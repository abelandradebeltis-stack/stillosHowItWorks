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

    let progress = 0;
    let progressInterval = null;
    let loadingTimeout = null;

    /* 👁️ MOSTRAR / OCULTAR SENHA */
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? '🙈' : '👁️';
    });

    const showError = message => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    };

    /* 🔄 INICIA LOADING */
    const startLoading = () => {
        loginButton.disabled = true;
        loginText.style.display = 'none';
        errorMessage.style.display = 'none';

        loadingContainer.classList.remove('hidden');

        progress = 1;
        progressFill.style.width = '1%';
        loadingText.textContent = 'Conectando ao servidor...';

        progressInterval = setInterval(() => {
            if (progress < 95) {
                progress += Math.random() * 4 + 1;
                progressFill.style.width = `${progress}%`;
            }
        }, 300);

        // ⏳ Feedback se demorar
        loadingTimeout = setTimeout(() => {
            loadingText.textContent = 'Servidor acordando, aguarde...';
        }, 3000);
    };

    /* ✅ FINALIZA LOADING */
    const finishLoading = () => {
        clearInterval(progressInterval);
        clearTimeout(loadingTimeout);

        progressFill.style.width = '100%';
        loadingText.textContent = 'Autenticado com sucesso!';
    };

    /* ❌ ERRO */
    const stopLoading = () => {
        clearInterval(progressInterval);
        clearTimeout(loadingTimeout);

        loginButton.disabled = false;
        loginText.style.display = 'inline';

        loadingContainer.classList.add('hidden');
        progressFill.style.width = '0%';
    };

    /* 🚀 SUBMIT */
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        startLoading();

        try {
            const API_BASE_URL = 'https://stilloshowitworks.onrender.com';

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            loadingText.textContent = 'Validando credenciais...';

            const result = await response.json();

            if (response.ok && result.token) {
                finishLoading();
                localStorage.setItem('token', result.token);

                setTimeout(() => {
                    window.location.href = '/';
                }, 700);
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
