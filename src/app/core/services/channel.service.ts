import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Channel } from '../interfaces/channel';

// export interface Channel { Muzzaml i have created Channel Interface sepperatly to use globaly
//   id: string;
//   title: string;
// }

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private firestore = inject(Firestore);

  getChannels(): Observable<Channel[]> {
    const channelsRef = collection(this.firestore, 'channels');
    return collectionData(channelsRef, { idField: 'id' }) as Observable<Channel[]>;
  }
}
