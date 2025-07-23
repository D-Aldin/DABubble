import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddPeopleComponent } from './add-people/add-people.component';
import { InputFieldComponent } from '../input-field/input-field.component';
import { getDocs, collection, query, where } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';


@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, AddPeopleComponent, InputFieldComponent, ReactiveFormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss'
})
export class AddChannelComponent {
  @Input() channelName: string = ''; // This is required to receive the input from parent
  @Output() close = new EventEmitter<void>();
  @Output() complete = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() openAddPeopleDialog = new EventEmitter<void>();
  @Output() proceedToPeople = new EventEmitter<{ name: string; description: string }>();
  @Output() confirm = new EventEmitter<{ title: string; description: string }>();
  channelDescription = '';
  showPeopleStep = false;
  form: FormGroup;

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.form = this.fb.group({
  channelname: ['', {
    validators: [Validators.required, Validators.minLength(4)],
    asyncValidators: [this.channelNameTakenValidator.bind(this)],
    updateOn: 'blur' // validation runs when user finishes typing or leaves input
  }],
  channeldescription: [''],
});

  }

  proceedToAddPeople() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.proceedToPeople.emit({
      name: this.form.value.channelname,
      description: this.form.value.channeldescription
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

  channelNameValidation(): string {
    const control = this.form.get('channelname');
    if (control?.touched && control?.errors) {
      if (control.errors['minlength']) {
        return 'Der Name muss mindestens 4 Zeichen beinhalten';
      }
      if (control.errors['required']) {
        return 'Bitte geben Sie einen Namen ein.';
      }
      if (control.errors['duplicate']) {
        return 'Ein Channel mit diesem Namen existiert bereits. Bitte wählen Sie einen anderen.';
      }
    }
    return '';
  }

  async channelNameTakenValidator(control: FormControl) {
    const name = control.value.trim();
    if (!name) return Promise.resolve(null);

    const q = query(collection(this.firestore, 'channels'), where('title', '==', name));

    return getDocs(q).then(snapshot => {
      return snapshot.empty ? null : { duplicate: true };
    });
  }

}