import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';

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
  @Input() success: boolean = false;

  @HostBinding('class.error') get isError() {
    return !this.success;
  }
}
