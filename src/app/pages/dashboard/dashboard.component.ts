import { Component, EventEmitter, HostListener, Output } from '@angular/core';
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
  isMediumScreen: boolean = false;
  showSidenav = false;
  sidenavAnimationClass: string = '';
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

  @HostListener('window:resize')
  onResize() {
    const width = window.innerWidth;
    this.isMediumScreen = width >= 980 && width <= 1400;
  }

  constructor(
    private router: Router,
    private threadService: ThreadMessagingService,
    public overlayService: ProfileOverlayService
  ) { }

  closeProfileCard(): void {
    this.overlayService.close();
  }

  ngOnInit(): void {
    this.onResize(); // initial check
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
    this.toggleSidenav()
    this.checkDashboardRouting();
  }

  checkDashboardRouting() {
    let lastBase = '';

    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        this.isIntroSectionVisible = this.currentUrl === '/dashboard';
        const baseRoute = this.currentUrl.split('/')[2] || '';

        if (baseRoute !== lastBase) {
          this.threadService.closeThread();
        }
        lastBase = baseRoute;
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

  toggleSidenav(): void {
    if (this.showSidenav) {
      // Close logic
      this.sidenavAnimationClass = this.isMediumScreen ? 'slide-to-left' : 'slide-down';

      setTimeout(() => {
        this.showSidenav = false;
        this.sidenavAnimationClass = '';
      }, 400); // match animation duration
    } else {
      // Open logic
      this.showSidenav = true;

      setTimeout(() => {
        this.sidenavAnimationClass = this.isMediumScreen ? 'slide-in-left' : 'slide-up';
      }, 10); // slight delay ensures DOM is painted
    }
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

  onChannelSelected(channelId: string): void {
    this.closeSidenavWithAnimation();
  }

  onUserSelected(userId: string): void {
    this.closeSidenavWithAnimation();
  }
  
  closeSidenavWithAnimation(): void {
    if (this.isMediumScreen && this.showSidenav) {
      this.sidenavAnimationClass = 'slide-to-left';

      setTimeout(() => {
        this.showSidenav = false;
        this.sidenavAnimationClass = '';
      }, 400);
    }
  }

}
