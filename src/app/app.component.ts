import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { ThreadComponent } from './shared/thread/thread.component';
<<<<<<< HEAD
import { ChatBoxComponent } from './shared/chat-box/chat-box.component';
=======
import { AuthService } from './core/services/auth.service';
import { User } from 'firebase/auth';
import { SuccessToastComponent } from './shared/success-toast/success-toast.component';
>>>>>>> 385df9bba66b7a2f404287a8d95d5080e6fcc22f

@Component({
  selector: 'app-root',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, RouterOutlet, ThreadComponent, ChatBoxComponent],
=======
  imports: [CommonModule, RouterOutlet, SuccessToastComponent, ThreadComponent],
>>>>>>> 385df9bba66b7a2f404287a8d95d5080e6fcc22f
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
          this.toastMessage = 'Bitte melde dich an, um fortzufahren.';
          this.showToast = true;
        }
        this.userAuthService.loggedOutManually = false;
      }
    });
    this.showToast = false
  }
}
