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

# 🔓 CORS — permite frontend do Vercel e ambiente local
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "https://stillos-how-it-works.vercel.app",
                "http://localhost:3000",
                "http://localhost:5173"
            ]
        }
    }
)

# 🔑 CREDENCIAIS (BÁSICO POR ENQUANTO)
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
            jwt.decode(
                token,
                app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401

        return f(*args, **kwargs)
    return decorated

# ---------------- LOGIN ----------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

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


# ---------------- CATÁLOGO CENTRAL DE APPS ----------------
APPS_CATALOG = [
    {
        "title": "Dashboard de Chamados GLPI",
        "description": "Visualize e gerencie os chamados do GLPI.",
        "link": "dashboard_chamados_Glpi_Stillos_N3/index.html",
        "image": "dashboard_chamados_Glpi_Stillos_N3/stillos-logo.png"
    },
    {
        "title": "Manual de Atualização de Tabela de Preços",
        "description": "Instruções para atualizar a tabela de preços no LockerStudio.",
        "link": "manual_atualizacao_tabela_de_precos_lockerStudio_pronet/index.html",
        "image": "manual_atualizacao_tabela_de_precos_lockerStudio_pronet/stillos-logo.png"
    },
    {
        "title": "Manual de Divergência de Tabela Pronet",
        "description": "Procedimentos para lidar com divergências na tabela Pronet.",
        "link": "manual_divergencia_tabela_pronet/index.html",
        "image": "manual_divergencia_tabela_pronet/stillos-logo.png"
    },
    {
        "title": "Manual de Fechamento",
        "description": "Guia para o processo de fechamento mensal.",
        "link": "manual_fechamento/index.html",
        "image": "manual_fechamento/stillos-logo.png"
    },
    {
        "title": "Manual de Fechamento SQL",
        "description": "Instruções SQL para o fechamento.",
        "link": "manual_fechamento_sql/index.html",
        "image": "manual_fechamento_sql/stillos-logo.png"
    },
    {
        "title": "Manual de Fechamento SQL - Comissões",
        "description": "Cálculo de comissões usando SQL.",
        "link": "manual_fechamento_sql_comissoes/index.html",
        "image": "manual_fechamento_sql_comissoes/stillos-logo.png"
    },
    {
        "title": "Manual de Formulários Google (BKP)",
        "description": "Backup e gerenciamento de formulários Google.",
        "link": "manual_formularios_Google_BKP/index.html",
        "image": "manual_formularios_Google_BKP/stillos-logo.png"
    },
    {
        "title": "Manual de Importação de Fichas de Identificação",
        "description": "Como importar fichas de identificação para o sistema.",
        "link": "manual_importacao_Fichas_de_identificacao/index.html",
        "image": "manual_importacao_Fichas_de_identificacao/stillos-logo.png"
    },
    {
        "title": "Manual de Parcelas Baixadas Incorretamente",
        "description": "Guia para corrigir parcelas baixadas incorretamente no Pronet.",
        "link": "manual_parcelas_baixadas_incorretamente_PRONET/index.html",
        "image": "manual_parcelas_baixadas_incorretamente_PRONET/stillos-logo.png"
    }
]

# ---------------- API PROTEGIDA ----------------
@app.route('/api/apps', methods=['GET'])
@token_required
def apps():
    return jsonify(APPS_CATALOG)


# ---------------- HEALTH CHECK ----------------
@app.route('/')
def health():
    return jsonify({'status': 'Backend online'})
