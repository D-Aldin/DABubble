import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { ThreadComponent } from './shared/thread/thread.component';
import { AuthService } from './core/services/auth.service';
import { SuccessToastComponent } from './shared/success-toast/success-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SuccessToastComponent, ThreadComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'dabubble';
  showToast: boolean = false;
  toastMessage: string = '';
  successCondition = true;

  constructor(private userAuthService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userAuthService.user$.subscribe(user => {
      if (!user && this.router.url !== '/login') {
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
