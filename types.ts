
export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  imageUrl: string;
  location: string;
  occupation: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Match {
  id: string;
  profileId: string;
  lastMessage?: string;
  timestamp: number;
}

export type View = 'discover' | 'matches' | 'profile' | 'chat';

export interface ChatContext {
  activeMatchId: string | null;
}
