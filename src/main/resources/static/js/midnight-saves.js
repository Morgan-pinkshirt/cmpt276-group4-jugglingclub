document.addEventListener('DOMContentLoaded', () => {
    initializeSavedProjects();
    initializeProjectImport();
    initializeProjectDeletion();
});

function initializeSavedProjects() {
    const gallery = document.getElementById('projectGallery');
    if (!gallery) return;
    const cards = Array.from(gallery.querySelectorAll('.mc-save-card'));
    const searchInput = document.getElementById('projectSearch');
    const typeFilter = document.getElementById('projectTypeFilter');
    const resetButton = document.getElementById('clearProjectFilters');
    const resultsCount = document.getElementById('projectResultsCount');
    const emptyState = document.getElementById('projectSearchEmpty');
    const totalCount = cards.length;
    const productCount = cards.filter(card => card.dataset.projectType === 'product').length;
    const synchroCount = cards.filter(card => card.dataset.projectType === 'synchro').length;
    setSavedProjectCount(
        'totalProjectCount',
        totalCount
    );
    setSavedProjectCount(
        'productProjectCount',
        productCount
    );
    setSavedProjectCount(
        'synchroProjectCount',
        synchroCount
    );

    if (!searchInput || !typeFilter ||
        !resetButton || !resultsCount ||
        !emptyState) {
        return;
    }
    const entries = cards.map(card => {
        const projectName =
            card.dataset.projectName || '';
        const projectType =
            card.dataset.projectType || '';
        const projectId =
            card.dataset.projectId || '';
        const propType =
            card.querySelector('.saved-project-preview')
                ?.dataset.productType || '';
        return {
            card,
            projectType,
            searchableText: [
                projectName,
                projectType,
                projectId,
                propType
            ].join(' ').toLowerCase()
        };
    });

    function applyProjectFilters() {
        const searchTerms = searchInput.value
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        const selectedType = typeFilter.value;
        let visibleCount = 0;
        entries.forEach(entry => {
            const matchesSearch = searchTerms.every(
                term => entry.searchableText.includes(term)
            );
            const matchesType =
                selectedType === 'all' ||
                entry.projectType === selectedType;
            const visible =
                matchesSearch && matchesType;
            entry.card.hidden = !visible;
            if (visible) visibleCount++;
        });
        emptyState.hidden =
            cards.length === 0 || visibleCount !== 0;
        resultsCount.textContent =
            `Showing ${visibleCount} of ${cards.length} projects`;
    }
    searchInput.addEventListener(
        'input',
        applyProjectFilters
    );
    typeFilter.addEventListener(
        'change',
        applyProjectFilters
    );

    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        typeFilter.value = 'all';
        applyProjectFilters();
        searchInput.focus();
    });
    applyProjectFilters();
}

function setSavedProjectCount(id, count) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = count;
    }
}

function showSavedProjectError(message) {
    const status = document.getElementById(
        'synchroProjectActionMessage'
    );
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    status.scrollIntoView({
        block: 'nearest'
    });
}

function clearSavedProjectError() {
    const status = document.getElementById(
        'synchroProjectActionMessage'
    );
    if (!status) return;
    status.textContent = '';
    status.hidden = true;
}

async function getSavedProjectResponseError(response) {
    try {
        const details = await response.json();
        if (typeof details.error === 'string') {
            return details.error;
        }
    } catch (_) {
    }
    return `Project request failed (${response.status}).`;
}

function initializeProjectImport() {
    const importForm = document.getElementById('importProjectForm');
    const importInput = document.getElementById('importProjectFile');
    const importButton = document.getElementById('importProjectButton');
    if (!importForm || !importInput || !importButton) {
        return;
    }
    importForm.addEventListener('submit', async event => {
        const file = importInput.files?.[0];
        if (!file) return;
        const filename = file.name.toLowerCase();
        clearSavedProjectError();
        if (filename.endsWith('.json')) {
            return;
        }
        event.preventDefault();
        if (!filename.endsWith('.zip')) {
            showSavedProjectError(
                'Please select a JSON or ZIP project file.'
            );
            return;
        }
        importButton.disabled = true;
        importButton.textContent = 'Importing...';
        try {
            const response = await fetch(
                '/api/synchro-projects/import',
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: new FormData(importForm)
                }
            );
            if (!response.ok) {
                throw new Error(
                    await getSavedProjectResponseError(response)
                );
            }
            window.location.assign('/viewsavedprojects');
        } catch (error) {
            showSavedProjectError(
                error.message ||
                'Unable to import the Synchro project.'
            );
        } finally {
            importButton.disabled = false;
            importButton.innerHTML =
                '<i data-lucide="upload"></i> Import Project';
            refreshSavedProjectIcons();
        }
    });
}

function initializeProjectDeletion() {
    const dialog =
        document.getElementById('deleteProjectDialog');
    const nameElement =
        document.getElementById('deleteProjectName');
    const cancelButton =
        document.getElementById('cancelProjectDelete');
    const confirmButton =
        document.getElementById('confirmProjectDelete');
    const productForms = document.querySelectorAll(
        '.mc-save-delete-form'
    );
    const synchroButtons = document.querySelectorAll(
        '.delete-synchro-project'
    );
    const supportsDialog =
        dialog &&
        nameElement &&
        cancelButton &&
        confirmButton &&
        typeof dialog.showModal === 'function';
    let pendingAction = null;
    let approvedForm = null;
    function requestConfirmation(name, action) {
        if (!supportsDialog) {
            if (window.confirm(
                `Permanently delete ${name}?`
            )) {
                action();
            }
            return;
        }
        if (dialog.open) return;
        pendingAction = action;
        nameElement.textContent = name;
        dialog.showModal();
        cancelButton.focus();
    }
    productForms.forEach(form => {
        form.addEventListener('submit', event => {
            if (approvedForm === form) {
                approvedForm = null;
                return;
            }
            event.preventDefault();
            const name =
                form.dataset.projectName || 'this project';
            requestConfirmation(name, () => {
                approvedForm = form;
                form.requestSubmit();
            });
        });
    });
    synchroButtons.forEach(button => {
        button.addEventListener('click', () => {
            const name = button.dataset.projectName || 'this project';
            requestConfirmation(name, () => {
                deleteSynchroProject(button);
            });
        });
    });
    if (!supportsDialog) return;
    cancelButton.addEventListener('click', () => {
        pendingAction = null;
        dialog.close();
    });
    confirmButton.addEventListener('click', () => {
        const action = pendingAction;
        pendingAction = null;
        dialog.close();
        if (action) action();
    });
    dialog.addEventListener('close', () => {
        pendingAction = null;
    });
}

async function deleteSynchroProject(button) {
    const projectId = button.dataset.synchroId;
    if (!projectId || button.disabled) return;
    button.disabled = true;
    clearSavedProjectError();
    try {
        const response = await fetch(
            `/api/synchro-projects/${encodeURIComponent(projectId)}`,
            {
                method: 'DELETE',
                credentials: 'same-origin'
            }
        );
        if (!response.ok) {
            throw new Error(
                await getSavedProjectResponseError(response)
            );
        }
        window.location.reload();
    } catch (error) {
        showSavedProjectError(
            error.message ||
            'Unable to delete the Synchro project.'
        );
        button.disabled = false;
    }
}

function refreshSavedProjectIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
