import { Timestamp } from "firebase/firestore";

export interface Message {
  messageFrom: string;
  to: string;
  message: string;
  timestamp: Timestamp;
}
