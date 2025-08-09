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
    this.screenWidth = width; 
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
    this.initializeResponsiveBehavior();
    this.listenToThreadState();
    this.toggleSidenav();
    this.checkDashboardRouting();
  }

  private initializeResponsiveBehavior(): void {
    this.onResize(); 
  }

  private listenToThreadState(): void {
    this.threadService.threadState$.subscribe((state) => {
      if (state) {
        this.handleThreadOpen(state.channelId, state.messageId);
      } else {
        this.handleThreadClose();
      }
    });
  }

  private handleThreadOpen(channelId: string, messageId: string): void {
    this.selectedMessageId = messageId;
    this.selectedChannelId = channelId;
    this.showThread = true;

    if (this.isMobile()) {
      this.currentView = 'thread';
      this.cdRef.detectChanges();
    }
  }

  private handleThreadClose(): void {
    this.selectedMessageId = '';
    this.selectedChannelId = '';
    this.showThread = false;

    if (this.isMobile()) {
      this.currentView = 'main';
      this.cdRef.detectChanges();
    }
  }

  private isMobile(): boolean {
    return window.innerWidth <= 979;
  }

  checkDashboardRouting(): void {
    let lastBase = '';

    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        const baseRoute = this.extractBaseRoute(this.currentUrl);
        const isMobile = this.isMobileView();

        this.handleDashboardRoute(this.currentUrl, isMobile);
        this.handleThreadResetIfBaseChanged(baseRoute, lastBase);

        lastBase = baseRoute;
      });
  }

  private extractBaseRoute(url: string): string {
    return url.split('/')[2] || '';
  }

  private isMobileView(): boolean {
    return window.innerWidth <= 580;
  }

  private handleDashboardRoute(url: string, isMobile: boolean): void {
    if (url === '/dashboard') {
      isMobile ? this.setupMobileDashboardView() : this.setupDesktopDashboardView();
    } else {
      this.isIntroSectionVisible = false;
      if (isMobile && this.currentView === 'sidenav') {
        this.currentView = 'main';
      }
    }
  }

  private setupMobileDashboardView(): void {
    setTimeout(() => {
      this.isIntroSectionVisible = false;
      this.currentView = 'sidenav';
      this.showSidenav = true;
      this.cdRef.detectChanges();
    }, 0);
  }

  private setupDesktopDashboardView(): void {
    setTimeout(() => {
      this.isIntroSectionVisible = true;
      this.currentView = 'main';
      this.showSidenav = false;
      this.cdRef.detectChanges();
    }, 0);
  }

  private handleThreadResetIfBaseChanged(current: string, last: string): void {
    if (current !== last) {
      this.threadService.closeThread();
    }
  }

  openThread(channelId: string, messageId: string) {
    this.selectedChannelId = channelId;
    this.selectedMessageId = messageId;
    this.showThread = true;

    if (window.innerWidth <= 979) {
      this.currentView = 'thread';
    }
  }

  onCloseThread() {
    this.threadService.closeThread();

    if (window.innerWidth <= 979) {
      this.currentView = 'main';
    }
  }

  onReplyToMessage(messageId: string) {
    this.replyToThread.emit(messageId);
  }

  toggleSidenav(): void {
    if (this.showSidenav) {
      this.animateSidenavClose();
    } else {
      this.animateSidenavOpen();
    }
  }

  private animateSidenavClose(): void {
    this.sidenavAnimationClass = this.getCloseAnimationClass();

    setTimeout(() => {
      this.showSidenav = false;
      this.sidenavAnimationClass = '';
      this.resetViewIfMobile();
    }, 400);
  }

  private animateSidenavOpen(): void {
    this.showSidenav = true;
    this.setViewToSidenavIfMobile();
    this.sidenavAnimationClass = this.getOpenAnimationClass();
  }

  private getCloseAnimationClass(): string {
    return this.isMediumScreen ? 'slide-to-left' : 'slide-down';
  }

  private getOpenAnimationClass(): string {
    return this.isMediumScreen ? 'slide-in-left' : 'slide-up';
  }

  private resetViewIfMobile(): void {
    if (window.innerWidth <= 979) {
      this.currentView = 'main';
    }
  }

  private setViewToSidenavIfMobile(): void {
    if (window.innerWidth <= 979) {
      this.currentView = 'sidenav';
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
}
