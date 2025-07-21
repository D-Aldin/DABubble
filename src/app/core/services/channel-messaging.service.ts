import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc,collectionData, orderBy, query, serverTimestamp, doc, runTransaction, getCountFromServer } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Message } from '../../core/interfaces/message';
import { ChannelMessage } from '../interfaces/channel-message';

@Injectable({
  providedIn: 'root'
})
export class ChannelMessagingService {
  private firestore = inject(Firestore);

  constructor() { }

  getChannelMessages(channelId: string): Observable<ChannelMessage[]> {
  const ref = collection(this.firestore, `channels/${channelId}/messages`);
  const q = query(ref, orderBy('timestamp', 'asc'));
  return collectionData(q, { idField: 'id' }) as Observable<ChannelMessage[]>;
}

  sendMessage(channelId: string, senderId: string, text: string) {
    const ref = collection(this.firestore, `channels/${channelId}/messages`);
    return addDoc(ref, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });
  }

  async getReplyCount(channelId: string, messageId: string): Promise<number> {
    const threadRef = collection(this.firestore, `channels/${channelId}/messages/${messageId}/threads`);
    const snapshot = await getCountFromServer(threadRef);
    return snapshot.data().count;
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
}
