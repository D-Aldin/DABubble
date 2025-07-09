import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss'
})
export class InputFieldComponent {
  @Input() src: string = '';             // icon path
  @Input() placeholder: string = '';     // placeholder text
  @Input() type: string = 'text';        // input type (text, email, etc.)
  @Input() formControl!: FormControl;    // reactive form binding
  @Input() name: string = '';            // name attribute
  @Input() required: boolean = true;    // HTML5 validation
  @Input() minlength?: number;
  @Input() maxlength?: number;
  @Input() autocomplete?: string;        // e.g. 'email', 'name'
  @Input() errorMsg: string = '';
}
