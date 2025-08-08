import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChannelService } from '../../core/services/channel.service';
import { Channel } from '../../core/interfaces/channel';
import { User } from '../../core/interfaces/user';
import { UserService } from '../../core/services/user.service';
import { OpenProfileCardService } from '../../core/services/open-profile-card.service';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent {
  @Input({ required: true }) src!: string;
  @Input({ required: true }) userName!: string;
  @Input({ required: true }) time!: string;
  @Input({ required: true }) message!: string;
  @Input({ required: true }) userMe: boolean = true;
  @Input({ required: true }) userId!: string;
  @Input() isParentHovered: boolean = false;
  changedMessage: {
    text: string;
    tagChannel: boolean;
    tagUser: boolean;
    channelId: string;
    userId: string;
  }[] = [];
  @Output() profileClick = new EventEmitter<string>();
  showOptions: boolean = false;
  channels: Channel[] = [];
  users: User[] = [];
  clickedTag = "";

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private openProfileCardService: OpenProfileCardService
  ) {
    this.channelService.getChannels().subscribe((channels: Channel[]) => {
      this.channels = channels;
      this.changedMessage = this.changedMessageWithLinks(this.message);
    });

    this.userService.getAllUsers().subscribe((user: User[]) => {
      this.users = user;
      this.changedMessage = this.changedMessageWithLinks(this.message);
    });
  }

  ngOnChanges() {
    if (this.channels.length > 0) {
      this.changedMessage = this.changedMessageWithLinks(this.message);
    }
  }

  onHover(isHovering: boolean): void {
    this.showOptions = isHovering;
  }

  onNameClick(): void {
    this.profileClick.emit(this.userId);
  }

  changedMessageWithLinks(message: string): {
    text: string;
    tagChannel: boolean;
    tagUser: boolean;
    channelId: string;
    userId: string;
  }[] {
    const result: {
      text: string;
      tagChannel: boolean;
      tagUser: boolean;
      channelId: string;
      userId: string;
    }[] = [];

    const combinedRegex = /(@[\w\s]+|#[\w\-]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(message)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          text: message.slice(lastIndex, match.index),
          tagChannel: false,
          tagUser: false,
          channelId: '',
          userId: '',
        });
      }

      const tagText = match[0].slice(1);
      const isChannel = match[0].startsWith('#');
      const isUser = match[0].startsWith('@');

      const channelId = isChannel ? this.findChannelByTitle(tagText) : '';
      const userId = isUser ? this.findUserByName(tagText) : '';

      result.push({
        text: tagText,
        tagChannel: isChannel,
        tagUser: isUser,
        channelId: channelId ?? '',
        userId: userId ?? '',
      });

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < message.length) {
      result.push({
        text: message.slice(lastIndex),
        tagChannel: false,
        tagUser: false,
        channelId: '',
        userId: '',
      });
    }
    
    
    return result;
  }

  findChannelByTitle(channelTag: string): string | undefined {
    const found = this.channels.find((channel) => channel.title === channelTag);
    return found?.id;
  }

  findUserByName(userTag: string): string | undefined {
    const found = this.users.find((user) => user.name === userTag);
    return found?.id;
  }

processMentionedUse(event: Event): void {
  const regex =  /@(\w+(?:\s\w+)?)/;
  const targetElement = event.target as HTMLElement;
  this.clickedTag = targetElement.innerText.trim();
  const match = this.clickedTag.match(regex);

  if (match) {
    const getUserName = `${match[1]}`;
    const userId = this.findUserByName(getUserName);
    this.openProfileCardService.openProfileCard(userId)
  } else {
    console.warn('No valid tag found:', this.clickedTag);
  }
}
}
