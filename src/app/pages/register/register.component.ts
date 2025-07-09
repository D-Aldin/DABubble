import { Component } from '@angular/core';
import { InputFieldComponent } from '../../shared/input-field/input-field.component';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [InputFieldComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form: any = new FormControl('', [Validators.required, Validators.minLength(2)]);;
}
