import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';

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
  users: { id: string, avatarPath: string, name: string }[] = [];
  filteredUsers: typeof this.users = [];
  
  addAllMembers = true;
  selectedUsers: string[] = [];
  searchTerm = '';

   constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAllUsers().subscribe(users => {
      this.users = users;
      this.filteredUsers = users;
    });
  }

  onUserSelectionChange(userId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    }
  }

  onSearchTermChange() {
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

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
