import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/store/auth/auth.store';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-otp-verification',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './otp-verification.html',
  styleUrl: './otp-verification.scss',
})
export class OtpVerification implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authStore = inject(AuthStore);
  private authService = inject(AuthService);

  otpForm!: FormGroup;
  registerData: any;
  countdown = 60;
  canResend = false;
  private countdownInterval: any;

  ngOnInit(): void {
    // Get registration data from router state
    const navigation = this.router.getCurrentNavigation();
    this.registerData = navigation?.extras.state?.['registerData'] || history.state?.registerData;
    const otpCode = navigation?.extras.state?.['otpCode'] || history.state?.otpCode;

    if (!this.registerData) {
      this.router.navigate(['/auth/register']);
      return;
    }

    this.otpForm = this.fb.group({
      otp_code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    });

    // FOR DEMO: Show OTP in console
    if (otpCode) {
      console.log('🔐 OTP Code (Demo Mode):', otpCode);
      console.log('📱 Enter this code:', otpCode);
    }

    this.startCountdown();
  }

  startCountdown(): void {
    this.canResend = false;
    this.countdown = 60;

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        this.canResend = true;
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  async resendOTP(): Promise<void> {
    if (!this.canResend) return;

    try {
      await this.authService.requestSignupOTP({
        phone_number: this.registerData.phone_number
      }).toPromise();
      this.startCountdown();
    } catch (err) {
      console.error('Failed to resend OTP', err);
    }
  }

  onSubmit(): void {
    if (this.otpForm.valid && this.registerData) {
      const deviceId = this.authService.generateDeviceId();
      const deviceName = this.getDeviceName();

      this.authStore.signup({
        phone_number: this.registerData.phone_number,
        otp_code: this.otpForm.value.otp_code,
        password: this.registerData.password,
        full_name: this.registerData.full_name,
        email: this.registerData.email,
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

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
