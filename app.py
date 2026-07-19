import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone


app = Flask(__name__)
# Enable CORS so your GitHub Pages site can talk to this backend
CORS(app) 
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-very-random-secret-key-you-should-change')

# Database configuration: Uses the secure DATABASE_URL from Render, 
# or falls back to local sqlite for testing
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///registrations.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

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

# Helper function to check admin password from Environment Variables
def is_authorized(auth_header):
    SECRET = os.environ.get("ADMIN_PASSWORD", "RoboLand@2026#")
    return auth_header == SECRET

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

# API Endpoint to fetch data (for your admin dashboard)
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

# Public endpoint for the registration counter
@app.route('/registrations/count', methods=['GET'])
def get_count():
    count = Registration.query.count()
    return jsonify({"count": count})

if __name__ == '__main__':
    # Use port 5000 for local, Render will override this automatically
    app.run(debug=True, port=5000)
