import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { inject } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { DatabaseService } from '../../services/db.service';
import { Wallet, Transaction, SendMoneyRequest, Beneficiary } from '../../models/wallet.model';

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  isLoading: boolean;
  error: string | null;
  transactionLoading: boolean;
  currentPage: number;
  hasMore: boolean;
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  beneficiaries: [],
  isLoading: false,
  error: null,
  transactionLoading: false,
  currentPage: 1,
  hasMore: true
};

export const WalletStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ wallet, transactions }) => ({
    balance: computed(() => wallet()?.balance ?? '0.00'),
    currency: computed(() => wallet()?.currency ?? 'USD'),
    accountNumber: computed(() => wallet()?.account_number ?? ''),
    recentTransactions: computed(() => transactions().slice(0, 5)),
    transactionCount: computed(() => transactions().length)
  })),
  withMethods((
    store,
    walletService = inject(WalletService),
    dbService = inject(DatabaseService)
  ) => ({
    // Load wallet balance
    loadBalance: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          walletService.getBalance().pipe(
            tap(async (response) => {
              if (response.status === 'success') {
                const wallet = response.data;
                patchState(store, { wallet, isLoading: false });

                // Cache in IndexedDB
                await dbService.saveWallet(wallet);
              }
            }),
            catchError(async (error) => {
              // Try to load from IndexedDB on error
              const cachedWallet = await dbService.getWallet();
              if (cachedWallet) {
                patchState(store, { wallet: cachedWallet, isLoading: false });
              } else {
                patchState(store, {
                  isLoading: false,
                  error: error.error?.message || 'Failed to load wallet'
                });
              }
              return of(null);
            })
          )
        )
      )
    ),

    // Load transactions
    loadTransactions: rxMethod<{ page?: number; reset?: boolean }>(
      pipe(
        tap(() => patchState(store, { transactionLoading: true, error: null })),
        switchMap(({ page = 1, reset = false }) =>
          walletService.getTransactionHistory({ page, page_size: 20 }).pipe(
            tap(async (response) => {
              const newTransactions = reset
                ? response.results
                : [...store.transactions(), ...response.results];

              patchState(store, {
                transactions: newTransactions,
                transactionLoading: false,
                currentPage: page,
                hasMore: !!response.next
              });

              // Cache in IndexedDB
              await dbService.saveTransactions(newTransactions);
            }),
            catchError(async (error) => {
              // Try to load from IndexedDB on error
              const cachedTransactions = await dbService.getTransactions();
              if (cachedTransactions.length > 0) {
                patchState(store, {
                  transactions: cachedTransactions,
                  transactionLoading: false
                });
              } else {
                patchState(store, {
                  transactionLoading: false,
                  error: error.error?.message || 'Failed to load transactions'
                });
              }
              return of(null);
            })
          )
        )
      )
    ),

    // Send money
    sendMoney: rxMethod<SendMoneyRequest>(
      pipe(
        tap(() => patchState(store, { transactionLoading: true, error: null })),
        switchMap((data) =>
          walletService.sendMoney(data).pipe(
            tap(async (response) => {
              if (response.status === 'success') {
                patchState(store, { transactionLoading: false });

                // Reload wallet balance
                const balanceResponse = await walletService.getBalance().toPromise();
                if (balanceResponse && balanceResponse.status === 'success') {
                  patchState(store, { wallet: balanceResponse.data });
                  await dbService.saveWallet(balanceResponse.data);
                }

                // Reload transactions
                const txResponse = await walletService.getTransactionHistory({ page: 1, page_size: 20 }).toPromise();
                if (txResponse) {
                  patchState(store, { transactions: txResponse.results });
                  await dbService.saveTransactions(txResponse.results);
                }
              }
            }),
            catchError((error) => {
              patchState(store, {
                transactionLoading: false,
                error: error.error?.message || 'Failed to send money'
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Load beneficiaries
    loadBeneficiaries: rxMethod<void>(
      pipe(
        switchMap(() =>
          walletService.getBeneficiaries().pipe(
            tap(async (response) => {
              if (response.status === 'success') {
                patchState(store, { beneficiaries: response.data });

                // Cache in IndexedDB
                for (const beneficiary of response.data) {
                  await dbService.saveBeneficiary(beneficiary);
                }
              }
            }),
            catchError(async () => {
              // Load from IndexedDB on error
              const cached = await dbService.getBeneficiaries();
              patchState(store, { beneficiaries: cached });
              return of(null);
            })
          )
        )
      )
    ),

    // Clear error
    clearError: () => {
      patchState(store, { error: null });
    }
  }))
);
