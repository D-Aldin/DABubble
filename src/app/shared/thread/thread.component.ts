import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MessageFieldComponent } from '../message-field/message-field.component';
import { Firestore, collection, addDoc, query, orderBy, onSnapshot,  doc, getDoc } from '@angular/fire/firestore';
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

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private userService: UserService,
    private threadService: ThreadMessagingService
  ) {}

  ngOnInit(): void {
  this.threadService.threadState$.subscribe(thread => {
    if (thread?.channelId && thread?.messageId) {
      this.channelId = thread.channelId;
      this.messageId = thread.messageId;

      console.log('ThreadComponent initialized → Channel:', this.channelId, 'MessageId:', this.messageId);

      this.loadThreadMessages(this.channelId, this.messageId);
      this.loadParentMessage(this.channelId, this.messageId);
    } else {
      console.warn('ThreadComponent missing channelId or messageId.');
    }
  });
}


 loadThreadMessages(channelId: string, messageId: string) {
  const threadCollection = collection(this.firestore, `channels/${channelId}/messages/${messageId}/threads`);
    const q = query(threadCollection, orderBy('timestamp', 'asc'));

    onSnapshot(q, snapshot => {
      this.replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const userIds = new Set(this.replies.map(r => r.senderId));
      if (this.parentMessage?.senderId) {
        userIds.add(this.parentMessage.senderId);
      }

      this.loadUserProfiles(Array.from(userIds));
    });
  }
  
  loadParentMessage(channelId: string, messageId: string) {
    const parentRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    getDoc(parentRef).then(snap => {
      if (snap.exists()) {
        this.parentMessage = snap.data();
      }
    });
  }

  getUserName(userId: string): string {
    return this.userMap[userId]?.name ?? 'Unknown';
  }

  getAvatarPath(userId: string): string {
    return this.userMap[userId]?.avatarPath ?? 'assets/images/default-avatar.png';
  }

  loadUserProfiles(userIds: string[]) {
  this.userService.getUsersByIds(userIds).subscribe(users => {
    users.forEach(user => {
      this.userMap[user.uid] = {
        name: user.name,
        avatarPath: user.avatarPath
      };
    });
  });
}


  async sendThreadMessage(text: string) {
    console.log('Thread message received from MessageField:', text);
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
