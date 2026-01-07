document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('token');

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');

    const loginButton = document.getElementById('login-button');
    const loginText = document.getElementById('login-text');
    const loginLoading = document.getElementById('login-loading');

    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? '🙈' : '👁️';
    });

    const showError = message => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    };

    const setLoading = isLoading => {
        loginButton.disabled = isLoading;
        loginText.style.display = isLoading ? 'none' : 'inline';
        loginLoading.style.display = isLoading ? 'inline' : 'none';
    };

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        setLoading(true);

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const API_BASE_URL = 'https://stilloshowitworks.onrender.com';

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok && result.token) {
                localStorage.setItem('token', result.token);
                window.location.href = '/';
            } else {
                setLoading(false);
                showError(result.message || 'Usuário ou senha inválidos.');
            }

        } catch (err) {
            console.error(err);
            setLoading(false);
            showError('Erro de rede. Tente novamente.');
        }
    });
});
