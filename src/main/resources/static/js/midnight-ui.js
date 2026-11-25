document.addEventListener('DOMContentLoaded', () => {
    function refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    refreshIcons();
    document.querySelectorAll('[data-password-toggle]')
        .forEach(button => {
            const input = document.getElementById(
                button.dataset.passwordToggle
            );
            if (!input) return;
            button.addEventListener('click', () => {
                const showPassword = input.type === 'password';
                input.type = showPassword
                    ? 'text'
                    : 'password';
                button.setAttribute(
                    'aria-label',
                    showPassword
                        ? 'Hide password'
                        : 'Show password'
                );
                button.setAttribute(
                    'aria-pressed',
                    String(showPassword)
                );
                button.innerHTML = showPassword
                    ? '<i data-lucide="eye-off"></i>'
                    : '<i data-lucide="eye"></i>';
                refreshIcons();
            });
        });
});
