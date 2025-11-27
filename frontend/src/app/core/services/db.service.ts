import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Transaction, Wallet, Beneficiary } from '../models/wallet.model';
import { User } from '../models/user.model';

export interface CachedData {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  transactions!: Table<Transaction & { id?: number }, number>;
  wallet!: Table<Wallet & { id?: number }, number>;
  beneficiaries!: Table<Beneficiary, number>;
  cachedData!: Table<CachedData, number>;
  user!: Table<User, number>;

  constructor() {
    super('SwiftWalletDB');

    this.version(1).stores({
      transactions: '++id, reference, transaction_type, status, created_at',
      wallet: '++id, account_number',
      beneficiaries: '++id, phone_number, is_favorite',
      cachedData: '++id, key, timestamp, expiresAt',
      user: '++id, phone_number, account_number'
    });
  }

  // Transaction Operations
  async saveTransaction(transaction: Transaction): Promise<number> {
    return await this.transactions.add(transaction as any);
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await this.transactions.clear();
    await this.transactions.bulkAdd(transactions as any);
  }

  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    return await this.transactions
      .orderBy('created_at')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getTransactionByReference(reference: string): Promise<Transaction | undefined> {
    return await this.transactions
      .where('reference')
      .equals(reference)
      .first();
  }

  // Wallet Operations
  async saveWallet(wallet: Wallet): Promise<void> {
    await this.wallet.clear();
    await this.wallet.add(wallet as any);
  }

  async getWallet(): Promise<Wallet | undefined> {
    return await this.wallet.toCollection().first();
  }

  // Beneficiary Operations
  async saveBeneficiary(beneficiary: Beneficiary): Promise<number> {
    return await this.beneficiaries.add(beneficiary);
  }

  async getBeneficiaries(): Promise<Beneficiary[]> {
    return await this.beneficiaries.toArray();
  }

  async getFavoriteBeneficiaries(): Promise<Beneficiary[]> {
    return await this.beneficiaries
      .where('is_favorite')
      .equals(1 as any)
      .toArray();
  }

  // User Operations
  async saveUser(user: User): Promise<void> {
    await this.user.clear();
    await this.user.add(user);
  }

  async getUser(): Promise<User | undefined> {
    return await this.user.toCollection().first();
  }

  // Cache Operations
  async setCacheData(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttlMinutes * 60 * 1000);

    // Remove existing cache with same key
    await this.cachedData.where('key').equals(key).delete();

    await this.cachedData.add({
      key,
      data,
      timestamp: now,
      expiresAt
    });
  }

  async getCacheData(key: string): Promise<any | null> {
    const cached = await this.cachedData.where('key').equals(key).first();

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      await this.cachedData.delete(cached.id!);
      return null;
    }

    return cached.data;
  }

  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    await this.cachedData.where('expiresAt').below(now).delete();
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await this.transactions.clear();
    await this.wallet.clear();
    await this.beneficiaries.clear();
    await this.cachedData.clear();
    await this.user.clear();
  }
}
