import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash').then(m => m.Splash)
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
      },
      {
        path: 'verify-otp',
        loadComponent: () => import('./features/auth/otp-verification/otp-verification').then(m => m.OtpVerification)
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'wallet',
    canActivate: [authGuard],
    children: [
      {
        path: 'send',
        loadComponent: () => import('./features/wallet/send-money/send-money').then(m => m.SendMoney)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/wallet/ai-chat/ai-chat').then(m => m.AiChat)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/splash'
  }
];
