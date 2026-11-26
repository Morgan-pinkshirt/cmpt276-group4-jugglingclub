document.addEventListener('DOMContentLoaded', () => {
    initializeAccountDashboard();
    initializeAccountDeletion();
});

function initializeAccountDashboard() {
    const tableBody = document.getElementById('accountsTableBody');
    const searchInput = document.getElementById('accountSearch');
    const roleFilter = document.getElementById('roleFilter');
    const resetButton = document.getElementById('clearAccountFilters');
    const emptyState = document.getElementById('accountsEmpty');
    const resultsCount = document.getElementById('accountResultsCount');
    if (!tableBody || !searchInput || !roleFilter ||
        !resetButton || !emptyState || !resultsCount) {
        return;
    }
    const rows = Array.from(
        tableBody.querySelectorAll('.mc-admin-account-row')
    );
    updateAccountStatistics(rows);

    const accountEntries = rows.map(row => {
        const username =
            row.querySelector('.mc-admin-username')
                ?.textContent.trim() || '';
        const email =
            row.querySelector('.mc-admin-email')
                ?.textContent.trim() || '';
        const roleLabel =
            row.querySelector('.mc-admin-role')
                ?.textContent.trim() || '';
        const role = row.dataset.role || '';
        return {
            row,
            role,
            searchableText: [
                username,
                email,
                roleLabel,
                role
            ].join(' ').toLowerCase()
        };
    });

    function applyFilters() {
        const searchTerms = searchInput.value
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        const selectedRole = roleFilter.value;
        let visibleCount = 0;
        accountEntries.forEach(entry => {
            const matchesSearch = searchTerms.every(
                term => entry.searchableText.includes(term)
            );
            const matchesRole =
                selectedRole === 'all' ||
                entry.role === selectedRole;
            const visible =
                matchesSearch && matchesRole;
            entry.row.hidden = !visible;
            if (visible) {
                visibleCount++;
            }
        });
        emptyState.hidden = visibleCount !== 0;
        resultsCount.textContent =
            `Showing ${visibleCount} of ${rows.length} accounts`;
    }
    searchInput.addEventListener('input', applyFilters);
    roleFilter.addEventListener('change', applyFilters);
    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        roleFilter.value = 'all';
        applyFilters();
        searchInput.focus();
    });
    applyFilters();
}

function updateAccountStatistics(rows) {
    const statistics = {
        total: rows.length,
        jester: 0,
        trickster: 0,
        joker: 0
    };

    rows.forEach(row => {
        switch (row.dataset.role) {
            case 'MEMBER':
                statistics.jester++;
                break;
            case 'ADMIN':
                statistics.trickster++;
                break;
            case 'SUPER_ADMIN':
                statistics.joker++;
                break;
        }
    });
    setAccountCount('totalCount', statistics.total);
    setAccountCount('jesterCount', statistics.jester);
    setAccountCount('tricksterCount', statistics.trickster);
    setAccountCount('jokerCount', statistics.joker);
}

function setAccountCount(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function initializeAccountDeletion() {
    const forms = document.querySelectorAll(
        '.mc-admin-delete-form'
    );
    const dialog = document.getElementById('deleteAccountDialog');
    const accountName = document.getElementById('deleteAccountName');
    const cancelButton = document.getElementById('cancelAccountDelete');
    const confirmButton = document.getElementById('confirmAccountDelete');
    if (!forms.length) {
        return;
    }

    if (!dialog || !accountName || !cancelButton ||
        !confirmButton ||
        typeof dialog.showModal !== 'function') {
        forms.forEach(form => {
            form.addEventListener('submit', event => {
                const username = form.dataset.username || 'this account';
                const confirmed = window.confirm(
                    `Permanently delete ${username}?`
                );
                if (!confirmed) {
                    event.preventDefault();
                }
            });
        });
        return;
    }
    let pendingForm = null;
    let approvedForm = null;
    forms.forEach(form => {
        form.addEventListener('submit', event => {
            if (approvedForm === form) {
                approvedForm = null;
                return;
            }
            event.preventDefault();
            if (dialog.open) {
                return;
            }
            pendingForm = form;
            accountName.textContent = form.dataset.username || 'this account';
            dialog.showModal();
            cancelButton.focus();
        });
    });
    
    cancelButton.addEventListener('click', () => {
        pendingForm = null;
        dialog.close();
    });

    confirmButton.addEventListener('click', () => {
        if (!pendingForm) {
            dialog.close();
            return;
        }
        const form = pendingForm;
        pendingForm = null;
        approvedForm = form;
        dialog.close();
        form.requestSubmit();
    });

    dialog.addEventListener('close', () => {
        pendingForm = null;
    });
}
