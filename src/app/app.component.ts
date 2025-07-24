import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
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

  constructor(private userAuthService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userAuthService.user$.subscribe((user) => {
      if (
        !user &&
        this.router.url !== '/login' &&
        this.router.url !== '/reset-request' &&
        this.router.url !== '/reset-password' &&
        this.router.url !== '/privacy-policy'
      ) {
        if (!this.userAuthService.loggedOutManually) {
          this.setToast(true, 'Bitte melde dich an, um fortzufahren.');
        }
        this.userAuthService.loggedOutManually = false;
      }
    });
    this.setToast(false, '');
  }

  setToast(show: boolean, message: string): void {
    this.showToast = show;
    this.toastMessage = message;
  }
}
