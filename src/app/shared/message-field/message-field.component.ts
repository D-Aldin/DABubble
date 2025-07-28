import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { CommonModule } from '@angular/common';
import { ChatUser } from '../../core/interfaces/chat-user';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { mergeScan, Observable } from 'rxjs';
import { ChannelService } from '../../core/services/channel.service';
import { Channel } from '../../core/interfaces/channel';

@Component({
  selector: 'app-message-field',
  standalone: true,
  imports: [FormsModule, CommonModule, PickerModule],
  templateUrl: './message-field.component.html',
  styleUrl: './message-field.component.scss',
})
export class MessageFieldComponent implements AfterViewInit {
  @Input() customClass: string = '';
  @Output() messageSend = new EventEmitter<string>();
  emojiPicker: boolean = false;
  message: string = '';
  input: string = '';
  isUserMentionActive: boolean = false;
  isChannelMentionActive: boolean = false;
  userArr: ChatUser[] = [];
  channelArr: Channel[] = [];
  isVisible: boolean = false;
  searchTerm: string = '';
  @Input() disabled: boolean = false;

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  constructor(
    private messagingService: DirectMessagingService,
    private channelService: ChannelService
  ) { }

  users$: Observable<ChatUser[]> =
    this.messagingService.getAllUsersExceptCurrent();
  channel$: Observable<Channel[]> = this.channelService.getChannels();

  captureMessage() {
    if (this.message.trim()) {
      this.messageSend.emit(this.message);
      this.message = '';
      console.log('message sent');
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
    this.isUserMentionActive = !this.isUserMentionActive;

    if (this.isUserMentionActive == true) {
      this.message += '@';
      this.getTheUser();
    }
  }

  getTheUser() {
    this.users$.subscribe((users) => {
      this.userArr = users;
    });
  }

  getChannels() {
    this.channel$.subscribe((channel) => {
      this.channelArr = channel;
    });
  }

  toggleUserMention() {
    const match = this.message.match(/(^|\s)@(\w*)$/);
    if (match) {
      this.searchTerm = match[2].toLowerCase();
      this.isUserMentionActive = true;
      this.getTheUser();
    } else {
      this.isUserMentionActive = false;
      this.searchTerm = '';
    }
  }

  toggleChannelMention() {
    const match = this.message.match(/(^|\s)#(\w*)$/);
    if (match) {
      this.searchTerm = match[2].toLowerCase();
      this.isChannelMentionActive = true;
      this.getChannels();
    } else {
      this.isChannelMentionActive = false;
      this.searchTerm = '';
    }
  }

  searchForUser() {
    this.searchTerm = this.message.replace('@', '').toLowerCase();
  }

  addUser(userName: string) {
    const regex = /(^|\s)@(\w*)$/;
    this.message = this.message.replace(regex, `$1@${userName} `);
    this.isUserMentionActive = false;
    this.searchTerm = '';
  }

  addChannel(channel: string) {
    const regex = /(^|\s)#(\w*)$/;
    this.message = this.message.replace(regex, `$1#${channel} `);
    this.isChannelMentionActive = false;
    this.searchTerm = '';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputRef.nativeElement.focus();
    });
  }
}
