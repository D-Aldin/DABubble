import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedService } from '../../core/services/shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MessageFieldComponent } from '../../shared/message-field/message-field.component';
import { SpinnerComponent } from "../../shared/spinner/spinner.component";

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule, MessageFieldComponent, SpinnerComponent],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  selectedUser: any = null;
  hasSelectedUser: boolean = false;
  private subscription?: Subscription;

  constructor(private sharedService: SharedService) { }

  ngOnInit() {
    this.sharedService.sharedData$.subscribe((user) => {
      if (user) {
        this.hasSelectedUser = true;
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
