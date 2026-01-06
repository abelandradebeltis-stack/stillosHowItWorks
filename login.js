
document.addEventListener('DOMContentLoaded', () => {
    // --- Verificação de Autenticação Existente ---
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'authenticated') {
                window.location.href = '/';
            }
        })
        .catch(error => console.error('Erro ao verificar autenticação:', error));

    // --- Lógica do Formulário de Login ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');

            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    window.location.href = '/';
                } else {
                    errorMessage.textContent = data.message || 'Erro ao fazer login. Tente novamente.';
                }
            })
            .catch(error => {
                console.error('Erro ao fazer login:', error);
                errorMessage.textContent = 'Ocorreu um erro inesperado. Verifique o console para mais detalhes.';
            });
        });
    }

    // --- Lógica para Alternar a Visibilidade da Senha ---
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            // Alterna o tipo do campo de senha
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Alterna o ícone do olho
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
});
