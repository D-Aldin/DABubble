import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  collectionData,
  docData,
} from '@angular/fire/firestore';

import { AuthService } from './auth.service';
import { Observable, map } from 'rxjs';
import { ChatUser } from '../interfaces/chat-user';

@Injectable({
  providedIn: 'root',
})
export class DirectMessagingService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  constructor() {}

  getAllUsersExceptCurrent(): Observable<ChatUser[]> {
    const usersRef = collection(this.firestore, 'users');
    const currentUid = this.authService.getCurrentUser()?.uid;

    return collectionData(usersRef, { idField: 'uid' }).pipe(
      map((users) => {
        return (users as ChatUser[]).filter((user) => user.uid !== currentUid);
      })
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
        createdAt: new Date().toISOString(),
      });
    }
  }

  generateConversationId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }
}
