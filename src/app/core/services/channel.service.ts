import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, arrayUnion, doc, docData } from '@angular/fire/firestore';
import { Observable, Subject, } from 'rxjs';
import { Channel } from '../interfaces/channel';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private firestore = inject(Firestore);
  private openAddChannelDialogSubject = new Subject<void>();
  openAddChannelDialog$ = this.openAddChannelDialogSubject.asObservable();

  getChannels(): Observable<Channel[]> {
    const channelsRef = collection(this.firestore, 'channels');
    return collectionData(channelsRef, { idField: 'id' }) as Observable<Channel[]>;
  }

  createChannel(channel: Channel): Promise<void> {
    const channelsRef = collection(this.firestore, 'channels');
    return addDoc(channelsRef, channel).then(() => { });
  }

  addUsersToChannel(channelId: string, userIds: string[]) {
    const channelRef = doc(this.firestore, 'channels', channelId);
    return updateDoc(channelRef, {
      members: arrayUnion(...userIds)
    });
  }

  getChannelById(id: string): Observable<Channel> {
    const channelRef = doc(this.firestore, 'channels', id);
    return docData(channelRef, { idField: 'id' }) as Observable<Channel>;
  }

  triggerAddChannelDialog() {
    this.openAddChannelDialogSubject.next();
  }
}
