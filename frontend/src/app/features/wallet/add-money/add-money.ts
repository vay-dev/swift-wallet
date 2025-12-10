import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WalletStore } from '../../../core/store/wallet/wallet.store';
import { WalletService } from '../../../core/services/wallet.service';
import { AddMoneyRequest } from '../../../core/models/wallet.model';

interface PaymentMethod {
  id: 'card' | 'bank_transfer' | 'bonus';
  name: string;
  icon: string;
  description: string;
  gradient: string;
}

@Component({
  selector: 'app-add-money',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-money.html',
  styleUrl: './add-money.scss',
})
export class AddMoney implements OnInit {
  walletStore = inject(WalletStore);
  walletService = inject(WalletService);
  router = inject(Router);

  isLoading = signal(false);
  showSuccess = signal(false);
  message = signal<{ type: 'success' | 'error', text: string } | null>(null);

  amount = signal('');
  selectedMethod = signal<'card' | 'bank_transfer' | 'bonus'>('card');
  description = signal('');

  presetAmounts = [50, 100, 500, 1000];

  paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Debit Card',
      icon: 'fa-credit-card',
      description: 'Add money using your card',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: 'fa-university',
      description: 'Transfer from your bank',
      gradient: 'linear-gradient(135deg, #4ECDC4 0%, #3DB8AF 100%)'
    },
    {
      id: 'bonus',
      name: 'Bonus Credit',
      icon: 'fa-gift',
      description: 'Use promotional credits',
      gradient: 'linear-gradient(135deg, #FF6B9D 0%, #E0567E 100%)'
    }
  ];

  ngOnInit(): void {
    this.walletStore.loadBalance();
  }

  selectPresetAmount(value: number): void {
    this.amount.set(value.toString());
  }

  selectPaymentMethod(methodId: 'card' | 'bank_transfer' | 'bonus'): void {
    this.selectedMethod.set(methodId);
  }

  isAmountValid(): boolean {
    const amt = parseFloat(this.amount());
    return !isNaN(amt) && amt > 0 && amt <= 10000;
  }

  addMoney(): void {
    if (!this.isAmountValid()) {
      this.showMessage('error', 'Please enter a valid amount between $1 and $10,000');
      return;
    }

    this.isLoading.set(true);

    const request: AddMoneyRequest = {
      amount: this.amount(),
      payment_method: this.selectedMethod(),
      description: this.description() || undefined
    };

    this.walletService.addMoney(request).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.isLoading.set(false);
          this.showSuccess.set(true);

          // Reload wallet balance
          this.walletStore.loadBalance();

          // Reset form after delay
          setTimeout(() => {
            this.showSuccess.set(false);
            this.amount.set('');
            this.description.set('');
          }, 3000);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.showMessage('error', error.error?.message || 'Failed to add money');
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private showMessage(type: 'success' | 'error', text: string): void {
    this.message.set({ type, text });
    setTimeout(() => this.message.set(null), 5000);
  }

  getSelectedMethodDetails(): PaymentMethod | undefined {
    return this.paymentMethods.find(m => m.id === this.selectedMethod());
  }
}
