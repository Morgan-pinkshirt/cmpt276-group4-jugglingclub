import {
    GUIDE_PET_CONFIG,
    getCurrentPage as getOriginalCurrentPage,
    isGuidePetEnabled as isOriginallyEnabled
} from "./guide-pet-config-base.js";

export * from "./guide-pet-config-base.js";

const navigationSelectors = [
    'a[href]:not([href=""]):not([href="#"]):not([href^="javascript:" i]):not([download]):not([href^="/exportproject"]):not([href^="/api/synchro-projects/"][href*="/export"]):not([href^="mailto:" i]):not([href^="tel:" i])',
    'button[data-simulator="2d"]',
    'button[data-simulator="3d"]',
    'form[action="/2d-sim"] button[type="submit"]',
    'form[action="/customsave"] button[type="submit"]',
    '[data-guide-gaze]'
];

Object.assign(GUIDE_PET_CONFIG.gaze, {
    enabled: true,
    selector: navigationSelectors.join(", "),
    continuousMouseTracking: false,
    resetOnLeave: true
});

GUIDE_PET_CONFIG.pageBehavior.synchro = {
    defaultDocked: true,
    dockSide: "right",
    dockBottom: 20,
    showWelcome: false,
    rememberPlacement: false
};

export function getCurrentPage(...args) {
    const page = getOriginalCurrentPage(...args);

    if (page === "momentEditor") {
        return null;
    }

    return page;
}

export function isGuidePetEnabled(
    role,
    page = getCurrentPage()
) {
    if (!page || page === "momentEditor") {
        return false;
    }

    return isOriginallyEnabled(role, page);
}

