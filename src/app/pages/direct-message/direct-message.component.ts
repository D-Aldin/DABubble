import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, take } from 'rxjs';
import { MessageFieldComponent } from '../../shared/message-field/message-field.component';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { AuthService } from '../../core/services/auth.service';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { Message } from '../../core/interfaces/message';
import { ChatBoxComponent } from '../../shared/chat-box/chat-box.component';
import { Timestamp } from '@angular/fire/firestore';
import { UserService } from '../../core/services/user.service';
import { TimestampLineComponent } from '../../shared/timestamp-line/timestamp-line.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileOverlayService } from '../../core/services/profile-overlay.service';
import { OpenProfileCardService } from '../../core/services/open-profile-card.service';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms'; import { Firestore, collection, collectionData, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ReactionService } from '../../core/services/reaction.service';
import { ChatUser } from '../../core/interfaces/chat-user';
import { SearchService } from '../../core/services/search.service';

interface CurrentUserId {
  userId: string;
}

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [
    CommonModule,
    MessageFieldComponent,
    SpinnerComponent,
    ChatBoxComponent,
    TimestampLineComponent,
    PickerModule,
    FormsModule
  ],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
})
export class DirectMessageComponent
  implements OnInit, OnDestroy, AfterViewInit {
  messages: Message[] = [];
  selectedUser: any = null;
  currentUser: CurrentUserId | null = null;
  hasSelectedUser: boolean = false;
  private subscription?: Subscription;
  conversation!: string;
  userNamesMap: { [userId: string]: string } = {};
  userAvatarsMap: { [userId: string]: string } = {};
  areMessagesLoaded: boolean = false;
  isMessagesArrayEmpty: boolean = false;
  showProfileCard: boolean = false;
  selectedUserId: string = '';
  areMessagesRendered: boolean = false;
  hoveredMessageId: string | null = null;
  showEmojiPickerFor: string | null = null;
  editingMessageId: string | null = null;
  editedMessageText: string = '';
  currentUserId: string = '';
  replyCount: number = 0;
  lastReplyTimestamp: Timestamp | Date | null = null;
  usersMap: { [userId: string]: ChatUser } = {};
  directMessages: Message[] = [];
  private previousSelectedUid: string | null = null;

  @Output() replyToMessage = new EventEmitter<string>();
  @ViewChild('scrollContainer')
  private scrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('messageInput') messageFieldComponent!: MessageFieldComponent;

  constructor(
    public authService: AuthService,
    private messagingService: DirectMessagingService,
    private userService: UserService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private overlayService: ProfileOverlayService,
    private openCardService: OpenProfileCardService,
    private threadService: ThreadMessagingService,
    private router: Router,
    private firestore: Firestore,
    private reactionService: ReactionService,
    private searchService: SearchService,
    private el: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    this.loadCurrentUserId();
    this.route.paramMap.subscribe(async (params) => {
      const selectedUid = params.get('uid');
      if (!selectedUid) return;
      if (this.previousSelectedUid !== selectedUid) {
        this.threadService.closeThread();
        this.previousSelectedUid = selectedUid;
      }
      if (!this.currentUser?.userId) return;
      await this.handleDirectMessageLoad(selectedUid);
    });
  }

  private async handleDirectMessageLoad(selectedUid: string): Promise<void> {
    this.areMessagesLoaded = false;
    const userDoc = await this.userService.getUserDocument(selectedUid);
    if (!userDoc) return;
    this.setSelectedUser(selectedUid, userDoc);
    await this.createConversation(this.currentUser!.userId, selectedUid);
    this.subscribeToDirectMessages();
  }

  private setSelectedUser(uid: string, userDoc: any): void {
    this.selectedUser = {
      uid,
      ...userDoc,
    };
  }

  private subscribeToDirectMessages(): void {
    this.messagingService.getMessages(this.conversation).subscribe((messages: Message[]) => {
      this.directMessages = messages;
      this.loadReactorProfiles(messages);
      this.areMessagesLoaded = true;
      this.cdr.detectChanges();
    });
  }

  private loadReactorProfiles(messages: Message[]): void {
    const userIds = new Set<string>();
    messages.forEach((m) => {
      if (m.reactions) {
        Object.keys(m.reactions).forEach(uid => userIds.add(uid));
      }
    });
    if (userIds.size > 0) {
      this.loadUserProfiles(Array.from(userIds));
    }
  }

  getFormattedLastReplyTime(timestamp: Timestamp | Date | undefined): string {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getThreadReplies(conversationId: string, messageId: string): Observable<Message[]> {
    const threadCollection = collection(
      this.firestore,
      `directMessages/${conversationId}/messages/${messageId}/threads`
    );

    const sortByTime = query(threadCollection, orderBy('timestamp', 'asc'));
    return collectionData(sortByTime, { idField: 'id' }) as Observable<Message[]>;
  }

  openThread(messageId: string) {
    if (!messageId) return;

    this.replyToMessage.emit(messageId);
    this.threadService.openThread(this.conversation, messageId, 'direct');

    this.router.navigate([], {
      queryParams: { thread: messageId, threadType: 'direct' },
      queryParamsHandling: 'merge',
    });
  }

  toggleEmojiPicker(messageId: string) {
    this.showEmojiPickerFor = this.showEmojiPickerFor === messageId ? null : messageId;
  }

  startEditing(msg: Message) {
    if (msg.messageFrom !== this.currentUserId) return;//only logged-in user can edit his message
    this.editingMessageId = msg.id!;
    this.editedMessageText = msg.message;
    this.showEmojiPickerFor = null;
    this.hoveredMessageId = null;
  }

  cancelEditing() {
    this.editingMessageId = null;
    this.editedMessageText = '';
  }

  appendEmojiToEdit(emoji: string) {
    this.editedMessageText += emoji;
  }

  async saveEditedMessage(msgId: string) {
    if (!msgId || !this.editedMessageText.trim()) return;
    await this.messagingService.updateDirectMessage(this.conversation, msgId, this.editedMessageText.trim());
    this.cancelEditing();
  }

  reactToDirectMessage(messageId: string, emoji: string) {
    if (!this.currentUserId || !this.conversation) return;
    if (!this.currentUser?.userId) return;
    this.reactionService.toggleReaction('dm', this.conversation, messageId, emoji, this.currentUser?.userId);
  }

  async reactToMessage(messageId: string, emoji: string) {
    if (!this.currentUser?.userId || !this.conversation) return;
    await this.messagingService.toggleReaction(
      this.conversation,
      messageId,
      emoji,
      this.currentUser.userId
    );
    this.showEmojiPickerFor = null;
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
    return userIds.map(id => this.usersMap[id]?.name || 'Unbekannt').join(', ');
  }

  getReactionTooltip(emoji: string, userIds: string[]): string {
    const names = userIds.map(id => this.usersMap[id]?.name || 'Unbekannt');
    return `${emoji} ${names.join(', ')} hat reagiert`;
  }

  loadUserProfiles(userIds: string[]) {
    this.userService.getUsersByIds(userIds).subscribe(users => {
      users.forEach(user => {
        this.usersMap[user.uid] = user;
      });
    });
  }

  ngAfterViewInit(): void {
    this.zone.onStable.pipe(take(1)).subscribe(() => {
      this.scrollToBottom();
    });
    this.searchService.handleHighlightScroll(".message", this.el, this.route)

  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadCurrentUserId(): void {
    const userFromAuthService = this.authService.getCurrentUser();
    if (userFromAuthService) {
      this.currentUser = {
        userId: userFromAuthService.uid,
      };
      this.currentUserId = userFromAuthService.uid;
    }
  }

  async createConversation(currentUserId: string, selectedUserId: string): Promise<void> {
    const conversationId = this.messagingService.generateConversationId(currentUserId, selectedUserId);

    this.conversation = conversationId;
    await this.messagingService.createConversation(conversationId, [
      currentUserId,
      selectedUserId,
    ]);

    await this.loadMessages(conversationId); // fully awaited now
  }

  onMessageSend(msg: string) {
    const from = this.currentUser?.userId;
    const to = this.selectedUser?.uid;
    if (from && to) {
      this.messagingService.sendDirectMsg(this.conversation, from, to, msg);
    } else {
      console.error('User IDs are missing. Cannot send message.');
    }
    this.loadMessages(this.conversation);
  }

  async loadMessages(id: string): Promise<void> {
    this.prepareForNewMessages();

    this.subscription = this.messagingService.getMessages(id).subscribe(async (msg) => {
      await this.enrichMessagesWithUserData(msg);
      this.updateMessageState(msg);
      this.renderMessages();
    });
  }

  private prepareForNewMessages(): void {
    this.subscription?.unsubscribe();
    this.messages = [];
    this.areMessagesRendered = false;
    this.cdr.detectChanges();
  }

  private async enrichMessagesWithUserData(messages: Message[]): Promise<void> {
    const senderIds = [...new Set(messages.map((m) => m.messageFrom))];
    for (const uid of senderIds) {
      if (!this.userNamesMap[uid]) {
        this.userNamesMap[uid] = await this.getCurrentUserName(uid);
      }
      if (!this.userAvatarsMap[uid]) {
        this.userAvatarsMap[uid] = await this.getCurrentUserAvatar(uid);
      }
    }
  }

  private updateMessageState(messages: Message[]): void {
    this.messages = messages;
    this.checkArray(this.messages);
    this.cdr.detectChanges();
  }

  private renderMessages(): void {
    setTimeout(() => {
      this.areMessagesRendered = true;
      this.zone.onStable.pipe(take(1)).subscribe(() => {
        this.scrollToBottom();
      });
      this.cdr.detectChanges();
    });
  }

  checkIfMessageIsFromLoggedInUser(index: number): boolean {
    const userFromAuthService = this.authService.getCurrentUser();
    const messageSender = this.messages[index]?.messageFrom;
    return userFromAuthService?.uid !== messageSender;
  }

  convertTimestampToString(timestamp: Timestamp): string {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  async getCurrentUserName(id: string): Promise<string> {
    const userDoc = await this.userService.getUserDocument(id);
    if (userDoc && userDoc.name) {
      return userDoc.name;
    }
    return '';
  }

  async getCurrentUserAvatar(id: string): Promise<string> {
    const userDoc = await this.userService.getUserDocument(id);
    if (userDoc && userDoc.avatarPath) {
      return userDoc.avatarPath;
    }
    return '';
  }

  scrollToBottom(): void {
    if (!this.scrollContainer) {
      return;
    }
    const el = this.scrollContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  checkArray(arr: Object[]) {
    this.isMessagesArrayEmpty = arr.length < 1;
  }

  handlingDateTime(timestamp: Timestamp): string {
    if (!timestamp) return '';

    const date = timestamp.toDate();
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'today';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  toggleProfileCardOnClick(userId: string): void {
    this.showProfileCard = !this.showProfileCard;
  }

  closeProfileCard(): void {
    this.overlayService.close();
  }

  openProfileCard(userId: string | undefined): void {
    this.openCardService.openProfileCard(userId)
  }
}
