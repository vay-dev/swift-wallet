import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WalletStore } from '../../../core/store/wallet/wallet.store';
import { Transaction } from '../../../core/models/wallet.model';

type FilterType = 'all' | 'credit' | 'debit' | 'bills';

@Component({
  selector: 'app-transaction-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.scss',
})
export class TransactionHistory implements OnInit {
  walletStore = inject(WalletStore);
  router = inject(Router);

  filterType = signal<FilterType>('all');
  searchQuery = signal('');
  isRefreshing = signal(false);
  currentPage = signal(1);

  ngOnInit(): void {
    this.loadTransactions(true);
  }

  loadTransactions(reset: boolean = false): void {
    const page = reset ? 1 : this.currentPage() + 1;
    this.walletStore.loadTransactions({ page, reset });
    if (!reset) {
      this.currentPage.set(page);
    }
  }

  filterTransactions(type: FilterType): void {
    this.filterType.set(type);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  get filteredTransactions(): Transaction[] {
    let transactions = this.walletStore.transactions();

    // Filter by type
    const filter = this.filterType();
    if (filter === 'credit' || filter === 'debit') {
      transactions = transactions.filter(tx => tx.transaction_type === filter);
    } else if (filter === 'bills') {
      // Filter for bill payments (you can adjust this logic based on your narration patterns)
      transactions = transactions.filter(tx =>
        tx.narration?.toLowerCase().includes('bill') ||
        tx.narration?.toLowerCase().includes('airtime') ||
        tx.narration?.toLowerCase().includes('data') ||
        tx.narration?.toLowerCase().includes('electricity') ||
        tx.narration?.toLowerCase().includes('cable')
      );
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      transactions = transactions.filter(tx =>
        tx.reference.toLowerCase().includes(query) ||
        tx.recipient_phone?.toLowerCase().includes(query) ||
        tx.sender_phone?.toLowerCase().includes(query) ||
        tx.narration?.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query)
      );
    }

    return transactions;
  }

  async pullToRefresh(): Promise<void> {
    this.isRefreshing.set(true);
    this.currentPage.set(1);
    this.loadTransactions(true);

    // Simulate pull to refresh delay
    setTimeout(() => {
      this.isRefreshing.set(false);
    }, 1000);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    // Infinite scroll logic
    const scrollPosition = window.innerHeight + window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;

    // Load more when user is 200px from bottom
    if (scrollPosition >= scrollHeight - 200) {
      if (!this.walletStore.transactionLoading() && this.walletStore.hasMore()) {
        this.loadTransactions(false);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getTransactionIcon(tx: Transaction): string {
    if (tx.transaction_type === 'credit') {
      return 'fa-arrow-down';
    }

    // Check if it's a bill payment based on narration
    const narration = tx.narration?.toLowerCase() || '';
    if (narration.includes('airtime')) return 'fa-mobile-alt';
    if (narration.includes('data')) return 'fa-wifi';
    if (narration.includes('electricity')) return 'fa-bolt';
    if (narration.includes('cable')) return 'fa-tv';
    if (narration.includes('bill')) return 'fa-file-invoice-dollar';

    return 'fa-arrow-up';
  }

  getTransactionTitle(tx: Transaction): string {
    const narration = tx.narration;

    if (narration) {
      return narration;
    }

    if (tx.transaction_type === 'credit') {
      return tx.sender_phone ? `Received from ${tx.sender_phone}` : 'Money Received';
    } else {
      return tx.recipient_phone ? `Sent to ${tx.recipient_phone}` : 'Money Sent';
    }
  }

  getTransactionColor(tx: Transaction): string {
    const narration = tx.narration?.toLowerCase() || '';

    if (narration.includes('airtime') || narration.includes('data')) return '#6C63FF';
    if (narration.includes('electricity')) return '#F59E0B';
    if (narration.includes('cable') || narration.includes('tv')) return '#8B5CF6';
    if (narration.includes('bill')) return '#3B82F6';

    if (tx.transaction_type === 'credit') return 'var(--success)';
    return 'var(--error)';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}
