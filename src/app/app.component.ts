import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SuccessToastComponent } from './shared/success-toast/success-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SuccessToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'DABubble';
  showToast: boolean = false;
  toastMessage: string = '';
  successCondition: boolean = true;

  constructor(
    private userAuthService: AuthService,
    private router: Router,
    private renderer: Renderer2
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes('/dashboard')) {
          this.renderer.removeClass(document.body, 'mobile-unlock');
        } else {
          this.renderer.addClass(document.body, 'mobile-unlock');
        }
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToUserAuth();
    this.setToast(false, '');
  }

  private subscribeToUserAuth(): void {
    this.userAuthService.user$.subscribe((user) => {
      if (this.shouldRedirectToLogin(user)) {
        this.handleUnauthorizedAccess();
      }
    });
  }

  private shouldRedirectToLogin(user: any): boolean {
    const url = this.router.url;
    const allowedPaths = [
      '/login',
      '/reset-request',
      '/reset-password',
      '/privacy-policy',
    ];
    return !user && !allowedPaths.includes(url);
  }

  private handleUnauthorizedAccess(): void {
    if (!this.userAuthService.loggedOutManually) {
      this.setToast(true, 'Bitte melde dich an, um fortzufahren.');
      setTimeout(() => {
        this.setToast(false, '');
      }, 3000);
    }
    this.userAuthService.loggedOutManually = false;
  }


  setToast(show: boolean, message: string): void {
    this.showToast = show;
    this.toastMessage = message;
  }
}
