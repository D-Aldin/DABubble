import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelService } from '../../core/services/channel.service'; 
import { ChannelMessage } from '../../core/interfaces/channel-message';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Output, EventEmitter } from '@angular/core';
import { ChatBoxComponent } from '../chat-box/chat-box.component';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatUser } from '../../core/interfaces/chat-user';
import { combineLatest, map, switchMap } from 'rxjs';
import { ChannelMessagingService } from '../../core/services/channel-messaging.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { forkJoin, from } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TimestampLineComponent } from '../timestamp-line/timestamp-line.component';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ChatBoxComponent, PickerModule, FormsModule, TimestampLineComponent],
  templateUrl: './channel-messages.component.html',
  styleUrls: ['./channel-messages.component.scss']
})
export class ChannelMessagesComponent implements OnInit {
  @Input() channelId!: string;
  messages$!: Observable<ChannelMessage[]>;
  @Output() replyToMessage = new EventEmitter<string>();
  usersMap: { [userId: string]: ChatUser } = {};
  currentUserId: string = '';
  hoveredMessageId: string | null | undefined = null;
  @Output() openThreadRequest = new EventEmitter<ChannelMessage>();
  showEmojiPickerFor: string | null = null;
  editingMessageId: string | null = null;
  editedMessageText: string = '';
 groupedMessages: { date: Date; dateString: string; messages: ChannelMessage[] }[] = [];

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private authService: AuthService,
    private messagingService: ChannelMessagingService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.uid ?? '';

    this.messages$ = this.messagingService.getChannelMessages(this.channelId).pipe(
      switchMap(messages => {
        const tasks = messages.map(msg =>
          from(this.messagingService.getReplyCount(this.channelId, msg.id!)).pipe(
            map(count => ({ ...msg, replyCount: count }))
          )
        );
        return forkJoin(tasks);
      })
    );

    this.messages$.subscribe(msgs => this.groupedMessages = this.groupMessagesByDate(msgs));

    this.userService.getAllUsers().subscribe(users => {
      this.usersMap = Object.fromEntries(users.map(u => [u.id, { ...u, uid: u.id, online: false }]));
    });
  }

  groupMessagesByDate(messages: ChannelMessage[]): {
    date: Date;
    dateString: string; 
    messages: ChannelMessage[];
  }[] {
    const grouped: { [key: string]: ChannelMessage[] } = {};

    messages.forEach(msg => {
      const date = msg.timestamp.toDate();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    });

    return Object.entries(grouped).map(([key, messages]) => {
      const [year, month, day] = key.split('-').map(Number);
      return {
        date: new Date(year, month - 1, day), 
        dateString: key, 
        messages
      };
    });
  }

  formatDate(date: Date): string {
    const today = new Date();
    
    const msgDate = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    const todayDate = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();

    if (msgDate === todayDate) return 'today';

    return date.toLocaleDateString('de-DE'); // or your preferred format
      this.usersMap = {};
      users.forEach(user => {
        this.usersMap[user.id] = {
          ...user,
          uid: user.id,
          online: false,
          email: 'dummymail@gmail.com'
        };
      });
    });
  }

  async reactToMessage(messageId: string, emoji: string) {
    if (!this.currentUserId || !this.channelId) return;

    await this.messagingService.toggleReaction(this.channelId, messageId, emoji, this.currentUserId);
    this.showEmojiPickerFor = null;
  }

  groupReactions(reactions: { [userId: string]: string }): { [emoji: string]: number } {
    const counts: { [emoji: string]: number } = {};
    Object.values(reactions).forEach(emoji => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return counts;
  }

  toggleEmojiPicker(messageId: string) {
    this.showEmojiPickerFor = this.showEmojiPickerFor === messageId ? null : messageId;
  }

  getUserName(uid: string): string {
    return this.usersMap[uid]?.name ?? uid;
  }

  getAvatarPath(uid: string): string {
    return this.usersMap[uid]?.avatarPath ?? '/assets/images/default-avatar.svg';
  }

  openThread(messageId: string) {
    this.replyToMessage.emit(messageId);
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  startEditing(msg: ChannelMessage) {
    this.editingMessageId = msg.id!;
    this.editedMessageText = msg.text;
    this.showEmojiPickerFor = null; 
    this.hoveredMessageId = null;
  }

  cancelEditing() {
    this.editingMessageId = null;
    this.editedMessageText = '';
  }

  async saveEditedMessage(msgId: string) {
    if (!this.channelId || !msgId || !this.editedMessageText.trim()) return;
    await this.messagingService.updateChannelMessageText(this.channelId, msgId, this.editedMessageText.trim());
    this.cancelEditing();
  }
   
  appendEmojiToEdit(emoji: string) {
    this.editedMessageText += emoji;
  }

}
