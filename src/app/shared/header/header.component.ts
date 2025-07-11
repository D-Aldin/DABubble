import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

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

  constructor(public router: Router) {
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
    // Logout-Logik hier
  }
}