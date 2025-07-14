import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MessageFieldComponent } from '../message-field/message-field.component';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerModule, MessageFieldComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  isClose: boolean = false;
  message: string = '';
  emojiPicker: boolean = false;

  close(event: Event) {
    this.isClose = true;
    event.stopPropagation();
  }

  captureMessage() {
    console.log(this.message);
    this.message = '';
  }

  toggleEmojiPicker() {
    this.emojiPicker = !this.emojiPicker;
  }

  addEmoji(event: any) {
    this.message += event.emoji.native;
    this.emojiPicker = false;
  }
}
