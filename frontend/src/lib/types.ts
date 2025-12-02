// Shared TypeScript types
export interface User {
  user_id: string;
  email: string;
  name: string;
}

export interface Document {
  name: string;
  chunks: number;
  embedding_count: number;
}

export interface Source {
  content: string;
  filename: string;
}

export interface ChatMessage {
  question: string;
  answer: string;
  sources: Source[];
  timestamp?: string;
}