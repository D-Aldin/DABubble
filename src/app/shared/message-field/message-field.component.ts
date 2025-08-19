import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { CommonModule } from '@angular/common';
import { ChatUser } from '../../core/interfaces/chat-user';
import { DirectMessagingService } from '../../core/services/direct-messaging.service';
import { Observable } from 'rxjs';
import { ChannelService } from '../../core/services/channel.service';
import { Channel } from '../../core/interfaces/channel';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

  emojiPicker = false;
  message = '';
  isUserMentionActive = false;
  isChannelMentionActive = false;
  userArr: ChatUser[] = [];
  channelArr: Channel[] = [];
  searchTerm = '';

  @Input() disabled = false;
  @Input() channelId!: string;

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  constructor(
    private messagingService: DirectMessagingService,
    private channelService: ChannelService,
    private sanitizer: DomSanitizer
  ) {}

  users$: Observable<ChatUser[]> =
    this.messagingService.getAllUsersExceptCurrent();
  channel$: Observable<Channel[]> = this.channelService.getChannels();

  captureMessage() {
    if (this.message.trim()) {
      this.messageSend.emit(this.message.trim());
      this.message = '';
    }
  }

   safeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  onEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.captureMessage();
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
    if (this.isUserMentionActive) {
      this.message += '@';
      this.getTheUser();
    }
  }

  getTheUser() {
    this.users$.subscribe((users) => (this.userArr = users));
  }

  getChannels() {
    this.channel$.subscribe((channel) => (this.channelArr = channel));
  }

  toggleUserMention() {
    const match = this.message.match(/(^|\s)@(\w*)$/);
    this.isUserMentionActive = !!match;
    this.searchTerm = match ? match[2].toLowerCase() : '';
    if (this.isUserMentionActive) this.getTheUser();
  }

  toggleChannelMention() {
    const match = this.message.match(/(^|\s)#(\w*)$/);
    this.isChannelMentionActive = !!match;
    this.searchTerm = match ? match[2].toLowerCase() : '';
    if (this.isChannelMentionActive) this.getChannels();
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
    setTimeout(() => this.inputRef.nativeElement.focus());
  }
}
