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
      console.log(this.channelDocData);
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
    const value = this.inputValue.toLowerCase().trim();

    if (value.startsWith('#')) {
      const query = value.slice(1);
      this.filteredList = this.channelDocData.filter(
        (channel) => channel?.title?.toLowerCase().includes(query)
      );
    } else if (value.startsWith('@')) {
      const query = value.slice(1);
      this.filteredList = this.userDocData.filter(
        (user) => user?.name?.toLowerCase().includes(query)
      );
    } else {
      this.filteredList = this.userDocData.filter((user) => {
        const emailMatch =
          typeof user.email === 'string' &&
          user.email.toLowerCase().includes(value);
        const nameMatch =
          typeof user.name === 'string' &&
          user.name.toLowerCase().includes(value);
        return emailMatch || nameMatch;
      });
    }

    this.getSelectedRecipient()
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

  channelMessaging(recipientData: Channel) {
    const userId = this.getCurrentUserId?.();
    if (userId) {
      this.channelMessageService.sendMessage(recipientData.id, userId, this.messageText);
      this.redirectURL = `/dashboard/channel/${recipientData.id}`;
      this.showRedirectButton = true;
    }
  }

  directMessaging(recipientData: UserDropDown) {
    if (this.getCurrentUserId !== null) {
      // this.directMessageService.sendDirectMsg()
    }
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
      console.warn('No valid recipient selected.');
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
