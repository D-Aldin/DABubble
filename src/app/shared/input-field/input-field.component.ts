import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ]
})
export class InputFieldComponent {
  @Input() src: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() errorMsg: string | null = '';
  @Input() name?: string;
  @Input() required: boolean = true;
  @Input() minlength?: number;
  @Input() maxlength?: number;
  @Input() autocomplete?: string;
  @Input() ngModel: string = '';
  @Output() input = new EventEmitter<Event>();
  @Output() focus = new EventEmitter<FocusEvent>();
  @Output() blur = new EventEmitter<FocusEvent>();
  @Output() ngModelChange = new EventEmitter<string>();
  value: string = '';
  isDisabled: boolean = false;
  onChange = (_: any) => { };
  onTouched = () => { };

  writeValue(val: any): void {
    this.ngModel = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
