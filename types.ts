
export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  imageUrl: string;
  location: string;
  occupation: string;
  gender?: 'male' | 'female' | 'non-binary' | 'other';
  interestedIn?: ('male' | 'female' | 'non-binary' | 'other')[];
  isVerified?: boolean;
  role?: 'user' | 'admin';
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  reason: string;
  timestamp: number;
  status: 'pending' | 'resolved';
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  timestamp: number;
}

export interface Match {
  id: string;
  profileId: string;
  lastMessage?: string;
  timestamp: number;
}

export type View = 'discover' | 'matches' | 'profile' | 'chat' | 'videoCall' | 'admin';

export interface Filters {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  interestMatch: boolean;
}
