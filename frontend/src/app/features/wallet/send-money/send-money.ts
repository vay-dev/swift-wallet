import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WalletStore } from '../../../core/store/wallet/wallet.store';

@Component({
  selector: 'app-send-money',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './send-money.html',
  styleUrl: './send-money.scss',
})
export class SendMoney implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  walletStore = inject(WalletStore);

  sendForm!: FormGroup;
  showPinInput = false;
  successMessage: string | null = null;

  ngOnInit(): void {
    this.sendForm = this.fb.group({
      recipient_phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      narration: [''],
      transaction_pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });
  }

  onSubmit(): void {
    if (this.sendForm.valid) {
      this.walletStore.sendMoney(this.sendForm.value);

      // Listen for success
      setTimeout(() => {
        if (!this.walletStore.error()) {
          this.successMessage = 'Money sent successfully!';
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        }
      }, 1000);
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
