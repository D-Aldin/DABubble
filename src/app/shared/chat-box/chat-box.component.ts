import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  // @Input({ required: true }) message!: string;
  changedMessage: { text: string; isTag: boolean }[] = [];

  @Output() profileClick = new EventEmitter<string>();

  showOptions: boolean = false;

  ngOnChanges() {
    this.changedMessage = this.changedMessageWithLinks(this.message);
  }

  onHover(isHovering: boolean): void {
    this.showOptions = isHovering;
  }

  onNameClick(): void {
    this.profileClick.emit(this.userId);
  }

  changedMessageWithLinks(message: string): { text: string; isTag: boolean }[] {
    const result = [];
    const regex = /#[a-zA-Z0-9\-]+/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(message)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          text: message.slice(lastIndex, match.index),
          isTag: false,
        });
      }
      result.push({ text: match[0].slice(1), isTag: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < message.length) {
      result.push({ text: message.slice(lastIndex), isTag: false });
    }

    return result;
  }
}
