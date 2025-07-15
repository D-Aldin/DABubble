import { CommonModule } from '@angular/common';
import { Component, inject, EventEmitter, Output  } from '@angular/core';
import { ChannelService } from '../../../core/services/channel.service';
import { DirectMessagingService } from '../../../core/services/direct-messaging.service';
import { Observable } from 'rxjs';
import { ChatUser } from '../../../core/interfaces/chat-user';
import { Channel } from '../../../core/interfaces/channel';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  @Output() openAddChannelDialog = new EventEmitter<void>();
  showChannels = true;
  showDMs = true;

  private channelService = inject(ChannelService);
  private dmService = inject(DirectMessagingService);

  channels$: Observable<Channel[]> = this.channelService.getChannels();
  users$: Observable<ChatUser[]> = this.dmService.getAllUsersExceptCurrent();

  toggleChannels() {
    this.showChannels = !this.showChannels;
    this.channels$.subscribe((channels) => {
      console.log('Channels from Firebase:', channels);
    });
  }

  toggleDMs() {
    this.showDMs = !this.showDMs;
  }

  selectUser(userName: string) {
    this.users$.subscribe((usersArray) => {
      const selectedUser = usersArray.find((user) => (user.name = userName));
    });
  }

  emitOpenDialog() {
    this.openAddChannelDialog.emit();
  }

}
