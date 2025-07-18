import { Component, Input } from '@angular/core';
import { ChannelService } from '../../core/services/channel.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel-message-input',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './channel-message-input.component.html',
  styleUrl: './channel-message-input.component.scss'
})
export class ChannelMessageInputComponent {
  @Input() channelId!: string;
  messageText: string = '';

  constructor(private channelService: ChannelService, private authService: AuthService) {}

  sendMessage() {
    const senderId = this.authService.getCurrentUser()?.uid;
    const text = this.messageText.trim();

    if (!text || !senderId || !this.channelId) return;

    this.channelService.sendChannelMessage(this.channelId, senderId, text).then(() => {
      this.messageText = '';
    });
  }
}
