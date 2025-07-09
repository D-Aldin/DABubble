import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  @Input() errorMsg: string = '';
  @Input() name?: string;
  @Input() required: boolean = true;
  @Input() minlength?: number;
  @Input() maxlength?: number;
  @Input() autocomplete?: string;

  value: string = '';
  isDisabled: boolean = false;

  onChange = (_: any) => { };
  onTouched = () => { };

  writeValue(val: any): void {
    this.value = val;
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
