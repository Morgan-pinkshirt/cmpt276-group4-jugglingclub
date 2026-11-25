document.addEventListener('DOMContentLoaded', () => {

    const simulatorRoutes = {
        '2d': '/2d-sim',
        '3d': '/simulator'
    };
    const propMapping = {
        '2d': {
            club: 'club',
            ball: 'club',
            staff: 'club'
        },
        '3d': {
            club: 'club',
            ball: 'ball',
            staff: 'staff'
        }
    };
    const defaultProject = {
        UID: 'new',
        projectname: 'My Project',
        productType: 'club',
        productColor: '#ffffff',
        bodyColor: '#808080',
        handleColor: '#ffffff',
        ballColor: '#9f1ad3',
        brightness: 1,
        saturation: 1,
        effect: 'none'
    };

    function launchSimulator(
        simulator,
        prop,
        effect,
        projectName
    ) {
        const destination = simulatorRoutes[simulator];
        if (!destination) {
            console.error(
                'Invalid simulator:',
                simulator
            );
            return;
        }
        const selectedProp = propMapping[simulator][prop] || 'club';
        const isFallback = simulator === '2d' && selectedProp !== prop;
        const project = {
            ...defaultProject,
            productType: selectedProp,
            projectname: isFallback
                ? 'New Club'
                : projectName || 'My Project',
            effect: effect || 'none'
        };
        try {
            sessionStorage.setItem(
                'tempSelection',
                JSON.stringify(project)
            );
        } catch (error) {
            console.error(
                'Unable to transfer project:',
                error
            );
            const status = document.getElementById('mc-status');
            if (status) {
                status.textContent =
                    'Unable to load the preset. '
                    + 'Please enable browser session storage.';
            }
            return;
        }
        window.location.assign(destination);
    }

    document.querySelectorAll('[data-simulator]')
        .forEach(button => {
            button.addEventListener('click', () => {
                const {
                    simulator,
                    prop,
                    effect,
                    name
                } = button.dataset;
                launchSimulator(
                    simulator,
                    prop || 'club',
                    effect || 'none',
                    name || 'My Project'
                );
            });
        });
});