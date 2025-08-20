import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AddPeopleComponent } from './add-people/add-people.component';
import { InputFieldComponent } from '../input-field/input-field.component';
import { getDocs, collection, query, where } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddPeopleComponent,
    InputFieldComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {
  @Input() channelName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() complete = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() openAddPeopleDialog = new EventEmitter<void>();
  @Output() proceedToPeople = new EventEmitter<{
    name: string;
    description: string;
  }>();
  @Output() confirm = new EventEmitter<{
    title: string;
    description: string;
  }>();
  channelDescription = '';
  showPeopleStep = false;
  form: FormGroup;

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.form = this.fb.group({
      channelname: [
        '',
        {
          validators: [Validators.required, Validators.minLength(4)],
          asyncValidators: [this.channelNameTakenValidator.bind(this)],
          updateOn: 'blur',
        },
      ],
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
      description: this.form.value.channeldescription,
    });
  }

  handlePeopleAdded(event: any) {
    this.close.emit();
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
      const errorKey = Object.keys(control.errors)[0];
      switch (errorKey) {
        case 'minlength':
          return 'Der Name muss mindestens 4 Zeichen beinhalten';
        case 'required':
          return 'Bitte geben Sie einen Namen ein.';
        case 'duplicate':
          return 'Ein Channel mit diesem Namen existiert bereits. Bitte wählen Sie einen anderen.';
        default:
          return '';
      }
    }
    return '';
  }

  async channelNameTakenValidator(control: FormControl) {
    const name = control.value.trim().toLowerCase();
    if (!name) return Promise.resolve(null);
    const q = query(collection(this.firestore, 'channels'));
    const snapshot = await getDocs(q);
    const exists = snapshot.docs.some((doc) => {
      const title = (doc.data()['title'] as string)?.toLowerCase();
      return title === name;
    });
    return exists ? { duplicate: true } : null;
  }
}
