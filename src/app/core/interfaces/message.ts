import { Timestamp } from "firebase/firestore";

/**
 * Common structure for all message types (channel + DM).
 */
export interface Message {
  id?: string;
  messageFrom: string;
  message: string;
  timestamp: Timestamp;
  reactions?: { [userId: string]: string }; // emoji reactions
  replyCount?: number;                     // used for threads
  lastReplyTimestamp?: Timestamp | Date;  // used for threads
}

/**
 * DirectMessage extends the base Message structure to avoid duplication.
 * It includes DM-specific fields like:
 * - messageTo: recipient's user ID
 * - tags: any metadata like labels or categories
 *
 * Inheriting from Message ensures consistency across channels and DMs
 * (e.g. reactions, threading, timestamps).
 */
export interface DirectMessage extends Message {
  messageTo: string;
  tags: string[];
}
