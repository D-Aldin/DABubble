import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-success-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-toast.component.html',
  styleUrl: './success-toast.component.scss'
})
export class SuccessToastComponent {
  @Input() message: string = 'Aktion erfolgreich';
  @Input() hasIcon: boolean = false;
}
