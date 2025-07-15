import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from '../../core/services/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MessageFieldComponent } from '../../shared/message-field/message-field.component';

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule, MessageFieldComponent],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  selectedUser: any = null;
  private subscription?: Subscription;

  constructor(private sharedService: SharedService) {}

  ngOnInit() {
    this.sharedService.sharedData$.subscribe((user) => {
      if (user) {
        this.selectedUser = user;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
