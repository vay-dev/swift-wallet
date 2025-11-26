from rest_framework import serializers
from decimal import Decimal
from .models import (
    Wallet, Transaction, TransactionPin, BeneficiaryContact,
    TransactionAnalytics, CustomerServiceChat, ChatMessage
)
from authApi.models import CustomUser


class WalletSerializer(serializers.ModelSerializer):
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    account_number = serializers.CharField(source='user.account_number', read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'user_phone', 'user_name', 'account_number', 'balance',
                  'currency', 'is_active', 'is_frozen', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    sender_phone = serializers.CharField(source='sender.phone_number', read_only=True)
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    recipient_phone = serializers.CharField(source='recipient.phone_number', read_only=True)
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'reference', 'transaction_type', 'transaction_category',
                  'amount', 'currency', 'sender_phone', 'sender_name',
                  'recipient_phone', 'recipient_name', 'balance_before', 'balance_after',
                  'status', 'description', 'narration', 'created_at', 'completed_at']
        read_only_fields = ['id', 'reference', 'balance_before', 'balance_after',
                           'created_at', 'completed_at']


class SendMoneySerializer(serializers.Serializer):
    recipient_phone = serializers.CharField(max_length=17)
    recipient_account = serializers.CharField(max_length=12, required=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    narration = serializers.CharField(max_length=255, required=False, allow_blank=True)
    transaction_pin = serializers.CharField(max_length=4, write_only=True, required=False)

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than zero.")
        if value < Decimal('1.00'):
            raise serializers.ValidationError("Minimum transaction amount is 1.00")
        if value > Decimal('100000.00'):
            raise serializers.ValidationError("Maximum transaction amount is 100,000.00")
        return value

    def validate(self, data):
        # Find recipient by phone or account number
        recipient_phone = data.get('recipient_phone')
        recipient_account = data.get('recipient_account')

        try:
            if recipient_account:
                recipient = CustomUser.objects.get(account_number=recipient_account)
            else:
                recipient = CustomUser.objects.get(phone_number=recipient_phone)
            data['recipient'] = recipient
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Recipient not found.")

        return data


class AddMoneySerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=['card', 'bank_transfer', 'bonus'])
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than zero.")
        if value < Decimal('10.00'):
            raise serializers.ValidationError("Minimum deposit amount is 10.00")
        if value > Decimal('500000.00'):
            raise serializers.ValidationError("Maximum deposit amount is 500,000.00")
        return value


class BillPaymentSerializer(serializers.Serializer):
    BILL_TYPES = (
        ('airtime', 'Airtime'),
        ('data', 'Data'),
        ('electricity', 'Electricity'),
        ('cable_tv', 'Cable TV'),
    )

    bill_type = serializers.ChoiceField(choices=BILL_TYPES)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    phone_number = serializers.CharField(max_length=17, required=False)
    meter_number = serializers.CharField(max_length=50, required=False)
    smartcard_number = serializers.CharField(max_length=50, required=False)
    transaction_pin = serializers.CharField(max_length=4, write_only=True, required=False)

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class TransactionPinSerializer(serializers.ModelSerializer):
    pin = serializers.CharField(max_length=4, write_only=True)
    confirm_pin = serializers.CharField(max_length=4, write_only=True)

    class Meta:
        model = TransactionPin
        fields = ['pin', 'confirm_pin', 'is_active']

    def validate(self, data):
        if data['pin'] != data['confirm_pin']:
            raise serializers.ValidationError("PINs do not match.")

        if not data['pin'].isdigit() or len(data['pin']) != 4:
            raise serializers.ValidationError("PIN must be exactly 4 digits.")

        return data


class BeneficiarySerializer(serializers.ModelSerializer):
    beneficiary_phone = serializers.CharField(source='beneficiary.phone_number', read_only=True)
    beneficiary_name = serializers.CharField(source='beneficiary.full_name', read_only=True)
    beneficiary_account = serializers.CharField(source='beneficiary.account_number', read_only=True)

    class Meta:
        model = BeneficiaryContact
        fields = ['id', 'beneficiary_phone', 'beneficiary_name', 'beneficiary_account',
                  'nickname', 'is_favorite', 'total_sent', 'transaction_count',
                  'last_transaction_at', 'created_at']
        read_only_fields = ['id', 'total_sent', 'transaction_count',
                           'last_transaction_at', 'created_at']


class TransactionAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionAnalytics
        fields = ['date', 'total_credits', 'total_debits', 'total_transactions',
                  'transfers_sent', 'transfers_received', 'bill_payments',
                  'airtime_purchases', 'closing_balance']


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'message_type', 'content', 'created_at']
        read_only_fields = ['id', 'message_type', 'created_at']


class CustomerServiceChatSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = CustomerServiceChat
        fields = ['id', 'session_id', 'user_phone', 'status', 'issue_category',
                  'sentiment_score', 'started_at', 'ended_at', 'total_messages',
                  'resolved_by_ai', 'messages']
        read_only_fields = ['id', 'session_id', 'started_at', 'ended_at']


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    session_id = serializers.CharField(required=False, allow_blank=True)
