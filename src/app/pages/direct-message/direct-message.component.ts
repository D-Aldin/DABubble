import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { SharedService } from '../../core/services/shared.service';
import { CommonModule } from '@angular/common';
import { map, Subscription, take } from 'rxjs';
import { MessageFieldComponent } from '../../shared/message-field/message-field.component';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { AuthService } from '../../core/services/auth.service';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { Message } from '../../core/interfaces/message';
import { ChatBoxComponent } from '../../shared/chat-box/chat-box.component';
import { Timestamp } from '@angular/fire/firestore';
import { UserService } from '../../core/services/user.service';
import { TimestampLineComponent } from '../../shared/timestamp-line/timestamp-line.component';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';

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
    ProfileCardComponent,
  ],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
})
export class DirectMessageComponent
  implements OnInit, OnDestroy, AfterViewInit
{
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

  @ViewChild('scrollContainer')
  private scrollContainer?: ElementRef<HTMLElement>;

  @ViewChild('messageInput') messageFieldComponent!: MessageFieldComponent;

  constructor(
    private sharedService: SharedService,
    private authService: AuthService,
    private messagingService: DirectMessagingService,
    private userService: UserService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sharedService.sharedData$.subscribe((user) => {
      if (user) {
        this.areMessagesLoaded = false;
        this.hasSelectedUser = true;
        this.selectedUser = user;
        this.loadCurrentUserId();
        const currentUserId = this.currentUser?.userId;
        const selectedUserId = this.selectedUser?.uid;
        if (currentUserId && selectedUserId) {
          this.createConversation(currentUserId, selectedUserId);
        }
      }
    });
    // this.subscription = this.messagingService
    //   .getMessages(this.conversation)
    //   .subscribe((msg) => {
    //     this.messages = msg;
    //   });
  }

  /** called once view is created; useful for initial deep‑link load */
  ngAfterViewInit(): void {
    this.zone.onStable.pipe(take(1)).subscribe(() => {
      this.scrollToBottom();
    });
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
    }
  }

  async createConversation(
    currentUserId: string,
    selectedUserId: string
  ): Promise<void> {
    const conversationId = this.messagingService.generateConversationId(
      currentUserId,
      selectedUserId
    );
    await this.messagingService.createConversation(conversationId, [
      currentUserId,
      selectedUserId,
    ]);

    this.conversation = conversationId;
    this.areMessagesLoaded = false;
    this.loadMessages(conversationId);
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

  loadMessages(id: string) {
    this.subscription = this.messagingService
      .getMessages(id)
      .subscribe(async (msg) => {
        this.areMessagesLoaded = false;
        this.messages = msg;
        const senderIds = [...new Set(msg.map((m) => m.messageFrom))];
        for (const uid of senderIds) {
          if (!this.userNamesMap[uid]) {
            this.userNamesMap[uid] = await this.getCurrentUserName(uid);
          }
          if (!this.userAvatarsMap[uid]) {
            this.userAvatarsMap[uid] = await this.getCurrentUserAvatar(uid);
          }
        }
        this.checkArray(this.messages);
        this.areMessagesLoaded = true;
        this.cdr.detectChanges();
        this.zone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
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
      // element not in DOM yet – nothing to do
      return;
    }
    const el = this.scrollContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  checkArray(arr: Object[]) {
    if (arr.length < 1) {
      this.isMessagesArrayEmpty = false;
    } else {
      this.isMessagesArrayEmpty = true;
    }
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
    // this.selectedUserId = this.userNamesMap[userId]
  }
}
