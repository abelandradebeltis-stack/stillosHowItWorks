import os
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# 🔐 CONFIGURAÇÕES
app.config['SECRET_KEY'] = os.environ.get(
    'SECRET_KEY', 'fallback-local'
)

# 🔓 CORS — permite o frontend do Vercel
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True
)

ADMIN_USERNAME = 'administrator'
ADMIN_PASSWORD = 'still0S@2026Sys!!'

# ---------------- JWT DECORATOR ----------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        auth = request.headers.get('Authorization')
        if auth and auth.startswith('Bearer '):
            token = auth.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token ausente'}), 401

        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except:
            return jsonify({'message': 'Token inválido ou expirado'}), 401

        return f(*args, **kwargs)
    return decorated

# ---------------- LOGIN ----------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if (
        data.get('username') == ADMIN_USERNAME and
        data.get('password') == ADMIN_PASSWORD
    ):
        token = jwt.encode(
            {
                'user': ADMIN_USERNAME,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
            },
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        return jsonify({'token': token})

    return jsonify({'message': 'Credenciais inválidas'}), 401

# ---------------- API PROTEGIDA ----------------
@app.route('/api/apps')
@token_required
def apps():
    return jsonify([
        {
            "title": "API_SECURITY",
            "description": "HowItWorks",
            "image": "https://via.placeholder.com/150",
            "link": "#"
        }
    ])

# ---------------- HEALTH CHECK ----------------
@app.route('/')
def health():
    return jsonify({'status': 'Backend online'})
