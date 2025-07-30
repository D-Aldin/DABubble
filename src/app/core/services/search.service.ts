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
import { ChannelMessage } from '../interfaces/channel-message';
import { ChatUser } from '../interfaces/chat-user';
import { DirectMessage } from '../interfaces/direct-message';




@Injectable({ providedIn: 'root' })
export class SearchService {
  private firestore = inject(Firestore);


  searchUsers(term: string): Observable<ChatUser[]> {
    const usersRef = collection(this.firestore, 'users') as unknown as CollectionReference<ChatUser>;
    return collectionData(usersRef, { idField: 'id' }).pipe(
      map(users =>
        users.filter((user: ChatUser) =>
          user.name.toLowerCase().includes(term.toLowerCase())
        )
      )
    );
  }


  searchChannelMessages(term: string): Observable<ChannelMessage[]> {
    const messagesRef = collectionGroup(this.firestore, 'messages') as Query<ChannelMessage>// durchsucht alle /messages
    return collectionData<ChannelMessage>(messagesRef, { idField: 'id' }).pipe(
      map(messages =>
        messages.filter((msg: ChannelMessage) =>
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
