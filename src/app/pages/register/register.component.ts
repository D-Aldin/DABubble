import { Component } from '@angular/core';
import { InputFieldComponent } from '../../shared/input-field/input-field.component';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "../../shared/header/header.component";
import { SuccessToastComponent } from "../../shared/success-toast/success-toast.component";
import { RouterModule } from '@angular/router';
import { avatarImgPaths, defaultAvatar } from './avatar-selection.config';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [InputFieldComponent, ReactiveFormsModule, CommonModule, HeaderComponent, SuccessToastComponent, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form: any = new FormControl('', [Validators.required, Validators.minLength(2)]);
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  namePattern = /^[A-Za-zÄÖÜäöüß.,'\-]+(?:\s+[A-Za-zÄÖÜäöüß.,'\-]+)+$/;
  avatarImgPaths = avatarImgPaths;
  selectedAvatar: string = defaultAvatar;
  isButtonDisabled: boolean = true;
  registerFormStatus: boolean = false;
  registerCompletionStatus: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private userService: UserService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(this.namePattern), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      password: ['', Validators.required],
      privacy: [false, Validators.requiredTrue]
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
      if (control.errors['required']) {
        return 'Bitte geben Sie ihren Namen ein';
      }

      if (control.errors['maxlength']) {
        return 'Name darf maximal 20 Satzzeichen lang sein';
      }

      if (control.errors['pattern']) {
        return 'Bitte geben Sie ein Vor- und Nachnamen ein';
      }
    }

    return '';
  }

  emailValidation(): string {
    const control = this.form.get('email');

    if (control?.touched && control?.errors) {
      return '*Diese E-Mail-Adresse ist leider ungültig.'
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

  proceedToAvatarChoosing(): void {
    this.registerFormStatus = !this.registerFormStatus;
  }

  onRegister(): void {
    if (this.form.valid) {
      this.authService.register(this.form.value.email, this.form.value.password)
        .then(async userCredential => {
          const user = userCredential.user;
          console.log('Registrierung erfolgreich:', user.uid);
          await this.userService.createUserDocument(user.uid, this.selectedAvatar);
        })
        .catch(error => {
          console.error('Registrierung fehlgeschlagen:', error.message);
        });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
