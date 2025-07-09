import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  public showSignUpLink: boolean = true;
  public shownSearchBar: boolean = true;
  public showProfileAvatar: boolean = true;
  public showSearchBar: boolean = true;
  public isHovering: boolean = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showSignUpLink = event.urlAfterRedirects === '';
        this.showProfileAvatar = event.urlAfterRedirects === '/dashboard';
        this.showSearchBar = event.urlAfterRedirects === '/dashboard';
      });
  }
}