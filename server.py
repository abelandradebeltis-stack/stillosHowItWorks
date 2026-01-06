
import os
from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory

app = Flask(__name__)

# Configure a chave secreta a partir de variáveis de ambiente para segurança
app.secret_key = os.environ.get('SECRET_KEY', 'default-secret-key')

# Carregue as credenciais do administrador a partir de variáveis de ambiente
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

# Rota de Login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session['logged_in'] = True
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'Credenciais inválidas'}), 401

# Rota de Logout
@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('serve_login_page'))

# Rota para verificar o status da autenticação
@app.route('/check-auth')
def check_auth():
    if session.get('logged_in'):
        return jsonify({'status': 'authenticated'})
    else:
        return jsonify({'status': 'unauthenticated'}), 401

# Rota principal que serve a página de login ou o portal principal
@app.route('/')
def serve_portal():
    if not session.get('logged_in'):
        return redirect(url_for('serve_login_page'))
    return send_from_directory('.', 'index.html')

# Rota para a página de login
@app.route('/login.html')
def serve_login_page():
    return send_from_directory('.', 'login.html')

# --- ROTA ATUALIZADA PARA SERVIR ARQUIVOS ESTÁTICOS ---
@app.route('/<path:path>')
def serve_static_files(path):
    # Arquivos públicos para a página de login que não exigem autenticação
    public_files = ['login.js', 'login.css', 'stillos-logo.png']
    if path in public_files:
        return send_from_directory('.', path)

    # Se o usuário não estiver logado, redirecione para a página de login
    if not session.get('logged_in'):
        return redirect(url_for('serve_login_page'))

    # Após o login, sirva com segurança qualquer arquivo solicitado do diretório raiz.
    # Isso inclui `script.js`, `style.css`, `apps.json` e todos os outros recursos.
    return send_from_directory('.', path)


if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 8080))
    app.run(host=host, port=port)
