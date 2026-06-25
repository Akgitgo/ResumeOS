import smtplib
import random
import string
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = os.getenv("SMTP_PORT", 587)
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", "AlgoVault <udayhese0116@gmail.com>")

def genrate_otp(length=6):


    characters= string.ascii_lowercase + string.digits

    otp = ''.join(random.choice(characters, k=length))
    return otp

def send_otp_email(to_email: str, subject: str, otp: str):
    if not to_email or not SMTP_USER or not SMTP_PASS:
        raise ValueError("Missing SMTP credentials or recipient email")

    try:

        # Setup the email server
        server= smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls() # Secure The Connection

        server.login(SMTP_USER, SMTP_PASS)

        # Create the email message
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_FROM
        msg['To'] = to_email
        msg['Subject'] = subject

        # HTML Template with styling (Includes a nice box for the OTP)

        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #333333; text-align: center;">AlgoVault Authentication</h2>
              <p style="color: #555555; font-size: 16px;">Hello,</p>
              <p style="color: #555555; font-size: 16px;">You requested a One-Time Password (OTP) for <strong>{subject}</strong>. Please use the code below to complete your process.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #4F46E5; background-color: #EEF2FF; border: 1px dashed #4F46E5; border-radius: 4px; letter-spacing: 5px;">
                  {otp}
                </span>
              </div>
              
              <p style="color: #777777; font-size: 14px; text-align: center;">This code will expire in 5 minutes.</p>
              <p style="color: #777777; font-size: 14px; text-align: center;">If you did not request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin-top: 30px; margin-bottom: 20px;">
              <p style="color: #aaaaaa; font-size: 12px; text-align: center;">&copy; 2024 AlgoVault. All rights reserved.</p>
            </div>
          </body>
        </html>
        """

        # Attach the HTML Content
        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Send the email
        server.sendmail(SMTP_FROM, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error Sending Email: {e}")
        return False
