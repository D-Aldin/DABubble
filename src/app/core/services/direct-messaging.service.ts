import { Injectable, inject } from '@angular/core';

import { Firestore, doc, getDocs, setDoc, collection, collectionData, getDoc, updateDoc} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, map, of, timestamp } from 'rxjs';
import { ChatUser } from '../interfaces/chat-user';
import { addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { Message } from '../interfaces/message';
import { ProfileCard } from '../interfaces/profile-card';

@Injectable({
  providedIn: 'root',
})
export class DirectMessagingService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  constructor() { }

  async sendReplyToThread(conversationId: string, messageId: string, reply: Message): Promise<void> {
    const parentRef = doc(this.firestore, `directMessages/${conversationId}/messages/${messageId}`);
    const parentSnap = await getDoc(parentRef);

    if (!parentSnap.exists()) {
      console.warn('Parent message does not exist.');
      return;
    }

    const threadCollection = collection(parentRef, 'threads');

    await addDoc(threadCollection, {
      ...reply,
      timestamp: serverTimestamp(),
    });

    await updateDoc(parentRef, {
      replyCount: (parentSnap.data()['replyCount'] || 0) + 1,
      lastReplyTimestamp: serverTimestamp(),
    });
  }


  async toggleReaction(conversationId: string, messageId: string, emoji: string, userId: string): Promise<void> {
    const messageRef = doc(this.firestore, `directMessages/${conversationId}/messages/${messageId}`);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) return;

    const messageData = messageSnap.data() as any;
    const reactions = messageData.reactions || {};

    if (reactions[userId] === emoji) {
      // remove reaction
      delete reactions[userId];
    } else {
      // add or change reaction
      reactions[userId] = emoji;
    }

    await updateDoc(messageRef, { reactions });
  }

  async updateDirectMessage(conversationId: string, messageId: string, newText: string): Promise<void> {
    const msgRef = doc(this.firestore, `directMessages/${conversationId}/messages/${messageId}`);
    await updateDoc(msgRef, { message: newText });
  }

  getAllUsersExceptCurrent(): Observable<ChatUser[]> {
    const usersRef = collection(this.firestore, 'users');
    const currentUid = this.authService.getCurrentUser()?.uid;

    return collectionData(usersRef, { idField: 'uid' }).pipe(
      map((users) => {
        return (users as ChatUser[]).filter((user) => user.uid !== currentUid);
      })
    );
  }

  getAllUsersForProfileCardCreation(): Observable<ProfileCard[]> {
    const usersRef = collection(this.firestore, 'users');

    return collectionData(usersRef, { idField: 'uid' }).pipe(
      map((users) =>
        (users as ChatUser[]).map((user) => ({
          name: user.name,
          email: user.email,
          avatarPath: user.avatarPath,
          online: user.online,
          direktMessageLink: `/dashboard/direct-message/${user.uid}`,
        }))
      )
    );
  }

  async createConversation(
    conversationId: string,
    userIds: string[]
  ): Promise<void> {
    const directMessagesRef = doc(
      this.firestore,
      'directMessages',
      conversationId
    );

    const conversationDoc = await getDoc(directMessagesRef);
    if (!conversationDoc.exists()) {
      await setDoc(directMessagesRef, {
        participants: userIds,
        createdAt: serverTimestamp(),
      });
    }
  }

  generateConversationId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  async sendDirectMsg(
    conversationId: string,
    from: string,
    to: string,
    message: string
  ) {
    const refDirectMessages = doc(
      this.firestore,
      'directMessages',
      conversationId
    );
    const refMessages = collection(refDirectMessages, 'messages');

    const tags = this.ifMessageHasChannelTags(message);

    await addDoc(refMessages, {
      messageFrom: from,
      messageTo: to,
      message: message,
      tags: tags,
      timestamp: serverTimestamp(),
    });
  }

  getMessages(conversationId: string) {
    const refMessages = collection(
      this.firestore,
      'directMessages',
      conversationId,
      'messages'
    );

    const sortByTime = query(refMessages, orderBy('timestamp', 'asc'));
    return collectionData(sortByTime, { idField: 'id' }) as Observable<
      Message[]
    >;
  }

  ifMessageHasChannelTags(message: string): string[] {
    const matches = message.match(/#[a-zA-Z0-9\-]+/g);
    return matches ? matches.map((tag) => tag.slice(1).toLowerCase()) : [];
  }

  async updateParentMessageThreadInfo(conversationId: string, messageId: string): Promise<void> {
    const parentRef = doc(this.firestore, `directMessages/${conversationId}/messages/${messageId}`);
    const parentSnap = await getDoc(parentRef);

    if (!parentSnap.exists()) {
      console.warn('No parent message found to update');
      return;
    }

    const threadCollectionRef = collection(this.firestore, `directMessages/${conversationId}/messages/${messageId}/threads`);
    const threadSnap = await getDocs(threadCollectionRef); //

    const replyCount = threadSnap.size;

    await updateDoc(parentRef, {
      replyCount: replyCount,
      lastReplyTimestamp: serverTimestamp(),
    });
  }

}
