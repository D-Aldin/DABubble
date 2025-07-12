import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ɵEmptyOutletComponent } from '@angular/router';

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
    this.nameInput = this.name;
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
  }

  saveChanges() {
    this.name = this.nameInput;         // optional: update local value
    this.isEditing = false;
    this.save.emit(this.nameInput);     // emit to parent if needed
  }
}

// example how to implement this in other components whitout button

// <app-profile-card [src]="'./../../assets/images/profile-images/head-1.png'" [name]="'Aldin'" [active]="true" [email]="'aldin@gmail.com'">
// I have implemented ngcontent here so that a button can be used for the various profile cards
// </app-profile-card>

// example with button

// <app-profile-card [src]="'./../../assets/images/profile-images/head-1.png'" [name]="'Aldin'" [active]="true" [email]="'aldin@gmail.com'">
// <button>Nachricht</button>
// </app-profile-card>
//
