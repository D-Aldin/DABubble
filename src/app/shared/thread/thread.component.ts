import { Component } from '@angular/core';
import { ɵEmptyOutletComponent } from '@angular/router';
import { ChatBoxComponent } from '../chat-box/chat-box.component';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [ɵEmptyOutletComponent, ChatBoxComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  chatBoxes = [
    { user: 'Muzammal', message: 'Hello World' },
    { user: 'Shardzil', message: 'Welcome' },
    { user: 'Aldin', message: 'Goodbye' },
  ];
}
