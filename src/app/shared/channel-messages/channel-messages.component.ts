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

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ChatBoxComponent, PickerModule, FormsModule],
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
        const withCount$ = messages.map(msg =>
          from(this.messagingService.getReplyCount(this.channelId, msg.id!)).pipe(
            map(count => ({
              ...msg,
              replyCount: count
            }))
          )
        );
        return forkJoin(withCount$); // waits for all reply counts
      })
    );

    this.userService.getAllUsers().subscribe(users => {
      this.usersMap = {};
      users.forEach(user => {
        this.usersMap[user.id] = {
          ...user,
          uid: user.id,
          online: false,
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
