import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent {
  @Input({ required: true }) src!: string;
  @Input({ required: true }) userName!: string;
  @Input({ required: true }) time!: string;
  @Input({ required: true }) message!: string;
  @Input() userMe: boolean = true;
  @Input({ required: true }) userId!: string;

  @Output() profileClick = new EventEmitter<string>();

  showOptions: boolean = false;

  onHover(isHovering: boolean): void {
    this.showOptions = isHovering;
  }

  onNameClick(): void {
    if (this.userMe) {
      this.profileClick.emit(this.userId);
    }
  }
}
