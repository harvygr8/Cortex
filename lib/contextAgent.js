import projectStore from './projectStore';
import vectorStore from './vectorStore';
import { ResponseNode, GuardRailNode, QueryClassifierNode, GeneralResponderNode } from './agents/nodes';
import fileLogger from './utils/fileLogger';

export class ContextAgent {
  constructor() {
    this.responder = new ResponseNode();
    this.guardRail = new GuardRailNode();
    this.classifier = new QueryClassifierNode();
    this.generalResponder = new GeneralResponderNode();

  }

  static async initialize() {
    const instance = new ContextAgent();
    instance.responder = new ResponseNode();
    instance.guardRail = new GuardRailNode();
    instance.classifier = new QueryClassifierNode();
    instance.generalResponder = new GeneralResponderNode();

    return instance;
  }

  async processProjectQuestion(projectId, question) {
    // Suppress all console output during processing
    const originalConsole = { log: console.log, warn: console.warn, error: console.error };
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};

    try {
      // Classify query
      let mode = 'RAG';
      try {
        const classification = await this.classifier.invoke({ question });
        mode = (classification && classification.mode) || 'RAG';
        await fileLogger.startNewQuery({ projectId, question, mode });
        await fileLogger.logIntermediateNode('QueryClassifier', classification);
      } catch (e) {
        await fileLogger.startNewQuery({ projectId, question, mode: 'RAG' });
        await fileLogger.logIntermediateNode('QueryClassifier', { error: 'classifier_failed_defaulting_RAG' });
        mode = 'RAG';
      }

      // Handle GENERAL mode with no retrieval
      if (mode === 'GENERAL') {
        const general = await this.generalResponder.invoke({ question });
        await fileLogger.logIntermediateNode('GeneralResponder', {
          answerPreview: (general.content || '').substring(0, 200),
          answerLength: (general.content || '').length
        });
        return {
          answer: general.content,
          metadata: { context: '' },
          widgets: { sources: [] }
        };
      }

      // Set retrieval sizes based on mode
      const chunkLimit = mode === 'SUMMARY' ? 6 : 3;
      const searchK = mode === 'SUMMARY' ? 8 : 5;
      // GuardRail check - DISABLED FOR NOW
      /*
      const guardRailResult = await this.guardRail.invoke({ question });
      if (!guardRailResult.allowed) {
        return { 
          answer: `I apologize, but I cannot process this question. ${guardRailResult.reason}`,
          widgets: null
        };
      }

      // Check for warnings from guardrail
      let warningMessage = '';
      if (guardRailResult.warning) {
        warningMessage = `Note: ${guardRailResult.warning}\n\n`;
        console.log('[ContextAgent] Guardrail warning:', guardRailResult.warning);
      }
      */

      await projectStore.initialize();
      const project = await projectStore.getProject(projectId);
      if (!project) return { 
        answer: "Project not found.",
        metadata: { context: '' },
        widgets: { sources: [] }
      };

      // Wrap all vector store operations in error handling
      let projectVectors, searchResults;
      try {
        projectVectors = await vectorStore.loadProjectIndex(projectId);
        
        if (!projectVectors) {
          // If loading failed (possibly due to dimension mismatch), try to regenerate
          try {
            const regeneratedVectors = await vectorStore.forceRegenerateProject(project);
            
            if (!regeneratedVectors) {
              return { 
                answer: "Failed to initialize AI context. Please try again.",
                metadata: { context: '' },
                widgets: { sources: [] }
              };
            }
            
            // Use the regenerated vectors with hybrid search
            
            searchResults = await vectorStore.hybridSearch(projectId, question, searchK);
            
            await fileLogger.logRetrieverStats(searchResults);
            
            // ALGORITHM PERFORMANCE METRICS FOR REGENERATION
            // (Stats written to file above)

            // CRITICAL FIX: Use regenerated hybrid search results directly, preserving the ranking
            
            if (searchResults.length === 0) {
              return { 
                answer: "I couldn't find any relevant information in the project context.",
                metadata: { context: '' },
                widgets: { sources: [] }
              };
            }
            
            // Use top N chunks with clear ranking based on mode
            const topResults = searchResults.slice(0, chunkLimit);
            const topScore = searchResults[0]?.hybridScore || 0;
            
            await fileLogger.logSelectedChunks(topResults);
            await fileLogger.logRankings(topResults);

            // STEP 3: Build context preserving the hybrid ranking order
            const context = this.buildSimplifiedContext(topResults, question);

            const response = await this.responder.invoke({
              question,
              context
            });
            await fileLogger.logIntermediateNode('ResponseNode', {
              sources: response.sources?.map(s => s.title),
              answerLength: response.content?.length || 0,
              answerPreview: (response.content || '').substring(0, 200)
            });

            return { 
              answer: response.content,
              metadata: {
                context: context
              },
              widgets: {
                sources: response.sources
              }
            };
          } catch (regenerationError) {
            return { 
              answer: "Failed to regenerate AI context. Please try again.",
              metadata: { context: '' },
              widgets: { sources: [] }
            };
          }
        }

        //search results with hybrid search and metadata filter
        try {
          
          searchResults = await vectorStore.hybridSearch(projectId, question, searchK);
          await fileLogger.logRetrieverStats(searchResults);
          
          // ALGORITHM PERFORMANCE METRICS
          console.log('\n🔬 [ContextAgent] ===== HYBRID ALGORITHM METRICS =====');
          
          // Score distribution analysis
          const scores = searchResults.map(doc => doc.hybridScore || 0).filter(score => score !== undefined);
          const scoreStats = {
            min: Math.min(...scores),
            max: Math.max(...scores),
            avg: scores.reduce((sum, score) => sum + score, 0) / scores.length,
            median: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
          };
          
          console.log('📊 Score Distribution:');
          console.log(`    Min Score: ${scoreStats.min.toFixed(4)}`);
          console.log(`    Max Score: ${scoreStats.max.toFixed(4)}`);
          console.log(`    Avg Score: ${scoreStats.avg.toFixed(4)}`);
          console.log(`    Median Score: ${scoreStats.median.toFixed(4)}`);
          
          // Source analysis
          const sourceAnalysis = searchResults.reduce((acc, doc) => {
            const source = doc.source || 'unknown';
            if (!acc[source]) {
              acc[source] = { count: 0, totalScore: 0, scores: [] };
            }
            acc[source].count++;
            acc[source].totalScore += doc.hybridScore || 0;
            acc[source].scores.push(doc.hybridScore || 0);
            return acc;
          }, {});
          
          console.log('\n🎯 Source Performance Analysis:');
          Object.entries(sourceAnalysis).forEach(([source, data]) => {
            const avgScore = data.totalScore / data.count;
            const minScore = Math.min(...data.scores);
            const maxScore = Math.max(...data.scores);
            console.log(`    ${source.toUpperCase()}:`);
            console.log(`      Count: ${data.count} results`);
            console.log(`      Avg Score: ${avgScore.toFixed(4)}`);
            console.log(`      Score Range: ${minScore.toFixed(4)} - ${maxScore.toFixed(4)}`);
          });
          
          // Ranking analysis
          console.log('\n🏆 Ranking Analysis:');
          searchResults.forEach((doc, index) => {
            const rank = index + 1;
            const score = doc.hybridScore || 0;
            const source = doc.source || 'unknown';
            const scorePercentile = ((score - scoreStats.min) / (scoreStats.max - scoreStats.min) * 100).toFixed(1);
            
            console.log(`    Rank ${rank}: ${doc.metadata.pageTitle}`);
            console.log(`      Score: ${score.toFixed(4)} (${scorePercentile}th percentile)`);
            console.log(`      Source: ${source}`);
            console.log(`      Content Length: ${doc.pageContent.length} chars`);
            
            // Show individual component scores if available
            if (doc.semanticRank !== undefined) {
              console.log(`      🧠 Semantic Rank: ${doc.semanticRank + 1}`);
            }
            if (doc.keywordRank !== undefined) {
              console.log(`      🔍 Keyword Rank: ${doc.keywordRank + 1}`);
            }
          });
          
          // Algorithm efficiency metrics
          console.log('\n⚡ Algorithm Efficiency:');
          const hybridResults = searchResults.filter(doc => doc.source === 'hybrid').length;
          const semanticResults = searchResults.filter(doc => doc.source === 'semantic').length;
          const keywordResults = searchResults.filter(doc => doc.source === 'keyword').length;
          
          console.log(`    Hybrid Overlap: ${hybridResults} results (${((hybridResults/searchResults.length)*100).toFixed(1)}%)`);
          console.log(`    Semantic Only: ${semanticResults} results (${((semanticResults/searchResults.length)*100).toFixed(1)}%)`);
          console.log(`    Keyword Only: ${keywordResults} results (${((keywordResults/searchResults.length)*100).toFixed(1)}%)`);
          
          // Quality metrics
          const highQualityResults = searchResults.filter(doc => (doc.hybridScore || 0) > scoreStats.avg).length;
          console.log(`    High Quality Results (>avg): ${highQualityResults}/${searchResults.length} (${((highQualityResults/searchResults.length)*100).toFixed(1)}%)`);
          
          console.log('==================================================\n');
          
          // Detailed logging of hybrid search results
          console.log('\n📊 [ContextAgent] HYBRID SEARCH RESULTS BREAKDOWN:');
          searchResults.forEach((doc, index) => {
            console.log(`\n  Result ${index + 1}:`);
            console.log(`    📄 Page: ${doc.metadata.pageTitle}`);
            console.log(`    🎯 Score: ${doc.hybridScore?.toFixed(4) || 'N/A'}`);
            console.log(`    🔗 Source: ${doc.source}`);
            console.log(`    📍 Project: ${doc.metadata.projectId}`);
            console.log(`    📝 Content Preview: ${doc.pageContent.substring(0, 100)}...`);
            
            // Show additional metadata if available
            if (doc.semanticRank !== undefined) {
              console.log(`    🧠 Semantic Rank: ${doc.semanticRank + 1}`);
            }
            if (doc.keywordRank !== undefined) {
              console.log(`    🔍 Keyword Rank: ${doc.keywordRank + 1}`);
            }
          });
          
          console.log('\n🎯 [ContextAgent] HYBRID SEARCH SUMMARY:');
          const sourceCounts = searchResults.reduce((acc, doc) => {
            acc[doc.source || 'unknown'] = (acc[doc.source || 'unknown'] || 0) + 1;
            return acc;
          }, {});
          
          Object.entries(sourceCounts).forEach(([source, count]) => {
            console.log(`    ${source}: ${count} results`);
          });
          
          const avgScore = searchResults.reduce((sum, doc) => sum + (doc.hybridScore || 0), 0) / searchResults.length;
          console.log(`    Average Score: ${avgScore.toFixed(4)}`);
          console.log('==================================================\n');
          
        } catch (searchError) {
          
          // If it's a dimension mismatch during search, regenerate the vectors
          if (searchError.message.includes('Query vector must have the same length') || 
              searchError.message.includes('dimensions') ||
              searchError.message.includes('length')) {
            
            try {
              const regeneratedVectors = await vectorStore.forceRegenerateProject(project);
                          if (!regeneratedVectors) {
              return { 
                answer: "Failed to regenerate AI context. Please try again.",
                metadata: { context: '' },
                widgets: { sources: [] }
              };
            }
              
              // Try search again with regenerated vectors using hybrid search
              searchResults = await vectorStore.hybridSearch(projectId, question, searchK);
              await fileLogger.logRetrieverStats(searchResults);
            } catch (regenerationError) {
              return { 
                answer: "Failed to regenerate AI context. Please try again.",
                metadata: { context: '' },
                widgets: { sources: [] }
              };
            }
          } else {
            // For other search errors, throw to be handled by outer catch
            throw searchError;
          }
        }
        
        // CRITICAL FIX: Use hybrid search results directly, preserving the ranking
        
        if (searchResults.length === 0) {
          return { 
            answer: "I couldn't find any relevant information in the project context.",
            metadata: { context: '' },
            widgets: { sources: [] }
          };
        }
        
        // Use top N chunks with clear ranking based on mode
        const topResults = searchResults.slice(0, chunkLimit);
        const topScore = searchResults[0]?.hybridScore || 0;
        
        await fileLogger.logSelectedChunks(topResults);
        await fileLogger.logRankings(topResults);

        // STEP 3: Build context preserving the hybrid ranking order
        const context = this.buildSimplifiedContext(topResults, question);

        const response = await this.responder.invoke({
          question,
          context
        });
        
        await fileLogger.logIntermediateNode('ResponseNode', {
          sources: response.sources?.map(s => s.title),
          answerLength: response.content?.length || 0,
          answerPreview: (response.content || '').substring(0, 200)
        });

        return { 
          answer: response.content,
          metadata: {
            context: context
          },
          widgets: {
            sources: response.sources
          }
        };
        
      } catch (vectorError) {
        // If it's a dimension mismatch, try one more regeneration
        if (vectorError.message.includes('Query vector must have the same length') || 
            vectorError.message.includes('dimensions') ||
            vectorError.message.includes('length')) {
          
          try {
            // Clear ALL vector stores to ensure clean state
            await vectorStore.clearAllVectorStores();
            
            const regeneratedVectors = await vectorStore.forceRegenerateProject(project);
            if (regeneratedVectors) {
              // Try the whole process again with regenerated vectors
              return await this.processProjectQuestion(projectId, question);
            }
          } catch (finalError) {
            // swallow
          }
        }
        
        return { 
          answer: "Failed to process your question due to a technical issue. Please try again.",
          metadata: { context: '' },
          widgets: { sources: [] }
        };
      }
    } catch (error) {
      return { 
        answer: "An error occurred while processing your question.",
        metadata: { context: '' },
        widgets: { sources: [] }
      };
    } finally {
      // Restore console
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  }
}

export default new ContextAgent();

// STEP 1: Find the most relevant pages for a question
ContextAgent.prototype.findMostRelevantPages = async function(project, question, maxPages = 3) {
  console.log(`[ContextAgent] 🎯 Finding top ${maxPages} relevant pages for: "${question}"`);
  console.log(`[ContextAgent] Analyzing ${project.pages.length} pages in project`);
  
  if (!project.pages || project.pages.length === 0) {
    console.log('[ContextAgent] No pages in project');
    return [];
  }
  
  const questionTerms = this.extractKeyTerms(question.toLowerCase());
  console.log(`[ContextAgent] Key question terms:`, questionTerms);
  
  if (questionTerms.length === 0) {
    console.log('[ContextAgent] No meaningful terms in question');
    return [];
  }
  
  // Score each page based on question relevance
  const scoredPages = await Promise.all(
    project.pages.map(async (page) => {
      try {
        const content = await this.getPageContent(page.id);
        if (!content || content.length < 50) {
          return { ...page, content: '', relevanceScore: 0 };
        }
        
        const title = page.title.toLowerCase();
        const contentLower = content.toLowerCase();
        
        // Calculate relevance score
        let score = 0;
        let titleMatches = 0;
        let contentMatches = 0;
        
        // Title matching gets very high weight (titles are key indicators)
        questionTerms.forEach(term => {
          if (title.includes(term)) {
            score += 1.0; // Very strong title match
            titleMatches++;
          } else if (contentLower.includes(term)) {
            score += 0.2; // Content match
            contentMatches++;
          }
        });
        
        // Exact phrase matching in title (extremely strong signal)
        const questionPhrase = question.toLowerCase();
        if (title.includes(questionPhrase)) {
          score += 2.0; // Extremely strong title phrase match
        } else if (contentLower.includes(questionPhrase)) {
          score += 1.0; // Strong content phrase match
        }
        
        // Bonus for multiple term matches
        const totalMatches = titleMatches + contentMatches;
        const termCoverage = totalMatches / questionTerms.length;
        score += termCoverage * 0.8;
        
        // Term proximity bonus (terms appearing close together)
        if (questionTerms.length > 1) {
          let proximityBonus = 0;
          for (let i = 0; i < questionTerms.length - 1; i++) {
            const term1 = questionTerms[i];
            const term2 = questionTerms[i + 1];
            const term1Index = contentLower.indexOf(term1);
            const term2Index = contentLower.indexOf(term2);
            
            if (term1Index !== -1 && term2Index !== -1) {
              const distance = Math.abs(term1Index - term2Index);
              if (distance < 100) { // Terms within 100 characters
                proximityBonus += 0.3;
              }
            }
          }
          score += proximityBonus;
        }
        
        // Penalize very short content
        if (content.length < 200) {
          score *= 0.5;
        }
        
        // Bonus for substantial, well-structured content
        if (content.length > 500) {
          score += 0.2;
        }
        
        return {
          ...page,
          content: content,
          relevanceScore: score,
          titleMatches: titleMatches,
          contentMatches: contentMatches,
          termCoverage: termCoverage
        };
      } catch (error) {
        console.error(`[ContextAgent] Error processing page ${page.id}:`, error);
        return { ...page, content: '', relevanceScore: 0 };
      }
    })
  );
  
  // Sort by relevance score and filter out irrelevant pages
  const relevantPages = scoredPages
    .filter(page => page.relevanceScore >= 0.1) // Minimum relevance threshold
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxPages);
  
  // Log all pages for debugging
  console.log('[ContextAgent] Page relevance analysis:');
  scoredPages.slice(0, 10).forEach((page, index) => {
    const selected = relevantPages.includes(page) ? '✅' : '❌';
    console.log(`  ${selected} ${index + 1}. "${page.title}" - Score: ${page.relevanceScore.toFixed(3)} (T:${page.titleMatches} C:${page.contentMatches})`);
  });
  
  console.log(`[ContextAgent] 🏆 Selected ${relevantPages.length} relevant pages`);
  return relevantPages;
};

// STEP 2: Get relevant chunks from selected pages
ContextAgent.prototype.getRelevantChunksFromPages = async function(selectedPages, question, allSearchResults) {
  console.log(`[ContextAgent] Extracting relevant chunks from ${selectedPages.length} pages`);
  
  const selectedPageIds = new Set(selectedPages.map(page => page.id));
  const questionTerms = this.extractKeyTerms(question.toLowerCase());
  
  // Filter search results to only include chunks from selected pages
  const chunksFromSelectedPages = allSearchResults.filter(chunk => {
    const chunkPageId = chunk.metadata?.pageId || chunk.metadata?.sqlitePageId;
    return selectedPageIds.has(chunkPageId);
  });
  
  console.log(`[ContextAgent] Found ${chunksFromSelectedPages.length} chunks from selected pages`);
  
  if (chunksFromSelectedPages.length === 0) {
    console.log('[ContextAgent] No chunks found from selected pages, using page content directly');
    
    // If no chunks found, create chunks from page content
    const directChunks = selectedPages.map(page => ({
      pageContent: page.content,
      metadata: {
        pageId: page.id,
        pageTitle: page.title,
        projectId: page.projectId || 'unknown'
      },
      source: 'direct_page_content',
      relevanceScore: page.relevanceScore
    }));
    
    return this.filterChunksByRelevance(directChunks, question, questionTerms);
  }
  
  // Score and filter chunks based on relevance to the question
  return this.filterChunksByRelevance(chunksFromSelectedPages, question, questionTerms);
};

// Filter chunks by relevance to the question
ContextAgent.prototype.filterChunksByRelevance = function(chunks, question, questionTerms) {
  console.log(`[ContextAgent] Filtering ${chunks.length} chunks for relevance`);
  
  const scoredChunks = chunks.map(chunk => {
    const content = (chunk.pageContent || chunk.fullContent || '').toLowerCase();
    const title = (chunk.metadata?.pageTitle || '').toLowerCase();
    
    // Calculate chunk relevance score
    let score = 0;
    let termMatches = 0;
    
    // Check for term matches
    questionTerms.forEach(term => {
      if (content.includes(term)) {
        score += 0.5;
        termMatches++;
      }
      if (title.includes(term)) {
        score += 0.2; // Title bonus (chunk inherits from page)
      }
    });
    
    // Exact phrase matching
    const questionPhrase = question.toLowerCase();
    if (content.includes(questionPhrase)) {
      score += 1.0;
    }
    
    // Term density bonus
    const termDensity = termMatches / Math.max(questionTerms.length, 1);
    score += termDensity * 0.5;
    
    // Content length consideration
    if (content.length < 100) {
      score *= 0.7; // Penalize very short chunks
    } else if (content.length > 300) {
      score += 0.1; // Slight bonus for substantial chunks
    }
    
    return {
      ...chunk,
      chunkRelevanceScore: score,
      termMatches: termMatches,
      termDensity: termDensity
    };
  });
  
  // Sort by relevance and filter out irrelevant chunks
  const relevantChunks = scoredChunks
    .filter(chunk => chunk.chunkRelevanceScore >= 0.3) // Minimum chunk relevance
    .sort((a, b) => b.chunkRelevanceScore - a.chunkRelevanceScore)
    .slice(0, 5); // Limit to top 5 chunks
  
  console.log('[ContextAgent] Chunk relevance analysis:');
  scoredChunks.slice(0, 8).forEach((chunk, index) => {
    const selected = relevantChunks.includes(chunk) ? '✅' : '❌';
    console.log(`  ${selected} Chunk ${index + 1}: "${chunk.metadata?.pageTitle}" - Score: ${chunk.chunkRelevanceScore.toFixed(3)} (${chunk.termMatches} matches)`);
  });
  
  console.log(`[ContextAgent] 🎯 Selected ${relevantChunks.length} relevant chunks`);
  return relevantChunks;
};

// SIMPLIFIED: Build context with clear ranking and generous content limits
ContextAgent.prototype.buildSimplifiedContext = function(rankedResults, question) {
  console.log(`[ContextAgent] Building simplified context from ${rankedResults.length} chunks`);
  
  let context = `QUESTION TO ANSWER: "${question}"\n\n`;
  context += `CONTEXT INFORMATION:\n`;
  context += `You are provided with 3 information chunks ranked by AI relevance.\n`;
  context += `RANK 1 is the MOST RELEVANT - prioritize this heavily in your response.\n`;
    context += `RANK 2 and RANK 3 provide additional context and supporting information.\n\n`;
  
  // Add each chunk with clear ranking and generous content
  rankedResults.forEach((result, index) => {
    const rank = index + 1;
    const pageTitle = result.metadata?.pageTitle || 'Unknown Page';
    const hybridScore = result.hybridScore?.toFixed(4) || 'N/A';
    const source = result.source || 'unknown';
    
    context += `==================== RANK ${rank} ====================\n`;
    context += `TITLE: ${pageTitle}\n`;
    context += `RELEVANCE SCORE: ${hybridScore} (${source})\n`;
    if (rank === 1) {
      context += `⭐ PRIORITY: HIGHEST - Use this as your PRIMARY source\n`;
    } else {
      context += `📋 PRIORITY: Supporting information for comprehensive answer\n`;
    }
    context += `CONTENT:\n`;
    
    // Use full content with reasonable limits (no complex strategy logic)
    let content = result.fullContent || result.pageContent || '';
    const maxLength = 5000; // Generous limit for all chunks
    
    if (content.length > maxLength) {
      // Simple truncation at natural boundaries
      const truncated = content.substring(0, maxLength);
      const lastParagraph = truncated.lastIndexOf('\n\n');
      const lastSentence = truncated.lastIndexOf('.');
      
      if (lastParagraph > maxLength * 0.8) {
        content = content.substring(0, lastParagraph) + '\n\n[Additional content available...]';
      } else if (lastSentence > maxLength * 0.8) {
        content = content.substring(0, lastSentence + 1) + '\n[Additional content available...]';
      } else {
        content = truncated + '\n[Additional content available...]';
      }
    }
    
    context += `${content}\n`;
    context += `==================== END RANK ${rank} ====================\n\n`;
  });
  
  return context;
};

// LEGACY: Keep old method for compatibility
ContextAgent.prototype.buildRankPreservingContext = function(rankedResults, question, contentStrategy = 'RANK_1_DOMINANT') {
  console.log(`[ContextAgent] Building rank-preserving context from ${rankedResults.length} hybrid search results`);
  console.log(`[ContextAgent] Content strategy: ${contentStrategy}`);
  
  let context = `🎯 ANSWERING QUESTION: "${question}"\n`;
  context += `📋 AVAILABLE INFORMATION: The sections below contain relevant documentation and data.\n`;
  context += `🏆 RANKING: Content is ordered by relevance (RANK 1 = most relevant to your question).\n`;
  context += `⚠️ INSTRUCTION: Extract and use the information from these sections to answer the question.\n\n`;
  
  // Add content in ranking order (preserving hybrid search ranking)
  rankedResults.forEach((result, index) => {
    const rank = index + 1;
    const pageTitle = result.metadata?.pageTitle || 'Unknown Page';
    const hybridScore = result.hybridScore?.toFixed(4) || 'N/A';
    const source = result.source || 'unknown';
    
    context += `=== RANK ${rank} (Score: ${hybridScore}, Source: ${source}): ${pageTitle} ===\n`;
    context += `Title: ${pageTitle}\n`;
    
    // Use full content if available, otherwise use page content
    let content = result.fullContent || result.pageContent || '';
    
    // Strategy-aware content expansion
    if (content.length > 0) {
      let maxLength;
      
      // Dynamic content limits based on strategy and rank
      switch (contentStrategy) {
        case 'RANK_1_EXPANDED':
          maxLength = rank === 1 ? 8000 : 2000; // Much more content for high-confidence single source
          break;
        case 'RANK_1_DOMINANT': 
          maxLength = rank === 1 ? 5000 : 2500; // More content for primary, moderate for secondary
          break;
        case 'MULTI_RANK_SYNTHESIS':
          maxLength = rank === 1 ? 4000 : rank === 2 ? 3000 : 2000; // Graduated content limits
          break;
        case 'COMPREHENSIVE_SEARCH':
          maxLength = 3000; // Equal but substantial content for all ranks
          break;
        default:
          maxLength = rank === 1 ? 3000 : 1500; // Conservative fallback
      }
      
      if (content.length > maxLength) {
        // Try to truncate at natural boundaries (paragraphs, sentences)
        const truncated = content.substring(0, maxLength);
        const lastParagraph = truncated.lastIndexOf('\n\n');
        const lastSentence = truncated.lastIndexOf('.');
        
        if (lastParagraph > maxLength * 0.7) {
          content = content.substring(0, lastParagraph) + '\n\n[Content truncated - more available in source]';
        } else if (lastSentence > maxLength * 0.7) {
          content = content.substring(0, lastSentence + 1) + '\n[Content truncated - more available in source]';
        } else {
          content = truncated + '\n[Content truncated - more available in source]';
        }
      }
      
      context += `Content:\n${content}\n`;
    } else {
      context += `Content: [No content available]\n`;
    }
    
    context += `\n--- End of Rank ${rank} ---\n\n`;
  });
  
  // Add content summary and emphasis
  const topicsFound = rankedResults.map((result, index) => {
    const rank = index + 1;
    const title = result.metadata?.pageTitle || 'Unknown';
    const contentPreview = (result.fullContent || result.pageContent || '').substring(0, 100);
    return `Rank ${rank}: "${title}" (contains: ${contentPreview}...)`;
  }).join('\n');
  
  context += `📊 CONTENT SUMMARY:\n${topicsFound}\n\n`;
  context += `💡 KEY INSTRUCTION: The question "${question}" can be answered using the information above. `;
  context += `Extract the relevant details from Rank 1 first, then supplement with other ranks if needed.\n`;
  
  console.log(`[ContextAgent] Built rank-preserving context with ${context.length} characters`);
  console.log(`[ContextAgent] Context includes ${rankedResults.length} results ranked from most to least relevant`);
  console.log(`[ContextAgent] Context preview: ${context.substring(0, 500)}...`);
  
  return context;
};

// LEGACY: Build focused context with anti-hallucination measures (kept for compatibility)
ContextAgent.prototype.buildFocusedContext = function(relevantChunks, question, selectedPages) {
  console.log(`[ContextAgent] Building focused context from ${relevantChunks.length} chunks`);
  
  // Group chunks by page for better organization
  const chunksByPage = new Map();
  relevantChunks.forEach(chunk => {
    const pageId = chunk.metadata?.pageId || chunk.metadata?.sqlitePageId;
    if (!chunksByPage.has(pageId)) {
      chunksByPage.set(pageId, []);
    }
    chunksByPage.get(pageId).push(chunk);
  });
  
  let context = `IMPORTANT: You are answering the question: "${question}"\n`;
  context += `Only use information from the provided content sections below. If the information is not in these sections, say "I don't have information about that in the provided context."\n\n`;
  
  // Add content organized by page
  chunksByPage.forEach((chunks, pageId) => {
    const page = selectedPages.find(p => p.id === pageId);
    const pageTitle = page?.title || chunks[0]?.metadata?.pageTitle || 'Unknown Page';
    
    context += `=== Page: ${pageTitle} ===\n`;
    
    chunks.forEach((chunk, index) => {
      const content = chunk.fullContent || chunk.pageContent || '';
      context += `\nSection ${index + 1}:\n${content}\n`;
    });
    
    context += `\n`;
  });
  
  console.log(`[ContextAgent] Built context with ${context.length} characters from ${chunksByPage.size} pages`);
  console.log(`[ContextAgent] Context preview: ${context.substring(0, 300)}...`);
  
  return context;
};

// Get page content from SQLite
ContextAgent.prototype.getPageContent = async function(pageId) {
  try {
    const projectStore = await import('./projectStore.js');
    const page = await projectStore.default.getPage(pageId);
    return page ? page.content : null;
  } catch (error) {
    console.error(`[ContextAgent] Error loading content for page ${pageId}:`, error);
    return null;
  }
};

// Legacy method - keeping for compatibility
ContextAgent.prototype.applyRelevanceFilter = function(results, question) {
  if (results.length === 0) return results;
  
  console.log(`[ContextAgent] Applying relevance filter to ${results.length} results`);
  console.log(`[ContextAgent] Question: "${question}"`);
  
  // Extract key terms from the question
  const questionTerms = this.extractKeyTerms(question.toLowerCase());
  console.log(`[ContextAgent] Key question terms:`, questionTerms);
  
  if (questionTerms.length === 0) {
    console.log('[ContextAgent] No meaningful terms in question, returning all results');
    return results;
  }
  
  // Score each result based on relevance
  const scoredResults = results.map(result => {
    const content = (result.pageContent || result.fullContent || '').toLowerCase();
    const title = (result.metadata?.pageTitle || '').toLowerCase();
    const combinedText = `${title} ${content}`;
    
    // Calculate term overlap score
    const matchingTerms = questionTerms.filter(term => {
      return combinedText.includes(term) || this.hasPartialTermMatch(term, combinedText);
    });
    
    const termOverlapScore = matchingTerms.length / questionTerms.length;
    
    // Calculate content quality score
    const contentQualityScore = this.calculateContentQuality(content, questionTerms);
    
    // Calculate hybrid score (if available) contribution
    const hybridScore = result.hybridScore || 0;
    const normalizedHybridScore = Math.min(hybridScore / 2, 1); // Normalize to 0-1 range
    
    // Combined relevance score
    const relevanceScore = (
      termOverlapScore * 0.5 +        // 50% term overlap
      contentQualityScore * 0.2 +     // 20% content quality  
      normalizedHybridScore * 0.3     // 30% hybrid search score
    );
    
    return {
      ...result,
      relevanceScore,
      termOverlapScore,
      contentQualityScore,
      matchingTerms: matchingTerms.length
    };
  });
  
  // Sort by relevance score
  scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Apply aggressive threshold - only keep highly relevant results
  const threshold = 0.2; // Aggressive threshold for better quality
  const relevantResults = scoredResults.filter(result => {
    const isRelevant = result.relevanceScore >= threshold;
    if (!isRelevant) {
      console.log(`[ContextAgent] 🚫 Filtered out: ${result.metadata?.pageTitle} (score: ${result.relevanceScore.toFixed(3)})`);
      console.log(`[ContextAgent]    Term overlap: ${result.matchingTerms}/${questionTerms.length}, Quality: ${result.contentQualityScore.toFixed(3)}`);
    } else {
      console.log(`[ContextAgent] ✅ Keeping: ${result.metadata?.pageTitle} (score: ${result.relevanceScore.toFixed(3)})`);
      console.log(`[ContextAgent]    Term overlap: ${result.matchingTerms}/${questionTerms.length}, Quality: ${result.contentQualityScore.toFixed(3)}`);
    }
    return isRelevant;
  });
  
  // If we filtered out everything, keep the top 2 results as fallback
  if (relevantResults.length === 0 && results.length > 0) {
    console.log('[ContextAgent] ⚠️ All results filtered out, keeping top 2 as fallback');
    return scoredResults.slice(0, 2);
  }
  
  // Limit to top 3 results to prevent information overload
  const finalResults = relevantResults.slice(0, 3);
  
  console.log(`[ContextAgent] Relevance filtering: ${results.length} → ${relevantResults.length} → ${finalResults.length} results`);
  
  return finalResults;
};

// Extract meaningful terms from question
ContextAgent.prototype.extractKeyTerms = function(question) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'what', 'how',
    'when', 'where', 'why', 'who', 'which', 'can', 'tell', 'explain',
    'about', 'more', 'some', 'any', 'much', 'many', 'get', 'make', 'take',
    'give', 'come', 'go', 'see', 'know', 'think', 'look', 'use', 'find',
    'work', 'may', 'say', 'each', 'like', 'also', 'back', 'other', 'after',
    'first', 'well', 'way', 'even', 'new', 'want', 'because', 'good', 'need'
  ]);
  
  return question.toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term))
    .map(term => term.replace(/[^\w]/g, ''))
    .filter(term => term.length > 0);
};

// Check for partial term matches
ContextAgent.prototype.hasPartialTermMatch = function(queryTerm, content) {
  if (queryTerm.length < 4) return false;
  
  // Check for substring matches (at least 75% of term length)
  const minLength = Math.ceil(queryTerm.length * 0.75);
  const substring = queryTerm.substring(0, minLength);
  return content.includes(substring);
};

// Calculate content quality score based on question terms
ContextAgent.prototype.calculateContentQuality = function(content, questionTerms) {
  if (!content || content.length < 50) return 0;
  
  // Penalize very short content
  if (content.length < 100) return 0.2;
  
  // Reward content that contains multiple question terms close together
  let proximityScore = 0;
  for (let i = 0; i < questionTerms.length; i++) {
    for (let j = i + 1; j < questionTerms.length; j++) {
      const term1Index = content.indexOf(questionTerms[i]);
      const term2Index = content.indexOf(questionTerms[j]);
      
      if (term1Index !== -1 && term2Index !== -1) {
        const distance = Math.abs(term1Index - term2Index);
        if (distance < 200) { // Terms within 200 characters
          proximityScore += 0.1;
        }
      }
    }
  }
  
  // Reward reasonable content length (not too short, not too long)
  let lengthScore = 0;
  if (content.length > 200 && content.length < 2000) {
    lengthScore = 0.3;
  } else if (content.length >= 2000) {
    lengthScore = 0.2; // Slightly penalize very long content
  }
  
  return Math.min(proximityScore + lengthScore, 1);
}; 