import { Timestamp } from "firebase/firestore";

/** Legacy: userId -> single emoji */
export type LegacyReactions = { [userId: string]: string };
/** New: emoji -> list of userIds */
export type NewReactions = { [emoji: string]: string[] };

export interface Message {
  id?: string;
  messageFrom: string;
  message: string;
  timestamp: Timestamp;

  /** Supports legacy (userId->emoji) OR new (emoji->userIds[]) */
  reactions?: LegacyReactions | NewReactions;
  replyCount?: number;
  lastReplyTimestamp?: Timestamp | Date;
}

export interface DirectMessage extends Message {
  messageTo: string;
  tags: string[];
}
