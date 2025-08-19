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
import { Observable, take, tap } from 'rxjs';
import { Output, EventEmitter } from '@angular/core';
import { ChatBoxComponent } from '../chat-box/chat-box.component';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatUser } from '../../core/interfaces/chat-user';
import { map, switchMap } from 'rxjs';
import { ChannelMessagingService } from '../../core/services/channel-messaging.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
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
import { SearchService } from '../../core/services/search.service';
import { LegacyReactions, NewReactions } from '../../core/interfaces/message';
import { AutoYScrollDirective } from '../../core/directives/auto-y-scroll.directive';
import { scrollToBottom } from '../../core/utility/scrollToBottom';

type ReactionMap = Record<string, string[]>;
type ReactionEntry = { emoji: string; users: string[]; count: number };

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
    AutoYScrollDirective,
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
  groupedReactionsMap: { [messageId: string]: { [emoji: string]: string[] } } =
    {};
  maxVisibleReactions = 4;
  openReactionsPopoverFor: string | null = null;

  constructor(
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
    private reactionService: ReactionService,
    private el: ElementRef,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.uid ?? '';
    this.isLoading = true;
    this.hasScrolledAfterLoad = false;

    this.userService
      .getAllUsers()
      .pipe(
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
      )
      .subscribe((msgs) => {
        const withReplyCounts = msgs.map((msg) => ({
          ...msg,
          replyCount: msg.replyCount ?? 0,
          lastReplyTimestamp: msg.lastReplyTimestamp ?? undefined,
        }));

        Promise.all(withReplyCounts).then((results) => {
          this.groupedMessages = this.groupMessagesByDate(results);
          this.cdRef.detectChanges();
          this.isLoading = false;
          const last = results[results.length - 1];
          if (!this.hasScrolledAfterLoad || last?.senderId === this.currentUserId) {
            requestAnimationFrame(() => {
              scrollToBottom(this.scrollContainer);
              this.hasScrolledAfterLoad = true;
            });
          }
        });
      });

    this.getObserveableProfileCardData();
  }

  hasReplies(msg: ChannelMessage): boolean {
    return (msg.replyCount ?? 0) > 0;
  }

  hasReactions(msg: ChannelMessage): boolean {
    return this.buildReactionEntries(msg.reactions).length > 0;
  }

  reactToChannelMessage(messageId: string, emoji: string) {
    if (!this.currentUserId || !this.channelId) return;
    this.messagingService
      .toggleReaction(this.channelId, messageId, emoji, this.currentUserId)
      .catch((e) => {
        if (e?.message === 'REACTION_LIMIT_REACHED') {
          console.warn('Maximal 20 Emojis pro Nachricht und Nutzer.');
        } else {
          console.error(e);
        }
      });
  }

  getReactionGroups(
    reactions: LegacyReactions | NewReactions | null | undefined
  ): ReactionMap {
    return this.normalizeReactions(reactions);
  }

  private buildReactionEntries(
    reactions: LegacyReactions | NewReactions | null | undefined
  ): ReactionEntry[] {
    const groups = this.normalizeReactions(reactions);
    return Object.entries(groups)
      .map(([emoji, users]) => ({ emoji, users, count: users.length }))
      .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
  }

  getVisibleReactions(msg: ChannelMessage): ReactionEntry[] {
    const all = this.buildReactionEntries(msg.reactions);
    return all.slice(0, this.maxVisibleReactions);
  }

  getHiddenReactions(msg: ChannelMessage): ReactionEntry[] {
    const all = this.buildReactionEntries(msg.reactions);
    return all.slice(this.maxVisibleReactions);
  }

  getHiddenCount(msg: ChannelMessage): number {
    const all = this.buildReactionEntries(msg.reactions);
    return Math.max(0, all.length - this.maxVisibleReactions);
  }

  toggleReactionsPopover(messageId: string): void {
    this.openReactionsPopoverFor =
      this.openReactionsPopoverFor === messageId ? null : messageId;
  }

  getUserNames(userIds: string[]): string {
    return userIds
      .map((id) => this.usersMap[id]?.name || 'Unbekannt')
      .join(', ');
  }

  getReactionTooltip(emoji: string, userIds: string[]): string {
    const names = userIds.map((id) => this.usersMap[id]?.name || 'Unbekannt');
    const verb = names.length > 1 ? 'haben reagiert' : 'hat reagiert';
    return `${emoji} ${names.join(', ')} ${verb}`;
  }

  getLastReplyTime(messages: ChannelMessage[]): Date | null {
    const timestamps = messages
      .map((m) => {
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
    const date =
      timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  groupMessagesByDate(messages: ChannelMessage[]): {
    date: Date;
    dateString: string;
    messages: ChannelMessage[];
  }[] {
    const grouped = this.groupMessagesByKey(messages);

    return this.mapGroupedEntriesToDateObjects(grouped);
  }

  private groupMessagesByKey(
    messages: ChannelMessage[]
  ): Record<string, ChannelMessage[]> {
    const grouped: Record<string, ChannelMessage[]> = {};

    for (const msg of messages) {
      const key = this.getDateKeyFromTimestamp(msg.timestamp);
      if (!key) continue;

      (grouped[key] ||= []).push(msg);
    }

    return grouped;
  }

  private getDateKeyFromTimestamp(timestamp: any): string | null {
    if (!timestamp || typeof timestamp.toDate !== 'function') return null;

    const date = timestamp.toDate();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private mapGroupedEntriesToDateObjects(
    grouped: Record<string, ChannelMessage[]>
  ): {
    date: Date;
    dateString: string;
    messages: ChannelMessage[];
  }[] {
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
    return date.toLocaleDateString('de-DE');
  }

  async reactToMessage(messageId: string, emoji: string) {
    if (!this.currentUserId || !this.channelId) return;
    try {
      await this.messagingService.toggleReaction(
        this.channelId,
        messageId,
        emoji,
        this.currentUserId
      );
    } catch (e: any) {
      if (e?.message === 'REACTION_LIMIT_REACHED') {
        console.warn('Maximal 20 Emojis pro Nachricht und Nutzer.');
      } else {
        console.error(e);
      }
    } finally {
      this.showEmojiPickerFor = null;
    }
  }

  private normalizeReactions(
    raw?: LegacyReactions | NewReactions | null
  ): ReactionMap {
    if (!raw) return {};
    const ent = Object.entries(raw);
    if (!ent.length) return {};

    if (ent.some(([k]) => this.isEmojiish(k))) return this.fromKeyEmoji(ent);
    if (
      ent.some(([, v]) => typeof v === 'string' && this.isEmojiish(v as string))
    )
      return this.fromValEmoji(ent);
    if (ent.every(([, v]) => Array.isArray(v)))
      return Object.fromEntries(
        ent.map(([e, u]) => [e, (u as string[]).slice()])
      ) as ReactionMap;

    const out: ReactionMap = {};
    for (const [e, v] of ent) out[e] = Array.isArray(v) ? (v as string[]) : [];
    return out;
  }

  private isEmojiish(s: string): boolean {
    return /[^\w\s-]/.test(s);
  }

  private fromKeyEmoji(ent: [string, any][]): ReactionMap {
    const out: ReactionMap = {};
    for (const [emoji, v] of ent) {
      const users = Array.isArray(v)
        ? (v as string[])
        : typeof v === 'string'
        ? [v as string]
        : [];
      if (users.length) out[emoji] = users;
    }
    return out;
  }

  private fromValEmoji(ent: [string, string][]): ReactionMap {
    const out: ReactionMap = {};
    for (const [uid, emoji] of ent) (out[emoji] ||= []).push(uid);
    return out;
  }

  handlingDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
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
    return this.usersMap[uid]?.name || 'Unbekannt';
  }

  getAvatarPath(uid: string): string {
    return (
      this.usersMap[uid].avatarPath ?? 'assets/images/register/default-profile-img.svg'
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
    if (msg.senderId !== this.currentUserId) return;
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

  closeProfileCard(): void {
    this.showProfileCard = false;
    this.selectedUserForProfileCard = null;
  }

  ngAfterViewInit(): void {
    this.zone.onStable.pipe(take(1)).subscribe(() => {
      scrollToBottom(this.scrollContainer);
    });
    this.searchService.handleHighlightScroll(
      '.message-wrapper',
      this.el,
      this.route
    );
  }

  openProfileCard(userId: string): void {
    const initialProfile: ProfileCard = {
      name: '...',
      email: '',
      avatarPath: '',
      online: false,
      direktMessageLink: `/dashboard/direct-message/${userId}`,
    };
    this.overlayService.open(initialProfile);
    this.userService.getUserById(userId).subscribe((userDoc) => {
      if (!userDoc) return;
      this.overlayService.updatePartial({
        name: userDoc.name,
        email: userDoc.email,
        avatarPath: userDoc.avatarPath,
        online: userDoc.online,
        direktMessageLink: `/dashboard/direct-message/${userId}`,
      });
    });
  }
}
