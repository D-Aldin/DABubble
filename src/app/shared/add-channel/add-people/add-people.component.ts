import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-people',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-people.component.html',
  styleUrl: './add-people.component.scss'
})
export class AddPeopleComponent {
  @Input() channelName!: string;
  @Output() complete = new EventEmitter<any>();
  @Output() confirm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  
  addAllMembers = true;
  selectedUsers: string[] = [];
  searchTerm = '';

  finish() {
    if (this.addAllMembers) {
      this.confirm.emit(['ALL']);
    } else {
      this.confirm.emit(this.selectedUsers); // or [this.searchTerm] if only one user
    }
  }

  cancelDialog() {
    this.cancel.emit();
  }
}
