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
  searchResults: typeof this.users = [];
  selectedUserObjects: typeof this.users = [];

   constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAllUsers().subscribe(users => {
      this.users = users;
      this.filteredUsers = users;
    });
  }

  onSearchTermChange() {
    const term = this.searchTerm.trim().toLowerCase();
    this.searchResults = this.users
      .filter(user =>
        user.name.toLowerCase().includes(term) &&
        !this.selectedUserObjects.some(u => u.id === user.id)
      )
      .slice(0, 5); // limit result length
  }
  
  selectUser(user: { id: string; name: string; avatarPath: string }) {
    this.selectedUserObjects.push(user);
    this.selectedUsers.push(user.id);
    this.searchTerm = '';
    this.searchResults = [];
  }

  removeUser(userId: string) {
    this.selectedUserObjects = this.selectedUserObjects.filter(u => u.id !== userId);
    this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
  }

  finish() {
    if (this.addAllMembers) {
      this.confirm.emit(['ALL']);
    } else {
      this.confirm.emit(this.selectedUsers); 
    }
  }

  cancelDialog() {
    this.cancel.emit();
  }
}
