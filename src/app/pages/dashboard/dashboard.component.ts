import { Component } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { ThreadComponent } from '../../shared/thread/thread.component';
import { ChatBoxComponent } from '../../shared/chat-box/chat-box.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SidenavComponent,
    HeaderComponent,
    ThreadComponent,
    ChatBoxComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  showSidenav = true;
  hovered = false;

  toggleSidenav() {
    this.showSidenav = !this.showSidenav;
  }
}
