import os
import random
import requests
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__)
# Enable CORS for all domains so your GitHub Pages frontend can connect safely
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-very-random-secret-key-you-should-change')

# Database configuration with connection pooling fix for Render
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///registrations.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}
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

# Helper function to send email via Resend HTTP API
def send_email_otp(recipient_email, recipient_name, otp_code):
    resend_api_key = os.environ.get("RESEND_API_KEY")
    
    if not resend_api_key:
        print("Resend Error: RESEND_API_KEY not set in environment variables.")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {resend_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": "Roboland <onboarding@resend.dev>",
        "to": [recipient_email],
        "subject": "Your Roboland Verification Code",
        "html": f"<p>Hello <strong>{recipient_name}</strong>,</p><p>Your verification code to access your Roboland Student Portal is:</p><h2>{otp_code}</h2><p>This code is valid for your current login session.</p>"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            return True
        else:
            print(f"Resend API failed: {response.text}")
            return False
    except Exception as e:
        print(f"Email sending exception: {e}")
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

# 1. Request OTP Code Endpoint (Sends real email via Resend API)
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
        return jsonify({"success": False, "message": "Failed to send email. Check Resend API key on Render."}), 500

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
