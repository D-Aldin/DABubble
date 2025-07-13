import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
=======
import { InputFieldComponent } from '../input-field/input-field.component';
>>>>>>> fcf394a8d0b24b3dd2ed527a99b9017047582415

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, EmojiComponent, PickerModule],
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
<<<<<<< HEAD
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
=======
>>>>>>> fcf394a8d0b24b3dd2ed527a99b9017047582415
  }
}
