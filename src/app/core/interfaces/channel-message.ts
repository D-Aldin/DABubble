import { Timestamp } from '@angular/fire/firestore';
import { LegacyReactions, NewReactions } from '../../core/interfaces/message';

export interface ChannelMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  reactions?: LegacyReactions | NewReactions;
  threadId?: string;
  replyCount?: number;
  lastReplyTimestamp?: Timestamp | Date;
  channelId: string;
}
