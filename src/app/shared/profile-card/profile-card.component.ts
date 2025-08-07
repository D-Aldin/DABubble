import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ɵEmptyOutletComponent } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
})
export class ProfileCardComponent {
  isEditing = false;
  nameInput = '';
  isCurrentUserAllowedToEditName: boolean = false;
  showGuestEditWarning: boolean = false;


  constructor(private authService: AuthService, private userService: UserService) { }

  @Input({ required: true }) src!: string;
  @Input({ required: true }) name!: string;
  @Input({ required: true }) active: boolean = false;
  @Input({ required: true }) email!: string;
  @Input() isInsertedInHeader: boolean = false; // dont set this to true when using profile-card not in header. Its already default false

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();
  @Output() closeCard = new EventEmitter<void>();

  onClose() { //closes the player-card on close button click
    this.closeCard.emit();
  }

  startEdit() {
    if (this.isCurrentUserAllowedToEditName) {
      this.nameInput = this.name;
      this.isEditing = true;
    }
  }

  cancelEdit() {
    this.isEditing = false;
  }

  saveChanges() {
    this.name = this.nameInput;
    this.isEditing = false;
    this.save.emit(this.nameInput);
  }

  checkIfLoggedInUserIsGuest() {
    const currentUserId = this.authService.getCurrentUser();

  }

  handleGuestEditAttempt(): void {
    if (!this.isCurrentUserAllowedToEditName) {
      this.showGuestEditWarning = true;
      setTimeout(() => {
        this.showGuestEditWarning = false;
      }, 2500);
    }
  }

  handleHover(isEntering: boolean): void {
    if (!this.isCurrentUserAllowedToEditName && isEntering) {
      this.showGuestEditWarning = true;
    } else if (!isEntering) {
      this.showGuestEditWarning = false;
    }
  }
}