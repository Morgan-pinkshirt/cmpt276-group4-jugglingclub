
import {
    GUIDE_PET_DIALOGUES,
    COMMON_EXPRESSIONS,
    RARE_EXPRESSIONS,
    RANDOM_EXPRESSIONS,
    EXCLUDED_RANDOM_EXPRESSIONS,
    getPageDialogues,
    getInteractionDialogue
} from "./guide-pet-dialogues.js";

export const GUIDE_PET_CONFIG = {

    appearance: {

        modelPath:
            "/live2d/models/guide-pet/c_0120.model3.json",

        defaultSize: "medium",

        sizes: {
            small: 200,
            medium: 300,
            large: 450
        },

        scaleFactor: 0.9,

        defaultPosition: {
            right: 20,
            bottom: 20
        },

        screenMargin: 10,

        defaultHidden: false
    },

    docking: {

        enabled: true,

        threshold: 30,

        visibleRatio: 0.20,

        hoverExtraRatio: 0.08,

        animationDuration: 400,

        hoverDuration: 250,

        enableHoverPeek: true,

        restoreOnClick: true,

        restoreOnDrag: true,

        dragRestoreRatio: 0.30,

        dragClickThreshold: 6,

        progressiveRotation: true,

        snapBackOnIncompleteDrag: true,

        restoreNearEdge: true,

        restoreEdgeMargin: 20,

        closeDialogueOnDock: true,

        pauseIdleOnDock: true,

        disableGazeOnDock: true
    },

    interaction: {

        welcomeDuration: 8000,

        dialogueDuration: 6000,

        expressionDuration: 4000,

        clickCooldown: 500,

        dragThreshold: 6,

        enableDragging: true,

        enableResizing: true,

        enableHide: true,

        rememberPosition: true,

        rememberSize: true,

        rememberVisibility: true
    },

    resize: {

        enabled: true,

        showDialogue: true,

        showExpression: true,

        reactionDuration: 3500,

        largerExpression: "star-eyes",

        smallerExpression: "crying",

        reactWhenSizeUnchanged: false,

        pauseIdleDuringReaction: true
    },

    onboarding: {

        enabled: true,

        allowedRoles: [
            "MEMBER"
        ],

        allowedPages: [
            "home"
        ],

        showAutomatically: true,

        expandWhenDocked: true,

        persistentDialogue: true,

        sequentialTips: true,

        allowSkip: true,

        allowVideoTutorials: true,

        pauseIdleDuringOnboarding: true,

        suppressRegularWelcome: true,

        completionDuration: 5000,

        persistence: "account",

        endpoints: {

            status: "/api/guide-pet/status",

            complete: "/api/guide-pet/onboarding/complete"
        }
    },

    pageBehavior: {

        default: {

            defaultDocked: false,

            dockSide: "right",

            dockBottom: 20,

            showWelcome: true,

            rememberPlacement: true
        },

        editor3d: {

            defaultDocked: true,

            dockSide: "right",

            dockBottom: 20,

            showWelcome: false,

            rememberPlacement: false
        },

        savedProductEditor: {

            defaultDocked: true,

            dockSide: "right",

            dockBottom: 20,

            showWelcome: false,

            rememberPlacement: false
        },

        momentEditor: {

            defaultDocked: true,

            dockSide: "right",

            dockBottom: 20,

            showWelcome: false,

            rememberPlacement: false
        }
    },

    gaze: {

        enabled: true,

        selector: "[data-guide-gaze]",

        continuousMouseTracking: true,

        resetOnLeave: true
    },

    conversation: {

        enabled: true,

        combinePageDialogues: true,

        avoidConsecutiveDialogueRepeats: true,

        avoidConsecutiveExpressionRepeats: true,

        resetExpressionBeforeDialogue: true,

        resetExpressionAfterDialogue: true,

        randomExpressions: RANDOM_EXPRESSIONS,

        excludedExpressions: EXCLUDED_RANDOM_EXPRESSIONS
    },

    idle: {

        enabled: true,

        defaultMotion: "Idle",

        interval: {
            min: 30000,
            max: 30000
        },

        inactivityTimeout: 30000,

        resetOnMouseMove: true,

        expressionDuration: {
            min: 3000,
            max: 6000
        },

        commonExpressions: COMMON_EXPRESSIONS,

        rareExpressions: RARE_EXPRESSIONS,

        excludedExpressions: EXCLUDED_RANDOM_EXPRESSIONS,

        randomMotions: [
            "AlternativeIdle",
            "BlowBubbles",
            "SimpleSelfie",
            "Selfie"
        ],

        probability: {

            commonExpression: 0.65,

            rareExpression: 0.25,

            motion: 0.10
        },

        avoidConsecutiveRepeats: true,

        resetExpressionBeforeIdle: true,

        resetExpressionAfterIdle: true,

        showDialogueDuringIdle: false,

        pauseDuringInteraction: true,

        pauseDuringNavigationHover: false,

        pauseDuringOnboarding: true,

        pauseDuringResize: true,

        pauseDuringDockDrag: true,

        pauseWhenHidden: true,

        pauseWhenPageInactive: true,

        motionTimeout: 15000
    },

    navigation: {

        home: {
            label: "Home",
            url: "/home"
        },

        editor3d: {
            label: "Open 3D Editor",
            url: "/simulator"
        },

        editor2d: {
            label: "Open 2D Editor",
            url: "/2d-sim"
        },

        synchro: {
            label: "Open Synchro",
            url: "/synchro.html"
        },

        savedProjects: {
            label: "Saved Projects",
            url: "/viewsavedprojects"
        },

        settings: {
            label: "Account Settings",
            url: "/settings"
        },

        register: {
            label: "Create an Account",
            url: "/userregister"
        },

        login: {
            label: "Log In",
            url: "/userlogin"
        },

        tutorials: {

            label: "Video Tutorials",

            url: "/tutorials",

            openInNewTab: true,

            allowEmbeddedEditor: false
        },

        demoVideo: {

            label: "Watch Demo",

            url: null,

            openInNewTab: true
        }
    },

    tutorials: {

        enabled: true,

        allowedRoles: [
            "MEMBER"
        ],

        showInHelpMenu: true,

        showDuringOnboarding: true,

        openInNewTab: true,

        navigationId: "tutorials"
    },

    roles: {

        GUEST: {

            enabled: true,

            allowedPages: [
                "home"
            ]
        },

        MEMBER: {

            enabled: true,

            allowedPages: [
                "home",
                "editor3d",
                "editor2d",
                "savedProductEditor",
                "synchro",
                "savedProjects",
                "settings",
                "tutorials"
            ]
        },

        ADMIN: {

            enabled: false,

            allowedPages: []
        },

        SUPER_ADMIN: {

            enabled: false,

            allowedPages: []
        }
    },

    pages: {

        "/": "home",

        "/home": "home",

        "/simulator": "editor3d",

        "/2d-sim": "editor2d",

        "/customsave": "savedProductEditor",

        "/synchro.html": "synchro",

        "/viewsavedprojects": "savedProjects",

        "/settings": "settings",

        "/tutorials": "tutorials"
    },

    pageActions: {

        GUEST: {

            home: [
                "register",
                "login",
                "demoVideo"
            ]
        },

        MEMBER: {

            home: [
                "editor3d",
                "editor2d",
                "synchro",
                "savedProjects",
                "settings"
            ],

            editor3d: [
                "editor2d",
                "synchro",
                "savedProjects",
                "home"
            ],

            editor2d: [
                "editor3d",
                "savedProjects",
                "home"
            ],

            savedProductEditor: [
                "savedProjects",
                "synchro",
                "home"
            ],

            synchro: [
                "editor3d",
                "savedProjects",
                "home"
            ],

            momentEditor: [],

            savedProjects: [
                "editor3d",
                "editor2d",
                "synchro",
                "home"
            ],

            settings: [
                "home",
                "savedProjects"
            ],

            tutorials: [
                "home",
                "editor3d",
                "editor2d",
                "synchro"
            ]
        }
    },

    generalDialogues: GUIDE_PET_DIALOGUES.general,

    dialogues: GUIDE_PET_DIALOGUES.pages,

    ui: {

        petName: "Your Assistant",

        menu: {

            talk: "Talk",

            help: "Need Help?",

            navigation: "Go To",

            size: "Size",

            hide: "Hide",

            close: "Close",

            back: "Back",

            tutorials: "Video Tutorials"
        },

        sizes: {

            small: "Small",

            medium: "Medium",

            large: "Large"
        },

        buttons: {

            restore: "Show Assistant",

            resetPosition: "Reset Position",

            closeDialogue: "Close Dialogue",

            nextTip: "Next Tip",

            previousTip: "Previous Tip",

            finish: "Finish",

            tutorials: "Video Tutorials"
        },

        docking: {

            hoverHint: "Click or drag to bring me back",

            left: "Hide on Left",

            right: "Hide on Right"
        },

        onboarding: {

            accept: "Yes, please!",

            skip: "Skip for now",

            next: "Next Tip",

            previous: "Previous Tip",

            finish: "Finish",

            tutorials: "Video Tutorials",

            progress: "Tip {current} of {total}"
        },

        messages: {

            loading: "Loading...",

            loadFailed: "Assistant unavailable.",

            noDialogue: "I'm here if you need me!",

            noTips: "You're ready to go!",

            noActions: "No destinations available.",

            onboardingSaveFailed:
                "I couldn't save your tutorial progress. Please try again.",

            tutorialsUnavailable:
                "The video tutorials are not available yet.",

            navigationUnavailable:
                "Please use the editor's navigation controls."
        }
    }
};

export function getCurrentPage(
    pathname = window.location.pathname,
    search = window.location.search
) {

    const normalizedPath =
        pathname.replace(/\/+$/, "") || "/";

    const params =
        new URLSearchParams(search);

    if (params.has("embed")) {

        return null;
    }

    return GUIDE_PET_CONFIG.pages[normalizedPath]
        || null;
}

export function getPageBehavior(
    page = getCurrentPage()
) {

    const behavior =
        GUIDE_PET_CONFIG.pageBehavior;

    return {

        ...behavior.default,

        ...(behavior[page] || {})
    };
}

export function shouldDefaultDock(
    page = getCurrentPage()
) {

    return (

        GUIDE_PET_CONFIG.docking.enabled &&

        getPageBehavior(page).defaultDocked
    );
}

export function shouldRememberPlacement(
    page = getCurrentPage()
) {

    return getPageBehavior(page).rememberPlacement;
}

export function isGuidePetEnabled(
    role,
    page = getCurrentPage()
) {

    if (!page || page === "momentEditor") {

        return false;
    }

    const roleConfig =
        GUIDE_PET_CONFIG.roles[role];

    if (!roleConfig || !roleConfig.enabled) {

        return false;
    }

    return roleConfig.allowedPages.includes(page);
}

export function getPageConfig(
    role,
    page = getCurrentPage()
) {

    if (!isGuidePetEnabled(role, page)) {

        return null;
    }

    const dialogues =
        getPageDialogues(role, page) || {};

    const actions =
        GUIDE_PET_CONFIG.pageActions[role]?.[page]
        || [];

    return {

        ...dialogues,

        actions: [...actions]
    };
}

export function pickRandom(
    items,
    previous = null
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return null;
    }

    const available = items.filter(

        item => item !== previous
    );

    const pool =

        available.length > 0
            ? available
            : items;

    const index = Math.floor(

        Math.random() * pool.length
    );

    return pool[index];
}

export function getRandomDialogue(
    role,
    page,
    type,
    previousText = null,
    previousExpression = null,
    availableExpressions = null
) {

    if (!isGuidePetEnabled(role, page)) {

        return null;
    }

    const conversation =
        GUIDE_PET_CONFIG.conversation;

    return getInteractionDialogue(

        role,

        page,

        type,

        {

            previousText:
                conversation.avoidConsecutiveDialogueRepeats
                    ? previousText
                    : null,

            previousExpression:
                conversation.avoidConsecutiveExpressionRepeats
                    ? previousExpression
                    : null,

            availableExpressions:
                availableExpressions
        }
    );
}

export function getNavigationActions(
    role,
    page = getCurrentPage()
) {

    if (!isGuidePetEnabled(role, page)) {

        return [];
    }

    const actions =
        GUIDE_PET_CONFIG.pageActions[role]?.[page]
        || [];

    return actions

        .map(key => {

            const action =
                GUIDE_PET_CONFIG.navigation[key];

            if (!action || !action.url) {

                return null;
            }

            return {

                id: key,

                ...action
            };
        })

        .filter(Boolean);
}

export function getNavigationAction(id) {

    const action =
        GUIDE_PET_CONFIG.navigation[id];

    if (!action || !action.url) {

        return null;
    }

    return {

        id,

        ...action
    };
}

export function isTutorialsEnabled(role) {

    const tutorials =
        GUIDE_PET_CONFIG.tutorials;

    return (

        tutorials.enabled &&

        tutorials.allowedRoles.includes(role) &&

        Boolean(
            getNavigationAction(
                tutorials.navigationId
            )
        )
    );
}

export function getTutorialNavigationAction(role) {

    if (!isTutorialsEnabled(role)) {

        return null;
    }

    const tutorials =
        GUIDE_PET_CONFIG.tutorials;

    const action =
        getNavigationAction(
            tutorials.navigationId
        );

    return {

        ...action,

        openInNewTab:
            tutorials.openInNewTab
    };
}

export function isOnboardingEnabled(
    role,
    page = getCurrentPage()
) {

    const onboarding =
        GUIDE_PET_CONFIG.onboarding;

    return (

        onboarding.enabled &&

        isGuidePetEnabled(role, page) &&

        onboarding.allowedRoles.includes(role) &&

        onboarding.allowedPages.includes(page)
    );
}

export function getDockDragThreshold(size) {

    const docking =
        GUIDE_PET_CONFIG.docking;

    if (!Number.isFinite(size) || size <= 0) {

        return 0;
    }

    return Math.max(

        docking.dragClickThreshold + 1,

        Math.round(
            size * docking.dragRestoreRatio
        )
    );
}

export function randomBetween(min, max) {

    return Math.floor(

        Math.random() * (max - min + 1)

    ) + min;
}

export function getPetSize(sizeName) {

    const appearance =
        GUIDE_PET_CONFIG.appearance;

    return appearance.sizes[sizeName]

        || appearance.sizes[appearance.defaultSize];
}
