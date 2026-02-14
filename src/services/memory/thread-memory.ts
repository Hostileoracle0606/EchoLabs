export interface ThreadMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export class ThreadMemoryStore {
  private threads = new Map<string, ThreadMessage[]>();

  addMessage(threadId: string, message: ThreadMessage) {
    const thread = this.threads.get(threadId) ?? [];
    thread.push(message);
    this.threads.set(threadId, thread);
  }

  getThread(threadId: string, limit = 10): ThreadMessage[] {
    const thread = this.threads.get(threadId) ?? [];
    return thread.slice(-limit);
  }

  async semanticSearch(threadId: string, query: string, limit = 3): Promise<ThreadMessage[]> {
    // TODO: Replace with Mastra memory semantic search.
    void query;
    return this.getThread(threadId, limit);
  }
}

const globalForMemory = global as unknown as { threadMemory?: ThreadMemoryStore };

export function getThreadMemory(): ThreadMemoryStore {
  if (!globalForMemory.threadMemory) {
    globalForMemory.threadMemory = new ThreadMemoryStore();
  }
  return globalForMemory.threadMemory;
}
