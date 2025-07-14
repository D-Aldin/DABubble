import { Component } from '@angular/core';
import { InputFieldComponent } from "../../shared/input-field/input-field.component";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { HeaderComponent } from "../../shared/header/header.component";
import { passwordMatchValidator } from './password-match.validator';
import { SuccessToastComponent } from "../../shared/success-toast/success-toast.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [InputFieldComponent, ReactiveFormsModule, RouterModule, HeaderComponent, SuccessToastComponent, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  form: any = new FormControl('', [Validators.required, Validators.minLength(2)]);
  passwordValidator = passwordMatchValidator;
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private userService: UserService, private router: Router) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordMatchValidator() });
  }

  passwordValidation(): string {
    const control = this.form.get('password');

    if (control?.touched && control?.errors) {
      if (control.errors['minlength']) {
        return 'Mindestens 8 Zeichen eingeben';
      }

      if (control.errors['required']) {
        return 'Bitte geben Sie ein Passwort ein.';
      }
    }
    return '';
  }

  confirmPasswordValidation(): string {
    const confirmControl = this.form.get('confirmPassword');
    const hasGroupError = this.form.errors?.['passwordsMismatch'];
    if (confirmControl?.touched || confirmControl?.dirty) {
      if (confirmControl.errors?.['required']) {
        return 'Bitte bestätigen Sie Ihr Passwort.';
      }
      if (hasGroupError) {
        return 'Passwort stimmt nicht überein!';
      }
    }
    return '';
  }

  changePassword(): void {
    if (this.confirmPasswordValidation() == '') {
      console.log('changed');
      this.setNewPasswordInFirebase()
    } else {
      return
    }
  }

  setNewPasswordInFirebase() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return
    } else {
      this.authService.updatePassword(currentUser, this.form.value.password)
        .then(() => {
          this.showSuccessToast = true;
        })
        .catch((error) => {
          this.showErrorToast = true;
        });
    }
  }
}
