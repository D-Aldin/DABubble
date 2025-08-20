import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ɵEmptyOutletComponent } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { avatarImgPaths } from '../../pages/register/avatar-selection.config';
import { ChatUser } from '../../core/interfaces/chat-user';
import { Observable } from 'rxjs';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
})
export class ProfileCardComponent implements OnInit {
  isEditing: boolean = false;
  nameInput: string = '';
  isCurrentUserAllowedToEditName: boolean = false;
  showGuestEditWarning: boolean = false;
  avatarImgPaths = avatarImgPaths;
  editAvatarActive = false;
  private readonly parentHeader = inject(HeaderComponent, { optional: true });

  @Input({ required: true }) src!: string;
  @Input({ required: true }) name!: string;
  @Input({ required: true }) active: boolean = false;
  @Input({ required: true }) email!: string;
  @Input() isInsertedInHeader: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();
  @Output() closeCard = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.checkIfLoggedInUserIsGuest();
  }

  onClose() {
    this.closeCard.emit();
  }

  shouldShowEditAvatar(): boolean {
    return !!this.parentHeader;
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

  checkIfLoggedInUserIsGuest(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.uid) {
      this.userService.getUserById(currentUser.uid).subscribe((userDoc) => {
        if (userDoc?.name?.includes('Guest')) {
          this.isCurrentUserAllowedToEditName = false;
        } else {
          this.isCurrentUserAllowedToEditName = true;
        }
      });
    }
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

  changeAvatar(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    const newAvatarPath = imgElement.getAttribute('src') || '';
    const currentUser = this.authService.getCurrentUser()?.uid;

    if (currentUser) {
      this.userService
        .updateUserAvatar(currentUser, newAvatarPath)
        .catch((err) => console.error('Error updating avatar:', err));
    }
  }

  toggleEditAvatar() {
    if (
      this.editAvatarActive === false &&
      this.authService.getCurrentUser()?.email === this.email
    ) {
      this.editAvatarActive = true;
    } else {
      this.editAvatarActive = false;
    }
  }
}
