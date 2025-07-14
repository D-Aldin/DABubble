import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ChannelService } from '../../../core/services/channel.service';
import { DirectMessagingService } from '../../../core/services/direct-messaging.service';
import { Observable } from 'rxjs';
import { ChatUser } from '../../../core/interfaces/chat-user';
import { Channel } from '../../../core/interfaces/channel';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  showChannels = true;
  showDMs = true;

  private channelService = inject(ChannelService);
  private dmService = inject(DirectMessagingService);

  channels$: Observable<Channel[]> = this.channelService.getChannels();
  users$: Observable<ChatUser[]> = this.dmService.getAllUsersExceptCurrent();

  toggleChannels() {
    this.showChannels = !this.showChannels;
      this.channels$.subscribe(channels => {
      console.log('🔥 Channels from Firebase:', channels);
    });
  }

   toggleDMs() {
    this.showDMs = !this.showDMs;
  }
}
