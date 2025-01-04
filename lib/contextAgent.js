import projectStore from './projectStore';
import vectorStore from './vectorStore';
import { ResponseNode } from './agents/nodes';

export class ContextAgent {
  constructor() {
    this.responder = new ResponseNode();
  }

  static async initialize() {
    return new ContextAgent();
  }

  async processProjectQuestion(projectId, question) {
    try {
      await projectStore.initialize();
      const project = await projectStore.getProject(projectId);
      if (!project) return { answer: "Project not found." };

      const projectVectors = await vectorStore.loadProjectIndex(projectId);
      if (!projectVectors) {
        return { answer: "Please wait while the AI context is being initialized..." };
      }

      //search results with metadata filter
      const searchResults = await projectVectors.similaritySearch(question, 5);
      
      console.log('[ContextAgent] Raw search results:', searchResults.map(doc => ({
        metadata: doc.metadata,
        content: doc.pageContent.substring(0, 100) + '...'
      })));

      //filter by projectId
      const filteredResults = searchResults.filter(doc => 
        doc.metadata && doc.metadata.projectId === projectId
      );

      if (filteredResults.length === 0) {
        console.log('[ContextAgent] No relevant results found');
        return { 
          answer: "I couldn't find any relevant information in the project context.",
          metadata: { context: '' }
        };
      }

      const context = filteredResults
        .map(doc => `Title: ${doc.metadata.pageTitle}\n\nContent:\n${doc.pageContent}`)
        .join('\n\n---\n\n');

      console.log('[ContextAgent] Context length:', context.length);
      console.log('[ContextAgent] First result preview:', filteredResults[0]?.pageContent.substring(0, 100));

      const response = await this.responder.invoke({
        question,
        context
      });

      return { 
        answer: response,
        metadata: {
          context: context
        }
      };
    } catch (error) {
      console.error('[ContextAgent] Error:', error);
      return { answer: "An error occurred while processing your question." };
    }
  }
}

export default new ContextAgent(); 