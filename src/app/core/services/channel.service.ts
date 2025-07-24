import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  arrayUnion,
  doc,
  docData,
  serverTimestamp,
  query,
  orderBy,
  where,
  QuerySnapshot,
  DocumentData,
  getDocs,
} from '@angular/fire/firestore';
import { Observable, Subject } from 'rxjs';
import { Channel } from '../interfaces/channel';
import { ChannelMessage } from '../interfaces/channel-message';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private firestore = inject(Firestore);
  private openAddChannelDialogSubject = new Subject<void>();
  openAddChannelDialog$ = this.openAddChannelDialogSubject.asObservable();

  getChannels(): Observable<Channel[]> {
    const channelsRef = collection(this.firestore, 'channels');
    return collectionData(channelsRef, { idField: 'id' }) as Observable<
      Channel[]
    >;
  }

  getChannelIdByTitle(
    title: string,
    callback: (channel?: Channel) => void
  ): void {
    this.getChannels().subscribe((channels: Channel[]) => {
      const matchingChannel = channels.find(
        (channel) => channel.title === title
      );
      callback(matchingChannel);
    });
  }

  async createChannel(channel: Channel): Promise<void> {
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(channelsRef, where('title', '==', channel.title));

    return getDocs(q).then((snapshot: QuerySnapshot<DocumentData>) => {
      if (!snapshot.empty) {
        throw new Error(
          `A channel with the name "${channel.title}" already exists.`
        );
      }
      return addDoc(channelsRef, channel).then(() => {});
    });
  }

  addUsersToChannel(channelId: string, userIds: string[]) {
    const channelRef = doc(this.firestore, 'channels', channelId);
    return updateDoc(channelRef, {
      members: arrayUnion(...userIds),
    });
  }

  getChannelById(id: string): Observable<Channel> {
    const channelRef = doc(this.firestore, 'channels', id);
    return docData(channelRef, { idField: 'id' }) as Observable<Channel>;
  }

  triggerAddChannelDialog() {
    this.openAddChannelDialogSubject.next();
  }

  updateChannel(channelId: string, data: Partial<Channel>) {
    const channelDoc = doc(this.firestore, 'channels', channelId);
    return updateDoc(channelDoc, data);
  }

  sendChannelMessage(channelId: string, senderId: string, text: string) {
    const messagesRef = collection(
      this.firestore,
      `channels/${channelId}/messages`
    );
    return addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });
  }

  listenToChannelMessages(channelId: string): Observable<ChannelMessage[]> {
    const messagesRef = collection(
      this.firestore,
      `channels/${channelId}/messages`
    );
    const q = query(messagesRef, orderBy('timestamp'));
    return collectionData(q, { idField: 'id' }) as Observable<ChannelMessage[]>;
  }

  addReaction(
    channelId: string,
    messageId: string,
    userId: string,
    emoji: string
  ) {
    const msgRef = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}`
    );
    return updateDoc(msgRef, {
      [`reactions.${userId}`]: emoji,
    });
  }

  addThreadIdToMessage(channelId: string, messageId: string, threadId: string) {
    const msgRef = doc(
      this.firestore,
      `channels/${channelId}/messages/${messageId}`
    );
    return updateDoc(msgRef, {
      threadId,
    });
  }
}
