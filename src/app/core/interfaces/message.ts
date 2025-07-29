import { Timestamp } from "firebase/firestore";

export interface Message {
  id?: string; 
  messageFrom: string;
  message: string;
  timestamp: Timestamp;
  reactions?: { [userId: string]: string };
  replyCount?: number;
  lastReplyTimestamp?: Timestamp | Date;
}
