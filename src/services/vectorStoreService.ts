// Vector Store Service - Main Process Interface
// This service runs in the main process due to LanceDB native dependencies

export interface VectorChunk {
  id: string;
  transcriptId: string;
  text: string;
  vector: number[];
  startTime: number;
  endTime: number;
  speaker?: string;
  chunkIndex: number;
  wordCount: number;
  speakers: string[];
  method: string;
  createdAt: string;
}

export interface SearchResult {
  chunk: VectorChunk;
  score: number;
  rank: number;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  transcriptId?: string;
  speaker?: string;
  timeRange?: { start: number; end: number };
}

export class VectorStoreService {
  private static instance: VectorStoreService;

  private constructor() {}

  static getInstance(): VectorStoreService {
    if (!VectorStoreService.instance) {
      VectorStoreService.instance = new VectorStoreService();
    }
    return VectorStoreService.instance;
  }

  async initialize(dbPath?: string): Promise<void> {
    return (window.electronAPI as any).vectorStore.initialize(dbPath);
  }

  async storeChunks(chunks: any[], embeddings: any[]): Promise<void> {
    return (window.electronAPI as any).vectorStore.storeChunks(chunks, embeddings);
  }

  async searchSimilar(
    queryEmbedding: number[], 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    return (window.electronAPI as any).vectorStore.searchSimilar(queryEmbedding, options);
  }

  async deleteTranscriptChunks(transcriptId: string): Promise<void> {
    return (window.electronAPI as any).vectorStore.deleteTranscriptChunks(transcriptId);
  }

  async getTranscriptChunks(transcriptId: string): Promise<VectorChunk[]> {
    return (window.electronAPI as any).vectorStore.getTranscriptChunks(transcriptId);
  }

  async updateChunks(chunks: any[], embeddings: any[]): Promise<void> {
    return (window.electronAPI as any).vectorStore.updateChunks(chunks, embeddings);
  }

  async getStats(): Promise<{
    totalChunks: number;
    transcripts: string[];
    avgChunkSize: number;
    speakers: string[];
  }> {
    return (window.electronAPI as any).vectorStore.getStats();
  }

  isInitialized(): boolean {
    // Always return true since we're delegating to main process
    return true;
  }

  async close(): Promise<void> {
    return (window.electronAPI as any).vectorStore.close();
  }
}

// Export singleton instance
export const vectorStoreService = VectorStoreService.getInstance();