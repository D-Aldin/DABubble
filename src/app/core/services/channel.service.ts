import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc  } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Channel } from '../interfaces/channel';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private firestore = inject(Firestore);

  getChannels(): Observable<Channel[]> {
    const channelsRef = collection(this.firestore, 'channels');
    return collectionData(channelsRef, { idField: 'id' }) as Observable<Channel[]>;
  }

  createChannel(channel: Channel): Promise<void> {
    const channelsRef = collection(this.firestore, 'channels');
    return addDoc(channelsRef, channel).then(() => {});
  }
}
