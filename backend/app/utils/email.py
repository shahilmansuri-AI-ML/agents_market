import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings


def send_email(to_email: str, subject: str, body: str, html: bool = True) -> bool:
    """Send email using SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        
        if html:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_otp_email(to_email: str, otp: str) -> bool:
    """Send OTP verification email."""
    subject = "Verify Your Email - Agents Market"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">{otp}</h1>
            <p>This code will expire in {settings.OTP_EXPIRATION_MINUTES} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, body)


def send_invitation_email(to_email: str, tenant_name: str, invitation_link: str) -> bool:
    """Send tenant invitation email."""
    subject = f"You've been invited to join {tenant_name}"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Invitation to {tenant_name}</h2>
            <p>You've been invited to join {tenant_name} on Agents Market.</p>
            <p>Click the link below to accept the invitation:</p>
            <a href="{invitation_link}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, body)
