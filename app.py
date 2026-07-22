import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__)
# Enable CORS for all domains so your GitHub Pages frontend can connect safely
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-very-random-secret-key-you-should-change')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///registrations.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Temporary storage for OTP codes
otp_storage = {}

# Database Model
class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    interest = db.Column(db.String(100), nullable=False)
    registered_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# Initialize DB
with app.app_context():
    db.create_all()

# Helper function to check admin password
def is_authorized(auth_header):
    SECRET = os.environ.get("ADMIN_PASSWORD", "RoboLand@2026#")
    return auth_header == SECRET

# Helper function to send email via Gmail SMTP
def send_email_otp(recipient_email, recipient_name, otp_code):
    sender_email = os.environ.get("MAIL_USERNAME")
    sender_password = os.environ.get("MAIL_PASSWORD")
    
    if not sender_email or not sender_password:
        print("SMTP Error: MAIL_USERNAME or MAIL_PASSWORD not set in environment variables.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = "Your Roboland Verification Code"

        body = f"Hello {recipient_name},\n\nYour verification code to access your Roboland Student Portal is: {otp_code}\n\nThis code is valid for your current login session."
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

# API Endpoint to receive form data
@app.route('/registrations', methods=['POST'])
def register():
    data = request.json
    new_reg = Registration(
        full_name=data['fullName'],
        age=data['age'],
        email=data['email'],
        phone=data['phone'],
        city=data['city'],
        interest=data['interest']
    )
    db.session.add(new_reg)
    db.session.commit()
    return jsonify({"message": "Registration successful!", "id": new_reg.id}), 201

# API Endpoint to fetch data (Admin dashboard)
@app.route('/registrations', methods=['GET'])
def get_registrations():
    if not is_authorized(request.headers.get('Authorization')):
        return jsonify({"message": "Unauthorized"}), 401

    regs = Registration.query.all()
    output = []
    for r in regs:
        output.append({
            "id": r.id,
            "fullName": r.full_name,
            "age": r.age,
            "email": r.email,
            "phone": r.phone,
            "city": r.city,
            "interest": r.interest,
            "registeredAt": r.registered_at.isoformat()
        })
    return jsonify(output)

# API Endpoint to delete data
@app.route('/registrations/<int:id>', methods=['DELETE'])
def delete_registration(id):
    if not is_authorized(request.headers.get('Authorization')):
        return jsonify({"message": "Unauthorized"}), 401
    
    reg = Registration.query.get_or_404(id)
    db.session.delete(reg)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

# Public endpoint for registration counter
@app.route('/registrations/count', methods=['GET'])
def get_count():
    count = Registration.query.count()
    return jsonify({"count": count})

# 1. Request OTP Code Endpoint
@app.route('/request-otp', methods=['POST'])
def request_otp():
    data = request.json
    email = data.get('email', '').strip().lower()
    
    user = Registration.query.filter(db.func.lower(Registration.email) == email).first()
    if not user:
        return jsonify({"success": False, "message": "Email not found. Please register first."}), 404
    
    code = str(random.randint(100000, 999999))
    otp_storage[email] = code
    
    sent = send_email_otp(email, user.full_name, code)
    if sent:
        return jsonify({"success": True, "message": "Verification code sent to email!"}), 200
    else:
        return jsonify({"success": False, "message": "Failed to send email. Check SMTP settings on Render."}), 500

# 2. Verify OTP Code Endpoint
@app.route('/verify-login', methods=['POST'])
def verify_login():
    data = request.json
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    
    if email in otp_storage and otp_storage[email] == code:
        del otp_storage[email]
        user = Registration.query.filter(db.func.lower(Registration.email) == email).first()
        return jsonify({
            "success": True,
            "fullName": user.full_name,
            "message": "Login successful!"
        }), 200
    else:
        return jsonify({"success": False, "message": "Invalid or expired verification code."}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
