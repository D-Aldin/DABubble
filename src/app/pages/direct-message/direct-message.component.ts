import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from '../../core/services/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MessageFieldComponent } from '../../shared/message-field/message-field.component';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { AuthService } from '../../core/services/auth.service';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';

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
  selectedUser: any = null;
  currentUser: CurrentUserId | null = null;
  hasSelectedUser: boolean = false;
  private subscription?: Subscription;

  constructor(
    private sharedService: SharedService,
    private authService: AuthService,
    private messagingService: DirectMessagingService,
    private route: ActivatedRoute,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const uid = params.get('uid');

      if (uid) {
        this.hasSelectedUser = true;

        // ✅ Fetch selected user by ID from your service
        this.userService.getUsersByIds([uid]).subscribe(users => {
          this.selectedUser = users[0];

          // Load current logged-in user
          this.loadCurrentUserId();
          const currentUserId = this.currentUser?.userId;
          const selectedUserId = this.selectedUser?.uid;

          if (currentUserId && selectedUserId) {
            this.createConversation(currentUserId, selectedUserId);
          }
        });
      }
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
  }
}
