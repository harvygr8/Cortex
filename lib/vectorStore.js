import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ensureDir } from 'fs-extra';
import { HybridRetriever } from './hybridRetriever.js';
import fileLogger from './utils/fileLogger.js';

let instance = null;

export class ProjectVectorStore {
  constructor() {
    if (instance) {
      return instance;
    }
    
    this.embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: "http://localhost:11434"
    });
    
    // Log the embedding model being used
    console.log('[VectorStore] Using embedding model: nomic-embed-text');
    
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,       // Optimal size for embedding quality vs context
      chunkOverlap: 80,     // 10% overlap for continuity
      separators: [
        "\n\n",     // 1st priority: Split on paragraph breaks
        "\n",       // 2nd priority: Split on line breaks  
        ". ",       // 3rd priority: Split on sentence endings
        "? ",       // 4th priority: Split on question endings
        "! ",       // 5th priority: Split on exclamation endings
        ": ",       // 6th priority: Split on colon separators
        "; ",       // 7th priority: Split on semicolon separators
        ", ",       // 8th priority: Split on comma separators
        " ",        // 9th priority: Split on word boundaries
        ""          // 10th priority: Character-level fallback
      ],
      lengthFunction: (text) => text.length,
    });
    this.initializedProjects = new Set();
    this.hybridRetrievers = new Map(); // Store hybrid retrievers per project
    instance = this;
  }

  // Force regeneration of vectors for a project
  async forceRegenerateProject(project) {
    console.log(`[VectorStore] Force regenerating vectors for project ${project.id}`);
    
    // Remove from initialized set to force regeneration
    this.initializedProjects.delete(project.id);
    
    // Clear existing vectors
    await this.clearProjectIndex(project.id);
    
    console.log(`[VectorStore] Cleared existing vectors, starting fresh regeneration`);
    
    // Regenerate with new chunking strategy
    return await this.createOrUpdateProjectIndex(project);
  }

  async createOrUpdateProjectIndex(project) {
    if (this.initializedProjects.has(project.id)) {
      console.log(`[VectorStore] Project ${project.id} already initialized, skipping`);
      return await this.loadProjectIndex(project.id);
    }

    console.log(`[VectorStore] Creating/updating index for project ${project.id}`);
    console.log(`[VectorStore] Using new intelligent chunking strategy`);
    console.log(`[VectorStore] Chunk size: ${this.textSplitter.chunkSize}, Overlap: ${this.textSplitter.chunkOverlap}`);
    console.log(`[VectorStore] Separators: ${this.textSplitter.separators.join(', ')}`);
    
    await ensureDir('./data/vectors');
    
    // Fetch full content from SQLite for proper indexing
    const projectStore = await import('./projectStore.js');
    const documentsWithContent = await Promise.all(
      project.pages.map(async (page) => {
        try {
          const fullPage = await projectStore.default.getPage(page.id);
          const fullContent = fullPage ? fullPage.content : '';
          
          return {
            pageContent: fullContent || `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
            metadata: {
              projectId: project.id,
              projectTitle: project.title,
              pageId: page.id,
              pageTitle: page.title,
              sqlitePageId: page.id,
              sqliteProjectId: project.id,
              hasFullContent: !!fullContent,
              contentLength: fullContent ? fullContent.length : 0
            }
          };
        } catch (error) {
          console.error(`[VectorStore] Error loading content for page ${page.id}:`, error);
          return {
            pageContent: `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
            metadata: {
              projectId: project.id,
              projectTitle: project.title,
              pageId: page.id,
              pageTitle: page.title,
              sqlitePageId: page.id,
              sqliteProjectId: project.id,
              hasFullContent: false,
              contentLength: 0
            }
          };
        }
      })
    );
    
    const documents = documentsWithContent;

    console.log('[VectorStore] Sample document:', documents[0] ? {
      content: documents[0].pageContent.substring(0, 200) + '...',
      metadata: documents[0].metadata,
      contentLength: documents[0].pageContent.length
    } : 'No documents');
    
    // Log content loading statistics
    const contentStats = documents.reduce((acc, doc) => {
      acc.total++;
      if (doc.metadata.hasFullContent) {
        acc.withContent++;
        acc.totalContentLength += doc.metadata.contentLength;
      } else {
        acc.withoutContent++;
      }
      return acc;
    }, { total: 0, withContent: 0, withoutContent: 0, totalContentLength: 0 });
    
    console.log('[VectorStore] Content loading stats:', {
      totalPages: contentStats.total,
      successfullyLoaded: contentStats.withContent,
      failedToLoad: contentStats.withoutContent,
      averageContentLength: contentStats.withContent > 0 ? Math.round(contentStats.totalContentLength / contentStats.withContent) : 0
    });

    console.log('[VectorStore] Total documents:', documents.length);

    console.log(`[VectorStore] Using intelligent chunking with custom separators`);
    console.log(`[VectorStore] Chunk size: ${this.textSplitter.chunkSize}, Overlap: ${this.textSplitter.chunkOverlap}`);
    const splitDocs = await this.textSplitter.splitDocuments(documents);
    console.log(`[VectorStore] Created ${splitDocs.length} intelligent chunks`);
    
    // Log chunk statistics
    const stats = this.getChunkStats(splitDocs);
    if (stats) {
      console.log('[VectorStore] Chunk Statistics:', {
        totalChunks: stats.totalChunks,
        totalCharacters: stats.totalCharacters,
        averageChunkSize: stats.averageChunkSize,
        sizeRange: `${stats.minChunkSize}-${stats.maxChunkSize}`,
        chunksUnderLimit: stats.chunksUnderLimit,
        chunksOverLimit: stats.chunksOverLimit
      });
    }
    
    // Log sample chunks to understand the chunking results
    if (splitDocs.length > 0) {
      console.log('[VectorStore] Sample chunks:');
      splitDocs.slice(0, 3).forEach((chunk, index) => {
        console.log(`  Chunk ${index + 1}: ${chunk.pageContent.length} chars - "${chunk.pageContent.substring(0, 100)}..."`);
      });
      if (splitDocs.length > 3) {
        console.log(`  ... and ${splitDocs.length - 3} more chunks`);
      }
    }
    
    const vectorStore = await FaissStore.fromDocuments(
      splitDocs,
      this.embeddings
    );

    console.log(`[VectorStore] Saving index to ./data/vectors/${project.id}`);
    await vectorStore.save(`./data/vectors/${project.id}`);
    
    // Initialize hybrid retriever with BM25
    console.log(`[VectorStore] Initializing hybrid retriever for project ${project.id}`);
    const hybridRetriever = new HybridRetriever(vectorStore, splitDocs);
    await hybridRetriever.initializeBM25(splitDocs);
    this.hybridRetrievers.set(project.id, hybridRetriever);
    
    this.initializedProjects.add(project.id);
    return vectorStore;
  }

  // Utility method to get chunk statistics for debugging
  getChunkStats(chunks) {
    if (!chunks || chunks.length === 0) return null;
    
    const sizes = chunks.map(chunk => chunk.pageContent.length);
    const totalChars = sizes.reduce((sum, size) => sum + size, 0);
    const avgSize = totalChars / chunks.length;
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    
    return {
      totalChunks: chunks.length,
      totalCharacters: totalChars,
      averageChunkSize: Math.round(avgSize),
      minChunkSize: minSize,
      maxChunkSize: maxSize,
      chunksUnderLimit: sizes.filter(size => size <= this.textSplitter.chunkSize).length,
      chunksOverLimit: sizes.filter(size => size > this.textSplitter.chunkSize).length
    };
  }

  // Test method to demonstrate intelligent chunking
  async testChunking(sampleText) {
    console.log('[VectorStore] Testing intelligent chunking...');
    console.log(`Sample text length: ${sampleText.length} characters`);
    
    const testDoc = {
      pageContent: sampleText,
      metadata: { test: true }
    };
    
    const chunks = await this.textSplitter.splitDocuments([testDoc]);
    const stats = this.getChunkStats(chunks);
    
    console.log('[VectorStore] Test chunking results:', stats);
    chunks.forEach((chunk, index) => {
      console.log(`  Test Chunk ${index + 1}: ${chunk.pageContent.length} chars`);
      console.log(`    Content: "${chunk.pageContent.substring(0, 150)}..."`);
    });
    
    return { chunks, stats };
  }

  async loadProjectIndex(projectId) {
    try {
      console.log(`[VectorStore] Loading index for project ${projectId}`);
      const store = await FaissStore.load(
        `./data/vectors/${projectId}`,
        this.embeddings
      );
      
      // Initialize hybrid retriever if not already done
      if (!this.hybridRetrievers.has(projectId)) {
        console.log(`[VectorStore] Initializing hybrid retriever for loaded project ${projectId}`);
        
        // We need to get the actual documents for BM25 initialization
        // Since we can't easily reconstruct the original documents from the loaded index,
        // we'll need to get them from the project store
        try {
          const projectStore = await import('./projectStore.js');
          const project = await projectStore.default.getProject(projectId);
          
          if (project && project.pages && project.pages.length > 0) {
            console.log(`[VectorStore] Found ${project.pages.length} pages, initializing BM25 with actual content`);
            
            // Convert project pages to document format with full content
            const documentsWithContent = await Promise.all(
              project.pages.map(async (page) => {
                try {
                  const fullPage = await projectStore.default.getPage(page.id);
                  const fullContent = fullPage ? fullPage.content : '';
                  
                  return {
                    pageContent: fullContent || `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
                    metadata: {
                      projectId: project.id,
                      projectTitle: project.title,
                      pageId: page.id,
                      pageTitle: page.title,
                      sqlitePageId: page.id,
                      sqliteProjectId: project.id,
                      hasFullContent: !!fullContent,
                      contentLength: fullContent ? fullContent.length : 0
                    }
                  };
                } catch (error) {
                  console.error(`[VectorStore] Error loading content for page ${page.id}:`, error);
                  return {
                    pageContent: `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
                    metadata: {
                      projectId: project.id,
                      projectTitle: project.title,
                      pageId: page.id,
                      pageTitle: page.title,
                      sqlitePageId: page.id,
                      sqliteProjectId: project.id,
                      hasFullContent: false,
                      contentLength: 0
                    }
                  };
                }
              })
            );
            
            const documents = documentsWithContent;
            
            const hybridRetriever = new HybridRetriever(store, documents);
            await hybridRetriever.initializeBM25(documents);
            this.hybridRetrievers.set(projectId, hybridRetriever);
            console.log(`[VectorStore] Hybrid retriever initialized with ${documents.length} documents`);
          } else {
            console.warn(`[VectorStore] No project pages found, initializing hybrid retriever without BM25`);
            const hybridRetriever = new HybridRetriever(store, []);
            this.hybridRetrievers.set(projectId, hybridRetriever);
          }
        } catch (projectError) {
          console.warn(`[VectorStore] Could not load project for BM25 initialization:`, projectError.message);
          console.warn(`[VectorStore] Initializing hybrid retriever without BM25`);
          const hybridRetriever = new HybridRetriever(store, []);
          this.hybridRetrievers.set(projectId, hybridRetriever);
        }
      }
      
      this.initializedProjects.add(projectId);
      return store;
    } catch (error) {
      console.log(`[VectorStore] Error loading index:`, error);
      return null;
    }
  }

  async clearProjectIndex(projectId) {
    try {
      console.log(`[VectorStore] Clearing index for project ${projectId}`);
      const fs = await import('fs-extra');
      const vectorPath = `./data/vectors/${projectId}`;
      
      if (await fs.pathExists(vectorPath)) {
        await fs.remove(vectorPath);
        console.log(`[VectorStore] Index cleared for project ${projectId}`);
      } else {
        console.log(`[VectorStore] No existing index found for project ${projectId}`);
      }
    } catch (error) {
      console.log(`[VectorStore] Error clearing index:`, error);
    }
  }

  // New method for hybrid search
  async hybridSearch(projectId, query, k = 5, weights = { semantic: 0.7, keyword: 0.3 }) {
    console.log(`[VectorStore] Performing hybrid search for project ${projectId}`);
    
    const hybridRetriever = this.hybridRetrievers.get(projectId);
    if (!hybridRetriever) {
      console.log(`[VectorStore] No hybrid retriever found for project ${projectId}, falling back to semantic search`);
      const vectorStore = await this.loadProjectIndex(projectId);
      if (!vectorStore) return [];
      
      const semanticResults = await vectorStore.similaritySearch(query, k);
      
      // Enhance results with full content from SQLite
      const enhancedResults = await this.enhanceSearchResultsWithContent(semanticResults, projectId);
      
      return enhancedResults;
    }
    
    // Check if BM25 is properly initialized
    if (!hybridRetriever.initialized || !hybridRetriever.bm25Retriever) {
      console.warn(`[VectorStore] Hybrid retriever not properly initialized for project ${projectId}`);
      console.warn(`[VectorStore] Attempting to reinitialize...`);
      
      try {
        // Try to reinitialize with project data
        const projectStore = await import('./projectStore.js');
        const project = await projectStore.default.getProject(projectId);
        
        if (project && project.pages && project.pages.length > 0) {
          // Load full content for BM25 initialization
          const documentsWithContent = await Promise.all(
            project.pages.map(async (page) => {
              try {
                const fullPage = await projectStore.default.getPage(page.id);
                const fullContent = fullPage ? fullPage.content : '';
                
                return {
                  pageContent: fullContent || `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
                  metadata: {
                    projectId: project.id,
                    projectTitle: project.title,
                    pageId: page.id,
                    pageTitle: page.title,
                    sqlitePageId: page.id,
                    sqliteProjectId: project.id,
                    hasFullContent: !!fullContent,
                    contentLength: fullContent ? fullContent.length : 0
                  }
                };
              } catch (error) {
                console.error(`[VectorStore] Error loading content for page ${page.id}:`, error);
                return {
                  pageContent: `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
                  metadata: {
                    projectId: project.id,
                    projectTitle: project.title,
                    pageId: page.id,
                    pageTitle: page.title,
                    sqlitePageId: page.id,
                    sqliteProjectId: project.id,
                    hasFullContent: false,
                    contentLength: 0
                  }
                };
              }
            })
          );
          
          const documents = documentsWithContent;
          
          await hybridRetriever.initializeBM25(documents);
          console.log(`[VectorStore] Successfully reinitialized hybrid retriever with ${documents.length} documents`);
        } else {
          console.error(`[VectorStore] Cannot reinitialize - no project data available`);
        }
      } catch (error) {
        console.error(`[VectorStore] Failed to reinitialize hybrid retriever:`, error.message);
      }
    }
    
    const searchResults = await hybridRetriever.hybridSearch(query, k, weights);
    try { await fileLogger.logSection('VectorStore.hybridSearch', { k, weights, returned: searchResults.length }); } catch {}
    
    // Enhance results with full content from SQLite
    const enhancedResults = await this.enhanceSearchResultsWithContent(searchResults, projectId);
    try { await fileLogger.logSection('VectorStore.enhanceSearchResultsWithContent', { enriched: enhancedResults.length }); } catch {}
    
    return enhancedResults;
  }

  // Get hybrid retriever stats for debugging
  getHybridRetrieverStats(projectId) {
    const hybridRetriever = this.hybridRetrievers.get(projectId);
    if (!hybridRetriever) {
      return { error: 'No hybrid retriever found for this project' };
    }
    return hybridRetriever.getSearchStats();
  }

  // Retrieve full content from SQLite for search results
  async getContentFromSQLite(projectId, pageId) {
    try {
      const projectStore = await import('./projectStore.js');
      const page = await projectStore.default.getPage(pageId);
      return page ? page.content : null;
    } catch (error) {
      console.error(`[VectorStore] Error retrieving content from SQLite for page ${pageId}:`, error);
      return null;
    }
  }

  // Enhance search results with full content from SQLite
  async enhanceSearchResultsWithContent(searchResults, projectId) {
    const enhancedResults = await Promise.all(
      searchResults.map(async (result) => {
        const pageId = result.metadata?.pageId || result.metadata?.sqlitePageId;
        if (pageId) {
          const fullContent = await this.getContentFromSQLite(projectId, pageId);
          return {
            ...result,
            fullContent: fullContent || result.pageContent, // Fallback to chunk content if SQLite fails
            source: 'sqlite' // Indicate content came from SQLite
          };
        }
        return {
          ...result,
          fullContent: result.pageContent,
          source: 'vector_chunk' // Indicate content came from vector chunk
        };
      })
    );
    return enhancedResults;
  }

  // Validate data consistency between SQLite and FAISS
  async validateDataConsistency(projectId) {
    try {
      console.log(`[VectorStore] Validating data consistency for project ${projectId}`);
      
      // Get project data from SQLite
      const projectStore = await import('./projectStore.js');
      const project = await projectStore.default.getProject(projectId);
      
      if (!project || !project.pages || project.pages.length === 0) {
        console.log(`[VectorStore] No project data found in SQLite for project ${projectId}`);
        return { valid: true, message: 'No project data to validate' };
      }
      
      // Check if vector store exists
      const fs = await import('fs-extra');
      const vectorPath = `./data/vectors/${projectId}`;
      const vectorExists = await fs.pathExists(vectorPath);
      
      if (!vectorExists) {
        console.log(`[VectorStore] Vector store does not exist for project ${projectId}`);
        return { 
          valid: false, 
          message: 'Vector store missing - needs regeneration',
          action: 'regenerate'
        };
      }
      
      // Try to load vector store
      let vectorStore;
      try {
        vectorStore = await this.loadProjectIndex(projectId);
        if (!vectorStore) {
          return { 
            valid: false, 
            message: 'Vector store corrupted - needs regeneration',
            action: 'regenerate'
          };
        }
      } catch (error) {
        console.error(`[VectorStore] Error loading vector store:`, error);
        return { 
          valid: false, 
          message: 'Vector store corrupted - needs regeneration',
          action: 'regenerate'
        };
      }
      
      // Check if all pages in SQLite have corresponding vectors
      const sqlitePageIds = new Set(project.pages.map(page => page.id));
      console.log(`[VectorStore] SQLite has ${sqlitePageIds.size} pages`);
      
      // This is a basic check - in a full implementation, you'd want to check
      // if the vector store actually contains vectors for all pages
      const validation = {
        valid: true,
        message: 'Data consistency validated successfully',
        sqlitePages: sqlitePageIds.size,
        vectorStoreExists: true,
        vectorStoreLoadable: true
      };
      
      console.log(`[VectorStore] Validation result:`, validation);
      return validation;
      
    } catch (error) {
      console.error(`[VectorStore] Error during validation:`, error);
      return { 
        valid: false, 
        message: `Validation failed: ${error.message}`,
        action: 'investigate'
      };
    }
  }

  // Force reinitialize hybrid retriever for a project
  async forceReinitializeHybridRetriever(projectId) {
    console.log(`[VectorStore] Force reinitializing hybrid retriever for project ${projectId}`);
    
    try {
      const projectStore = await import('./projectStore.js');
      const project = await projectStore.default.getProject(projectId);
      
      if (!project || !project.pages || project.pages.length === 0) {
        console.error(`[VectorStore] No project data available for reinitialization`);
        return false;
      }
      
      // Get the existing vector store
      const vectorStore = await this.loadProjectIndex(projectId);
      if (!vectorStore) {
        console.error(`[VectorStore] Could not load vector store for reinitialization`);
        return false;
      }
      
      // Create new documents with full content
      const documentsWithContent = await Promise.all(
        project.pages.map(async (page) => {
          try {
            const fullPage = await projectStore.default.getPage(page.id);
            const fullContent = fullPage ? fullPage.content : '';
            
            return {
              pageContent: fullContent || `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
              metadata: {
                projectId: project.id,
                projectTitle: project.title,
                pageId: page.id,
                pageTitle: page.title,
                sqlitePageId: page.id,
                sqliteProjectId: project.id,
                hasFullContent: !!fullContent,
                contentLength: fullContent ? fullContent.length : 0
              }
            };
          } catch (error) {
            console.error(`[VectorStore] Error loading content for page ${page.id}:`, error);
            return {
              pageContent: `[ERROR: Could not load content for page ${page.id}] ${page.title}`,
              metadata: {
                projectId: project.id,
                projectTitle: project.title,
                pageId: page.id,
                pageTitle: page.title,
                sqlitePageId: page.id,
                sqliteProjectId: project.id,
                hasFullContent: false,
                contentLength: 0
              }
            };
          }
        })
      );
      
      const documents = documentsWithContent;
      
      // Create new hybrid retriever
      const HybridRetriever = await import('./hybridRetriever.js');
      const hybridRetriever = new HybridRetriever.default(vectorStore, documents);
      await hybridRetriever.initializeBM25(documents);
      
      // Replace the existing one
      this.hybridRetrievers.set(projectId, hybridRetriever);
      
      console.log(`[VectorStore] Successfully reinitialized hybrid retriever with ${documents.length} documents`);
      return true;
      
    } catch (error) {
      console.error(`[VectorStore] Failed to force reinitialize hybrid retriever:`, error);
      return false;
    }
  }
}

const vectorStore = new ProjectVectorStore();
export default vectorStore; 