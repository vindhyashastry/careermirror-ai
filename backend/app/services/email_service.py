import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
import os
from datetime import datetime, timedelta

# In-memory OTP store: {email: {"otp": otp, "expiry": expiry}}
otp_store = {}

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = "vindhyashastry23@gmail.com"
        # User should provide an app password for Gmail
        self.sender_password = os.getenv("EMAIL_PASSWORD", "mekf unnt lvpb piei") 

    def generate_otp(self, length=6):
        return ''.join(random.choices(string.digits, k=length))

    def send_otp_email(self, receiver_email, otp):
        msg = MIMEMultipart()
        msg['From'] = self.sender_email
        msg['To'] = receiver_email
        msg['Subject'] = "Your CareerMirror AI OTP"

        body = f"Hey, here is ur OTP -> {otp}. Use this to complete your authentication."
        msg.attach(MIMEText(body, 'plain'))

        try:
            # Note: In a real app, you'd use a background task to not block
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    def store_otp(self, email, otp):
        expiry = datetime.now() + timedelta(minutes=5)
        otp_store[email] = {"otp": otp, "expiry": expiry}

    def verify_otp(self, email, otp):
        if email not in otp_store:
            return False
        
        stored_data = otp_store[email]
        if datetime.now() > stored_data["expiry"]:
            del otp_store[email]
            return False
        
        if stored_data["otp"] == otp:
            del otp_store[email] # Clear after use
            return True
        
        return False
