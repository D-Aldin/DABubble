import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
// import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-field',
  standalone: true,
  imports: [FormsModule, CommonModule, PickerModule],
  templateUrl: './message-field.component.html',
  styleUrl: './message-field.component.scss',
})
export class MessageFieldComponent {
  @Input() customClass: string = '';
  message: string = '';
  emojiPicker: boolean = false;

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
