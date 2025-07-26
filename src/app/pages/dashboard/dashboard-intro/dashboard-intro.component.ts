import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-intro.component.html',
  styleUrl: './dashboard-intro.component.scss'
})
export class DashboardIntroComponent {
  constructor(private router: Router) { }

  isOnDashboard(): boolean {
    return this.router.url === '/dashboard';
  }
}
