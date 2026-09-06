export interface Message {
  id: string;
  sender: 'student' | 'bot';
  text: string;
  timestamp: string;
  category?: 'Content - Framework' | 'Content - Case Study' | 'Logistics' | 'Wellbeing' | 'Out of Scope' | 'Academic Integrity Risk';
  flagged?: boolean;
  unresolved?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
  lastActiveAt: string;
}

export interface SyllabusChunk {
  id: string;
  title: string;
  content: string;
  category: 'Framework' | 'Tunisia' | 'Egypt' | 'Syria' | 'Yemen' | 'Logistics' | 'Policies' | 'Resources';
  tags: string[];
}

export interface QueryLog {
  id: string;
  query: string;
  answer: string;
  category: string;
  flagged: boolean;
  unresolved: boolean;
  timestamp: string;
}

export interface SupplementalMaterial {
  id: string;
  title: string;
  content: string;
  addedBy: string;
  dateAdded: string;
}
