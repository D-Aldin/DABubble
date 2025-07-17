import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileCardComponent, SpinnerComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
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

  DASHBOARD_PREFIX: string = '/dashboard';
  DIRECT_MESSAGE_PREFIX: string = '/dashboard/direct-message';
  CHANNEL_PREFIX: string = '/dashboard/channel';

  constructor(
    public router: Router,
    private userAuthService: AuthService,
    private userService: UserService
  ) {
    this.handleHeaderAppearancesForRoutes();
  }

  handleHeaderAppearancesForRoutes() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.handleLoginAppearance(url);
        this.handleDashboardAppearance(url);
      });
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
    this.closeProfileMenu();
  }

  showProfileCardContainer() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showProfileCard = !this.showProfileCard;
  }

  closeProfileMenu() {
    if (this.showProfileCard == true) {
      this.showProfileMenu = false;
    }
  }

  logout(): void {
    const user = this.userAuthService.getCurrentUser();

    // Prevent logout for guest users
    if (user?.isAnonymous) {
      console.log('Guest user – not logging out');
      this.setUserOnlineStatus(user.uid, false);
      this.router.navigate(['/login']); // Or wherever you want to redirect
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
  }

  private async loadUserData(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    await this.fetchAndSetUserDocument(currentUser.uid); // 👈 await
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
      // console.log(this.userName);
      // console.log(this.avatarPath);
    } else {
      this.userName = 'Unbekannt';
      // console.log(this.userName);
      // console.log(this.avatarPath);
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
    if (userData) {
      await this.userService.createUserDocument(
        userData.uid,
        this.avatarPath,
        this.userName
      );
    }
  }

  async setUserOnlineStatus(uid: string, online: boolean) {
    await this.userService.setOnlineStatus(uid, online);
    this.onlineStatus = online;
  }
}
