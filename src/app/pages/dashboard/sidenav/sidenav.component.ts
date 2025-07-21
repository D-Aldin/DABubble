import { CommonModule } from '@angular/common';
import { Component, inject, EventEmitter, Output, OnInit } from '@angular/core';
import { ChannelService } from '../../../core/services/channel.service';
import { DirectMessagingService } from '../../../core/services/direct-messaging.service';
import { filter, Observable, take } from 'rxjs';
import { ChatUser } from '../../../core/interfaces/chat-user';
import { Channel } from '../../../core/interfaces/channel';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { SpinnerComponent } from '../../../shared/spinner/spinner.component';
import { SharedService } from '../../../core/services/shared.service';
import { User } from 'firebase/auth';
import { user } from '@angular/fire/auth';
import { ProfileCardComponent } from "../../../shared/profile-card/profile-card.component";
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent, ProfileCardComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent implements OnInit {
  selectedUserId: string | null = null;
  selectedChannel: string | null = null;
  usersArray: ChatUser[] = [];
  currentURL: string = '';
  isURLChannel: boolean | null = null;
  bounceMap: { [uid: string]: boolean } = {}; //For bounce animation when selecting user

  constructor(private sharedService: SharedService, private router: Router, private userService: UserService) { }

  @Output() openAddChannelDialog = new EventEmitter<void>();
  showChannels = true;
  showDMs = true;

  private channelService = inject(ChannelService);
  private dmService = inject(DirectMessagingService);

  channels$: Observable<Channel[]> = this.channelService.getChannels();
  users$: Observable<ChatUser[]> = this.dmService.getAllUsersExceptCurrent();

  ngOnInit(): void {
    this.subscribeToUsers();
    this.currentURL = this.router.url;
    this.checkGivenURL();
    this.handleRouteSelectionOnPageReload();
    this.subscribeToRouterEvents();
  }

  subscribeToRouterEvents(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentURL = event.urlAfterRedirects;
        this.checkGivenURL();
        this.handleRouteSelectionOnPageReload();
      });
  }

  subscribeToUsers(): void {
    this.users$.subscribe((users) => {
      this.usersArray = users;
    });
  }

  checkGivenURL(): void {
    this.isURLChannel = this.currentURL.includes('/dashboard/channel');
  }

  selectUser(userName: string): void {
    const selectedUser = this.usersArray.find((user) => user.name === userName);
    if (selectedUser) {
      this.selectedUserId = selectedUser.uid; // ✅ used for styling
      this.sharedService.setData(selectedUser);
      this.router.navigate(['/dashboard/direct-message', this.selectedUserId]);
    }
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel = channel.id;
    this.router.navigate(['/dashboard/channel', channel.id]);
  }

  toggleChannels() {
    this.showChannels = !this.showChannels;
  }

  toggleDMs() {
    this.showDMs = !this.showDMs;
  }

  emitOpenDialog() {
    this.channelService.triggerAddChannelDialog();
  }

  handleRouteSelectionOnPageReload(): void {
    const match = this.currentURL.match(/\/direct-message\/([^\/]+)/);
    const userIdFromURL = match ? match[1] : null;

    if (userIdFromURL && !this.selectedUserId) {
      // Already have users loaded
      const user = this.usersArray.find(u => u.uid === userIdFromURL);
      if (user) {
        this.selectUser(user.name);
      } else {
        // Wait for users to load if not already
        this.users$
          .pipe(
            filter(users => !!users && users.length > 0),
            take(1)
          )
          .subscribe((users) => {
            const user = users.find((u) => u.uid === userIdFromURL);
            if (user) {
              this.selectUser(user.name);
            }
          });
      }
    }
  }

  triggerBounce(uid: string): void {
    this.bounceMap[uid] = true;
    setTimeout(() => {
      this.bounceMap[uid] = false;
    }, 250);
  }
}
