import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from '../../core/services/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MessageFieldComponent } from '../../shared/message-field/message-field.component';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { AuthService } from '../../core/services/auth.service';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { Message } from '../../core/interfaces/message';

interface CurrentUserId {
  userId: string;
}

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule, MessageFieldComponent, SpinnerComponent],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  selectedUser: any = null;
  currentUser: CurrentUserId | null = null;
  hasSelectedUser: boolean = false;
  private subscription?: Subscription;
  conversation!: string;

  constructor(
    private sharedService: SharedService,
    private authService: AuthService,
    private messagingService: DirectMessagingService
  ) {}

  ngOnInit() {
    this.sharedService.sharedData$.subscribe((user) => {
      if (user) {
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
    this.subscription = this.messagingService
      .getMessages(this.conversation)
      .subscribe((msg) => {
        console.log('Message recevid', msg);

        this.messages = msg;
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
      .subscribe((msg) => {
        this.messages = msg;
        console.log(this.messages);
      });
  }
}
