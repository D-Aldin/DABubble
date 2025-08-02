import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelService } from '../../core/services/channel.service';
import { ChannelMessage } from '../../core/interfaces/channel-message';
import { AsyncPipe } from '@angular/common';
import { Observable, Subscription, take, tap } from 'rxjs';
import { Output, EventEmitter } from '@angular/core';
import { ChatBoxComponent } from '../chat-box/chat-box.component';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatUser } from '../../core/interfaces/chat-user';
import { map, switchMap } from 'rxjs';
import { ChannelMessagingService } from '../../core/services/channel-messaging.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { forkJoin, from } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TimestampLineComponent } from '../timestamp-line/timestamp-line.component';
import { ProfileCard } from '../../core/interfaces/profile-card';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { ProfileOverlayService } from '../../core/services/profile-overlay.service';
import { Timestamp } from 'firebase/firestore';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { ReactionService } from '../../core/services/reaction.service';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ChatBoxComponent,
    PickerModule,
    FormsModule,
    TimestampLineComponent,
    SpinnerComponent,
  ],
  templateUrl: './channel-messages.component.html',
  styleUrls: ['./channel-messages.component.scss'],
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
  groupedMessages: {
    date: Date;
    dateString: string;
    messages: ChannelMessage[];
  }[] = [];
  showProfileCard: boolean = false;
  showHoverOptions: boolean = false;
  userDataForProfileCard$!: Observable<ProfileCard[]>;
  userDataForProfileCard: ProfileCard[] = [];
  selectedUserForProfileCard: ProfileCard | null = null;
  isLoading: boolean = true;
  hasScrolledAfterLoad: boolean = false;
  @ViewChild('scrollContainer', { static: false })
  scrollContainer?: ElementRef<HTMLElement>;
  lastReplyTimestamp?: Timestamp | Date;
  groupedReactionsMap: { [messageId: string]: { [emoji: string]: string[] } } = {};

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private authService: AuthService,
    private messagingService: ChannelMessagingService,
    private directMessagingService: DirectMessagingService,
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private overlayService: ProfileOverlayService,
    private threadService: ThreadMessagingService,
    private reactionService: ReactionService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.uid ?? '';
    this.isLoading = true;
    this.hasScrolledAfterLoad = false;

    this.userService.getAllUsers().pipe(
      tap((users) => {
        this.usersMap = {};
        users.forEach((user) => {
          this.usersMap[user.id] = {
            ...user,
            uid: user.id,
            online: false,
            email: '',
          };
        });
      }),
      switchMap(() =>
        this.messagingService.getChannelMessages(this.channelId)
      )
    ).subscribe((msgs) => {
      const withReplyCounts = msgs.map((msg) => ({
        ...msg,
        replyCount: msg.replyCount ?? 0,
        lastReplyTimestamp: msg.lastReplyTimestamp ?? undefined
      }));

      Promise.all(withReplyCounts).then((results) => {
        this.groupedMessages = this.groupMessagesByDate(results);
        this.cdRef.detectChanges();
        this.isLoading = false;
      });
    });

    this.getObserveableProfileCardData();
  }

  reactToChannelMessage(messageId: string, emoji: string) {
    if (!this.currentUserId || !this.channelId) return;
    this.reactionService.toggleReaction('channel', this.channelId, messageId, emoji, this.currentUserId);
  }

  getReactionGroups(reactions: { [userId: string]: string }) {
    const groups: { [emoji: string]: string[] } = {};
    for (const [userId, emoji] of Object.entries(reactions)) {
      if (!groups[emoji]) groups[emoji] = [];
      groups[emoji].push(userId);
    }
    return groups;
  }

  getUserNames(userIds: string[]): string {
    return userIds
      .map((id) => this.usersMap[id]?.name || 'Unbekannt')
      .join(', ');
  }

  getReactionTooltip(emoji: string, userIds: string[]): string {
    const names = userIds.map(id => this.usersMap[id]?.name || 'Unbekannt');
    return `${emoji} ${names.join(', ')} hat reagiert`;
  }



  getLastReplyTime(messages: ChannelMessage[]): Date | null {
    const timestamps = messages
      .map(m => {
        const ts = m.lastReplyTimestamp;
        if (ts instanceof Timestamp) {
          return ts.toDate();
        }
        return ts as Date;
      })
      .filter(Boolean);

    if (timestamps.length === 0) return null;

    return timestamps.sort((a, b) => b.getTime() - a.getTime())[0];
  }

  getFormattedLastReplyTime(timestamp: Timestamp | Date | undefined): string {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  groupMessagesByDate(messages: ChannelMessage[]): {
    date: Date;
    dateString: string;
    messages: ChannelMessage[];
  }[] {
    const grouped: { [key: string]: ChannelMessage[] } = {};

    messages.forEach((msg) => {
      if (!msg.timestamp || typeof msg.timestamp.toDate !== 'function') {
        // console.warn('Skipping message with invalid timestamp:', msg);
        return;
      }

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
        messages,
      };
    });
  }

  formatDate(date: Date): string {
    const today = new Date();

    const msgDate =
      date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    const todayDate =
      today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();

    if (msgDate === todayDate) return 'today';

    return date.toLocaleDateString('de-DE'); // or your preferred format
  }

  async reactToMessage(messageId: string, emoji: string) {
    if (!this.currentUserId || !this.channelId) return;

    await this.messagingService.toggleReaction(
      this.channelId,
      messageId,
      emoji,
      this.currentUserId
    );
    this.showEmojiPickerFor = null;
  }

  handlingDateTime(date: Date): string {
    return date.toLocaleDateString(); // or any other formatting logic
  }

  groupReactions(reactions: { [userId: string]: string }): {
    [emoji: string]: number;
  } {
    const counts: { [emoji: string]: number } = {};
    Object.values(reactions).forEach((emoji) => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return counts;
  }

  toggleEmojiPicker(messageId: string) {
    this.showEmojiPickerFor =
      this.showEmojiPickerFor === messageId ? null : messageId;
  }

  getUserName(uid: string): string {
    return this.usersMap[uid]?.name ?? uid;
  }

  getAvatarPath(uid: string): string {
    return (
      this.usersMap[uid]?.avatarPath ?? '/assets/images/default-avatar.svg'
    );
  }

  openThread(messageId: string) {
    this.replyToMessage.emit(messageId);

    this.router.navigate([], {
      queryParams: { thread: messageId },
      queryParamsHandling: 'merge',
    });

    this.threadService.openThread(this.channelId, messageId, 'channel');
  }


  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  startEditing(msg: ChannelMessage) {
    if (msg.senderId !== this.currentUserId) return; //only logged-in user can edit his message
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
    await this.messagingService.updateChannelMessageText(
      this.channelId,
      msgId,
      this.editedMessageText.trim()
    );
    this.cancelEditing();
  }

  appendEmojiToEdit(emoji: string) {
    this.editedMessageText += emoji;
  }

  getObserveableProfileCardData(): void {
    this.userDataForProfileCard$ =
      this.directMessagingService.getAllUsersForProfileCardCreation();

    this.userDataForProfileCard$.subscribe((data) => {
      this.userDataForProfileCard = data;
    });
  }

  // openProfileCard(uid: string): void {
  //   const user = this.userDataForProfileCard.find((u) =>
  //     u.direktMessageLink.endsWith(uid)
  //   );
  //   if (user) {
  //     this.selectedUserForProfileCard = user;
  //     this.showProfileCard = true;
  //   }
  // }

  closeProfileCard(): void {
    this.showProfileCard = false;
    this.selectedUserForProfileCard = null;
  }

  scrollToBottom(): void {
    if (!this.scrollContainer) {
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

  openProfileCard(userId: string): void {
    // Open immediately with minimal info
    const initialProfile: ProfileCard = {
      name: '...',
      email: '', // empty for now
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
}
