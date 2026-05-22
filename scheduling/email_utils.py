import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site

load_dotenv()

BREVO_API_KEY = os.environ.get('BREVO_API_KEY')

configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = BREVO_API_KEY

def send_verification_email(user, request):
    if not BREVO_API_KEY:
        raise ValueError("BREVO_API_KEY environment variable is not set. Email verification will not work in production.")
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    sender_email = os.environ.get('BREVO_SENDER_EMAIL')
    if not sender_email:
        raise ValueError("BREVO_SENDER_EMAIL environment variable is not set. Email verification will not work in production.")
    
    sender = {"name": "Class Scheduling App", "email": sender_email}
    
    to = [{"email": user.email, "name": user.get_full_name() or user.username}]
    subject = "Verify your email address"
    token = user.profile.email_verification_token
    
    frontend_url = os.environ.get('FRONTEND_URL')
    if not frontend_url:
        raise ValueError("FRONTEND_URL environment variable is not set. Email verification links will be invalid in production.")
    
    verification_link = f"{frontend_url}/verify-email/{token}"
    
    html_content = f"""
        <p>Hello {user.get_full_name() or user.username},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href='{verification_link}'>Verify Email</a>
        <p>If you did not sign up, please ignore this email.</p>
    """
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject=subject,
        html_content=html_content
    )
    try:
        api_instance.send_transac_email(send_smtp_email)
    except ApiException as e:
        raise Exception(f"Failed to send verification email via Brevo: {e}")
