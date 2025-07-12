import { Component } from '@angular/core';
import { ɵEmptyOutletComponent } from '@angular/router';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [ɵEmptyOutletComponent],
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
