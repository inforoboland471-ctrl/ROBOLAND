import os
import re
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError

app = Flask(__name__)
# Enable CORS so your frontend can talk to this backend
CORS(app) 
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-very-random-secret-key-you-should-change')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///registrations.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Model
class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True) # Added unique constraint
    phone = db.Column(db.String(20), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    interest = db.Column(db.String(100), nullable=False)
    registered_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# Initialize DB
with app.app_context():
    db.create_all()

# Helper function to check admin password securely
def is_authorized(auth_header):
    secret = os.environ.get("ADMIN_PASSWORD")
    # Fails safely if the environment variable is missing
    if not secret:
        print("WARNING: ADMIN_PASSWORD environment variable not set.")
        return False
    return auth_header == secret

# Helper for basic email validation
def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

# API Endpoint to receive form data
@app.route('/registrations', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"message": "Invalid or missing JSON payload"}), 400

        # 1. Check for required fields
        required_fields = ['fullName', 'age', 'email', 'phone', 'city', 'interest']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({"message": f"Missing or empty required field: {field}"}), 400
        
        email = data['email'].strip().lower()
        if not is_valid_email(email):
            return jsonify({"message": "Invalid email format"}), 400
            
        # 2. Validate age safely
        try:
            age = int(data['age'])
            if age < 5 or age > 99:
                return jsonify({"message": "Age must be between 5 and 99"}), 400
        except ValueError:
            return jsonify({"message": "Age must be a valid number"}), 400

        # 3. Prevent duplicate registrations
        existing_user = Registration.query.filter(db.func.lower(Registration.email) == email).first()
        if existing_user:
            return jsonify({"message": "This email is already registered."}), 409

        # 4. Save to database
        new_reg = Registration(
            full_name=data['fullName'].strip(),
            age=age,
            email=email,
            phone=data['phone'].strip(),
            city=data['city'].strip(),
            interest=data['interest'].strip()
        )
        db.session.add(new_reg)
        db.session.commit()
        return jsonify({"message": "Registration successful!", "id": new_reg.id}), 201

    except SQLAlchemyError as e:
        db.session.rollback() # Crucial: prevents the database from locking up on error
        return jsonify({"message": "Database error occurred. Please try again."}), 500
    except Exception as e:
        return jsonify({"message": "An unexpected error occurred."}), 500

# API Endpoint to fetch data (Admin Dashboard)
@app.route('/registrations', methods=['GET'])
def get_registrations():
    if not is_authorized(request.headers.get('Authorization')):
        return jsonify({"message": "Unauthorized"}), 401

    try:
        # Sorts by newest first
        regs = Registration.query.order_by(Registration.registered_at.desc()).all()
        output = [{
            "id": r.id,
            "fullName": r.full_name,
            "age": r.age,
            "email": r.email,
            "phone": r.phone,
            "city": r.city,
            "interest": r.interest,
            "registeredAt": r.registered_at.isoformat()
        } for r in regs]
        return jsonify(output), 200
    except Exception as e:
        return jsonify({"message": "Failed to fetch registrations."}), 500

# API Endpoint to delete data
@app.route('/registrations/<int:id>', methods=['DELETE'])
def delete_registration(id):
    if not is_authorized(request.headers.get('Authorization')):
        return jsonify({"message": "Unauthorized"}), 401
    
    try:
        reg = Registration.query.get(id)
        if not reg:
            return jsonify({"message": "Registration not found"}), 404
            
        db.session.delete(reg)
        db.session.commit()
        return jsonify({"message": "Deleted successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"message": "Database error occurred."}), 500

# Public endpoint for the registration counter
@app.route('/registrations/count', methods=['GET'])
def get_count():
    try:
        count = Registration.query.count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"count": 0}), 500

# API Endpoint for User Login / Course Access
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"success": False, "message": "Email is required"}), 400
            
        email = data.get('email', '').strip().lower()
        if not email:
            return jsonify({"success": False, "message": "Email cannot be empty"}), 400
        
        # Search for user by email
        user = Registration.query.filter(db.func.lower(Registration.email) == email).first()
        
        if user:
            return jsonify({
                "success": True,
                "fullName": user.full_name,
                "message": "Login successful!"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Email not found. Please register first."
            }), 404
            
    except Exception as e:
        return jsonify({"success": False, "message": "Login failed due to server error."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
