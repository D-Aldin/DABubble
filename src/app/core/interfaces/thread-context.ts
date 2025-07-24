export interface ThreadContext {
  messageId: string;
  parentType: 'channel' | 'dm';
  parentId: string; // could be channelId or dmId depending on the parentType
}
