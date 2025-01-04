import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

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
      - When answering, specify which context section you're using by referencing the title
      - Synthesize information from multiple context sections if needed
      - Be concise and accurate
      - If context sections seem contradictory, point this out

      Context sections:
      {context}

      Question: {question}

      Answer (remember to cite your sources from the context):
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
      console.log('[ResponseNode] Raw result:', result);
      return result.content;
    } catch (error) {
      console.error('[ResponseNode] Error:', error);
      return "I'm sorry, I encountered an error processing your request.";
    }
  }
} 