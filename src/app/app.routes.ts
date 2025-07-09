import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LegalNoticeComponent } from './pages/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';

export const routes: Routes = [
    { path: '', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'legal-notice', component: LegalNoticeComponent }, 
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: '**', component: LoginComponent }
];