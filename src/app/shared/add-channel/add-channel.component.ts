import { Component, EventEmitter, Output, Input, OnInit  } from '@angular/core';
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
  @Output() proceedToPeople = new EventEmitter<{ name: string; description: string }>();

   proceedToAddPeople() {
    this.proceedToPeople.emit({
      name: this.channelName,
      description: this.channelDescription
    });
  }

   handlePeopleAdded(event: any) {
    console.log('Users added:', event);
    this.close.emit(); // Close the whole dialog after final step
  }

  cancelAddPeople() {
    this.showPeopleStep = false;
  }

  closeDialog() {
    this.close.emit();
  }

}
