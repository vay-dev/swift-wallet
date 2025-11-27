export interface Wallet {
  id: number;
  user_phone: string;
  user_name: string;
  account_number: string;
  balance: string;
  currency: string;
  is_active: boolean;
  is_frozen: boolean;
}

export interface Transaction {
  reference: string;
  transaction_type: 'credit' | 'debit';
  amount: string;
  recipient_phone?: string;
  sender_phone?: string;
  narration?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
}

export interface SendMoneyRequest {
  recipient_phone: string;
  amount: string;
  narration?: string;
  transaction_pin: string;
}

export interface AddMoneyRequest {
  amount: string;
  payment_method: 'card' | 'bank_transfer' | 'bonus';
  description?: string;
}

export interface BillPaymentRequest {
  bill_type: 'airtime' | 'data' | 'electricity' | 'cable_tv';
  amount: string;
  phone_number: string;
  transaction_pin: string;
}

export interface Beneficiary {
  id: number;
  phone_number: string;
  nickname?: string;
  is_favorite: boolean;
  created_at: string;
}

export interface Analytics {
  period: string;
  daily_data: any[];
  summary: {
    total_credits: string;
    total_debits: string;
    total_transactions: number;
    current_balance: string;
  };
}
