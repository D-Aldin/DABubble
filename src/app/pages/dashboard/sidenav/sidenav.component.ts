import { CommonModule } from '@angular/common';
import { Component, inject, EventEmitter, Output, OnInit } from '@angular/core';
import { ChannelService } from '../../../core/services/channel.service';
import { DirectMessagingService } from '../../../core/services/direct-messaging.service';
import { Observable } from 'rxjs';
import { ChatUser } from '../../../core/interfaces/chat-user';
import { Channel } from '../../../core/interfaces/channel';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { SpinnerComponent } from '../../../shared/spinner/spinner.component';
import { SharedService } from '../../../core/services/shared.service';
import { User } from 'firebase/auth';
import { user } from '@angular/fire/auth';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent implements OnInit {
  selectedUserId: string | null = null;
  selectedChannel: string | null = null;
  usersArray: ChatUser[] = [];
  currentURL: string = '';
  isURLChannel: boolean | null = null;
  constructor(private sharedService: SharedService, private router: Router) { }

  @Output() openAddChannelDialog = new EventEmitter<void>();
  showChannels = true;
  showDMs = true;
  // @Output() channelSelected = new EventEmitter<Channel>();
  private channelService = inject(ChannelService);
  private dmService = inject(DirectMessagingService);

  channels$: Observable<Channel[]> = this.channelService.getChannels();
  users$: Observable<ChatUser[]> = this.dmService.getAllUsersExceptCurrent();

  // selectChannel(channel: Channel) {
  //   this.selectedChannel = channel.id;
  //   this.channelSelected.emit(channel); // Sending to parent
  // }

  selectChannel(channel: Channel) {
    this.selectedChannel = channel.id;
    this.router.navigate(['/dashboard/channel', channel.id]);
  }


  toggleChannels() {
    this.showChannels = !this.showChannels;
    // No need to load channels on toggle; subscribing now happens in ngOnInit()

    // this.channels$.subscribe((channels) => {
    //   console.log('Channels from Firebase:', channels);
    // });
  }

  toggleDMs() {
    this.showDMs = !this.showDMs;
  }

  ngOnInit(): void {
    this.subscribeToUsers()
    //keep track of URL for the selection of channels or users
    this.keepTrackOfCurrentURL()
  }

  keepTrackOfCurrentURL(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentURL = event.urlAfterRedirects;
        this.checkGivenURL();
      }
    });
  }

  checkGivenURL(): void {
    if (this.currentURL.includes('/dashboard/channel')) {
      this.isURLChannel = true
    } else {
      this.isURLChannel = false;
    }
  }

  subscribeToUsers(): void {
    this.users$.subscribe((users) => {
      this.usersArray = users;
    });
  }

  selectUser(userName: string): void {
    const selectedUser = this.usersArray.find((user) => user.name === userName);
    if (selectedUser) {
      this.selectedUserId = selectedUser.uid; // ✅ used for styling
      this.sharedService.setData(selectedUser);
      this.router.navigate(['/dashboard/direct-message', this.selectedUserId]);
    }
  }

  emitOpenDialog() {
    this.openAddChannelDialog.emit();
  }
}
