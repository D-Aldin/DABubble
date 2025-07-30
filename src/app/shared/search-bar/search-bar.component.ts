import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService} from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service'; 
import { ChannelMessage } from '../../core/interfaces/channel-message';
import { DirectMessage } from '../../core/interfaces/direct-message';
import { ChatUser } from '../../core/interfaces/chat-user';


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

  constructor(private searchService: SearchService, private authService: AuthService) {
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
}
