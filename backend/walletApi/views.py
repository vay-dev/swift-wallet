from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from decimal import Decimal
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import (
    Wallet, Transaction, TransactionPin, BeneficiaryContact,
    TransactionAnalytics, CustomerServiceChat
)
from .serializers import (
    WalletSerializer, TransactionSerializer, SendMoneySerializer,
    AddMoneySerializer, BillPaymentSerializer, TransactionPinSerializer,
    BeneficiarySerializer, TransactionAnalyticsSerializer,
    CustomerServiceChatSerializer, ChatRequestSerializer
)
from .utils import (
    process_transfer, add_money_to_wallet, process_bill_payment,
    get_user_balance, verify_transaction_pin
)
from .ai_service import generate_ai_response, detect_issue_category, analyze_sentiment
from authApi.utils import get_client_ip

import logging

logger = logging.getLogger(__name__)


class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(
    tags=['Wallet'],
    summary='Get Wallet Balance',
    description='Retrieve the current balance and wallet information for the authenticated user.',
    responses={
        200: WalletSerializer,
        404: OpenApiTypes.OBJECT
    }
)
class WalletBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            wallet = Wallet.objects.get(user=user)
            serializer = WalletSerializer(wallet)

            return Response({
                'status': 'success',
                'message': 'Wallet balance retrieved',
                'data': serializer.data
            }, status=status.HTTP_200_OK)

        except Wallet.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Wallet not found'
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Transactions'],
    summary='Send Money',
    description='''
    Transfer money to another user by phone number or account number.

    **Requirements:**
    - Recipient must have an account
    - Sender must have sufficient balance
    - Transaction PIN (optional but recommended)

    **Limits:**
    - Minimum: $1.00
    - Maximum: $100,000.00
    ''',
    request=SendMoneySerializer,
    responses={
        200: TransactionSerializer,
        400: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT
    },
    examples=[
        OpenApiExample(
            'Send by phone number',
            value={
                "recipient_phone": "+0987654321",
                "amount": "50.00",
                "narration": "Payment for lunch",
                "transaction_pin": "1234"
            }
        ),
        OpenApiExample(
            'Send by account number',
            value={
                "recipient_account": "1234567890",
                "amount": "100.00",
                "narration": "Refund"
            }
        )
    ]
)
class SendMoneyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = SendMoneySerializer(data=request.data)

        if serializer.is_valid():
            try:
                wallet = Wallet.objects.get(user=user)
                recipient = serializer.validated_data['recipient']
                amount = serializer.validated_data['amount']
                narration = serializer.validated_data.get('narration', '')
                transaction_pin = serializer.validated_data.get('transaction_pin')

                # Check if sender is trying to send to themselves
                if recipient == user:
                    return Response({
                        'status': 'error',
                        'message': 'Cannot send money to yourself'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Verify transaction PIN if provided
                if transaction_pin:
                    pin_valid, pin_message = verify_transaction_pin(user, transaction_pin)
                    if not pin_valid:
                        return Response({
                            'status': 'error',
                            'message': pin_message
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Process transfer
                result = process_transfer(wallet, recipient, amount, narration)

                return Response({
                    'status': 'success',
                    'message': 'Money sent successfully',
                    'data': {
                        'transaction': TransactionSerializer(result['debit_transaction']).data,
                        'new_balance': str(result['sender_balance']),
                        'recipient': recipient.phone_number
                    }
                }, status=status.HTTP_200_OK)

            except Wallet.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Wallet not found'
                }, status=status.HTTP_404_NOT_FOUND)

            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logger.error(f"Transfer error: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': 'Transaction failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AddMoneyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = AddMoneySerializer(data=request.data)

        if serializer.is_valid():
            try:
                wallet = Wallet.objects.get(user=user)
                amount = serializer.validated_data['amount']
                payment_method = serializer.validated_data['payment_method']
                description = serializer.validated_data.get('description', '')

                # Process deposit
                result = add_money_to_wallet(wallet, amount, payment_method, description)

                return Response({
                    'status': 'success',
                    'message': 'Money added successfully',
                    'data': {
                        'transaction': TransactionSerializer(result['transaction']).data,
                        'new_balance': str(result['new_balance'])
                    }
                }, status=status.HTTP_200_OK)

            except Wallet.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Wallet not found'
                }, status=status.HTTP_404_NOT_FOUND)

            except Exception as e:
                logger.error(f"Add money error: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': 'Failed to add money. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class BillPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = BillPaymentSerializer(data=request.data)

        if serializer.is_valid():
            try:
                wallet = Wallet.objects.get(user=user)
                bill_type = serializer.validated_data['bill_type']
                amount = serializer.validated_data['amount']
                transaction_pin = serializer.validated_data.get('transaction_pin')

                # Verify transaction PIN if provided
                if transaction_pin:
                    pin_valid, pin_message = verify_transaction_pin(user, transaction_pin)
                    if not pin_valid:
                        return Response({
                            'status': 'error',
                            'message': pin_message
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Build metadata
                metadata = {
                    'phone_number': serializer.validated_data.get('phone_number'),
                    'meter_number': serializer.validated_data.get('meter_number'),
                    'smartcard_number': serializer.validated_data.get('smartcard_number'),
                }

                # Process bill payment
                result = process_bill_payment(wallet, bill_type, amount, metadata)

                return Response({
                    'status': 'success',
                    'message': f'{bill_type.replace("_", " ").title()} payment successful',
                    'data': {
                        'transaction': TransactionSerializer(result['transaction']).data,
                        'new_balance': str(result['new_balance'])
                    }
                }, status=status.HTTP_200_OK)

            except Wallet.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Wallet not found'
                }, status=status.HTTP_404_NOT_FOUND)

            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logger.error(f"Bill payment error: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': 'Bill payment failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer
    pagination_class = TransactionPagination

    def get_queryset(self):
        user = self.request.user

        try:
            wallet = Wallet.objects.get(user=user)
            queryset = Transaction.objects.filter(wallet=wallet).order_by('-created_at')

            # Filter by transaction type
            transaction_type = self.request.query_params.get('type')
            if transaction_type in ['credit', 'debit']:
                queryset = queryset.filter(transaction_type=transaction_type)

            # Filter by status
            txn_status = self.request.query_params.get('status')
            if txn_status:
                queryset = queryset.filter(status=txn_status)

            # Filter by date range
            start_date = self.request.query_params.get('start_date')
            end_date = self.request.query_params.get('end_date')

            if start_date:
                queryset = queryset.filter(created_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__lte=end_date)

            return queryset

        except Wallet.DoesNotExist:
            return Transaction.objects.none()


class TransactionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        user = request.user

        try:
            wallet = Wallet.objects.get(user=user)
            transaction = Transaction.objects.get(reference=reference, wallet=wallet)

            return Response({
                'status': 'success',
                'message': 'Transaction details retrieved',
                'data': TransactionSerializer(transaction).data
            }, status=status.HTTP_200_OK)

        except Transaction.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)


class SetTransactionPinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = TransactionPinSerializer(data=request.data)

        if serializer.is_valid():
            pin = serializer.validated_data['pin']

            # Create or update transaction PIN
            transaction_pin, created = TransactionPin.objects.get_or_create(user=user)
            transaction_pin.pin = make_password(pin)
            transaction_pin.is_active = True
            transaction_pin.failed_attempts = 0
            transaction_pin.locked_until = None
            transaction_pin.save()

            action = 'created' if created else 'updated'

            return Response({
                'status': 'success',
                'message': f'Transaction PIN {action} successfully'
            }, status=status.HTTP_200_OK)

        return Response({
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class BeneficiaryListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BeneficiarySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = BeneficiaryContact.objects.filter(user=user).order_by('-last_transaction_at')

        # Filter favorites only
        if self.request.query_params.get('favorites') == 'true':
            queryset = queryset.filter(is_favorite=True)

        return queryset


class AddBeneficiaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        phone_number = request.data.get('phone_number')
        nickname = request.data.get('nickname', '')

        try:
            from authApi.models import CustomUser
            beneficiary = CustomUser.objects.get(phone_number=phone_number)

            if beneficiary == user:
                return Response({
                    'status': 'error',
                    'message': 'Cannot add yourself as beneficiary'
                }, status=status.HTTP_400_BAD_REQUEST)

            beneficiary_contact, created = BeneficiaryContact.objects.get_or_create(
                user=user,
                beneficiary=beneficiary,
                defaults={'nickname': nickname}
            )

            if not created:
                beneficiary_contact.nickname = nickname
                beneficiary_contact.save()

            return Response({
                'status': 'success',
                'message': 'Beneficiary added successfully',
                'data': BeneficiarySerializer(beneficiary_contact).data
            }, status=status.HTTP_201_CREATED)

        except:
            return Response({
                'status': 'error',
                'message': 'Beneficiary not found'
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Analytics'],
    summary='Get Transaction Analytics',
    description='Retrieve transaction analytics and insights for a specified period.',
    parameters=[
        OpenApiParameter(
            name='days',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Number of days to analyze (default: 7)',
            required=False
        )
    ],
    responses={200: OpenApiTypes.OBJECT}
)
class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get date range (default: last 7 days)
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days)

        analytics = TransactionAnalytics.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')

        return Response({
            'status': 'success',
            'message': 'Analytics retrieved',
            'data': {
                'period': f'Last {days} days',
                'daily_data': TransactionAnalyticsSerializer(analytics, many=True).data,
                'summary': {
                    'total_credits': sum(a.total_credits for a in analytics),
                    'total_debits': sum(a.total_debits for a in analytics),
                    'total_transactions': sum(a.total_transactions for a in analytics),
                    'current_balance': str(get_user_balance(user))
                }
            }
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['AI Support'],
    summary='Chat with AI Customer Service',
    description='''
    Interact with the AI-powered customer service chatbot.

    **Features:**
    - Context-aware responses (knows your balance, transactions)
    - GPT-4 powered (with fallback to mock responses)
    - Session continuity
    - Sentiment analysis
    - Auto-escalation to human support

    **Topics the AI can help with:**
    - How to send money
    - Check balance
    - Transaction issues
    - Account settings
    - App features and usage
    ''',
    request=ChatRequestSerializer,
    responses={200: OpenApiTypes.OBJECT},
    examples=[
        OpenApiExample(
            'Start new conversation',
            value={
                "message": "How do I send money to someone?"
            }
        ),
        OpenApiExample(
            'Continue existing conversation',
            value={
                "message": "What are the transaction limits?",
                "session_id": "CS-20241126-ABC12345"
            }
        )
    ]
)
class CustomerServiceChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = ChatRequestSerializer(data=request.data)

        if serializer.is_valid():
            message = serializer.validated_data['message']
            session_id = serializer.validated_data.get('session_id')

            # Get or create chat session
            chat_session = None
            if session_id:
                try:
                    chat_session = CustomerServiceChat.objects.get(
                        session_id=session_id,
                        user=user
                    )
                except CustomerServiceChat.DoesNotExist:
                    pass

            # Generate AI response
            result = generate_ai_response(user, message, chat_session)

            # Update issue category if new session
            if not session_id and result.get('session_id'):
                try:
                    chat = CustomerServiceChat.objects.get(session_id=result['session_id'])
                    chat.issue_category = detect_issue_category(message)
                    chat.sentiment_score = analyze_sentiment(message)
                    chat.save()
                except:
                    pass

            return Response({
                'status': 'success',
                'message': 'Response generated',
                'data': result
            }, status=status.HTTP_200_OK)

        return Response({
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ChatHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CustomerServiceChatSerializer

    def get_queryset(self):
        user = self.request.user
        return CustomerServiceChat.objects.filter(user=user).order_by('-started_at')


@extend_schema(
    tags=['Dashboard'],
    summary='Get Dashboard Summary',
    description='''
    Retrieve a comprehensive dashboard summary including:
    - Wallet balance and status
    - Recent transactions (last 5)
    - Today's transaction summary
    - User profile information

    Perfect for the main dashboard/home screen of your app.
    ''',
    responses={
        200: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT
    }
)
class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            wallet = Wallet.objects.get(user=user)

            # Get recent transactions
            recent_transactions = Transaction.objects.filter(
                wallet=wallet
            ).order_by('-created_at')[:5]

            # Get today's analytics
            today = timezone.now().date()
            today_analytics = TransactionAnalytics.objects.filter(
                user=user,
                date=today
            ).first()

            return Response({
                'status': 'success',
                'message': 'Dashboard summary retrieved',
                'data': {
                    'wallet': WalletSerializer(wallet).data,
                    'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
                'today_summary': {
                        'total_sent': str(today_analytics.total_debits) if today_analytics else '0.00',
                        'total_received': str(today_analytics.total_credits) if today_analytics else '0.00',
                        'transaction_count': today_analytics.total_transactions if today_analytics else 0
                    },
                    'user_info': {
                        'full_name': user.full_name,
                        'phone_number': user.phone_number,
                        'account_number': user.account_number,
                        'is_verified': user.is_verified
                    }
                }
            }, status=status.HTTP_200_OK)

        except Wallet.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Wallet not found'
            }, status=status.HTTP_404_NOT_FOUND)
