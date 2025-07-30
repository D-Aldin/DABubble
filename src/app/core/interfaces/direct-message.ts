export interface DirectMessage {
  id?: string;
  message: string;
  messageFrom: string;
  messageTo: string;
  tags: string[];
  timestamp: Date;
}