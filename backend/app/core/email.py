"""
Email utility for sending OTP verification codes via Gmail SMTP.
Uses Python built-in smtplib — no extra packages required.
"""

import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings


def _build_otp_html(otp_code: str, recipient_email: str) -> str:
    """Build a professional HTML email template for OTP delivery."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0B0F17;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F17;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#121826;border:1px solid #232E42;border-radius:16px;overflow:hidden;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="padding:32px 32px 20px;text-align:center;border-bottom:1px solid #232E42;">
                                <div style="font-size:24px;margin-bottom:8px;">⚡</div>
                                <h1 style="margin:0;font-size:18px;font-weight:700;color:#E9EDF4;letter-spacing:2px;">
                                    FINANCIAL TIME MACHINE
                                </h1>
                                <p style="margin:4px 0 0;font-size:12px;color:#8C99AF;">
                                    Enterprise Identity Verification
                                </p>
                            </td>
                        </tr>

                        <!-- OTP Code -->
                        <tr>
                            <td style="padding:32px;">
                                <p style="margin:0 0 8px;font-size:13px;color:#8C99AF;">
                                    Your 6-digit verification code is:
                                </p>
                                <div style="background-color:#0B0F17;border:2px solid #E8A33D;border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
                                    <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#E8A33D;font-family:'Courier New',monospace;">
                                        {otp_code}
                                    </span>
                                </div>
                                <p style="margin:16px 0 0;font-size:12px;color:#8C99AF;line-height:1.5;">
                                    This code expires in <strong style="color:#E9EDF4;">5 minutes</strong>. 
                                    Do not share this code with anyone.
                                </p>
                                <p style="margin:8px 0 0;font-size:11px;color:#5B6A82;">
                                    Requested for: <strong style="color:#8C99AF;">{recipient_email}</strong>
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding:20px 32px;border-top:1px solid #232E42;text-align:center;">
                                <p style="margin:0;font-size:10px;color:#5B6A82;line-height:1.5;">
                                    This is an automated message from Financial Time Machine.<br>
                                    If you did not request this code, please ignore this email.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def send_otp_email(recipient_email: str, otp_code: str) -> bool:
    """
    Send OTP verification email via Gmail SMTP.
    Runs in a background thread to avoid blocking the API response.
    Returns True if the email dispatch was initiated (not delivery confirmation).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("[EMAIL] SMTP credentials not configured — skipping email dispatch.")
        return False

    def _send():
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
            msg["To"] = recipient_email
            msg["Subject"] = f"Your Verification Code: {otp_code} — Financial Time Machine"

            # Plain text fallback
            plain_text = (
                f"Your Financial Time Machine verification code is: {otp_code}\n\n"
                f"This code expires in 5 minutes.\n"
                f"Do not share this code with anyone.\n\n"
                f"- Financial Time Machine"
            )
            msg.attach(MIMEText(plain_text, "plain", "utf-8"))
            msg.attach(MIMEText(_build_otp_html(otp_code, recipient_email), "html", "utf-8"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, recipient_email, msg.as_string())

            print(f"[EMAIL] [SUCCESS] OTP email dispatched to {recipient_email}", flush=True)
        except Exception as e:
            print(f"[EMAIL] [ERROR] Failed to send OTP email to {recipient_email}: {e}", flush=True)

    # Fire and forget — don't block the API response
    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
    return True
