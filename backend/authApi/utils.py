from .models import OTP
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def generate_and_save_otp(phone_number, otp_type='signup'):
    otp_code = OTP.generate_otp()
    otp = OTP.objects.create(
        phone_number=phone_number,
        otp_code=otp_code,
        otp_type=otp_type,
        expires_at=timezone.now() + timezone.timedelta(minutes=5)
    )

    logger.info(f"OTP Generated for {phone_number}: {otp_code} (Type: {otp_type})")

    return otp


def send_device_change_notification(user, old_device_id, new_device_id, ip_address):
    notification_message = f"""
    Device Change Alert!

    User: {user.phone_number}
    Account: {user.account_number}
    Old Device: {old_device_id[:20]}...
    New Device: {new_device_id[:20]}...
    IP Address: {ip_address}
    Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}

    If this wasn't you, please contact support immediately.
    """

    logger.info(f"Device Change Notification: {notification_message}")

    return notification_message
