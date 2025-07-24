import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, getLocaleFirstDayOfWeek } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChannelService } from '../../core/services/channel.service';
import { Channel } from '../../core/interfaces/channel';

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
  changedMessage: { text: string; isTag: boolean; channelId: string }[] = [];
  @Output() profileClick = new EventEmitter<string>();
  showOptions: boolean = false;
  channels: Channel[] = [];

  constructor(private channelService: ChannelService) {
    this.channelService.getChannels().subscribe((channels: Channel[]) => {
      this.channels = channels;
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

  changedMessageWithLinks(
    message: string
  ): { text: string; isTag: boolean; channelId: string }[] {
    const result: { text: string; isTag: boolean; channelId: string }[] = [];
    const regex = /#[a-zA-Z0-9\-]+/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(message)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          text: message.slice(lastIndex, match.index),
          isTag: false,
          channelId: '',
        });
      }

      const tagText = match[0].slice(1);
      const channelId = this.findChannelByTitle(tagText);

      result.push({
        text: tagText,
        isTag: true,
        channelId: channelId ?? '',
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < message.length) {
      result.push({
        text: message.slice(lastIndex),
        isTag: false,
        channelId: '',
      });
    }
    console.log(result);

    return result;
  }

  findChannelByTitle(channelTag: string): string | undefined {
    const found = this.channels.find((channel) => channel.title === channelTag);
    return found?.id;
  }
}
