import os
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

app.config['SECRET_KEY'] = 'uma-chave-secreta-de-fallback-confiavel'
ADMIN_USERNAME = 'administrator'
ADMIN_PASSWORD = 'still0S@2026Sys!!'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(' ')
            if len(parts) == 2:
                token = parts[1]

        if not token:
            return jsonify({'message': 'Token ausente'}), 401

        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except:
            return jsonify({'message': 'Token inválido ou expirado'}), 401

        return f(*args, **kwargs)
    return decorated

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if (
        data.get('username', '').lower() == ADMIN_USERNAME and
        data.get('password', '') == ADMIN_PASSWORD
    ):
        token = jwt.encode({
            'user': ADMIN_USERNAME,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({'token': token})

    return jsonify({'message': 'Credenciais inválidas'}), 401

@app.route('/api/apps')
@token_required
def apps():
    return send_from_directory('.', 'apps.json')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/login.html')
def login_page():
    return send_from_directory('.', 'login.html')

@app.route('/<path:path>')
def static_files(path):
    if os.path.isfile(path):
        return send_from_directory('.', path)
    return jsonify({'message': 'Arquivo não encontrado'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
