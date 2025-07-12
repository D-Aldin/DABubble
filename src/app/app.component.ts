import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { User } from 'firebase/auth';
import { SuccessToastComponent } from './shared/success-toast/success-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SuccessToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'dabubble';
  showToast: boolean = false;
  toastMessage: string = '';
  successCondition = true;

  constructor(private userAuthService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.userAuthService.user$.subscribe((user) => {
      if (!user && this.router.url !== '/login') {
        if (!this.userAuthService.loggedOutManually) {
          this.toastMessage = 'Bitte melde dich an, um fortzufahren.';
          this.showToast = true;
        }
        this.userAuthService.loggedOutManually = false;
      }
    });
    this.showToast = false;
  }
}
