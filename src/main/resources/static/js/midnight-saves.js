document.addEventListener('DOMContentLoaded', () => {
    initializeSavedProjects();
    initializeProjectImport();
    initializeProjectDeletion();
    initializeAdminSavedProjects();
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

function initializeAdminSavedProjects() {
    const tableBody = document.getElementById(
        'adminProjectsTableBody'
    );
    if (!tableBody) return;
    const searchInput = document.getElementById(
        'adminProjectSearch'
    );
    const typeFilter = document.getElementById(
        'adminProjectType'
    );
    const ownerFilter = document.getElementById(
        'adminProjectOwner'
    );
    const resetButton = document.getElementById(
        'resetAdminProjectFilters'
    );
    const resultsCount = document.getElementById(
        'adminProjectResults'
    );
    const emptyState = document.getElementById(
        'adminProjectsEmpty'
    );
    const emptyTitle = document.getElementById(
        'adminProjectsEmptyTitle'
    );
    const emptyDescription = document.getElementById(
        'adminProjectsEmptyDescription'
    );

    if (!searchInput || !typeFilter ||
        !ownerFilter || !resetButton ||
        !resultsCount || !emptyState ||
        !emptyTitle || !emptyDescription) {
        return;
    }
    const rows = Array.from(
        tableBody.querySelectorAll(
            '.mc-admin-project-row'
        )
    );
    const projects = rows.map(row => {
        const name =
            row.dataset.projectName || '';
        const type =
            row.dataset.projectType || '';
        const owner =
            row.dataset.projectOwner || '';
        const id =
            row.dataset.projectId || '';
        const propType =
            row.querySelector('.saved-project-preview')
                ?.dataset.productType || '';
        return {
            row,
            name,
            type,
            owner,
            id,
            searchableText: [
                name,
                type,
                owner,
                id,
                propType
            ].join(' ').toLowerCase()
        };
    });
    const owners = Array.from(
        new Set(
            projects
                .map(project => project.owner)
                .filter(owner =>
                    owner.trim().length > 0
                )
        )
    ).sort((a, b) =>
        a.localeCompare(b, undefined, {
            sensitivity: 'base'
        })
    );
    setSavedProjectCount(
        'adminTotalProjects',
        projects.length
    );
    setSavedProjectCount(
        'adminProductProjects',
        projects.filter(project =>
            project.type === 'product'
        ).length
    );
    setSavedProjectCount(
        'adminSynchroProjects',
        projects.filter(project =>
            project.type === 'synchro'
        ).length
    );
    setSavedProjectCount(
        'adminProjectOwners',
        owners.length
    );
    ownerFilter.replaceChildren(
        new Option('All Owners', '')
    );
    owners.forEach(owner => {
        const option = document.createElement(
            'option'
        );
        option.value = owner;
        option.textContent = owner;
        ownerFilter.appendChild(option);
    });
    function applyAdminProjectFilters() {
        const searchTerms = searchInput.value
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        const selectedType =
            typeFilter.value;
        const selectedOwner =
            ownerFilter.value;
        let visibleCount = 0;
        projects.forEach(project => {
            const matchesSearch =
                searchTerms.every(term =>
                    project.searchableText.includes(term)
                );
            const matchesType =
                selectedType === 'all' ||
                project.type === selectedType;
            const matchesOwner =
                selectedOwner === '' ||
                project.owner === selectedOwner;
            const visible =
                matchesSearch &&
                matchesType &&
                matchesOwner;
            project.row.hidden = !visible;
            if (visible) {
                visibleCount++;
            }
        });
        emptyState.hidden =
            visibleCount !== 0;
        if (projects.length === 0) {
            emptyTitle.textContent =
                'No Saved Projects';
            emptyDescription.textContent =
                'There are no saved projects across the club yet.';
        } else {
            emptyTitle.textContent =
                'No Matching Projects';
            emptyDescription.textContent =
                'Try another search or change your filters.';
        }
        resultsCount.textContent =
            `Showing ${visibleCount} of ${projects.length} projects`;
    }

    searchInput.addEventListener(
        'input',
        applyAdminProjectFilters
    );
    typeFilter.addEventListener(
        'change',
        applyAdminProjectFilters
    );
    ownerFilter.addEventListener(
        'change',
        applyAdminProjectFilters
    );
    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        typeFilter.value = 'all';
        ownerFilter.value = '';
        applyAdminProjectFilters();
        searchInput.focus();
    });
    applyAdminProjectFilters();
}
