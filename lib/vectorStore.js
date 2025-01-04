import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ensureDir } from 'fs-extra';

let instance = null;

export class ProjectVectorStore {
  constructor() {
    if (instance) {
      return instance;
    }
    
    this.embeddings = new OllamaEmbeddings({
      model: "llama3.2",
      baseUrl: "http://localhost:11434"
    });
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: ["\n\n", "\n", " ", ""],
      lengthFunction: (text) => text.length,
    });
    this.initializedProjects = new Set();
    instance = this;
  }

  async createOrUpdateProjectIndex(project) {
    if (this.initializedProjects.has(project.id)) {
      console.log(`[VectorStore] Project ${project.id} already initialized, skipping`);
      return await this.loadProjectIndex(project.id);
    }

    console.log(`[VectorStore] Creating/updating index for project ${project.id}`);
    
    await ensureDir('./data/vectors');
    
    const documents = project.pages.flatMap(page => {
      // Split content into paragraphs
      const paragraphs = (page.content || '').split('\n\n');
      
      return paragraphs.map((paragraph, index) => ({
        pageContent: paragraph,
        metadata: {
          projectId: project.id,
          projectTitle: project.title,
          pageId: page.id,
          pageTitle: page.title,
          paragraphIndex: index,
          //summary if the paragraph is long
          summary: paragraph.length > 100 ? paragraph.substring(0, 100) + '...' : paragraph
        }
      }));
    });

    console.log('[VectorStore] Sample document:', documents[0] ? {
      content: documents[0].pageContent,
      metadata: documents[0].metadata
    } : 'No documents');

    console.log('[VectorStore] Total documents:', documents.length);

    console.log(`[VectorStore] Splitting ${documents.length} documents into chunks`);
    const splitDocs = await this.textSplitter.splitDocuments(documents);
    console.log(`[VectorStore] Created ${splitDocs.length} chunks`);
    
    const vectorStore = await FaissStore.fromDocuments(
      splitDocs,
      this.embeddings
    );

    console.log(`[VectorStore] Saving index to ./data/vectors/${project.id}`);
    await vectorStore.save(`./data/vectors/${project.id}`);
    this.initializedProjects.add(project.id);
    return vectorStore;
  }

  async loadProjectIndex(projectId) {
    try {
      console.log(`[VectorStore] Loading index for project ${projectId}`);
      const store = await FaissStore.load(
        `./data/vectors/${projectId}`,
        this.embeddings
      );
      this.initializedProjects.add(projectId);
      return store;
    } catch (error) {
      console.log(`[VectorStore] Error loading index:`, error);
      return null;
    }
  }
}

const vectorStore = new ProjectVectorStore();
export default vectorStore; 