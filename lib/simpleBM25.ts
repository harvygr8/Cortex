// Simple BM25-like retriever implementation
export class SimpleBM25Retriever {
  constructor(documents = []) {
    this.documents = documents;
    this.termFrequencies = new Map();
    this.documentFrequencies = new Map();
    this.totalDocuments = documents.length;
    this.averageDocumentLength = 0;
    this.initialize();
  }

  initialize() {
    if (this.documents.length === 0) return;

    // Calculate average document length in tokens, not characters
    const tokenLengths = this.documents.map(doc => this.tokenize(doc.pageContent).length);
    const totalTokens = tokenLengths.reduce((sum, len) => sum + len, 0);
    this.averageDocumentLength = totalTokens / this.totalDocuments;

    // Build term frequency and document frequency maps
    this.documents.forEach((doc, docIndex) => {
      const terms = this.tokenize(doc.pageContent);
      const termCounts = new Map();

      // Count terms in this document
      terms.forEach(term => {
        termCounts.set(term, (termCounts.get(term) || 0) + 1);
      });

      // Update document frequencies
      termCounts.forEach((count, term) => {
        if (!this.documentFrequencies.has(term)) {
          this.documentFrequencies.set(term, 0);
        }
        this.documentFrequencies.set(term, this.documentFrequencies.get(term) + 1);
      });

      // Store term frequencies for this document
      this.termFrequencies.set(docIndex, termCounts);
    });

    console.log(`[SimpleBM25] Initialized with ${this.documents.length} documents, ${this.documentFrequencies.size} unique terms`);
    console.log(`[SimpleBM25] Average document length: ${this.averageDocumentLength.toFixed(1)} tokens`);
    
    // Log some statistics for debugging
    const topTerms = Array.from(this.documentFrequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log(`[SimpleBM25] Top terms:`, topTerms.map(([term, freq]) => `${term}(${freq})`).join(', '));
  }

  tokenize(text) {
    // Enhanced tokenization: lowercase, split on whitespace, remove short terms
    return text.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 1) // Reduced from 2 to 1 to include more terms
      .map(term => term.replace(/[^\w]/g, ''))
      .filter(term => term.length > 0 && !this.isStopWord(term));
  }
  
  // Basic stop word filtering to improve relevance
  isStopWord(term) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    return stopWords.has(term);
  }

  calculateBM25Score(docIndex, queryTerms) {
    const doc = this.documents[docIndex];
    const docLength = this.tokenize(doc.pageContent).length; // Use token count, not char count
    const termFreqs = this.termFrequencies.get(docIndex);
    
    let score = 0;
    const k1 = 1.2; // BM25 parameter
    const b = 0.75;  // BM25 parameter

    queryTerms.forEach(term => {
      const tf = termFreqs.get(term) || 0;
      const df = this.documentFrequencies.get(term) || 0;
      
      if (df > 0 && tf > 0) {
        const idf = Math.log((this.totalDocuments - df + 0.5) / (df + 0.5));
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLength / this.averageDocumentLength));
        const termScore = idf * (numerator / denominator);
        score += termScore;
      }
    });

    return score;
  }

  async getRelevantDocuments(query, k = 5) {
    const queryTerms = this.tokenize(query);
    
    if (queryTerms.length === 0) {
      console.log(`[SimpleBM25] Empty query, returning first ${k} documents`);
      return this.documents.slice(0, k);
    }

    console.log(`[SimpleBM25] Query terms:`, queryTerms);

    // Calculate scores for all documents
    const scoredDocs = this.documents.map((doc, index) => ({
      ...doc,
      score: this.calculateBM25Score(index, queryTerms)
    }));

    // Sort by score (descending) and apply aggressive filtering
    const sortedDocs = scoredDocs.sort((a, b) => b.score - a.score);
    
    // Calculate dynamic threshold based on score distribution
    const positiveScores = sortedDocs.map(doc => doc.score).filter(score => score > 0);
    
    let results;
    if (positiveScores.length === 0) {
      console.log(`[SimpleBM25] No documents with positive scores`);
      return [];
    }
    
    const maxScore = Math.max(...positiveScores);
    const avgScore = positiveScores.reduce((sum, score) => sum + score, 0) / positiveScores.length;
    
    // Set aggressive threshold - must be at least 20% of max score or 50% of average
    const minThreshold = 0.1; // Absolute minimum
    const dynamicThreshold = Math.max(
      minThreshold,
      maxScore * 0.2,  // 20% of max score
      avgScore * 0.5   // 50% of average score
    );
    
    console.log(`[SimpleBM25] Score stats - Max: ${maxScore.toFixed(3)}, Avg: ${avgScore.toFixed(3)}, Threshold: ${dynamicThreshold.toFixed(3)}`);
    
    // Filter by threshold
    const thresholdFilteredDocs = sortedDocs.filter(doc => {
      const isRelevant = doc.score >= dynamicThreshold;
      if (!isRelevant) {
        console.log(`[SimpleBM25] Filtered out: ${doc.metadata?.pageTitle} (score: ${doc.score.toFixed(3)} < ${dynamicThreshold.toFixed(3)})`);
      }
      return isRelevant;
    });
    
    // If threshold filtering removed everything, keep top 2 results
    if (thresholdFilteredDocs.length === 0 && sortedDocs.length > 0) {
      console.log(`[SimpleBM25] Threshold too aggressive, keeping top 2 results`);
      results = sortedDocs.slice(0, 2);
    } else {
      results = thresholdFilteredDocs.slice(0, k);
    }

    console.log(`[SimpleBM25] Query: "${query}" -> ${results.length} results`);
    if (results.length > 0) {
      console.log(`[SimpleBM25] Score range: ${Math.min(...results.map(r => r.score)).toFixed(3)} to ${Math.max(...results.map(r => r.score)).toFixed(3)}`);
      console.log(`[SimpleBM25] Top result: ${results[0].metadata?.pageTitle || 'Unknown'} (score: ${results[0].score.toFixed(3)})`);
    }
    return results;
  }

  // Method to add new documents
  addDocuments(newDocuments) {
    this.documents.push(...newDocuments);
    this.initialize();
  }
}
