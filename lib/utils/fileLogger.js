import { ensureDir, writeFile, appendFile } from 'fs-extra';
import path from 'path';

class FileLogger {
  constructor(logDir = './logs', fileName = 'query.log') {
    this.logDir = logDir;
    this.fileName = fileName;
    this.logFilePath = path.join(this.logDir, this.fileName);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    await ensureDir(this.logDir);
    this.initialized = true;
  }

  async startNewQuery({ projectId, question, mode }) {
    await this.initialize();
    const header = [
      '===== Cortex Query Log =====',
      `Timestamp: ${new Date().toISOString()}`,
      projectId ? `Project: ${projectId}` : null,
      question ? `Question: ${question}` : null,
      mode ? `Mode: ${mode}` : null,
      '====================================',
      ''
    ].filter(Boolean).join('\n');
    await writeFile(this.logFilePath, header, 'utf8');
  }

  async logSection(title, payload) {
    await this.initialize();
    const text = `\n--- ${title} ---\n${this.format(payload)}\n`;
    await appendFile(this.logFilePath, text, 'utf8');
  }

  async logIntermediateNode(nodeName, output) {
    return this.logSection(`Intermediate Node Output: ${nodeName}`, output);
  }

  async logSelectedChunks(chunks) {
    const formatted = chunks.map((c, idx) => ({
      rank: idx + 1,
      pageTitle: c.metadata?.pageTitle || 'Unknown',
      hybridScore: c.hybridScore,
      source: c.source,
      preview: (c.fullContent || c.pageContent || '').substring(0, 300)
    }));
    return this.logSection('Selected Chunks (Truncated)', formatted);
  }

  async logRankings(chunks) {
    const ranking = chunks.map((c, idx) => ({
      rank: idx + 1,
      pageTitle: c.metadata?.pageTitle || 'Unknown',
      hybridScore: c.hybridScore,
      source: c.source,
      pageId: c.metadata?.pageId || c.metadata?.sqlitePageId
    }));
    return this.logSection('Chunk Rankings', ranking);
  }

  async logRetrieverStats(searchResults) {
    const scores = searchResults.map(d => d.hybridScore || 0).filter(s => typeof s === 'number');
    const count = scores.length;
    const min = count ? Math.min(...scores) : 0;
    const max = count ? Math.max(...scores) : 0;
    const avg = count ? (scores.reduce((a, b) => a + b, 0) / count) : 0;
    const variance = count ? (scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / count) : 0;
    const stdDev = Math.sqrt(variance);

    const sourceDistribution = searchResults.reduce((acc, d) => {
      const s = d.source || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      resultsCount: searchResults.length,
      score: { min, max, avg, stdDev },
      sources: sourceDistribution
    };
    return this.logSection('Retriever Final Stats', stats);
  }

  format(obj) {
    try {
      return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }
}

const fileLogger = new FileLogger();
export default fileLogger;


