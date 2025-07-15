import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss'
})
export class AddChannelComponent {
  @Output() close = new EventEmitter<void>();
  channelName = '';
  channelDescription = '';

  createChannel() {
    console.log('Channel Name:', this.channelName);
    console.log('Description:', this.channelDescription);
    // TODO: add Firebase logic later
  }

  closeDialog() {
    this.close.emit();
  }

}
