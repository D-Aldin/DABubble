import { Component, OnInit } from '@angular/core';
import { InputFieldComponent } from "../../shared/input-field/input-field.component";
import { MessageFieldComponent } from "../../shared/message-field/message-field.component";
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/interfaces/user';
import { Observable } from 'rxjs';
import { Channel } from '../../core/interfaces/channel';
import { ChannelService } from '../../core/services/channel.service';
import { UserDropDown } from '../../core/interfaces/user-drop-down';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelMessagingService } from '../../core/services/channel-messaging.service';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { Router } from '@angular/router';
import { SuccessToastComponent } from "../../shared/success-toast/success-toast.component";

@Component({
  selector: 'app-new-message',
  standalone: true,
  imports: [InputFieldComponent, MessageFieldComponent, CommonModule, FormsModule, SuccessToastComponent],
  templateUrl: './new-message.component.html',
  styleUrl: './new-message.component.scss'
})
export class NewMessageComponent implements OnInit {
  userDocs$!: Observable<UserDropDown[]>;
  userDocData: UserDropDown[] = [];
  channels$!: Observable<Channel[]>;
  channelDocData: Channel[] = [];
  inputValue: string = '';
  filteredList: any[] = [];
  showDropdown: boolean = false;
  dropdownTimeout: any;
  hasTyped: boolean = false;
  selectedRecipient: string = '';
  messageText: string = '';
  messageSentSuccessfully: boolean = false;
  toastMessage: string = '';
  wasMessageSentSuccessfully: boolean = false;
  redirectURL: string = '';
  showRedirectButton: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private channelService: ChannelService,
    private channelMessageService: ChannelMessagingService,
    private directMessageService: DirectMessagingService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getChannels();
    this.getUsers();
  }

  getChannels(): void {
    this.channels$ = this.channelService.getChannels();

    this.channels$.subscribe((data) => {
      this.channelDocData = data;
    })
  }

  getUsers(): void {
    this.userDocs$ = this.userService.getAllUsersForDropdown();

    this.userDocs$.subscribe((data) => {
      this.userDocData = data;
    })
  }

  onTextChange(msg: string): void {
    this.messageText = msg;
  }

  onInputChange(): void {
    this.hasTyped = true;
    const value = this.getNormalizedInput();

    if (value.startsWith('#')) {
      this.filteredList = this.filterChannels(value.slice(1));
    } else if (value.startsWith('@')) {
      this.filteredList = this.filterUsersByName(value.slice(1));
    } else {
      this.filteredList = this.filterUsersByEmailOrName(value);
    }

    this.getSelectedRecipient();
  }

  getNormalizedInput(): string {
    return this.inputValue?.toLowerCase().trim() || '';
  }

  filterChannels(query: string): Channel[] {
    return this.channelDocData.filter(
      (channel) => channel?.title?.toLowerCase().includes(query)
    );
  }

  filterUsersByName(query: string): UserDropDown[] {
    return this.userDocData.filter(
      (user) => user?.name?.toLowerCase().includes(query)
    );
  }

  filterUsersByEmailOrName(value: string): UserDropDown[] {
    return this.userDocData.filter((user) => {
      const isGuest = user?.name?.toLowerCase().includes('guest');
      if (isGuest || !user?.email) return false;

      const emailMatch = user.email?.toLowerCase().includes(value);
      const nameMatch = user.name?.toLowerCase().includes(value);

      return emailMatch || nameMatch;
    });
  }

  selectItem(item: any): void {
    if (this.inputValue.startsWith('#')) {
      this.inputValue = `#${item.title}`;
    } else if (this.inputValue.startsWith('@')) {
      this.inputValue = `@${item.name}`;
    } else {
      this.inputValue = item.email;
    }
    this.getSelectedRecipient();
    this.showDropdown = false;
  }

  hideDropdownWithDelay(): void {
    this.dropdownTimeout = setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  getInputType(value: string = this.inputValue): 'channel' | 'user' | 'email' | 'invalid' {
    const trimmed = value.trim();

    if (trimmed.startsWith('#')) return 'channel';
    if (trimmed.startsWith('@')) return 'user';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) return 'email';

    return 'invalid';
  }

  getRecipientError(): string | null {
    const value = this.inputValue.trim();
    const type = this.getInputType();

    if (!this.hasTyped || value === '') return null;

    switch (type) {
      case 'channel':
        return this.channelDocData.some(c => `#${c.title}` === value)
          ? null
          : 'Dieser Channelname existiert nicht.';
      case 'user':
        return this.userDocData.some(u => `@${u.name}` === value)
          ? null
          : 'Dieser User existiert nicht.';
      case 'email':
        return this.userDocData.some(u => u.email === value)
          ? null
          : 'Diese User E-Mail existiert nicht.';
      default:
        return 'Bitte gib einen gültigen Empfänger ein.';
    }
  }

  isRecipientValid(): boolean {
    const value = this.inputValue.trim();
    const type = this.getInputType();

    switch (type) {
      case 'channel':
        return this.channelDocData.some(c => `#${c.title}` === value);
      case 'user':
        return this.userDocData.some(u => `@${u.name}` === value);
      case 'email':
        return this.userDocData.some(u => u.email === value);
      default:
        return false;
    }
  }

  getSelectedRecipient(): void {
    if (!this.isRecipientValid()) {
      this.selectedRecipient = '';
      return;
    }

    this.selectedRecipient = this.inputValue.trim();
    const recipientData = this.getSelectedRecipientData(this.selectedRecipient);
  }


  getSelectedRecipientData(recipient: string): UserDropDown | Channel | null {
    const type = this.getInputType(recipient);

    switch (type) {
      case 'channel':
        return this.channelDocData.find(c => `#${c.title}` === recipient) || null;

      case 'user':
        return this.userDocData.find(u => `@${u.name}` === recipient) || null;

      case 'email':
        return this.userDocData.find(u => u.email === recipient) || null;

      default:
        return null;
    }
  }

  sendMessage(recipientData: UserDropDown | Channel) {
    if ('avatarPath' in recipientData) {
      // it's a UserDropDown
      this.directMessaging(recipientData);
    } else {
      // it's a Channel
      this.channelMessaging(recipientData);
    }
  }

  getCurrentUserId(): string | null {
    const user = this.authService.getCurrentUser();
    if (user) {
      return user.uid
    }
    return null;
  }

  async channelMessaging(recipientData: Channel) {
    const userId = this.getCurrentUserId?.();
    if (userId) {
      await this.channelMessageService.sendMessage(recipientData.id, userId, this.messageText);
      this.redirectURL = `/dashboard/channel/${recipientData.id}`;
      this.showRedirectButton = true;
    }
  }

  async directMessaging(recipientData: UserDropDown): Promise<void> {
    const currentUserId = this.getCurrentUserId(); // Get current user ID
    const selectedUserId = recipientData?.id;

    if (!currentUserId || !selectedUserId) return;

    // 1. Generate consistent conversation ID
    const conversationId = this.directMessageService.generateConversationId(currentUserId, selectedUserId);

    // 2. Ensure the conversation exists
    await this.directMessageService.createConversation(conversationId, [currentUserId, selectedUserId]);

    // 3. Prepare message text
    const trimmedMessage = this.messageText.trim();
    if (!trimmedMessage) return;

    // 4. Send the message via messaging service
    await this.directMessageService.sendDirectMsg(
      conversationId,
      currentUserId,
      selectedUserId,
      trimmedMessage
    );
    // 5. Clear the message input
    this.showRedirectButton = true;
    this.messageText = '';
    this.redirectURL = `/dashboard/direct-message/${recipientData.id}`;
  }



  onMessageSend(message: string): void {
    this.messageText = message;
    if (!this.messageText.trim()) return;
    const recipient = this.inputValue.trim();
    const recipientData = this.getSelectedRecipientData(recipient);
    if (recipientData) {
      this.sendMessage(recipientData);
      this.handleToast(true);
    } else {
      this.handleToast(false);
    }
  }

  handleToast(success: boolean): void {
    if (success) {
      this.toastMessage = 'Nachricht erfolgreich gesendet!';
      this.wasMessageSentSuccessfully = true;
    } else {
      this.toastMessage = 'Es ist ein Fehler aufgetreten';
      this.wasMessageSentSuccessfully = false;
    }
    this.messageSentSuccessfully = true;
  }

  redirectToMsg(): void {
    this.router.navigateByUrl(this.redirectURL);
  }
}
