import { Component, OnInit } from '@angular/core';
import { InputFieldComponent } from "../../shared/input-field/input-field.component";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { HeaderComponent } from "../../shared/header/header.component";
import { passwordMatchValidator } from './password-match.validator';
import { SuccessToastComponent } from "../../shared/success-toast/success-toast.component";
import { CommonModule } from '@angular/common';
import { getAuth, confirmPasswordReset } from 'firebase/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [InputFieldComponent, ReactiveFormsModule, RouterModule, HeaderComponent, SuccessToastComponent, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  form: any = new FormControl('', [Validators.required, Validators.minLength(2)]);
  passwordValidator = passwordMatchValidator;
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;
  oobCode: string = '';
  oobCodeError: string = '';
  passwordResetSuccess: boolean = false;

  actionCodeSettings: object = {
    url: 'http://localhost:4200/reset-password', //will be changed when uploaded on FTP
    handleCodeInApp: true,
  };

  constructor(private fb: FormBuilder, private authService: AuthService, private userService: UserService, private router: Router, private route: ActivatedRoute) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordMatchValidator() });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.oobCode = params['oobCode'];
      if (!this.oobCode) {
        this.oobCodeError = 'Invalid or missing code.';
      }
    });
  }

  resetPassword(newPassword: string): void {
    if (!this.oobCode) {
      this.oobCodeError = 'Reset code not found.';
      return;
    }

    const auth = getAuth();
    confirmPasswordReset(auth, this.oobCode, newPassword)
      .then(() => {
        this.passwordResetSuccess = true;
        this.oobCodeError = '';
      })
      .catch((error) => {
        this.passwordResetSuccess = false;
        this.oobCodeError = error.message;
      });
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
      this.resetPassword(this.form.value.password)
      console.log(this.form.value.password);
    } else {
      return
    }
  }
}
