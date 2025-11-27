import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Wallet,
  Transaction,
  SendMoneyRequest,
  AddMoneyRequest,
  BillPaymentRequest,
  Beneficiary,
  Analytics
} from '../models/wallet.model';

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wallet`;

  // Wallet Balance
  getBalance(): Observable<ApiResponse<Wallet>> {
    return this.http.get<ApiResponse<Wallet>>(`${this.apiUrl}/wallet/balance/`);
  }

  // Transactions
  sendMoney(data: SendMoneyRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/transactions/send/`, data);
  }

  addMoney(data: AddMoneyRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/transactions/add-money/`, data);
  }

  payBill(data: BillPaymentRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/transactions/bill-payment/`, data);
  }

  getTransactionHistory(filters?: {
    type?: 'credit' | 'debit';
    status?: 'pending' | 'completed' | 'failed';
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Observable<PaginatedResponse<Transaction>> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Transaction>>(
      `${this.apiUrl}/transactions/history/`,
      { params }
    );
  }

  getTransactionDetails(reference: string): Observable<ApiResponse<Transaction>> {
    return this.http.get<ApiResponse<Transaction>>(`${this.apiUrl}/transactions/${reference}/`);
  }

  // Security
  setTransactionPin(pin: string, confirmPin: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/security/pin/set/`, {
      pin,
      confirm_pin: confirmPin
    });
  }

  // Beneficiaries
  getBeneficiaries(favoritesOnly: boolean = false): Observable<ApiResponse<Beneficiary[]>> {
    let params = new HttpParams();
    if (favoritesOnly) {
      params = params.set('favorites', 'true');
    }
    return this.http.get<ApiResponse<Beneficiary[]>>(`${this.apiUrl}/beneficiaries/`, { params });
  }

  addBeneficiary(phone_number: string, nickname?: string): Observable<ApiResponse<Beneficiary>> {
    return this.http.post<ApiResponse<Beneficiary>>(`${this.apiUrl}/beneficiaries/add/`, {
      phone_number,
      nickname
    });
  }

  // Analytics
  getAnalytics(days: number = 7): Observable<ApiResponse<Analytics>> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ApiResponse<Analytics>>(`${this.apiUrl}/analytics/`, { params });
  }

  // Dashboard
  getDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard/`);
  }

  // AI Support
  chatWithAI(message: string, sessionId?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/support/chat/`, {
      message,
      session_id: sessionId
    });
  }

  getChatHistory(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/support/history/`);
  }
}
