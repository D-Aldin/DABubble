import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-timestamp-line',
  standalone: true,
  imports: [],
  templateUrl: './timestamp-line.component.html',
  styleUrl: './timestamp-line.component.scss',
})
export class TimestampLineComponent {
  @Input({ required: true }) date!: Date;

  get displayText(): string {
  const today = new Date();
    const input = this.date;

    // Normalize both to midnight local time
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const inputLocal = new Date(input.getFullYear(), input.getMonth(), input.getDate());

    const isToday = inputLocal.getTime() === todayLocal.getTime();

    if (isToday) return 'Today';

    return input.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

}
