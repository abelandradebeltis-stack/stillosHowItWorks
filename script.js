// 🔐 Verifica se o token JWT expirou
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

// 🚪 Logout
function exitApp() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // 🔒 Bloqueio de acesso
    if (!token || isTokenExpired(token)) {
        exitApp();
        return;
    }

    const appsGrid = document.getElementById('apps-grid');
    const searchBar = document.getElementById('search-bar');
    const themeToggle = document.getElementById('theme-toggle');

    let allApps = [];

    // ✅ URL CORRETA DO BACKEND
    const API_BASE_URL = 'https://stilloshowitworks.onrender.com';

    // 🔄 Apps protegidos
    fetch(`${API_BASE_URL}/api/apps`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(response => {
            if (response.status === 401) {
                exitApp();
                return null;
            }
            if (!response.ok) {
                throw new Error('Erro ao buscar apps');
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            allApps = data;
            displayApps(allApps);
        })
        .catch(err => {
            console.error('Erro ao carregar apps:', err);
            exitApp();
        });

    function displayApps(apps) {
        appsGrid.innerHTML = '';
        apps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.innerHTML = `
                <a href="${app.link}" class="app-link">
                    <img src="${app.image}" alt="${app.title}">
                    <div class="app-card-content">
                        <h3>${app.title}</h3>
                        <p>${app.description}</p>
                    </div>
                </a>
            `;
            appsGrid.appendChild(card);
        });
    }

    // 🔍 Pesquisa
    searchBar.addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        displayApps(
            allApps.filter(app =>
                app.title.toLowerCase().includes(term) ||
                app.description.toLowerCase().includes(term)
            )
        );
    });

    // 🌙 Tema
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem(
            'theme',
            document.body.classList.contains('dark-theme') ? 'dark' : 'light'
        );
    });

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
});
