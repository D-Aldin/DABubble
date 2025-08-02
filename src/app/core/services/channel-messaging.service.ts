import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, orderBy, query, serverTimestamp, doc, runTransaction, getCountFromServer, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Message } from '../../core/interfaces/message';
import { ChannelMessage } from '../interfaces/channel-message';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChannelMessagingService {
  private firestore = inject(Firestore);
  private replyCountCache: { [key: string]: number } = {};

  constructor() { }

  getChannelMessages(channelId: string): Observable<ChannelMessage[]> {
    const messagesRef = collection(this.firestore, `channels/${channelId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return new Observable<ChannelMessage[]>((observer) => {
      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
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

    await runTransaction(this.firestore, async (transaction) => {
      const msgSnap = await transaction.get(msgRef);
      if (!msgSnap.exists()) return;

      const data = msgSnap.data();
      const reactions = data['reactions'] || {};

      if (reactions[userId] === emoji) {
        delete reactions[userId]; // remove reaction
      } else {
        reactions[userId] = emoji; // add or change reaction
      }

      transaction.update(msgRef, { reactions });
    });
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
