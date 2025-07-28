import { Component, OnInit } from '@angular/core';
import { InputFieldComponent } from "../../shared/input-field/input-field.component";
import { MessageFieldComponent } from "../../shared/message-field/message-field.component";
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
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
  selectedRecipients: (UserDropDown | Channel)[] = [];
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
  showRecipientList: boolean = false;

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (trimmed.startsWith('#')) return 'channel';
    if (trimmed.startsWith('@')) return 'user';
    if (emailRegex.test(trimmed)) return 'email';

    return 'invalid';
  }

  getRecipientError(): string | null {
    const value = this.inputValue.trim();
    const type = this.getInputType();
    if (!this.hasTyped || value === '') return null;
    if (this.isRecipientDuplicate(value)) {
      return 'Dieser Empfänger wurde bereits hinzugefügt.';
    }
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

  private isRecipientDuplicate(value: string): boolean {
    const recipientData = this.getSelectedRecipientData(value);
    if (!recipientData) return false;

    return this.selectedRecipients.some(r => {
      if ('avatarPath' in r && 'avatarPath' in recipientData) {
        return r.id === recipientData.id;
      } else if (!('avatarPath' in r) && !('avatarPath' in recipientData)) {
        return r.id === recipientData.id;
      }
      return false;
    });
  }

  isRecipientValid(): boolean {
    const value = this.inputValue.trim();
    const type = this.getInputType(value);
    if (this.isRecipientDuplicate(value)) return false;
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
      this.directMessaging(recipientData);
    } else {
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
    const conversationId = this.directMessageService.generateConversationId(currentUserId, selectedUserId);
    await this.directMessageService.createConversation(conversationId, [currentUserId, selectedUserId]);
    const trimmedMessage = this.messageText.trim();
    await this.sendDirectMsgWithService(conversationId, currentUserId, selectedUserId, trimmedMessage);
    this.directMessagingAftermath(recipientData);
  }

  async sendDirectMsgWithService(conversationId: string, currentUserId: string, selectedUserId: string, trimmedMessage: string) {
    await this.directMessageService.sendDirectMsg(
      conversationId,
      currentUserId,
      selectedUserId,
      trimmedMessage
    );
  }

  directMessagingAftermath(recipientData: UserDropDown) {
    this.showRedirectButton = true;
    this.messageText = '';
    this.redirectURL = `/dashboard/direct-message/${recipientData.id}`;
  }

  onMessageSend(message: string): void {
    this.messageText = message;
    if (!this.messageText.trim()) return;
    if (this.selectedRecipients.length === 0) return;
    for (const recipientData of this.selectedRecipients) {
      this.sendMessage(recipientData);
    }
    this.handleToast(true);
    this.selectedRecipients = [];
    this.inputValue = '';
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

  addRecipientToList(): void {
    const recipientData = this.getSelectedRecipientData(this.inputValue.trim());
    if (!recipientData) return;

    if (!this.isRecipientAlreadyAdded(recipientData)) {
      this.selectedRecipients.push(recipientData);
      this.sortRecipientsList();
      this.inputValue = '';
      this.filteredList = [];
      this.hasTyped = false;
    }
  }

  private sortRecipientsList(): void {
    this.selectedRecipients.sort((a, b) => {
      const isAUser = 'avatarPath' in a;
      const isBUser = 'avatarPath' in b;

      if (!isAUser && isBUser) return -1; // channel before user
      if (isAUser && !isBUser) return 1;  // user after channel

      const aName = isAUser ? a.name.toLowerCase() : a.title.toLowerCase();
      const bName = isBUser ? b.name.toLowerCase() : b.title.toLowerCase();
      return aName.localeCompare(bName);
    });
  }

  isRecipientAlreadyAdded(recipientData: UserDropDown | Channel): boolean {
    return this.selectedRecipients.some(r => {
      if ('avatarPath' in r && 'avatarPath' in recipientData) {
        return r.id === recipientData.id;
      } else if (!('avatarPath' in r) && !('avatarPath' in recipientData)) {
        return r.id === recipientData.id;
      }
      return false;
    });
  }

  get processedRecipients(): { isUser: boolean; display: string; src: string | boolean }[] {
    return this.selectedRecipients.map((recipient) => {
      if ('avatarPath' in recipient) {
        return { isUser: true, display: recipient.name, src: recipient.avatarPath };
      } else {
        return { isUser: false, display: `<b>#</b>${recipient.title}`, src: false };
      }
    });
  }
}
