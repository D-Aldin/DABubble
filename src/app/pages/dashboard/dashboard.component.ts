import { Component, EventEmitter, Output } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { ThreadComponent } from '../../shared/thread/thread.component';
import { NavigationEnd, Router, RouterModule, Event } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Channel } from '../../core/interfaces/channel';
import { CommonModule } from '@angular/common';
import { ThreadMessagingService } from '../../core/services/thread-messaging.service';
import { DashboardIntroComponent } from './dashboard-intro/dashboard-intro.component';
import { filter } from 'rxjs';
import { ProfileCardComponent } from "../../shared/profile-card/profile-card.component";
import { ProfileOverlayService } from '../../core/services/profile-overlay.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SidenavComponent,
    HeaderComponent,
    CommonModule,
    RouterModule,
    RouterOutlet,
    ThreadComponent,
    DashboardIntroComponent,
    ProfileCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  showSidenav = true;
  hovered = false;
  showAddChannelDialog = false;
  showPeopleDialog = false;
  createdChannelName = '';
  channelDataBuffer: Partial<Channel> = {};
  channelName = '';
  channelDescription = '';
  currentUrl: string = '';
  showAddUserToChannelPopup = false;
  addUserMode: 'create-channel' | 'add-to-channel' = 'add-to-channel';
  selectedChannelIdForUserAdd: string = '';
  selectedChannelTitleForUserAdd: string = '';
  showThread = false;
  selectedMessageId: string = '';
  selectedChannelId: string = '';
  isIntroSectionVisible: boolean = true;
  public showProfileCard$ = this.overlayService.isVisible$;
  public selectedUser$ = this.overlayService.selectedUser$;
  @Output() replyToThread = new EventEmitter<string>();

  constructor(
    private router: Router,
    private threadService: ThreadMessagingService,
    public overlayService: ProfileOverlayService
  ) { }

  closeProfileCard(): void {
    this.overlayService.close();
  }

  ngOnInit(): void {
    this.threadService.threadState$.subscribe((state) => {
      if (state) {
        this.selectedMessageId = state.messageId;
        this.selectedChannelId = state.channelId;
        this.showThread = true;
      } else {
        this.selectedMessageId = '';
        this.selectedChannelId = '';
        this.showThread = false;
      }
    });

    this.checkDashboardRouting();
  }

  checkDashboardRouting() {
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        this.isIntroSectionVisible = this.currentUrl === '/dashboard';
      });
  }

  openThread(channelId: string, messageId: string) {
    console.log('Opening thread:', channelId, messageId);
    this.selectedChannelId = channelId;
    this.selectedMessageId = messageId;
    this.showThread = true;
  }

  onCloseThread() {
    this.threadService.closeThread();
  }

  onReplyToMessage(messageId: string) {
    this.replyToThread.emit(messageId);
  }

  toggleSidenav() {
    this.showSidenav = !this.showSidenav;
  }

  openAddChannelDialog() {
    this.showAddChannelDialog = true;
  }

  closeAddChannelDialog() {
    this.createdChannelName = '';
    this.showAddChannelDialog = false;
  }

  openAddPeopleDialog(data?: { name: string; description: string }) {
    if (data) {
      this.channelName = data.name;
      this.channelDescription = data.description;
      this.createdChannelName = data.name;
    }
    this.addUserMode = 'create-channel';
    this.showAddChannelDialog = false;
    this.showPeopleDialog = true;
  }

  closePeopleDialog() {
    this.createdChannelName = '';
    this.showPeopleDialog = false;
  }
}
