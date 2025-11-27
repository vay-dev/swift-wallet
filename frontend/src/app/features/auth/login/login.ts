import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth/auth.store';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authStore = inject(AuthStore);
  private authService = inject(AuthService);

  loginForm!: FormGroup;
  showPassword = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      phone_number: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const deviceId = this.authService.generateDeviceId();
      const deviceName = this.getDeviceName();

      this.authStore.login({
        ...this.loginForm.value,
        device_id: deviceId,
        device_name: deviceName
      });
    }
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome Browser';
    if (ua.includes('Firefox')) return 'Firefox Browser';
    if (ua.includes('Safari')) return 'Safari Browser';
    if (ua.includes('Edge')) return 'Edge Browser';
    return 'Web Browser';
  }
}
