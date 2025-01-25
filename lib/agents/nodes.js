import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

export class GuardRailNode {
  constructor() {
    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama3.2",
      temperature: 0.1
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a content moderator focused on detecting greetings and inappropriate content.
      Your task is to analyze the given question and determine if it's a greeting or contains inappropriate content.
      
      Guidelines:
      1. Detect greetings like: hi, hello, hey there, greetings, good morning, who are you, what is your name, etc.
      2. Detect questions about the agent itself, like "who are you", "what is your name", "what is your purpose", etc. and classify them as a GREETING too.
      3. Check for spam content (repeated text, promotional content, etc.)
      4. Check for profanity or offensive language
      
      Question: {question}
      
      Respond with one of:
      GREETING: If the input is a greeting
      ACCEPT: If the question is appropriate
      REJECT: <reason> if the question contains spam or foul language

      Make the reason as vague as possible , like "I'm sorry, I cannot process this specific question"
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input, options = {}) {
    try {
      const result = await this.chain.invoke({
        question: input.question
      });
      
      const response = result.content.trim();
      console.log('[GuardRailNode] Moderation result:', response);
      
      if (response.startsWith('GREETING')) {
        const greetingMessage = 'Hey there, I am Cortex - an AI agent based on Llama 3.2 and I am here to answer any questions you have about your project data';
        
        if (options.onProgress) {
          options.onProgress({
            content: greetingMessage,
            sources: [],
            followUpQuestions: [],
            done: true
          });
        }
        
        return {
          allowed: false,
          isGreeting: true,
          message: greetingMessage
        };
      }
      
      if (response.startsWith('ACCEPT')) {
        return { 
          allowed: true 
        };
      }
      
      const reason = response.replace('REJECT:', '').trim();
      const rejectionMessage = `I apologize, but I cannot process this question. ${reason}`;

      if (options.onProgress) {
        options.onProgress({
          content: rejectionMessage,
          sources: [],
          followUpQuestions: [],
          done: true
        });
      }

      return {
        allowed: false,
        reason: reason || 'Question contains inappropriate content',
        message: rejectionMessage
      };
    } catch (error) {
      console.error('[GuardRailNode] Error:', error);
      const errorMessage = 'Failed to process content moderation';
      
      if (options.onProgress) {
        options.onProgress({
          content: errorMessage,
          sources: [],
          followUpQuestions: [],
          done: true
        });
      }

      return {
        allowed: false,
        reason: errorMessage,
        message: errorMessage
      };
    }
  }
}

export class ResponseNode {
  constructor() {
    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama3.2",
      temperature: 0.2
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a precise and helpful AI assistant. Your task is to answer questions based on the provided context sections.

      Guidelines:
      - Only use information from the provided context sections
      - If you can't find relevant information in the context, say "I don't have enough information to answer that"
      - Synthesize information from multiple context sections if needed
      - Be concise and accurate
      - If context sections seem contradictory, point this out
      - You MUST ALWAYS format your response using EXACTLY these two sections:
        1. Start with "ANSWER:" followed by your response on a new line
        2. End with "SOURCES:" followed by source references on new lines

      Context sections:
      {context}

      Question: {question}

      You must respond in this exact format:
      ANSWER:
      Your detailed answer here...

      SOURCES:
      SOURCE: name of source 1
      SOURCE: name of source 2
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input) {
    try {
      console.log('[ResponseNode] Processing input:', input);
      const stream = await this.chain.stream({
        context: input.context,
        question: input.question
      });

      let fullContent = '';
      let answer = '';
      let sources = [];

      for await (const chunk of stream) {
        fullContent += chunk.content;
        
        // Try to extract answer and sources as they come in
        const answerMatch = fullContent.match(/ANSWER:([\s\S]*?)(?=\nSOURCES:|$)/);
        const sourcesMatch = fullContent.match(/SOURCES:([\s\S]*?)$/);

        if (answerMatch) {
          answer = answerMatch[1].trim();
        }

        if (sourcesMatch) {
          sources = sourcesMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('SOURCE:'))
            .map(line => ({
              title: line.replace('SOURCE:', '').trim()
            }));
        }

        // Emit partial response
        if (input.onProgress) {
          input.onProgress({
            content: answer,
            sources: sources,
            done: false
          });
        }
      }

      return {
        content: answer,
        sources: sources
      };
    } catch (error) {
      console.error('[ResponseNode] Error:', error);
      return {
        content: "I'm sorry, I encountered an error processing your request.",
        sources: []
      };
    }
  }
}

export class WidgetNode {
  constructor() {
    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama3.2",
      temperature: 0.1
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a JSON formatting assistant that generates follow-up questions.
      Your task is to generate exactly 4 concise follow-up questions based on the previous answer.
      
      Original question: {question}
      AI's answer: {answer}

      IMPORTANT: You must ONLY output valid JSON in the following format, nothing else:
      {{
        "followUpQuestions": [
          {{
            "question": "First follow-up question?"
          }},
          {{
            "question": "Second follow-up question?"
          }}
        ]
      }}

      Rules for questions:
      1. Each question should be 3-8 words
      2. Must end with question mark
      3. Focus on key points from the answer
      4. At least 2 questions must relate to original context
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input) {
    try {
      const result = await this.chain.invoke({
        question: input.question,
        answer: input.answer
      });

      // Clean the response to ensure it's valid JSON
      let jsonStr = result.content.trim();
      
      // Remove any text before the first {
      jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
      // Remove any text after the last }
      jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1);

      try {
        const parsedResult = JSON.parse(jsonStr);
        
        // Validate structure and format
        if (!parsedResult.followUpQuestions || !Array.isArray(parsedResult.followUpQuestions)) {
          throw new Error('Invalid followUpQuestions structure');
        }

        // Validate each question
        const validQuestions = parsedResult.followUpQuestions
          .filter(q => q && typeof q.question === 'string' && q.question.trim().endsWith('?'))
          .map(q => ({
            question: q.question.trim()
          }));

        return {
          followUpQuestions: validQuestions
        };
      } catch (parseError) {
        console.error('[WidgetNode] Failed to parse JSON:', parseError);
        console.log('[WidgetNode] Raw content:', result.content);
        return {
          followUpQuestions: []
        };
      }
    } catch (error) {
      console.error('[WidgetNode] Error:', error);
      return {
        followUpQuestions: []
      };
    }
  }
} 