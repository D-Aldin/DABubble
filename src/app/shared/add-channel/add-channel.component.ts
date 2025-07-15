import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddPeopleComponent } from './add-people/add-people.component';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, AddPeopleComponent],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss'
})
export class AddChannelComponent {
  @Output() close = new EventEmitter<void>();
  @Input() channelName: string = ''; // This is required to receive the input from parent
  @Output() complete = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() openAddPeopleDialog = new EventEmitter<void>();
  channelDescription = '';
  showPeopleStep = false;

   proceedToAddPeople() {
  this.openAddPeopleDialog.emit(); // Close current and open people-dialog
}

   handlePeopleAdded(event: any) {
    console.log('Users added:', event);
    this.close.emit(); // Close the whole dialog after final step
  }

  cancelAddPeople() {
    this.showPeopleStep = false;
  }

  createChannel() {
    console.log('Channel Name:', this.channelName);
    console.log('Description:', this.channelDescription);
    // TODO: add Firebase logic later
  }

  closeDialog() {
    this.close.emit();
  }

}
