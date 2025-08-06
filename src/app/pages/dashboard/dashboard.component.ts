import { ChangeDetectorRef, Component, EventEmitter, HostListener, OnChanges, Output } from '@angular/core';
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
export class DashboardComponent implements OnChanges {
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
  currentView: 'sidenav' | 'main' | 'thread' = 'main'; // default to main view
  selectedChannelIdForUserAdd: string = '';
  selectedChannelTitleForUserAdd: string = '';
  showThread = false;
  selectedMessageId: string = '';
  selectedChannelId: string = '';
  isIntroSectionVisible: boolean = true;
  screenWidth: number = window.innerWidth;
  public showProfileCard$ = this.overlayService.isVisible$;
  public selectedUser$ = this.overlayService.selectedUser$;
  isHoveringNewMessageButton: boolean = false;
  @Output() replyToThread = new EventEmitter<string>();

  @HostListener('window:resize')
  onResize() {
    const width = window.innerWidth;
    this.isMediumScreen = width >= 980 && width <= 1400;
    this.screenWidth = width; // ✅ add this line
  }



  constructor(
    private router: Router,
    private threadService: ThreadMessagingService,
    public overlayService: ProfileOverlayService,
    private cdRef: ChangeDetectorRef
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

        // Auto-switch view for mobile
        if (window.innerWidth <= 979) {
          this.currentView = 'thread';
          this.cdRef.detectChanges(); // ✅ FIX: triggers safe change after view
        }
      } else {
        this.selectedMessageId = '';
        this.selectedChannelId = '';
        this.showThread = false;

        // Auto-switch back to main if thread closes on mobile
        if (window.innerWidth <= 979) {
          this.currentView = 'main';
          this.cdRef.detectChanges(); // ✅ FIX again
        }
      }
    });

    this.toggleSidenav(); // show/hide depending on screen size
    this.checkDashboardRouting();
  }

  checkDashboardRouting() {
    let lastBase = '';

    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;

        const baseRoute = this.currentUrl.split('/')[2] || '';
        const isMobile = window.innerWidth <= 580;

        if (this.currentUrl === '/dashboard') {
          if (isMobile) {
            // ✅ Mobile: show sidenav, hide intro
            setTimeout(() => {
              this.isIntroSectionVisible = false;
              this.currentView = 'sidenav';
              this.showSidenav = true;
              this.cdRef.detectChanges();
            }, 0);
          } else {
            // ✅ Desktop: show intro, hide sidenav
            setTimeout(() => {
              this.isIntroSectionVisible = true;
              this.currentView = 'main';
              this.showSidenav = false;
              this.cdRef.detectChanges();
            }, 0);
          }
        } else {
          // ✅ Any DM or channel route: hide intro
          this.isIntroSectionVisible = false;

          // Only switch to main on mobile if currently on sidenav
          if (isMobile && this.currentView === 'sidenav') {
            this.currentView = 'main';
          }
        }

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

    if (window.innerWidth <= 979) {
      this.currentView = 'thread';
    }
  }

  onCloseThread() {
    this.threadService.closeThread(); // also sets showThread = false via observable

    if (window.innerWidth <= 979) {
      this.currentView = 'main';
    }
  }

  onReplyToMessage(messageId: string) {
    this.replyToThread.emit(messageId);
  }

  toggleSidenav(): void {
    if (this.showSidenav) {
      this.sidenavAnimationClass = this.isMediumScreen ? 'slide-to-left' : 'slide-down';

      setTimeout(() => {
        this.showSidenav = false;
        this.sidenavAnimationClass = '';

        if (window.innerWidth <= 979) {
          this.currentView = 'main'; // return to main when sidenav closes
        }
      }, 400);
    } else {
      this.showSidenav = true;

      if (window.innerWidth <= 979) {
        this.currentView = 'sidenav';
      }

      this.sidenavAnimationClass = this.isMediumScreen ? 'slide-in-left' : 'slide-up';
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
    this.selectedChannelId = channelId;

    if (window.innerWidth <= 979) {
      this.currentView = 'main';
    }

    this.closeSidenavWithAnimation();
  }

  onUserSelected(userId: string): void {
    if (window.innerWidth <= 979) {
      this.currentView = 'main';
    }

    this.closeSidenavWithAnimation();
  }

  closeSidenavWithAnimation(): void {
    if (this.isMediumScreen && this.showSidenav) {
      this.sidenavAnimationClass = 'slide-to-left';

      this.showSidenav = false;
      this.sidenavAnimationClass = '';
    }
  }

  showResponsiveSidenav() {
    this.currentView = 'sidenav';
  }

  showResponsiveMainContainer() {
    this.currentView = 'main';
  }

  showResponsiveThread() {
    this.currentView = 'thread';
  }

  handleGoBack(): void {
    if (window.innerWidth <= 580) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnChanges() {
    console.log('Current view:', this.currentView);
  }
}
