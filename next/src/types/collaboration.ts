import { Timestamp } from 'firebase/firestore';

export interface Review {
  professionalSkill: number;
  communication: number;
  attitude: number;
  satisfaction: number;
  comment: string;
  isAnonymous: boolean;
  timestamp: Date;
}

export interface Collaboration {
  id: string;
  title: string;
  partnerId: string;
  partnerName: string;
  startDate: Date | Timestamp;
  endDate?: Date | Timestamp;
  isCompleted: boolean;
  isReviewed: boolean;
  review?: Review;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CollaborationRequest {
  id?: string;
  postId: string;
  postTitle: string;
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  rejectReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}