import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WalletStore } from '../../../core/store/wallet/wallet.store';
import { WalletService } from '../../../core/services/wallet.service';
import { Analytics } from '../../../core/models/wallet.model';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface DateRange {
  value: number;
  label: string;
}

@Component({
  selector: 'app-analytics',
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AnalyticsComponent implements OnInit {
  walletStore = inject(WalletStore);
  walletService = inject(WalletService);
  router = inject(Router);

  // Expose Math for template
  Math = Math;

  isLoading = signal(true);
  analyticsData = signal<Analytics | null>(null);
  selectedDays = signal(7);

  dateRanges: DateRange[] = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' }
  ];

  // Mock category data (in production, this would come from the backend)
  categories = signal<CategoryData[]>([
    {
      name: 'Food & Dining',
      amount: 450.50,
      percentage: 35,
      color: '#FF6B9D',
      icon: 'fa-utensils'
    },
    {
      name: 'Shopping',
      amount: 320.00,
      percentage: 25,
      color: '#6C63FF',
      icon: 'fa-shopping-bag'
    },
    {
      name: 'Transportation',
      amount: 180.75,
      percentage: 14,
      color: '#4ECDC4',
      icon: 'fa-car'
    },
    {
      name: 'Entertainment',
      amount: 150.00,
      percentage: 12,
      color: '#F59E0B',
      icon: 'fa-film'
    },
    {
      name: 'Bills & Utilities',
      amount: 180.25,
      percentage: 14,
      color: '#10B981',
      icon: 'fa-file-invoice-dollar'
    }
  ]);

  // Computed values
  totalIncome = computed(() => {
    const data = this.analyticsData();
    return data ? parseFloat(data.summary.total_credits) : 0;
  });

  totalExpenses = computed(() => {
    const data = this.analyticsData();
    return data ? parseFloat(data.summary.total_debits) : 0;
  });

  netBalance = computed(() => {
    return this.totalIncome() - this.totalExpenses();
  });

  transactionCount = computed(() => {
    const data = this.analyticsData();
    return data ? data.summary.total_transactions : 0;
  });

  // Recent large transactions (mock data)
  largeTransactions = signal([
    {
      title: 'Amazon Purchase',
      amount: -125.99,
      date: '2024-01-15',
      category: 'Shopping',
      icon: 'fa-shopping-cart',
      color: '#6C63FF'
    },
    {
      title: 'Salary Deposit',
      amount: 2500.00,
      date: '2024-01-14',
      category: 'Income',
      icon: 'fa-money-bill-wave',
      color: '#10B981'
    },
    {
      title: 'Restaurant',
      amount: -85.50,
      date: '2024-01-13',
      category: 'Food',
      icon: 'fa-utensils',
      color: '#FF6B9D'
    }
  ]);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading.set(true);

    this.walletService.getAnalytics(this.selectedDays()).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.analyticsData.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load analytics:', error);
        this.isLoading.set(false);
      }
    });
  }

  selectDateRange(days: number): void {
    this.selectedDays.set(days);
    this.loadAnalytics();
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getBarHeight(percentage: number): string {
    return `${percentage}%`;
  }
}
