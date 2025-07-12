import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, formatCurrency } from '@angular/common';
import { InputFieldComponent } from '../../shared/input-field/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SuccessToastComponent } from "../../shared/success-toast/success-toast.component";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [HeaderComponent, ReactiveFormsModule, CommonModule, InputFieldComponent, RouterModule, SuccessToastComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm!: FormGroup;
  showErrorToast: boolean = false;
  showSuccessToast: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      //Handle login logic
    }
  }

  onGuestLogin(): void {
    //Handle guest login logic
  }

  onGoogleLogin(): void {
    //Handle Google Auth login
  }

  emailValidation(): string {
    const emailCtrl = this.loginForm.get('email');
    if (emailCtrl?.touched || emailCtrl?.dirty) {
      if (emailCtrl.hasError('required')) return 'E-Mail ist erforderlich';
      if (emailCtrl.hasError('email')) return 'Ungültige E-Mail-Adresse';
    }
    return '';
  }

  passwordValidation(): string {
    const passCtrl = this.loginForm.get('password');
    if (passCtrl?.touched || passCtrl?.dirty) {
      if (passCtrl.hasError('required')) return 'Passwort ist erforderlich';
      if (passCtrl.hasError('minlength')) return 'Mindestens 8 Zeichen';
    }
    return '';
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value.email, this.loginForm.value.password)
        .then(async userCredential => {
          this.showSuccessFeedback()
          this.proceedToDashboard()
        })
        .catch(error => {
          this.showErrorFeedback()
        });
    }
    this.loginForm.reset();
  }

  showSuccessFeedback(): void {
    this.showSuccessToast = true;
    this.showErrorToast = false;
  }

  showErrorFeedback(): void {
    this.showSuccessToast = false;
    this.showErrorToast = true;
  }

  proceedToDashboard(): void {
    setTimeout(() => {
      this.router.navigateByUrl('/dashboard')
    }, 2000);
  }
}
