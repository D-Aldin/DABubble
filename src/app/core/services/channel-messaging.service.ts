import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc,collectionData, orderBy, query, serverTimestamp,} from '@angular/fire/firestore';
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
}
