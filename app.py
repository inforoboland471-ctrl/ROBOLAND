from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app) 

# Setup a local database file
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///registrations.db'
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
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

# Initialize DB
with app.app_context():
    db.create_all()

# API Endpoint to receive form data
# NOTE: Must match the URL in your main.js (which you set to /registrations)
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
    auth_header = request.headers.get('Authorization')
    if auth_header != "RoboLand@2026#": 
        return jsonify({"message": "Unauthorized"}), 401

    regs = Registration.query.all()
    output = []
    for r in regs:
        output.append({
            "fullName": r.full_name,
            "age": r.age,
            "email": r.email,
            "phone": r.phone,
            "city": r.city,
            "interest": r.interest,
            "registeredAt": r.registered_at.isoformat()
        })
    return jsonify(output)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
