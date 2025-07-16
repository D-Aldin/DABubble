import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LegalNoticeComponent } from './pages/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { authGuard } from './core/guards/auth.guard';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ResetRequestComponent } from './pages/reset-request/reset-request.component';
import { DirectMessageComponent } from './pages/direct-message/direct-message.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'reset-request', component: ResetRequestComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'direct-message',
        component: DirectMessageComponent,
      },
      // {
      //   path: 'dashboard/channel/:id',
      //   component: ChannelComponent
      // }
      // Create route for channel showing as defined above with direct-message
    ],
  },
  { path: 'register', component: RegisterComponent },
  { path: 'legal-notice', component: LegalNoticeComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: '**', component: LoginComponent },
];
