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

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ChatBoxComponent, PickerModule],
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

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private authService: AuthService,
    private messagingService: ChannelMessagingService
  ) { }

   ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.uid ?? '';

    this.messages$ = this.messagingService.getChannelMessages(this.channelId);

    // Preload all users in this channel to map senderId → name, avatar
    this.userService.getAllUsers().subscribe(users => {
      this.usersMap = {};
      users.forEach(user => {
        this.usersMap[user.id] = {
          ...user,
          uid: user.id, // fallback: reuse id
          online: false, // default value or fetch if available
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
}
