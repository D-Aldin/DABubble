import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { ChannelMessage } from '../../core/interfaces/channel-message';
import { DirectMessage } from '../../core/interfaces/direct-message';
import { ChatUser } from '../../core/interfaces/chat-user';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
  searchTerm = '';
  users: ChatUser[] = [];
  channelMessages: ChannelMessage[] = [];
  directMessages: DirectMessage[] = [];
  currentUserId: string | undefined;
  isActive = false;
  @ViewChild('searchWrapper') searchWrapper!: ElementRef;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = this.searchWrapper?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.isActive = false;
    }
  }

  constructor(private searchService: SearchService, private authService: AuthService, private router: Router, private userService: UserService) {
    this.loadCurrentUserId();
  }

  async loadCurrentUserId() {
    this.currentUserId = await this.authService.currentUserId
  }

  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term || !this.currentUserId) return;

    this.searchService.searchUsers(term).subscribe(results => {
      this.users = results;

    });


    this.searchService.searchChannelMessages(term).subscribe(results => {
      this.channelMessages = results;

    });


    this.searchService.searchMyDirectMessages(term, this.currentUserId).subscribe(results => {
      this.directMessages = results;

    });
  }

  openDirectChat(userId: string) {
    this.router.navigate(['/dashboard/direct-message', userId]);
    this.closeResultWindow()
  }


  openChannelMessage(channelId?: string, messageId?: string) {
    this.router.navigate(['/dashboard/channel', channelId], {
      queryParams: { highlight: messageId }
    });
    this.closeResultWindow()

  }

  openDirectMessage(otherUserId: string, messageId: string | undefined) {
    this.router.navigate(['/dashboard/direct-message', otherUserId], {
      queryParams: { highlight: messageId }
    });
    this.closeResultWindow()
  }

  closeResultWindow() {
    this.isActive = false;
    this.searchTerm = "";
    if (this.searchTerm.length == 0) {
      this.isActive = false;
      this.users = [];
      this.channelMessages = [];
      this.directMessages = [];
    }
  }

  // findUserById(id: string) {
  //   this.userService.getUserById(id).subscribe(user => {
  //     return user.name
  //   })
  // }
}