import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MessageFieldComponent } from '../message-field/message-field.component';
import { Firestore, collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { ChannelService } from '../../core/services/channel.service';
import { ThreadState } from '../../core/interfaces/thread-state';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { ProfileCard } from '../../core/interfaces/profile-card';
import { ProfileOverlayService } from '../../core/services/profile-overlay.service';
import { ParseTagsPipe } from '../../core/pipes/tag-parser.pipe';
import { Router } from '@angular/router';
import { User } from '../../core/interfaces/user';
import { Channel } from '../../core/interfaces/channel';
import { MentioningService } from '../../core/services/mentioning.service';


@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerModule, MessageFieldComponent, ParseTagsPipe],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  isClose: boolean = false;
  message: string = '';
  emojiPicker: boolean = false;
  @Input() messageId!: string;
  @Input() channelId!: string;
  @Output() closeThread = new EventEmitter<void>();
  replies: any[] = [];
  messageText: string = '';
  userMap: { [userId: string]: { name: string, avatarPath: string } } = {};
  parentMessage: any = null;
  channelName: string = '';
  selectedChannelUsers: { name: string; avatarPath: string }[] = [];
  currentUserId: string = '';
  hoveredMessageId: string | null = null;
  editingMessageId: string | null = null;
  editedMessageText: string = '';
  emojiPickerForMessageId: string | null = null;
  threadType: 'channel' | 'direct' = 'channel';
  users: User[] = [];
  channels: Channel[] = [];


  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private userService: UserService,
    private threadService: ThreadMessagingService,
    private cdr: ChangeDetectorRef,
    private channelService: ChannelService,
    private directMessagingService: DirectMessagingService,
    private overlayService: ProfileOverlayService,
    private router: Router,
    private mentioningService: MentioningService
    // private userService: UserService,
  ) { 

     this.userService.getAllUsers().subscribe((user: User[]) => {
      this.users = user;
      // this.changedMessage = this.changedMessageWithLinks(this.message);
    });

    this.channelService.getChannels().subscribe((channels: Channel[]) => {
      this.channels = channels;
      // this.changedMessage = this.changedMessageWithLinks(this.message);
    });
  }

  ngOnInit(): void {
    this.threadService.threadState$.subscribe((thread: ThreadState | null) => {
      if (thread?.channelId && thread?.messageId) {
        this.channelId = thread.channelId;
        this.messageId = thread.messageId;
        this.threadType = thread.threadType; // make sure this is saved!
        this.currentUserId = this.authService.currentUserId;

        this.loadThreadMessages(this.channelId, this.messageId, this.threadType); //always load thread

        if (this.threadType === 'channel') {
          this.loadChannelUsers(this.channelId);
          this.loadChannelName(this.channelId);
          this.loadParentMessage(this.channelId, this.messageId);
        } else {
          this.loadDirectParentMessage(this.channelId, this.messageId);
        }
      }
    });

  }

   ngAfterViewInit() {
 
    this.initializeMentioningHandlers();
  }

  loadDirectThreadMessages(conversationId: string, messageId: string) {
    const threadCollection = collection(
      this.firestore,
      `directMessages/${conversationId}/messages/${messageId}/threads`
    );

    const q = query(threadCollection, orderBy('timestamp', 'asc'));

    onSnapshot(q, snapshot => {
      this.replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (this.replies.length && this.parentMessage?.senderId) {
        this.loadUserProfilesForThread();
      }
    });
  }

  loadDirectParentMessage(conversationId: string, messageId: string) {
    const parentRef = doc(
      this.firestore,
      `directMessages/${conversationId}/messages/${messageId}`
    );

    getDoc(parentRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        this.parentMessage = {
          id: snap.id,
          ...data,
          senderId: data['senderId'] || data['messageFrom'],
          text: data['text'] || data['message'] || ''
        };
        this.loadUserProfilesForThread(); // Always call, even if no replies yet
      }
    });
  }

  async sendDirectThreadMessage(text: string) {
    if (!text.trim()) return;
    if (!this.channelId || !this.messageId) {
      console.warn('Missing conversationId or messageId for direct thread');
      return;
    }
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }
    const threadCollection = collection(
      this.firestore,
      `directMessages/${this.channelId}/messages/${this.messageId}/threads`
    );
    try {
      await addDoc(threadCollection, {
        text: text.trim(),
        senderId: currentUser.uid,
        timestamp: new Date()
      });
      // Update parent message with replyCount and lastReplyTimestamp
      const parentDocRef = doc(
        this.firestore,
        `directMessages/${this.channelId}/messages/${this.messageId}`
      );
      const parentSnap = await getDoc(parentDocRef);
      const replyCount = ((parentSnap.data() || {})['replyCount'] || 0) + 1;

      await updateDoc(parentDocRef, {
        replyCount,
        lastReplyTimestamp: new Date()
      });
      console.log('Direct thread reply saved:', text);
    } catch (error) {
      console.error('❌ Error saving direct thread reply:', error);
    }
  }

  startEditingThread(message: any) {
    this.editingMessageId = message.id;
    this.editedMessageText = message.text;
  }

  getReactionArray(reactions: { [userId: string]: string }) {
    const countMap = new Map<string, number>();

    for (const emoji of Object.values(reactions || {})) {
      countMap.set(emoji, (countMap.get(emoji) || 0) + 1);
    }

    return Array.from(countMap.entries()).map(([emoji, count]) => ({ emoji, count }));
  }

  selectEmojiForMessage(messageId: string) {
    this.emojiPickerForMessageId = this.emojiPickerForMessageId === messageId ? null : messageId;
  }

  addEmojiToMessage(event: any, replyId: string) {
    const emoji = event.emoji.native;
    const thread = this.threadService.getCurrentThread();

    if (!thread?.channelId || !thread?.messageId || !thread.threadType) {
      console.warn('Missing thread context');
      return;
    }
    const { channelId, messageId, threadType } = thread;
    const refPath = threadType === 'channel'
      ? `channels/${channelId}/messages/${messageId}/threads/${replyId}`
      : `directMessages/${channelId}/messages/${messageId}/threads/${replyId}`;
    const messageRef = doc(this.firestore, refPath);

    getDoc(messageRef).then(docSnap => {
      if (!docSnap.exists()) {
        console.warn('❌ Document not found:', refPath);
        return;
      }
      const data = docSnap.data();
      const reactions = data['reactions'] || {};
      const userId = this.authService.currentUserId;

      if (reactions[userId] === emoji) {
        delete reactions[userId];
      } else {
        reactions[userId] = emoji;
      }

      updateDoc(messageRef, { reactions });
      this.emojiPickerForMessageId = null;
    });
  }

  cancelEditing() {
    this.editingMessageId = null;
    this.editedMessageText = '';
  }

  async saveEditedMessage(messageId: string) {
    const thread = this.threadService.getCurrentThread();
    if (!thread?.channelId || !thread?.messageId || !thread.threadType) {
      console.warn('Missing thread context');
      return;
    }
    const { channelId, messageId: parentId, threadType } = thread;
    const basePath =
      threadType === 'channel'
        ? `channels/${channelId}/messages/${parentId}/threads/${messageId}`
        : `directMessages/${channelId}/messages/${parentId}/threads/${messageId}`;
    const threadReplyRef = doc(this.firestore, basePath);

    try {
      const snap = await getDoc(threadReplyRef);
      if (!snap.exists()) {
        console.warn('Thread reply not found at', basePath);
        return;
      }
      await updateDoc(threadReplyRef, { text: this.editedMessageText.trim() });
      console.log(' Thread reply updated:', this.editedMessageText);
      this.cancelEditing();
    } catch (error) {
      console.error('Error updating thread reply:', error);
    }
  }

  loadChannelUsers(channelId: string) {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    getDoc(channelRef).then(async (snap) => {
      if (snap.exists()) {
        const userIds: string[] = snap.data()['members'] || [];

        const users = await this.userService.getUsersByIds(userIds).toPromise();
        if (users) {
          this.selectedChannelUsers = users.map(user => ({
            name: user.name,
            avatarPath: user.avatarPath || 'assets/images/default-avatar.png'
          }));
        }
      }
    });
  }

  loadChannelName(channelId: string) {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    getDoc(channelRef).then(snap => {
      if (snap.exists()) {
        this.channelName = snap.data()['title'] || channelId;
      }
    });
  }

  loadThreadMessages(channelId: string, messageId: string, threadType: 'channel' | 'direct') {
    const basePath = threadType === 'direct'
      ? `directMessages/${channelId}/messages/${messageId}/threads`
      : `channels/${channelId}/messages/${messageId}/threads`;

    const threadCollection = collection(this.firestore, basePath);
    const q = query(threadCollection, orderBy('timestamp', 'asc'));

    onSnapshot(q, snapshot => {
      this.replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Wait until parent message is also loaded
      if (this.replies.length && this.parentMessage?.senderId) {
        this.loadUserProfilesForThread();
      }
    });
  }


  loadParentMessage(channelId: string, messageId: string) {
    const parentRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    getDoc(parentRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        this.parentMessage = {
          id: snap.id,
          ...data,
          senderId: data['senderId'] || data['messageFrom']
        };
        this.loadUserProfilesForThread();
      }
    });
  }

  loadUserProfilesForThread() {
    const userIds = new Set(this.replies.map(r => r.senderId));
    if (this.parentMessage?.senderId) {
      userIds.add(this.parentMessage.senderId);
    }

    this.loadUserProfiles(Array.from(userIds));
  }

  getOtherParticipantId(): string {
    if (!this.parentMessage || !this.currentUserId) return '';
    return this.parentMessage.senderId === this.currentUserId
      ? this.replies.find(r => r.senderId !== this.currentUserId)?.senderId || ''
      : this.parentMessage.senderId;
  }
  getUserName(userId: string): string {
    return this.userMap[userId]?.name ?? 'Unbekannt';
  }

  getAvatarPath(userId: string): string {
    return this.userMap[userId]?.avatarPath ?? 'assets/images/profile-images/head-1.png';
  }

  loadUserProfiles(userIds: string[]) {
    // console.log('Loading user IDs for thread:', userIds);
    this.userService.getUsersByIds(userIds).subscribe(users => {
      users.forEach(user => {
        this.userMap[user.uid] = {
          name: user.name,
          avatarPath: user.avatarPath || 'assets/images/default-avatar.png'
        };
      });
      this.cdr.detectChanges(); //to force Angular to re-render after users are loaded.
    });
  }

  async sendThreadMessage(text: string) {
    if (!text.trim()) return;
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    const thread = this.threadService.getCurrentThread(); // uses threadStateSubject
    if (!thread?.channelId || !thread?.messageId || !thread.threadType) {
      console.warn('Missing thread context');
      return;
    }
    const { channelId, messageId, threadType } = thread;
    const basePath =
      threadType === 'channel'
        ? `channels/${channelId}/messages/${messageId}/threads`
        : `directMessages/${channelId}/messages/${messageId}/threads`;
    const threadCollection = collection(this.firestore, basePath);
    try {
      await addDoc(threadCollection, {
        text: text.trim(),
        senderId: currentUser.uid,
        timestamp: new Date(),
      });

      if (threadType === 'channel') {
        await this.channelService.updateParentMessageThreadInfo(channelId, messageId);
      } else {
        await this.directMessagingService.updateParentMessageThreadInfo(channelId, messageId);
      }
      console.log('Thread reply saved:', text);
    } catch (error) {
      console.error('❌ Error saving thread reply:', error);
    }
  }


  getCurrentThread(): ThreadState | null {
    return this.threadService.getCurrentThread();
  }

  close(event: Event) {
    this.closeThread.emit();
    event.stopPropagation();
  }

  captureMessage() {
    console.log(this.message);
    this.message = '';
  }

  toggleEmojiPicker() {
    this.emojiPicker = !this.emojiPicker;
  }

  addEmoji(event: any) {
    this.message += event.emoji.native;
    this.emojiPicker = false;
  }

  openProfileCard(userId: string): void {
    
    const initialProfile: ProfileCard = {
      name: '...',
      email: '', 
      avatarPath: '',
      online: false,
      direktMessageLink: `/dashboard/direct-message/${userId}`
    };

    this.overlayService.open(initialProfile);

    // Load actual user and update profile once available
    this.userService.getUserById(userId).subscribe(userDoc => {
      if (!userDoc) return;

      this.overlayService.updatePartial({
        name: userDoc.name,
        email: userDoc.email,
        avatarPath: userDoc.avatarPath,
        online: userDoc.online,
        direktMessageLink: `/dashboard/direct-message/${userId}`
      });
    });
  }

  private initializeMentioningHandlers(): void {
    this.mentioningService.handleTagClicks({
      onUserClick: (userId: string) => this.openProfileCard(userId)
    });
  }
}

