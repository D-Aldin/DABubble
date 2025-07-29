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
  getDoc,
  
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

  async createChannel(channel: Partial<Channel>): Promise<void> {
    // Validate required fields
    if (!channel.title || !channel.creatorId || !channel.members || channel.members.length === 0) {
      throw new Error('Missing required channel fields.');
    }

    const channelsRef = collection(this.firestore, 'channels');
    const q = query(channelsRef, where('title', '==', channel.title));

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error(`A channel with the name "${channel.title}" already exists.`);
    }

    // Ensure required fields are added properly
    const newChannel: Channel = {
      id: '', // Will be set later if needed
      title: channel.title,
      description: channel.description || '',
      createdAt: channel.createdAt || new Date(),
      members: channel.members,
      creatorId: channel.creatorId,
    };

    await addDoc(channelsRef, newChannel);
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

  async updateLastReplyTimestamp(channelId: string, messageId: string): Promise<void> {
    const parentRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    console.log('Updating timestamp at path:', `channels/${channelId}/messages/${messageId}`);

    await updateDoc(parentRef, {
      lastReplyTimestamp: serverTimestamp(),
    });
  }

  async updateParentMessageThreadInfo(channelId: string, messageId: string): Promise<void> {
  const parentRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
  const parentSnap = await getDoc(parentRef);

  if (!parentSnap.exists()) {
    console.warn(`❗️Parent message not found for update: ${messageId}`);
    return;
  }

  const currentCount = parentSnap.data()?.['replyCount'] || 0;
  await updateDoc(parentRef, {
    replyCount: currentCount + 1,
    lastReplyTimestamp: new Date()
  });
}

  
}
