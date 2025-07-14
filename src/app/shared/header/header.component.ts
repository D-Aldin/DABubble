import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ProfileCardComponent } from "../profile-card/profile-card.component";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileCardComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
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

  constructor(public router: Router, private userAuthService: AuthService, private userService: UserService) {
    this.handleHeaderAppearancesForRoutes();
  }

  handleHeaderAppearancesForRoutes() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showSignUpLink = event.urlAfterRedirects === '/login';
        this.showProfileAvatar = event.urlAfterRedirects === '/dashboard';
        this.showSearchBar = event.urlAfterRedirects === '/dashboard';
        this.showProfileMenu = event.urlAfterRedirects === '/dashboard';
      });
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
    this.userAuthService.logout().then(() => {
      if (user) {
        this.setUserOnlineStatus(user.uid, false)
      }
      this.router.navigate(['/login']);
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    this.fetchAndSetUserDocument(currentUser.uid);
    this.setUserEmail();
    this.setUserOnlineStatus(currentUser.uid, true)
  }

  private getCurrentUser() {
    const user = this.userAuthService.getCurrentUser();
    if (!user) {
      return null;
    }
    return user;
  }

  private fetchAndSetUserDocument(uid: string): void {
    this.userService.getUserDocument(uid)
      .then(userDoc => this.handleUserDocument(userDoc))
  }

  private handleUserDocument(userDoc: any): void {
    if (userDoc && userDoc.name) {
      this.userName = userDoc.name;
      this.avatarPath = userDoc.avatarPath;
    } else {
      this.userName = 'Unbekannt';
    }
  }

  private setUserEmail(): void {
    const userData = this.getCurrentUser();
    if (userData && userData.email) {
      this.userEmail = userData.email
    }
  }

  async onNameSaved(newName: string) {
    this.userName = newName;
    const userData = this.getCurrentUser()
    if (userData) {
      await this.userService.createUserDocument(userData.uid, this.avatarPath, this.userName)
    }
  }

  async setUserOnlineStatus(uid: string, online: boolean) {
    await this.userService.setOnlineStatus(uid, online)
    this.onlineStatus = online;
  }
}