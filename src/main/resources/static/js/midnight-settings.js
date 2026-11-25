document.addEventListener('DOMContentLoaded', () => {
    initializeUsernameEditor();
});

function initializeUsernameEditor() {
    const input = document.getElementById('username');
    const editor = document.getElementById('usernameEditor');
    const current = document.getElementById('currentUsername');
    const button = document.getElementById('usernameButton');
    const cancel = document.getElementById('cancelUsernameButton');
    if (!input || !editor || !current || !button || !cancel) {
        return;
    }

    button.addEventListener('click', () => {
        if (editor.hidden) {
            current.hidden = true;
            editor.hidden = false;
            cancel.hidden = false;
            button.innerHTML ='<i data-lucide="save"></i> Save Username';
            refreshSettingsIcons();
            input.focus();
            input.select();
            return;
        }
        if (input.value.trim() === '') {
            input.setCustomValidity('Please enter a username.');
            input.reportValidity();

            return;
        }
        input.setCustomValidity('');
        button.form.requestSubmit();
    });

    cancel.addEventListener('click', () => {
        input.value = input.defaultValue;
        input.setCustomValidity('');
        editor.hidden = true;
        cancel.hidden = true;
        current.hidden = false;
        button.innerHTML ='<i data-lucide="pencil"></i> Edit Username';
        refreshSettingsIcons();
        button.focus();
    });

    input.addEventListener('input', () => {
        input.setCustomValidity('');
    });
}

function refreshSettingsIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
