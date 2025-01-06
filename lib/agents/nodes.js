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
      You are a content moderator. Your task is to analyze the given question and determine if it's appropriate and relevant.
      
      Guidelines for rejection:
      1. Harmful or malicious content
      2. Offensive language
      3. Personal information requests
      4. Completely off-topic questions
      5. Non-English questions (we only support English for now)
      
      Question: {question}
      
      Respond with either:
      ACCEPT: If the question is appropriate
      REJECT: <reason> if the question should be rejected
    `);

    this.chain = RunnableSequence.from([
      prompt,
      model
    ]);
  }

  async invoke(input) {
    try {
      const result = await this.chain.invoke({
        question: input.question
      });
      
      const response = result.content.trim();
      console.log('[GuardRailNode] Moderation result:', response);
      
      if (response.startsWith('ACCEPT')) {
        return { 
          allowed: true 
        };
      }
      
      const reason = response.replace('REJECT:', '').trim();
      return {
        allowed: false,
        reason: reason || 'Question was flagged as inappropriate'
      };
    } catch (error) {
      console.error('[GuardRailNode] Error:', error);
      return {
        allowed: false,
        reason: 'Failed to process content moderation'
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
      - When answering, format your response in two parts:
        1. The main answer
        2. A list of sources used, with each source on a new line prefixed with "SOURCE:"
      - Be concise and accurate
      - If context sections seem contradictory, point this out

      Context sections:
      {context}

      Question: {question}

      Format your response like this:
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
      const result = await this.chain.invoke({
        context: input.context,
        question: input.question
      });

      const content = result.content;
      let answer = '';
      let sources = [];

      // First, split by ANSWER: and SOURCES: markers
      const answerMatch = content.match(/ANSWER:([\s\S]*?)(?=\nSOURCES:|$)/);
      const sourcesMatch = content.match(/SOURCES:([\s\S]*?)$/);

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

      console.log('[ResponseNode] Parsed response:', {
        answer,
        sources
      });

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