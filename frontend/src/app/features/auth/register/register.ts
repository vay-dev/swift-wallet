import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  registerForm!: FormGroup;
  isLoading = false;
  error: string | null = null;
  otpSent = false;

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      phone_number: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async requestOTP(): Promise<void> {
    if (this.registerForm.get('phone_number')?.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const response: any = await this.authService.requestSignupOTP({
        phone_number: this.registerForm.value.phone_number
      }).toPromise();

      this.otpSent = true;

      // Navigate to OTP verification with data (including OTP for demo)
      this.router.navigate(['/auth/verify-otp'], {
        state: {
          registerData: this.registerForm.value,
          otpCode: response.data?.otp_code  // Pass OTP from backend response
        }
      });
    } catch (err: any) {
      this.error = err.error?.message || 'Failed to send OTP';
    } finally {
      this.isLoading = false;
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.requestOTP();
    }
  }
}
