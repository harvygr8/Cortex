import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers';

export const createOllamaModel = async () => {
  return new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "llama3.2",
    temperature: 0.2,
  });
};

export const createPrompt = (template: string) => {
  return ChatPromptTemplate.fromTemplate(template);
};

export const outputParser = new StringOutputParser(); 