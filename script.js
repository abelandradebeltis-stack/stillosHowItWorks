
function exitApp() {
    window.location.href = '/logout';
}

document.addEventListener('DOMContentLoaded', () => {
    const appsGrid = document.getElementById('apps-grid');
    const searchBar = document.getElementById('search-bar');
    const themeToggle = document.getElementById('theme-toggle');

    let allApps = [];

    // Carregar os dados dos aplicativos do apps.json
    fetch('apps.json')
        .then(response => response.json())
        .then(data => {
            allApps = data;
            displayApps(allApps);
        });

    // Função para exibir os aplicativos
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

    // Funcionalidade de pesquisa
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredApps = allApps.filter(app => 
            app.title.toLowerCase().includes(searchTerm) || 
            app.description.toLowerCase().includes(searchTerm)
        );
        displayApps(filteredApps);
    });

    // Alternador de tema
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        // Salvar a preferência do tema (opcional)
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Carregar o tema salvo
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
});
