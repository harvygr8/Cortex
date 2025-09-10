import { SimpleBM25Retriever } from './simpleBM25.js';

export class HybridRetriever {
  constructor(vectorStore, documents = []) {
    this.vectorStore = vectorStore;
    this.bm25Retriever = null;
    this.initialized = false;
  }

  // Initialize BM25 with documents
  async initializeBM25(documents) {
    if (this.initialized) return;
    
    console.log('[HybridRetriever] Initializing Simple BM25 with', documents.length, 'documents');
    
    try {
      // Fetch full content from SQLite for BM25 initialization
      const documentsWithContent = await this.fetchFullContentFromSQLite(documents);
      
      // Use our simple but reliable BM25 implementation with full content
      this.bm25Retriever = new SimpleBM25Retriever(documentsWithContent);
      
      this.initialized = true;
      console.log('[HybridRetriever] Simple BM25 initialized successfully with full content');
    } catch (error) {
      console.error('[HybridRetriever] Error initializing BM25:', error);
      this.initialized = false;
      console.log('[HybridRetriever] BM25 initialization failed, will use semantic-only search');
    }
  }

  // Fetch full content from SQLite for BM25 initialization
  async fetchFullContentFromSQLite(documents) {
    try {
      const projectStore = await import('./projectStore.js');
      const documentsWithContent = await Promise.all(
        documents.map(async (doc) => {
          const pageId = doc.metadata?.pageId || doc.metadata?.sqlitePageId;
          if (pageId) {
            try {
              const page = await projectStore.default.getPage(pageId);
              const fullContent = page ? page.content : doc.pageContent;
              return {
                ...doc,
                pageContent: fullContent,
                hasFullContent: !!page && !!page.content,
                originalContent: doc.pageContent // Keep reference to original
              };
            } catch (error) {
              console.warn(`[HybridRetriever] Could not fetch content for page ${pageId}:`, error.message);
              return { 
                ...doc, 
                hasFullContent: false,
                originalContent: doc.pageContent
              }; // Keep original document if fetch fails
            }
          }
          return { 
            ...doc, 
            hasFullContent: false,
            originalContent: doc.pageContent
          }; // Keep original document if no page ID
        })
      );
      
      const successCount = documentsWithContent.filter(doc => doc.hasFullContent).length;
      console.log(`[HybridRetriever] Content fetch results: ${successCount}/${documentsWithContent.length} documents with full content`);
      
      if (successCount === 0) {
        console.warn('[HybridRetriever] No documents have full content - BM25 will work with limited data');
      }
      
      return documentsWithContent;
    } catch (error) {
      console.error('[HybridRetriever] Error fetching content from SQLite:', error);
      return documents.map(doc => ({
        ...doc,
        hasFullContent: false,
        originalContent: doc.pageContent
      })); // Return original documents if fetch fails
    }
  }

  // Perform hybrid search combining both retrievers
  async hybridSearch(query, k = 5, weights = { semantic: 0.6, keyword: 0.4 }) {
    console.log('[HybridRetriever] Performing hybrid search for:', query);
    
    try {
      // Get semantic results first - use larger multiplier for better coverage
      const semanticResults = await this.vectorStore.similaritySearch(query, Math.max(k * 3, 15));
      console.log('[HybridRetriever] Semantic results:', semanticResults.length);
      
      // Log semantic result quality
      if (semanticResults.length > 0) {
        console.log('[HybridRetriever] Top semantic results:');
        semanticResults.slice(0, 3).forEach((result, idx) => {
          console.log(`  ${idx + 1}. ${result.metadata?.pageTitle || 'Unknown'} (${result.pageContent.substring(0, 100)}...)`);
        });
      }
      
      let keywordResults = [];
      try {
        // Try to get BM25 results
        console.log('[HybridRetriever] About to call BM25 search...');
        console.log('[HybridRetriever] BM25 retriever state:', {
          initialized: this.initialized,
          hasRetriever: !!this.bm25Retriever,
          retrieverType: this.bm25Retriever?.constructor?.name,
          retrieverMethods: this.bm25Retriever ? Object.getOwnPropertyNames(Object.getPrototypeOf(this.bm25Retriever)) : 'none'
        });
        
        if (!this.bm25Retriever) {
          throw new Error('BM25 retriever is null - not initialized properly');
        }
        
        if (!this.initialized) {
          throw new Error('BM25 retriever not initialized');
        }
        
        console.log('[HybridRetriever] Attempting BM25 search with query:', query);
        keywordResults = await this.bm25Retriever.getRelevantDocuments(query, Math.max(k * 3, 15));
        console.log('[HybridRetriever] Keyword results:', keywordResults.length);
        
        // Log keyword result quality
        if (keywordResults.length > 0) {
          console.log('[HybridRetriever] Top keyword results:');
          keywordResults.slice(0, 3).forEach((result, idx) => {
            console.log(`  ${idx + 1}. ${result.metadata?.pageTitle || 'Unknown'} (score: ${result.score?.toFixed(3) || 'N/A'})`);
          });
        }
        
        if (keywordResults.length === 0) {
          console.warn('[HybridRetriever] BM25 returned 0 results - this might indicate an issue');
        }
      } catch (bm25Error) {
        console.error('[HybridRetriever] BM25 search failed with error:', bm25Error);
        console.error('[HybridRetriever] Error stack:', bm25Error.stack);
        console.warn('[HybridRetriever] Using semantic results only due to BM25 failure');
        keywordResults = [];
      }

      // If no keyword results, fall back to semantic-only
      if (keywordResults.length === 0) {
        console.log('[HybridRetriever] No BM25 results, returning semantic results only');
        const semanticOnlyResults = semanticResults.slice(0, k).map((doc, index) => ({
          ...doc,
          hybridScore: weights.semantic * (1 - index / Math.max(semanticResults.length, 1)),
          source: 'semantic',
          semanticRank: index
        }));
        
        console.log('[HybridRetriever] Semantic-only fallback results:');
        semanticOnlyResults.forEach((result, idx) => {
          console.log(`  ${idx + 1}. ${result.metadata?.pageTitle || 'Unknown'} (score: ${result.hybridScore?.toFixed(3)})`);
        });
        
        return semanticOnlyResults;
      }

      // Merge and re-rank results
      const mergedResults = this.mergeAndRerank(
        semanticResults, 
        keywordResults, 
        query, 
        weights
      );

      // Apply aggressive relevance filtering before returning results
      const filteredResults = this.applyRelevanceFiltering(mergedResults, query);
      
      // Return top k results from filtered set
      const finalResults = filteredResults.slice(0, k);
      
      console.log('[HybridRetriever] Results after relevance filtering:', finalResults.length);
      console.log('[HybridRetriever] Filtered out', mergedResults.length - filteredResults.length, 'irrelevant results');
      
      // ALGORITHM PERFORMANCE METRICS
      console.log('\n🔬 [HybridRetriever] ===== INTERNAL ALGORITHM METRICS =====');
      
      // Input analysis
      console.log('📥 Input Analysis:');
      console.log(`    Semantic Results: ${semanticResults.length}`);
      console.log(`    Keyword Results: ${keywordResults.length}`);
      console.log(`    Final Merged: ${finalResults.length}`);
      
      // Score analysis
      const scores = finalResults.map(doc => doc.hybridScore || 0);
      const scoreStats = {
        min: Math.min(...scores),
        max: Math.max(...scores),
        avg: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        stdDev: Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - (scores.reduce((a, b) => a + b, 0) / scores.length), 2), 0) / scores.length)
      };
      
      console.log('\n📊 Score Analysis:');
      console.log(`    Min Score: ${scoreStats.min.toFixed(4)}`);
      console.log(`    Max Score: ${scoreStats.max.toFixed(4)}`);
      console.log(`    Avg Score: ${scoreStats.avg.toFixed(4)}`);
      console.log(`    Std Dev: ${scoreStats.stdDev.toFixed(4)}`);
      console.log(`    Score Range: ${(scoreStats.max - scoreStats.min).toFixed(4)}`);
      
      // Source distribution
      const sourceDistribution = finalResults.reduce((acc, doc) => {
        acc[doc.source || 'unknown'] = (acc[doc.source || 'unknown'] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n🎯 Source Distribution:');
      Object.entries(sourceDistribution).forEach(([source, count]) => {
        const percentage = ((count / finalResults.length) * 100).toFixed(1);
        console.log(`    ${source}: ${count} results (${percentage}%)`);
      });
      
      // Overlap analysis
      const hybridCount = sourceDistribution.hybrid || 0;
      const overlapPercentage = ((hybridCount / finalResults.length) * 100).toFixed(1);
      console.log(`    Overlap Rate: ${overlapPercentage}% (${hybridCount}/${finalResults.length} results found by both methods)`);
      
      // Weight effectiveness
      console.log('\n⚖️ Weight Configuration Analysis:');
      console.log(`    Semantic Weight: ${weights.semantic}`);
      console.log(`    Keyword Weight: ${weights.keyword}`);
      console.log(`    Weight Balance: ${weights.semantic > weights.keyword ? 'Semantic-Heavy' : weights.keyword > weights.semantic ? 'Keyword-Heavy' : 'Balanced'}`);
      
      // Performance insights
      console.log('\n💡 Performance Insights:');
      if (hybridCount > 0) {
        console.log(`    ✅ High overlap detected - both methods agree on ${hybridCount} results`);
      }
      if (scoreStats.stdDev < 0.1) {
        console.log(`    ⚠️ Low score variance (${scoreStats.stdDev.toFixed(4)}) - results may be too similar`);
      } else if (scoreStats.stdDev > 0.5) {
        console.log(`    ✅ Good score variance (${scoreStats.stdDev.toFixed(4)}) - clear ranking differentiation`);
      }
      
      console.log('==================================================\n');
      
      return finalResults;

    } catch (error) {
      console.error('[HybridRetriever] Error in hybrid search:', error);
      
      // Fallback to semantic search only
      console.log('[HybridRetriever] Falling back to semantic search only');
      return await this.vectorStore.similaritySearch(query, k);
    }
  }

  // Merge results from both retrievers and re-rank
  mergeAndRerank(semanticResults, keywordResults, query, weights) {
    const merged = new Map();
    
    console.log('[HybridRetriever] Merging results:');
    console.log(`  Semantic: ${semanticResults.length}, Keyword: ${keywordResults.length}`);
    
    // Normalize BM25 scores for better hybrid ranking
    const keywordScores = keywordResults.map(doc => doc.score || 0).filter(score => score > 0);
    const maxKeywordScore = keywordScores.length > 0 ? Math.max(...keywordScores) : 1;
    const minKeywordScore = keywordScores.length > 0 ? Math.min(...keywordScores) : 0;
    const keywordScoreRange = maxKeywordScore - minKeywordScore || 1;
    
    // Process semantic results
    semanticResults.forEach((doc, index) => {
      const normalizedRank = index / Math.max(semanticResults.length - 1, 1);
      const score = weights.semantic * (1 - normalizedRank);
      const key = `${doc.metadata.pageId}-${this.getContentHash(doc.pageContent)}`;
      
      merged.set(key, {
        ...doc,
        hybridScore: score,
        source: 'semantic',
        semanticRank: index,
        semanticScore: score
      });
    });

    // Process keyword results and merge
    keywordResults.forEach((doc, index) => {
      const key = `${doc.metadata.pageId}-${this.getContentHash(doc.pageContent)}`;
      const existing = merged.get(key);
      
      // Normalize BM25 score to 0-1 range
      const rawScore = doc.score || 0;
      const normalizedBM25 = keywordScoreRange > 0 ? 
        (rawScore - minKeywordScore) / keywordScoreRange : 0;
      
      const keywordScore = weights.keyword * Math.max(normalizedBM25, 0.1); // Ensure minimum score
      
      if (existing) {
        // Document exists in both - boost score significantly
        const overlap_bonus = 0.3; // Bonus for appearing in both results
        existing.hybridScore += keywordScore + overlap_bonus;
        existing.keywordRank = index;
        existing.bm25Score = rawScore;
        existing.normalizedBM25 = normalizedBM25;
        existing.source = 'hybrid';
      } else {
        // New document from keyword search
        merged.set(key, {
          ...doc,
          hybridScore: keywordScore,
          source: 'keyword',
          keywordRank: index,
          bm25Score: rawScore,
          normalizedBM25: normalizedBM25
        });
      }
    });

    // Convert to array and sort by hybrid score
    const results = Array.from(merged.values());
    results.sort((a, b) => b.hybridScore - a.hybridScore);

    // Enhanced logging
    console.log('[HybridRetriever] Merge complete:');
    console.log(`  Total unique results: ${results.length}`);
    console.log(`  Keyword score range: ${minKeywordScore.toFixed(3)} - ${maxKeywordScore.toFixed(3)}`);
    console.log('[HybridRetriever] Top 5 results ranking:');
    results.slice(0, 5).forEach((result, index) => {
      console.log(`  ${index + 1}. Score: ${result.hybridScore.toFixed(3)}, Source: ${result.source}, Page: ${result.metadata.pageTitle}`);
      if (result.source === 'hybrid') {
        console.log(`      Semantic: ${result.semanticScore?.toFixed(3) || 'N/A'}, BM25: ${result.bm25Score?.toFixed(3) || 'N/A'}`);
      }
    });

    return results;
  }
  
  // Simple content hash for deduplication
  getContentHash(content) {
    return content.substring(0, 50).replace(/\s+/g, ' ').trim();
  }
  
  // Apply aggressive relevance filtering to eliminate irrelevant results
  applyRelevanceFiltering(results, query) {
    if (results.length === 0) return results;
    
    console.log('[HybridRetriever] Applying relevance filtering for query:', query);
    
    // Calculate dynamic thresholds based on score distribution
    const scores = results.map(r => r.hybridScore || 0).filter(s => s > 0);
    if (scores.length === 0) {
      console.log('[HybridRetriever] No positive scores found, returning empty results');
      return [];
    }
    
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const scoreStdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length);
    
    // Set aggressive thresholds
    const minAbsoluteScore = 0.1; // Minimum score to be considered relevant
    const relativeThreshold = Math.max(avgScore * 0.3, maxScore * 0.15); // At least 30% of average or 15% of max
    const finalThreshold = Math.max(minAbsoluteScore, relativeThreshold);
    
    console.log('[HybridRetriever] Score statistics:', {
      max: maxScore.toFixed(3),
      avg: avgScore.toFixed(3),
      stdDev: scoreStdDev.toFixed(3),
      threshold: finalThreshold.toFixed(3)
    });
    
    // Apply keyword relevance check
    const queryTerms = this.extractKeyTerms(query.toLowerCase());
    
    const filteredResults = results.filter(result => {
      const score = result.hybridScore || 0;
      
      // Score threshold check
      if (score < finalThreshold) {
        console.log(`[HybridRetriever] Filtered out ${result.metadata?.pageTitle}: score ${score.toFixed(3)} < threshold ${finalThreshold.toFixed(3)}`);
        return false;
      }
      
      // Content relevance check
      if (!this.hasContentRelevance(result, queryTerms)) {
        console.log(`[HybridRetriever] Filtered out ${result.metadata?.pageTitle}: no content relevance`);
        return false;
      }
      
      return true;
    });
    
    // If we filtered out everything, keep the top 2 results to avoid empty responses
    if (filteredResults.length === 0 && results.length > 0) {
      console.log('[HybridRetriever] All results filtered out, keeping top 2 as fallback');
      return results.slice(0, 2);
    }
    
    // If we have very few results after filtering, lower the threshold slightly
    if (filteredResults.length < 2 && results.length > 2) {
      console.log('[HybridRetriever] Too few results after filtering, applying relaxed threshold');
      const relaxedThreshold = finalThreshold * 0.7;
      
      const relaxedResults = results.filter(result => {
        const score = result.hybridScore || 0;
        return score >= relaxedThreshold && this.hasContentRelevance(result, queryTerms);
      });
      
      return relaxedResults.length > 0 ? relaxedResults : results.slice(0, 2);
    }
    
    console.log(`[HybridRetriever] Relevance filtering complete: ${filteredResults.length} relevant results`);
    return filteredResults;
  }
  
  // Extract key terms from query for relevance checking
  extractKeyTerms(query) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'what', 'how',
      'when', 'where', 'why', 'who', 'which'
    ]);
    
    return query.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term))
      .map(term => term.replace(/[^\w]/g, ''))
      .filter(term => term.length > 0);
  }
  
  // Check if result content has relevance to query terms
  hasContentRelevance(result, queryTerms) {
    if (queryTerms.length === 0) return true;
    
    const content = (result.pageContent || '').toLowerCase();
    const title = (result.metadata?.pageTitle || '').toLowerCase();
    const combinedText = content + ' ' + title;
    
    // Check if at least one significant query term appears in content
    const termMatches = queryTerms.filter(term => {
      return combinedText.includes(term) || this.findSimilarTerms(term, combinedText);
    });
    
    // Require at least 25% of query terms to match for relevance
    const relevanceRatio = termMatches.length / queryTerms.length;
    return relevanceRatio >= 0.25;
  }
  
  // Find similar terms (basic fuzzy matching)
  findSimilarTerms(queryTerm, content) {
    if (queryTerm.length < 4) return false;
    
    // Check for partial matches (substring of 70% or more)
    const minLength = Math.ceil(queryTerm.length * 0.7);
    const regex = new RegExp(queryTerm.substring(0, minLength), 'i');
    return regex.test(content);
  }

  // Get search statistics for debugging
  getSearchStats() {
    return {
      initialized: this.initialized,
      hasVectorStore: !!this.vectorStore,
      hasBM25: !!this.bm25Retriever
    };
  }
}
