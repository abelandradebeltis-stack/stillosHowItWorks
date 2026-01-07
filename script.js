// 🔐 Verificação de autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const appsGrid = document.getElementById('apps-grid');
    const searchBar = document.getElementById('search-bar');
    const themeToggle = document.getElementById('theme-toggle');

    let allApps = [];

    // 🔄 Carregar apps protegidos pela API
    fetch('/api/apps', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            allApps = data;
            displayApps(allApps);
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
    searchBar.addEventListener('input', (e) => {
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

// 🚪 Logout correto (JWT)
function exitApp() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}
