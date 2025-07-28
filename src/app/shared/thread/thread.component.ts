import { Component, Input, Output, EventEmitter, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MessageFieldComponent } from '../message-field/message-field.component';
import { Firestore, collection, addDoc, query, orderBy, onSnapshot,  doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerModule, MessageFieldComponent],
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

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private userService: UserService,
    private threadService: ThreadMessagingService,
     private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.threadService.threadState$.subscribe(thread => {
      if (thread?.channelId && thread?.messageId) {
        this.channelId = thread.channelId;
        this.messageId = thread.messageId;
        this.currentUserId = this.authService.currentUserId;
        
        this.loadChannelUsers(this.channelId); 
        this.loadChannelName(this.channelId); 
        this.loadThreadMessages(this.channelId, this.messageId);
        this.loadParentMessage(this.channelId, this.messageId);
      } else {
        console.warn('ThreadComponent missing channelId or messageId.');
      }
    });
  }

  startEditingThread(message: any) {
    this.editingMessageId = message.id;
    this.editedMessageText = message.text;
  }
  
  reactToThreadMessage(replyId: string, emoji: string) {
  // Your Firestore update logic here
  }
  
  cancelEditing() {
    this.editingMessageId = null;
    this.editedMessageText = '';
  }

  async saveEditedMessage(messageId: string) {
    if (!this.channelId || !this.messageId) {
      console.warn('Missing channelId or parentMessageId');
      return;
    }

    const threadReplyRef = doc(this.firestore,
      `channels/${this.channelId}/messages/${this.messageId}/threads/${messageId}`);

    try {
      await updateDoc(threadReplyRef, { text: this.editedMessageText.trim() });
      console.log('Thread reply updated:', this.editedMessageText);
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


  loadThreadMessages(channelId: string, messageId: string) {
    const threadCollection = collection(this.firestore, `channels/${channelId}/messages/${messageId}/threads`);
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
      this.parentMessage = snap.data();

      // Wait until replies are also loaded
      if (this.replies.length > 0) {
        this.loadUserProfilesForThread();
      }
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
      //  console.log('userMap after population:', this.userMap);
      this.cdr.detectChanges(); //to force Angular to re-render after users are loaded.
  });
}



async sendThreadMessage(text: string) {
    // console.log('Thread message received from MessageField:', text);
    if (!text.trim()) return;

    if (!this.channelId || !this.messageId) {
      console.warn('Missing channelId or messageId');
      return;
    }

    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    const threadCollection = collection(this.firestore,
      `channels/${this.channelId}/messages/${this.messageId}/threads`);

    try {
      await addDoc(threadCollection, {
        text: text.trim(),
        senderId: currentUser.uid,
        timestamp: new Date()
      });
      console.log('Thread reply saved:', text);
    } catch (error) {
      console.error('Error saving thread reply:', error);
    }
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
}
