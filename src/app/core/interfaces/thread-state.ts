export interface ThreadState {
  messageId: string;
  channelId: string;
  threadType: 'channel' | 'direct';
}
