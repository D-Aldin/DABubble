import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';

@Injectable({
  providedIn: 'root'
})
export class MentioningService {
  constructor(
    private userService: UserService,
    private channelService: ChannelService,
    private router: Router
  ) {}

  handleTagClicks(callbacks: {
    onUserClick: (userId: string) => void
  }) {
    document.addEventListener('click', (event) => {
      const tagElement = (event.target as HTMLElement).closest('.tag-link');
      if (!tagElement) return;
      event.preventDefault();
      event.stopPropagation();
      const type = tagElement.getAttribute('data-type');
      const name = tagElement.getAttribute('data-name');
      if (!type || !name) return;
      if (type === 'user') {
        this.handleUserTagClick(name, callbacks.onUserClick);
      } else if (type === 'channel') {
        this.handleChannelTagClick(name);
      }
    });
  }

  private handleUserTagClick(userName: string, callback: (userId: string) => void): void {
    this.userService.getAllUsers().subscribe(users => {
      const user = users.find(user => 
        user.name.toLowerCase().includes(userName.toLowerCase()) || 
        userName.toLowerCase().includes(user.name.toLowerCase())
      );
      if (user) {
        callback(user.id);
      } else {
        console.warn('User not found:', userName);
      }
    });
  }

  private handleChannelTagClick(channelName: string): void {
    this.channelService.getChannels().subscribe(channels => {
      const channel = channels.find(channel => 
        channel.title.toLowerCase().includes(channelName.toLowerCase()) || 
        channelName.toLowerCase().includes(channel.title.toLowerCase())
      );
      
      if (channel) {
        this.router.navigate(['/dashboard/channel', channel.id]);
      } else {
        console.warn('Channel not found:', channelName);
      }
    });
  }
}