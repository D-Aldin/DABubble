import { Component } from '@angular/core';
import { HeaderComponent } from "../../shared/header/header.component";
import { InputFieldComponent } from "../../shared/input-field/input-field.component";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { SuccessToastComponent } from "../../shared/success-toast/success-toast.component";
import { CommonModule } from '@angular/common';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-reset-request',
  standalone: true,
  imports: [HeaderComponent, InputFieldComponent, RouterLink, ReactiveFormsModule, SuccessToastComponent, CommonModule],
  templateUrl: './reset-request.component.html',
  styleUrl: './reset-request.component.scss'
})
export class ResetRequestComponent {
  form: any = new FormControl('', [Validators.required, Validators.minLength(2)]);
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  showErrorToast: boolean = false;
  showSuccessToast: boolean = false;
  errorMsg: string = 'Diese E-mail ist nicht registriert!';

  constructor(private fb: FormBuilder, private authService: AuthService, private userService: UserService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
    });
  }

  emailValidation(): string {
    const control = this.form.get('email');

    if (control?.touched && control?.errors) {
      return '*Diese E-Mail-Adresse ist leider ungültig.'
    }

    return '';
  }

  sendResetEmail(): void {
    if (this.ifFormValid()) {
      const email = this.form.value.email;
      this.authService.requestPasswordReset(email).then(() => {
        this.showSuccessToast = true;
        this.form.reset();
      }).catch((error) => {
        this.errorMsg = 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.';
      });
    }
  }

  ifFormValid(): boolean {
    if (!this.form.valid) {
      this.showErrorToast = true;
      return false
    }
    return true
  }
}
