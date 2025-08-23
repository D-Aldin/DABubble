import { Component } from '@angular/core';
import { InputFieldComponent } from '../../shared/input-field/input-field.component';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { SuccessToastComponent } from '../../shared/success-toast/success-toast.component';
import { Router, RouterModule } from '@angular/router';
import { avatarImgPaths, defaultAvatar } from './avatar-selection.config';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    InputFieldComponent,
    ReactiveFormsModule,
    CommonModule,
    HeaderComponent,
    SuccessToastComponent,
    RouterModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  form: any = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
  ]);
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  namePattern = /^[A-Za-zÄÖÜäöüß.,'\-]+(?:\s+[A-Za-zÄÖÜäöüß.,'\-]+)+$/;
  avatarImgPaths = avatarImgPaths;
  selectedAvatar: string = defaultAvatar;
  isButtonDisabled: boolean = true;
  registerFormStatus: boolean = false;
  showErrorToast: boolean = false;
  showSuccessToast: boolean = false;
  nameInput: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(this.namePattern),
          Validators.maxLength(20),
        ],
      ],
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      password: ['', Validators.required],
      privacy: [false, Validators.requiredTrue],
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

  nameValidation(): string {
    const control = this.form.get('name');
    if (control?.touched && control?.errors) {
      const errorKey = Object.keys(control.errors)[0];
      switch (errorKey) {
        case 'required':
          return 'Bitte geben Sie ihren Namen ein';
        case 'maxlength':
          return 'Name darf maximal 20 Satzzeichen lang sein';
        case 'pattern':
          return 'Namen eingeben, ohne Sonderzeichen';
        default:
          return '';
      }
    }
    return '';
  }

  emailValidation(): string {
    const control = this.form.get('email');
    if (control?.touched && control?.errors) {
      return '*Diese E-Mail ist leider ungültig.';
    }
    return '';
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
    this.validateButton();
  }

  validateButton(): void {
    this.isButtonDisabled = this.selectedAvatar === defaultAvatar;
  }

  toggleAvatarChoosing(): void {
    this.registerFormStatus = !this.registerFormStatus;
  }

  onRegister(): void {
    if (this.form.valid) {
      this.authService
        .register(this.form.value.email, this.form.value.password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          if (user.email)
            await this.userService.createUserDocument(
              user.uid,
              this.selectedAvatar,
              this.nameInput,
              user.email
            );
          this.showSuccessFeedback();
          this.proceedToLogin();
        })
        .catch((error) => {
          this.showErrorFeedback();
        });
    }
    this.form.reset();
  }

  showSuccessFeedback(): void {
    this.showSuccessToast = true;
    this.showErrorToast = false;
  }

  showErrorFeedback(): void {
    this.showSuccessToast = false;
    this.showErrorToast = true;
    this.toggleAvatarChoosing();
  }

  proceedToLogin(): void {
    setTimeout(() => {
      this.router.navigateByUrl('/login');
    }, 2000);
  }

  onNameChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.nameInput = inputElement.value;
  }
}
