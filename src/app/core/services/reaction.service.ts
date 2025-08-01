import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ReactionService {
  constructor(private firestore: Firestore) {}

  async toggleReaction(
    type: 'channel' | 'dm',
    conversationId: string,
    messageId: string,
    emoji: string,
    userId: string
  ) {
    const path =
      type === 'channel'
        ? `channels/${conversationId}/messages/${messageId}`
        : `directMessages/${conversationId}/messages/${messageId}`;

    const ref = doc(this.firestore, path);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const reactions = { ...(data['reactions'] || {}) };

    if (reactions[userId] === emoji) {
      delete reactions[userId];
    } else {
      reactions[userId] = emoji;
    }

    await updateDoc(ref, { reactions });
  }
}
