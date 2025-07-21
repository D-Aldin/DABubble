import { Timestamp } from '@angular/fire/firestore';

export interface ChannelMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  reactions?: { [userId: string]: string };
  threadId?: string;
  replyCount?: number;
}
