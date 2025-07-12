import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  public isChevronHovered: boolean = false;
  public userName: string = '';
  public avatarPath: string = '';

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
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    this.userAuthService.logout().then(() => {
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
}