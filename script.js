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

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token || isTokenExpired(token)) {
        exitApp();
        return;
    }

    const appsGrid = document.getElementById('apps-grid');

    if (!appsGrid) {
        console.error('Elemento #apps-grid não encontrado no HTML');
        return;
    }

    // 🔗 Backend correto
    const API_BASE_URL = 'https://stilloshowitworks.onrender.com';

    try {
        const response = await fetch(`${API_BASE_URL}/api/apps`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            exitApp();
            return;
        }

        if (!response.ok) {
            throw new Error('Erro ao buscar apps');
        }

        const apps = await response.json();

        console.log('Apps recebidos do backend:', apps);

        renderApps(apps);

    } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
        exitApp();
    }

    function renderApps(apps) {
        appsGrid.innerHTML = '';

        if (!apps.length) {
            appsGrid.innerHTML = '<p>Nenhuma documentação disponível.</p>';
            return;
        }

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
});
