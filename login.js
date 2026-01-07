document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('token');

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');

    const loginButton = document.getElementById('login-button');
    const loginText = document.getElementById('login-text');
    const loginLoading = document.getElementById('login-loading');

    let progressInterval = null;
    let maxLoadingTimeout = null;

    // 👁️ Mostrar / ocultar senha
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? '🙈' : '👁️';
    });

    const showError = message => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    };

    const startLoading = () => {
        loginButton.disabled = true;
        loginText.style.display = 'none';
        loginLoading.style.display = 'inline';
        errorMessage.style.display = 'none';

        // ⛔ GARANTIA: loading nunca passa de 20s
        maxLoadingTimeout = setTimeout(() => {
            stopLoading();
            showError('Servidor indisponível no momento. Tente novamente.');
        }, 20000);
    };

    const stopLoading = () => {
        clearTimeout(maxLoadingTimeout);
        clearInterval(progressInterval);

        loginButton.disabled = false;
        loginText.style.display = 'inline';
        loginLoading.style.display = 'none';
    };

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        startLoading();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const API_BASE_URL = 'https://stilloshowitworks.onrender.com';

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Credenciais inválidas');
            }

            const result = await response.json();

            if (!result.token) {
                throw new Error('Token não recebido');
            }

            localStorage.setItem('token', result.token);

            // ✅ SUCESSO GARANTIDO
            window.location.href = '/';

        } catch (err) {
            console.error(err);
            stopLoading();

            if (err.name === 'AbortError') {
                showError('Tempo de resposta excedido. Tente novamente.');
            } else {
                showError(err.message || 'Erro ao autenticar.');
            }
        }
    });
});
