import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent {
  @Input({ required: true }) src!: string;
  @Input({ required: true }) userName!: string;
  @Input({ required: true }) time!: string;
  @Input({ required: true }) message!: string;

  userMe: boolean = true;
}
