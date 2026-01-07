document.addEventListener('DOMContentLoaded', () => {
    // 🧹 Limpa token antigo ao abrir a tela de login
    localStorage.removeItem('token');

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');

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

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value.trim();

        try {
            const API_BASE_URL = 'https://stilloshowitworks.onrender.com';

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok && result.token) {
                localStorage.setItem('token', result.token);

                // ✅ redirecionamento seguro
                window.location.href = '/index.html';
            } else {
                showError(result.message || 'Usuário ou senha inválidos.');
            }

        } catch (err) {
            console.error(err);
            showError('Erro de rede. Tente novamente.');
        }
    });
});
