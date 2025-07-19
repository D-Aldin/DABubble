import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-timestamp-line',
  standalone: true,
  imports: [],
  templateUrl: './timestamp-line.component.html',
  styleUrl: './timestamp-line.component.scss',
})
export class TimestampLineComponent {
  @Input({ required: true }) date!: string;

  get displayText(): string {
    return this.date === 'today' ? 'Today' : this.date;
  }
}
