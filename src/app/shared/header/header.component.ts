import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { HostListener } from '@angular/core';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileCardComponent, SpinnerComponent, FormsModule, SearchBarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnChanges {
  public showSignUpLink: boolean = false;
  public shownSearchBar: boolean = true;
  public showProfileAvatar: boolean = false;
  public showSearchBar: boolean = true;
  public isHovering: boolean = false;
  public showProfileMenu: boolean = false;
  public showProfileCard: boolean = false;
  public isChevronHovered: boolean = false;
  public userName: string = '';
  public avatarPath: string = '';
  public userEmail: string = '';
  public onlineStatus: boolean | any;
  public isProfileAvatarLoading: boolean = true;
  public headerLogo: string = "assets/icons/daBubbleLogo.png"
  public windowWidth!: number;
  public showBackToSidenav: boolean = false;
  public shouldShowBackButtonByRoute: boolean = false;
  public inputSearchBar: string = "";
  @Output() goBackToSidenav = new EventEmitter<void>();
  @Input() currentView: 'sidenav' | 'main' | 'thread' = 'main';
  DASHBOARD_PREFIX: string = '/dashboard';
  DIRECT_MESSAGE_PREFIX: string = '/dashboard/direct-message';
  CHANNEL_PREFIX: string = '/dashboard/channel';
  currentURL: string = '';

  constructor(
    public router: Router,
    private userAuthService: AuthService,
    private userService: UserService,
  ) {
    this.handleHeaderAppearancesForRoutes();
    this.onResize()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentView']) {
      this.showBackToSidenav = this.shouldShowBackButtonByRoute && this.currentView !== 'sidenav';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: any) {
    this.windowWidth = window.innerWidth;
    this.handleShowBackToSidenavButtonAppearance(this.router.url);
  }

  handleHeaderAppearancesForRoutes() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.currentURL = url;
        this.handleLoginAppearance(url);
        this.handleDashboardAppearance(url);
        this.handleShowBackToSidenavButtonAppearance(url);
      });
  }

  handleShowBackToSidenavButtonAppearance(url: string) {
    const isMobile = this.windowWidth <= 580;
    const isInDetailView = url.startsWith(this.DIRECT_MESSAGE_PREFIX) || url.startsWith(this.CHANNEL_PREFIX);
    this.shouldShowBackButtonByRoute = isMobile && isInDetailView;
  }

  handleDashboardAppearance(url: string): void {
    const isDashboardRoute =
      url.startsWith(this.DASHBOARD_PREFIX) ||
      url.startsWith(this.DIRECT_MESSAGE_PREFIX) ||
      url.startsWith(this.CHANNEL_PREFIX);
    this.showProfileAvatar = isDashboardRoute;
    this.showSearchBar = isDashboardRoute;
    this.showProfileMenu = isDashboardRoute;
  }

  handleLoginAppearance(url: string): void {
    this.showSignUpLink = url === '/login';
  }

  toggleProfileMenu(): void {
    if (this.showProfileCard == true || this.showProfileMenu == true) {
      this.showProfileMenu = false;
    } else {
      this.showProfileMenu = !this.showProfileMenu;
    }
  }

  closeProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }


  showProfileCardContainer() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showProfileCard = !this.showProfileCard;
  }

  logout(): void {
    const user = this.userAuthService.getCurrentUser();
    if (user?.isAnonymous) {
      this.setUserOnlineStatus(user.uid, false);
      this.router.navigate(['/login']);
      return;
    }
    this.userAuthService.logout().then(() => {
      if (user) {
        this.setUserOnlineStatus(user.uid, false);
      }
      this.router.navigate(['/login']);
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.changeLogo();
  }

  private async loadUserData(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    await this.fetchAndSetUserDocument(currentUser.uid); 
    this.setUserEmail();
    this.setUserOnlineStatus(currentUser.uid, true);
  }

  private getCurrentUser() {
    const user = this.userAuthService.getCurrentUser();
    if (!user) {
      return null;
    }
    return user;
  }

  private async fetchAndSetUserDocument(uid: string): Promise<void> {
    this.isProfileAvatarLoading = true;
    const userDoc = await this.userService.getUserDocument(uid);
    this.handleUserDocument(userDoc);
    this.isProfileAvatarLoading = false;
  }

  private handleUserDocument(userDoc: any): void {
    if (userDoc && userDoc.name && userDoc.avatarPath) {
      this.userName = userDoc.name;
      this.avatarPath = userDoc.avatarPath;
    } else {
      this.userName = 'Unbekannt';
    }
  }

  private setUserEmail(): void {
    const userData = this.getCurrentUser();
    if (userData && userData.email) {
      this.userEmail = userData.email;
    }
  }

  async onNameSaved(newName: string) {
    this.userName = newName;
    const userData = this.getCurrentUser();
    if (userData && userData.email) {
      await this.userService.createUserDocument(
        userData.uid,
        this.avatarPath,
        this.userName,
        userData.email
      );
    }
  }

  async setUserOnlineStatus(uid: string, online: boolean) {
    await this.userService.setOnlineStatus(uid, online);
    this.onlineStatus = online;
  }

  dashboardIntroRouting(currentURL: string): string {
    if (currentURL.includes('/dashboard')) {
      return '/dashboard'
    }
    return currentURL;
  }

  changeLogo(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects;
      if (url.includes("direct-message") && this.windowWidth < 580 ||
        url.includes("channel") && this.windowWidth < 580 ||
        url.includes("new-message") && this.windowWidth < 580) {
        this.headerLogo = "assets/icons/devspace.png";
      } else {
        this.headerLogo = "assets/icons/daBubbleLogo.png";
      }
    });
  }

  onBackClick(): void {
    this.goBackToSidenav.emit();
  }
}

