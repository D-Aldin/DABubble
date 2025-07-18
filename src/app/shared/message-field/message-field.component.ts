import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { ChatUser } from '../../core/interfaces/chat-user';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-message-field',
  standalone: true,
  imports: [FormsModule, CommonModule, PickerModule],
  templateUrl: './message-field.component.html',
  styleUrl: './message-field.component.scss',
})
export class MessageFieldComponent {
  @Input() customClass: string = '';
  @Output() messageSend = new EventEmitter<string>();
  emojiPicker: boolean = false;
  message: string = '';
  addUserPopUp: boolean = false;

  userArr: ChatUser[] = [];

  constructor(private messagingService: DirectMessagingService) {}

  users$: Observable<ChatUser[]> =
    this.messagingService.getAllUsersExceptCurrent();

  captureMessage() {
    if (this.message.trim()) {
      this.messageSend.emit(this.message);
      this.message = '';
    }
  }

  toggleEmojiPicker() {
    this.emojiPicker = !this.emojiPicker;
  }

  addEmoji(event: any) {
    this.message += event.emoji.native;
    this.emojiPicker = false;
  }

  toggleAddUser() {
    this.addUserPopUp = !this.addUserPopUp;
    this.getTheUser();
  }

  getTheUser() {
    this.users$.subscribe((users) => {
      this.userArr = users;
    });
  }
}
