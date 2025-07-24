import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelService } from '../../core/services/channel.service';
import { ChannelMessage } from '../../core/interfaces/channel-message';
import { AsyncPipe } from '@angular/common';
import { Observable, take } from 'rxjs';
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
import { Timestamp } from 'firebase/firestore';
import { ProfileCardComponent } from "../profile-card/profile-card.component";
import { ProfileCard } from '../../core/interfaces/profile-card';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { RouterLink, RouterModule } from '@angular/router';
import { SpinnerComponent } from "../spinner/spinner.component";


@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [RouterModule, CommonModule, ChatBoxComponent, PickerModule, FormsModule, TimestampLineComponent, ProfileCardComponent, SpinnerComponent],
  templateUrl: './channel-messages.component.html',
  styleUrls: ['./channel-messages.component.scss']
})
export class ChannelMessagesComponent implements OnInit, AfterViewInit {
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
  showProfileCard: boolean = false;
  showHoverOptions: boolean = false;
  userDataForProfileCard$!: Observable<ProfileCard[]>;
  userDataForProfileCard: ProfileCard[] = [];
  selectedUserForProfileCard: ProfileCard | null = null;
  isLoading: boolean = true;
  hasScrolledAfterLoad: boolean = false;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef<HTMLElement>;

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private authService: AuthService,
    private messagingService: ChannelMessagingService,
    private directMessagingService: DirectMessagingService,
    private zone: NgZone,
    private cdRef: ChangeDetectorRef
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

    this.messages$.subscribe((msgs) => {
      this.isLoading = true;
      this.hasScrolledAfterLoad = false;
      this.groupedMessages = this.groupMessagesByDate(msgs);
      this.cdRef.detectChanges();
      this.isLoading = false;
    });

    this.userService.getAllUsers().subscribe(users => {
      // this.usersMap = Object.fromEntries(users.map(u => [u.id, { ...u, uid: u.id, online: false }]));
      this.usersMap = {};
      users.forEach(user => {
        this.usersMap[user.id] = {
          ...user,
          uid: user.id,
          online: false,
          email: ''
        };
      });
    });

    this.getObserveableProfileCardData()
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
  };


  async reactToMessage(messageId: string, emoji: string) {
    if (!this.currentUserId || !this.channelId) return;

    await this.messagingService.toggleReaction(this.channelId, messageId, emoji, this.currentUserId);
    this.showEmojiPickerFor = null;
  }

  handlingDateTime(date: Date): string {
    return date.toLocaleDateString(); // or any other formatting logic
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

  getObserveableProfileCardData(): void {
    this.userDataForProfileCard$ = this.directMessagingService.getAllUsersForProfileCardCreation();

    this.userDataForProfileCard$.subscribe(data => {
      this.userDataForProfileCard = data;
    });
  }

  openProfileCard(uid: string): void {
    const user = this.userDataForProfileCard.find(u => u.direktMessageLink.endsWith(uid));
    if (user) {
      this.selectedUserForProfileCard = user;
      this.showProfileCard = true;
    }
  }

  closeProfileCard(): void {
    this.showProfileCard = false;
    this.selectedUserForProfileCard = null;
  }

  scrollToBottom(): void {
    if (!this.scrollContainer) {
      console.warn('scrollContainer not available');
      return;
    }
    const el = this.scrollContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }


  ngAfterViewInit(): void {
    this.zone.onStable.pipe(take(1)).subscribe(() => {
      this.scrollToBottom();
    });
  }

  ngAfterViewChecked(): void {
    if (!this.isLoading && !this.hasScrolledAfterLoad) {
      this.scrollToBottom();
      this.hasScrolledAfterLoad = true;
    }
  }
}
