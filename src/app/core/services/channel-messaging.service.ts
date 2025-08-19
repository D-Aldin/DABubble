import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, orderBy, query, serverTimestamp, doc, runTransaction, getCountFromServer, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Message } from '../../core/interfaces/message';
import { ChannelMessage } from '../interfaces/channel-message';
import { LegacyReactions, NewReactions } from '../../core/interfaces/message';

@Injectable({
  providedIn: 'root'
})
export class ChannelMessagingService {
  private firestore = inject(Firestore);
  private replyCountCache: { [key: string]: number } = {};
  private static readonly MAX_EMOJIS_PER_USER_PER_MESSAGE = 20;

  constructor() { }

  getChannelMessages(channelId: string): Observable<ChannelMessage[]> {
    const messagesRef = collection(this.firestore, `channels/${channelId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return new Observable<ChannelMessage[]>((observer) => {
      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            lastReplyTimestamp: (data as any)['lastReplyTimestamp'] ?? null,
          } as ChannelMessage;
        });
        observer.next(messages);
      }, (error) => observer.error(error));
    });
  }

  sendMessage(channelId: string, senderId: string, text: string) {
    const ref = collection(this.firestore, `channels/${channelId}/messages`);
    return addDoc(ref, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });
  }

  async toggleReaction(channelId: string, messageId: string, emoji: string, userId: string): Promise<void> {
    const msgRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    await runTransaction(this.firestore, async (tx) => {
      const reactions = await this.getNormalizedReactions(tx, msgRef);
      if (!reactions) return;
      this.updateReactionSet(reactions, emoji, userId);
      tx.update(msgRef, { reactions } as Partial<ChannelMessage>);
    });
  }

  private async getNormalizedReactions(tx: any, msgRef: any): Promise<Record<string, string[]> | null> {
    const snap = await tx.get(msgRef);
    if (!snap.exists()) return null;
    const data = snap.data() as ChannelMessage;
    return this.normalizeToNew(data.reactions);
  }

  private updateReactionSet(reactions: Record<string, string[]>, emoji: string, userId: string): void {
    const set = new Set<string>(reactions[emoji] ?? []);
    const already = set.has(userId);
    const userEmojiCount = Object.values(reactions)
      .reduce((acc, list) => acc + (list.includes(userId) ? 1 : 0), 0);
    if (already) {
      set.delete(userId);
      reactions[emoji] = set.size ? Array.from(set) : undefined!;
      if (!set.size) delete reactions[emoji];
    } else {
      if (userEmojiCount >= ChannelMessagingService.MAX_EMOJIS_PER_USER_PER_MESSAGE) {
        throw new Error('REACTION_LIMIT_REACHED');
      }
      set.add(userId);
      reactions[emoji] = Array.from(set);
    }
  }

  private normalizeToNew(raw?: LegacyReactions | NewReactions | null): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    if (!raw) return out;
    const entries = Object.entries(raw);
    if (!entries.length) return out;
    const keyHasEmoji    = entries.some(([k])   => /[^\w\s-]/.test(k));
    const valueHasEmoji  = entries.some(([, v]) => typeof v === 'string' && /[^\w\s-]/.test(v as string));
    const allValuesArray = entries.every(([, v]) => Array.isArray(v));
    if (keyHasEmoji) return this.fromKeyEmoji(entries);
    if (valueHasEmoji) return this.fromValEmoji(entries);
    if (allValuesArray) return Object.fromEntries(entries.map(([e, u]) => [e, (u as string[]).slice()]));
    for (const [emoji, v] of entries) out[emoji] = Array.isArray(v) ? (v as string[]) : [];
    return out;
  }

  private fromKeyEmoji(entries: [string, any][]): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const [emoji, v] of entries) {
      const users = Array.isArray(v) ? (v as string[]) : typeof v === 'string' ? [v as string] : [];
      if (users.length) out[emoji] = users;
    }
    return out;
  }

  private fromValEmoji(entries: [string, string][]): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const [uid, emoji] of entries) (out[emoji] ||= []).push(uid);
    return out;
  }

  async updateChannelMessageText(channelId: string, messageId: string, newText: string): Promise<void> {
    const msgRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    await runTransaction(this.firestore, async (transaction) => {
      const snapshot = await transaction.get(msgRef);
      if (!snapshot.exists()) throw new Error('Message not found');

      transaction.update(msgRef, { text: newText });
    });
  }

}
