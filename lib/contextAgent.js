import projectStore from './projectStore';
import vectorStore from './vectorStore';
import { ResponseNode, GuardRailNode, WidgetNode, KnowledgeNode } from './agents/nodes';

export class ContextAgent {
  constructor() {
    this.responder = new ResponseNode();
    this.guardRail = new GuardRailNode();
    this.widget = new WidgetNode();
    this.knowledge = new KnowledgeNode();
  }

  static async initialize() {
    const instance = new ContextAgent();
    instance.responder = new ResponseNode();
    instance.guardRail = new GuardRailNode();
    instance.widget = new WidgetNode();
    instance.knowledge = new KnowledgeNode();
    return instance;
  }

  async processProjectQuestion(projectId, question, options = {}, useKnowledge = false) {
    try {
      const guardRailResult = await this.guardRail.invoke({ question }, options);
      if (!guardRailResult.allowed) {
        return { 
          answer: guardRailResult.message,
          widgets: {
            sources: [],
            followUpQuestions: []
          }
        };
      }

      if (useKnowledge) {
        const response = await this.knowledge.invoke({
          question,
          onProgress: options.onProgress
        });

        const widgets = await this.widget.invoke({
          question,
          answer: response.content
        });

        if (options.onProgress) {
          options.onProgress({
            content: response.content,
            sources: [],
            followUpQuestions: widgets.followUpQuestions,
            done: true
          });
        }

        return {
          answer: response.content,
          widgets: {
            sources: [],
            followUpQuestions: widgets.followUpQuestions
          }
        };
      }

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
        context,
        onProgress: options.onProgress
      });

      // Process the response through the widget node
      const widgets = await this.widget.invoke({
        question,
        answer: response.content
      });

      // If we have an onProgress callback, send the final state
      if (options.onProgress) {
        options.onProgress({
          content: response.content,
          sources: response.sources,
          followUpQuestions: widgets.followUpQuestions,
          done: true
        });
      }

      return { 
        answer: response.content,
        metadata: {
          context: context
        },
        widgets: {
          sources: response.sources,
          followUpQuestions: widgets.followUpQuestions
        }
      };
    } catch (error) {
      console.error('[ContextAgent] Error:', error);
      return { 
        answer: "An error occurred while processing your question.",
        widgets: null
      };
    }
  }
}

export default new ContextAgent(); 