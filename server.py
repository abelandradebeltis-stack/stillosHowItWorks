import os
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

# --- Configuração ---
app.config['SECRET_KEY'] = 'uma-chave-secreta-de-fallback-confiavel'
ADMIN_USERNAME = 'administrator'
ADMIN_PASSWORD = 'admin'

# --- Decorator JWT ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(" ")
            if len(parts) == 2:
                token = parts[1]

        if not token:
            return jsonify({'message': 'Token está faltando!'}), 401

        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return jsonify({'message': 'Token inválido ou expirado!'}), 401

        return f(*args, **kwargs)
    return decorated

# --- Login ---
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if username.lower() == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = jwt.encode({
            'user': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token})

    return jsonify({'message': 'Credenciais inválidas'}), 401

# --- API protegida ---
@app.route('/api/apps')
@token_required
def get_apps():
    return send_from_directory('.', 'apps.json')

# --- Frontend ---
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/login.html')
def serve_login():
    return send_from_directory('.', 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.isfile(path):
        return send_from_directory('.', path)
    return jsonify({'message': 'Arquivo não encontrado'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
