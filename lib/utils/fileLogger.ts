import { ensureDir, writeFile, appendFile } from 'fs-extra';
import * as path from 'path';
import { SearchResult } from '../../types';

interface QueryParams {
  projectId?: string;
  question?: string;
  mode?: string;
}

interface FormattedChunk {
  rank: number;
  pageTitle: string;
  hybridScore: number;
  source: string;
  preview: string;
}

interface RankingChunk {
  rank: number;
  pageTitle: string;
  hybridScore: number;
  source: string;
  pageId: string;
}

interface ScoreStats {
  min: number;
  max: number;
  avg: number;
  stdDev: number;
}

interface RetrieverStats {
  resultsCount: number;
  score: ScoreStats;
  sources: Record<string, number>;
}

class FileLogger {
  private logDir: string;
  private fileName: string;
  private logFilePath: string;
  private initialized: boolean;

  constructor(logDir = './logs', fileName = 'query.log') {
    this.logDir = logDir;
    this.fileName = fileName;
    this.logFilePath = path.join(this.logDir, this.fileName);
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await ensureDir(this.logDir);
    this.initialized = true;
  }

  async startNewQuery({ projectId, question, mode }: QueryParams): Promise<void> {
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

  async logSection(title: string, payload: any): Promise<void> {
    await this.initialize();
    const text = `\n--- ${title} ---\n${this.format(payload)}\n`;
    await appendFile(this.logFilePath, text, 'utf8');
  }

  async logIntermediateNode(nodeName: string, output: any): Promise<void> {
    return this.logSection(`Intermediate Node Output: ${nodeName}`, output);
  }

  async logSelectedChunks(chunks: SearchResult[]): Promise<void> {
    const formatted: FormattedChunk[] = chunks.map((c: SearchResult, idx: number): FormattedChunk => ({
      rank: idx + 1,
      pageTitle: c.metadata?.pageTitle || 'Unknown',
      hybridScore: (c as any).hybridScore || 0,
      source: (c as any).source || 'unknown',
      preview: ((c as any).fullContent || c.pageContent || '').substring(0, 300)
    }));
    return this.logSection('Selected Chunks (Truncated)', formatted);
  }

  async logRankings(chunks: SearchResult[]): Promise<void> {
    const ranking: RankingChunk[] = chunks.map((c: SearchResult, idx: number): RankingChunk => ({
      rank: idx + 1,
      pageTitle: c.metadata?.pageTitle || 'Unknown',
      hybridScore: (c as any).hybridScore || 0,
      source: (c as any).source || 'unknown',
      pageId: c.metadata?.pageId || c.metadata?.sqlitePageId || 'unknown'
    }));
    return this.logSection('Chunk Rankings', ranking);
  }

  async logRetrieverStats(searchResults: SearchResult[]): Promise<void> {
    const scores = searchResults.map((d: SearchResult) => (d as any).hybridScore || 0).filter((s: number) => typeof s === 'number');
    const count = scores.length;
    const min = count ? Math.min(...scores) : 0;
    const max = count ? Math.max(...scores) : 0;
    const avg = count ? (scores.reduce((a: number, b: number) => a + b, 0) / count) : 0;
    const variance = count ? (scores.reduce((sum: number, s: number) => sum + Math.pow(s - avg, 2), 0) / count) : 0;
    const stdDev = Math.sqrt(variance);

    const sourceDistribution = searchResults.reduce((acc: Record<string, number>, d: SearchResult) => {
      const s = (d as any).source || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const stats: RetrieverStats = {
      resultsCount: searchResults.length,
      score: { min, max, avg, stdDev },
      sources: sourceDistribution
    };
    return this.logSection('Retriever Final Stats', stats);
  }

  format(obj: any): string {
    try {
      return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }
}

const fileLogger = new FileLogger();
export default fileLogger;


