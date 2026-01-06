# backend/app/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import get_settings
import structlog

logger = structlog.get_logger()
settings = get_settings()


class EmailService:
    """Handle sending emails for password reset, verification, etc."""
    
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.smtp_from_email
        self.from_name = settings.smtp_from_name
        self.frontend_url = settings.frontend_url
    
    def is_configured(self) -> bool:
        """Check if email is properly configured."""
        return all([
            self.smtp_host,
            self.smtp_user,
            self.smtp_password,
            self.from_email
        ])
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email."""
        if not self.is_configured():
            logger.warning("Email not configured, skipping send", to=to_email)
            return False
        
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            
            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info("Email sent successfully", to=to_email, subject=subject)
            return True
            
        except Exception as e:
            logger.error("Failed to send email", to=to_email, error=str(e))
            return False
    
    async def send_password_reset_email(self, to_email: str, token: str) -> bool:
        """Send password reset email."""
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #10B981; margin-bottom: 24px; }}
                .button {{ 
                    display: inline-block; 
                    background: #10B981; 
                    color: white; 
                    padding: 12px 24px; 
                    border-radius: 8px; 
                    text-decoration: none;
                    font-weight: 600;
                    margin: 24px 0;
                }}
                .footer {{ color: #6B7280; font-size: 14px; margin-top: 32px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🔷 Askyia</div>
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="{reset_url}" class="button">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <div class="footer">
                    <p>— The Askyia Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Reset Your Password
        
        We received a request to reset your password. 
        
        Click this link to create a new password: {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request this, you can safely ignore this email.
        
        — The Askyia Team
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Reset your Askyia password",
            html_content=html_content,
            text_content=text_content
        )
    
    async def send_welcome_email(self, to_email: str, name: Optional[str] = None) -> bool:
        """Send welcome email after registration."""
        display_name = name or to_email.split("@")[0]
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #10B981; margin-bottom: 24px; }}
                .button {{ 
                    display: inline-block; 
                    background: #10B981; 
                    color: white; 
                    padding: 12px 24px; 
                    border-radius: 8px; 
                    text-decoration: none;
                    font-weight: 600;
                    margin: 24px 0;
                }}
                .footer {{ color: #6B7280; font-size: 14px; margin-top: 32px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🔷 Askyia</div>
                <h2>Welcome to Askyia, {display_name}! 🎉</h2>
                <p>Thank you for signing up! You're now ready to build powerful AI workflows with drag-and-drop simplicity.</p>
                <a href="{self.frontend_url}" class="button">Get Started</a>
                <p>Here's what you can do:</p>
                <ul>
                    <li>Create AI-powered workflows</li>
                    <li>Connect multiple LLM providers</li>
                    <li>Build and deploy in minutes</li>
                </ul>
                <div class="footer">
                    <p>— The Askyia Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Welcome to Askyia! 🎉",
            html_content=html_content
        )


email_service = EmailService()