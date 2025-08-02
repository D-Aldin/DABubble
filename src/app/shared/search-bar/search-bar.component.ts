import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService} from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service'; 
import { ChannelMessage } from '../../core/interfaces/channel-message';
import { DirectMessage } from '../../core/interfaces/direct-message';
import { ChatUser } from '../../core/interfaces/chat-user';
import {  Router, RouterLink } from '@angular/router';
import { ViewChild } from '@angular/core';
import { Renderer2, AfterViewInit } from '@angular/core';


@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements AfterViewInit{
  searchTerm = '';
  users: ChatUser[] = [];
  channelMessages: ChannelMessage[] = [];
  directMessages: DirectMessage[] = [];
  currentUserId: string | undefined;
  @ViewChild('#scrollContainer') scrollContainer!: ElementRef;
  isActive = false;

  ngAfterViewInit(): void {
    
  }

  constructor(private searchService: SearchService, private authService: AuthService, private router: Router, private renderer: Renderer2, private elementRef: ElementRef) {
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

  openDirectChat(userId:string) {
    this.router.navigate(['/dashboard/direct-message', userId]);
    this.isActive = true;
    this.searchTerm = ""

     if(this.searchTerm.length == 0) {
    this.isActive = false
  }
  }

  openChannelMessage(channelId?: string, messageId?: string) {
  this.router.navigate(['/dashboard/channel', channelId], {
    queryParams: { highlight: messageId }
  });
  this.isActive = true;
  this.searchTerm = "";

  if(this.searchTerm.length == 0) {
    this.isActive = false
  }
  
}

openDirectMessage(otherUserId: string, messageId: string | undefined) {
  this.router.navigate(['/dashboard/direct-message', otherUserId], {
    queryParams: { highlight: messageId }
  });
}
}
