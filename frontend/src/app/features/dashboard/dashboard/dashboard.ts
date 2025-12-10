import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/store/auth/auth.store';
import { WalletStore } from '../../../core/store/wallet/wallet.store';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  authStore = inject(AuthStore);
  walletStore = inject(WalletStore);
  private router = inject(Router);

  showBalance = true;
  copied = false;

  quickActions = [
    { icon: 'fa-paper-plane', title: 'Send Money', route: '/wallet/send', color: 'primary' },
    { icon: 'fa-plus-circle', title: 'Add Money', route: '/wallet/add', color: 'secondary' },
    { icon: 'fa-chart-line', title: 'Analytics', route: '/wallet/analytics', color: 'accent' },
    { icon: 'fa-robot', title: 'AI Support', route: '/wallet/chat', color: 'info' }
  ];

  ngOnInit(): void {
    // Load wallet data
    this.walletStore.loadBalance();
    this.walletStore.loadTransactions({ page: 1, reset: true });
  }

  toggleBalanceVisibility(): void {
    this.showBalance = !this.showBalance;
  }

  copyAccountNumber(): void {
    const accountNumber = this.walletStore.accountNumber();
    navigator.clipboard.writeText(accountNumber).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }

  logout(): void {
    this.authStore.logout();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
