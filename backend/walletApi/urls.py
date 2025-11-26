from django.urls import path
from .views import (
    WalletBalanceView,
    SendMoneyView,
    AddMoneyView,
    BillPaymentView,
    TransactionHistoryView,
    TransactionDetailView,
    SetTransactionPinView,
    BeneficiaryListView,
    AddBeneficiaryView,
    AnalyticsView,
    CustomerServiceChatView,
    ChatHistoryView,
    DashboardSummaryView
)

app_name = 'walletApi'

urlpatterns = [
    # Dashboard
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard'),

    # Wallet
    path('wallet/balance/', WalletBalanceView.as_view(), name='wallet-balance'),

    # Transactions
    path('transactions/send/', SendMoneyView.as_view(), name='send-money'),
    path('transactions/add-money/', AddMoneyView.as_view(), name='add-money'),
    path('transactions/bill-payment/', BillPaymentView.as_view(), name='bill-payment'),
    path('transactions/history/', TransactionHistoryView.as_view(), name='transaction-history'),
    path('transactions/<str:reference>/', TransactionDetailView.as_view(), name='transaction-detail'),

    # Transaction PIN
    path('security/pin/set/', SetTransactionPinView.as_view(), name='set-transaction-pin'),

    # Beneficiaries
    path('beneficiaries/', BeneficiaryListView.as_view(), name='beneficiary-list'),
    path('beneficiaries/add/', AddBeneficiaryView.as_view(), name='add-beneficiary'),

    # Analytics
    path('analytics/', AnalyticsView.as_view(), name='analytics'),

    # Customer Service AI
    path('support/chat/', CustomerServiceChatView.as_view(), name='customer-service-chat'),
    path('support/history/', ChatHistoryView.as_view(), name='chat-history'),
]
