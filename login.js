document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('token');

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');

    const loginButton = document.getElementById('login-button');
    const loginText = document.getElementById('login-text');

    const loadingContainer = document.getElementById('login-loading-container');
    const loadingText = document.getElementById('login-loading-text');
    const progressFill = document.getElementById('progress-fill');

    let progressInterval = null;
    let progress = 0;

    /* 👁️ MOSTRAR / OCULTAR SENHA */
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? '🙈' : '👁️';
    });

    /* ❌ ERRO */
    const showError = message => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    };

    /* 🔄 LOADING */
    const startLoading = () => {
        loginButton.disabled = true;
        loginText.style.display = 'none';

        loadingContainer.classList.remove('hidden');
        progress = 5;
        progressFill.style.width = '5%';
        loadingText.textContent = 'Conectando ao servidor...';

        progressInterval = setInterval(() => {
            if (progress < 85) {
                progress += Math.random() * 6;
                progressFill.style.width = `${progress}%`;
            }
        }, 400);
    };

    const finishLoading = () => {
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        loadingText.textContent = 'Autenticado com sucesso!';
    };

    const stopLoading = () => {
        clearInterval(progressInterval);
        loginButton.disabled = false;
        loginText.style.display = 'inline';

        loadingContainer.classList.add('hidden');
        progressFill.style.width = '0%';
    };

    /* 🚀 SUBMIT */
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        startLoading();

        try {
            const API_BASE_URL = 'https://stilloshowitworks.onrender.com';

            loadingText.textContent = 'Validando credenciais...';

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            loadingText.textContent = 'Processando resposta...';

            const result = await response.json();

            if (response.ok && result.token) {
                finishLoading();
                localStorage.setItem('token', result.token);

                setTimeout(() => {
                    window.location.href = '/';
                }, 600);
            } else {
                stopLoading();
                showError(result.message || 'Usuário ou senha inválidos.');
            }

        } catch (err) {
            console.error(err);
            stopLoading();
            showError('Erro de rede. Tente novamente.');
        }
    });
});
