import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  collectionGroup,
  CollectionReference,
  Query
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

// Interfaces
export interface User {
  id?: string;
  name: string;
  avatarPath: string;
  online: boolean;
  email?: string | " ";
}

export interface ChannelMessages {
  id?: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface DirectMessage {
  id?: string;
  message: string;
  messageFrom: string;
  messageTo: string;
  tags: string[];
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private firestore = inject(Firestore);


  searchUsers(term: string): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users') as unknown as CollectionReference<User>;
    return collectionData(usersRef, { idField: 'id' }).pipe(
      map(users =>
        users.filter((user: User) =>
          user.name.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }


  searchChannelMessages(term: string): Observable<ChannelMessages[]> {
    const messagesRef = collectionGroup(this.firestore, 'messages') as Query<ChannelMessages>// durchsucht alle /messages
    return collectionData<ChannelMessages>(messagesRef, { idField: 'id' }).pipe(
      map(messages =>
        messages.filter((msg: ChannelMessages) =>
          msg.text.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }


  searchMyDirectMessages(term: string, currentUserId: string): Observable<DirectMessage[]> {
    const directMessagesRef = collectionGroup(this.firestore, 'messages') as Query<DirectMessage>;
    return collectionData<DirectMessage>(directMessagesRef, { idField: 'id' }).pipe(
      map(messages =>
        messages.filter((msg: DirectMessage) =>
          (msg.messageFrom === currentUserId || msg.messageTo === currentUserId) &&
          msg.message.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }
}
