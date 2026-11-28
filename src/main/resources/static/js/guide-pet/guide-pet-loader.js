
import {
    GUIDE_PET_CONFIG,
    getCurrentPage,
    isGuidePetEnabled
} from "./guide-pet-config.js";


const LIVE2D_DEPENDENCIES = [

    {
        name: "Live2D Cubism Core",

        url: "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",

        isLoaded: () => Boolean(window.Live2DCubismCore)
    },

    {
        name: "PixiJS",

        url: "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js",

        isLoaded: () => Boolean(window.PIXI)
    },

    {
        name: "Pixi Live2D Display",

        url: "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js",

        isLoaded: () => Boolean(
            window.PIXI?.live2d?.Live2DModel
        )
    }
];


const loadedScripts = new Map();

let assistant = null;

let initializationTask = null;


// Wait until the page is ready.
function waitForDocument() {

    if (document.readyState !== "loading") {

        return Promise.resolve();
    }

    return new Promise(resolve => {

        document.addEventListener(
            "DOMContentLoaded",
            resolve,
            { once: true }
        );
    });
}


// Retrieve the current account configuration.
async function getAccountStatus() {

    const controller = new AbortController();

    const timeout = window.setTimeout(() => {

        controller.abort();

    }, 10000);

    try {

        const response = await fetch(

            GUIDE_PET_CONFIG.onboarding.endpoints.status,

            {
                method: "GET",

                credentials: "same-origin",

                cache: "no-store",

                redirect: "error",

                headers: {
                    "Accept": "application/json"
                },

                signal: controller.signal
            }
        );

        if (!response.ok) {

            throw new Error(
                `Account status request failed: ${response.status}`
            );
        }

        const status = await response.json();

        return validateAccountStatus(status);

    } finally {

        window.clearTimeout(timeout);
    }
}


// Validate the account configuration received from the server.
function validateAccountStatus(status) {

    const supportedRoles = [

        "GUEST",

        "MEMBER",

        "ADMIN",

        "SUPER_ADMIN"
    ];

    const supportedThemes = [

        "light",

        "dark",

        "purple"
    ];

    if (
        !status ||

        !supportedRoles.includes(status.role) ||

        typeof status.enabled !== "boolean"
    ) {

        throw new Error(
            "Invalid assistant account status."
        );
    }

    const theme =

        status.role === "GUEST"

            ? "light"

            : supportedThemes.includes(status.theme)

                ? status.theme

                : "purple";

    return {

        role: status.role,

        theme,

        enabled: status.enabled,

        onboardingPending:

            status.role === "MEMBER" &&

            status.onboardingPending === true
    };
}


// Load the assistant stylesheet only once.
function loadStylesheet() {

    const url = new URL(

        "/css/guide-pet.css",

        window.location.origin

    ).href;

    const existing = Array.from(

        document.querySelectorAll(
            'link[rel="stylesheet"]'
        )

    ).find(link => link.href === url);

    if (existing?.sheet) {

        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {

        const link =
            existing || document.createElement("link");

        let finished = false;

        const finish = error => {

            if (finished) {
                return;
            }

            finished = true;

            window.clearTimeout(timeout);

            link.removeEventListener("load", onLoad);

            link.removeEventListener("error", onError);

            if (error) {

                if (!existing) {
                    link.remove();
                }

                reject(error);

            } else {

                resolve();
            }
        };

        const onLoad = () => finish();

        const onError = () => finish(

            new Error(
                "Assistant stylesheet could not be loaded."
            )
        );

        const timeout = window.setTimeout(() => {

            finish(
                new Error(
                    "Assistant stylesheet loading timed out."
                )
            );

        }, 10000);

        link.addEventListener("load", onLoad);

        link.addEventListener("error", onError);

        if (!existing) {

            link.rel = "stylesheet";

            link.href = url;

            link.dataset.guidePetStylesheet = "true";

            document.head.appendChild(link);
        }

        if (link.sheet) {

            finish();
        }
    });
}


// Load an external dependency only when necessary.
function loadDependency(dependency) {

    if (dependency.isLoaded()) {

        return Promise.resolve();
    }

    const url = new URL(

        dependency.url,

        window.location.href

    ).href;

    if (loadedScripts.has(url)) {

        return loadedScripts.get(url);
    }

    const task = new Promise((resolve, reject) => {

        const existing = Array.from(

            document.querySelectorAll("script[src]")

        ).find(script => script.src === url);

        const script =
            existing || document.createElement("script");

        let finished = false;

        const finish = error => {

            if (finished) {
                return;
            }

            finished = true;

            window.clearTimeout(timeout);

            script.removeEventListener("load", onLoad);

            script.removeEventListener("error", onError);

            if (error) {

                if (!existing) {

                    script.remove();
                }

                reject(error);

            } else {

                resolve();
            }
        };

        const onLoad = () => {

            if (!dependency.isLoaded()) {

                finish(
                    new Error(
                        `${dependency.name} loaded but is unavailable.`
                    )
                );

                return;
            }

            finish();
        };

        const onError = () => {

            finish(
                new Error(
                    `Failed to load ${dependency.name}.`
                )
            );
        };

        const timeout = window.setTimeout(() => {

            if (dependency.isLoaded()) {

                finish();

            } else {

                finish(
                    new Error(
                        `${dependency.name} loading timed out.`
                    )
                );
            }

        }, 15000);

        script.addEventListener("load", onLoad);

        script.addEventListener("error", onError);

        if (!existing) {

            script.src = url;

            script.async = false;

            script.dataset.guidePetDependency =
                dependency.name;

            document.head.appendChild(script);
        }

        if (dependency.isLoaded()) {

            finish();
        }
    });

    loadedScripts.set(url, task);

    task.catch(() => {

        if (loadedScripts.get(url) === task) {

            loadedScripts.delete(url);
        }
    });

    return task;
}


// Load Live2D dependencies in the required order.
async function loadLive2DDependencies() {

    for (const dependency of LIVE2D_DEPENDENCIES) {

        await loadDependency(dependency);
    }
}


// Determine whether any role can use the assistant on this page.
function isSupportedPage(page) {

    if (!page) {

        return false;
    }

    return Object.values(

        GUIDE_PET_CONFIG.roles

    ).some(role =>

        role.enabled &&

        role.allowedPages.includes(page)
    );
}


// Initialize the assistant for the current page and account.
async function initializeAssistant() {

    await waitForDocument();

    if (assistant?.initialized && !assistant.destroyed) {

        return assistant;
    }

    if (document.querySelector(".dsc-layer")) {

        return null;
    }

    const page = getCurrentPage();

    // Unsupported pages do not require account or model requests.
    if (!isSupportedPage(page)) {

        return null;
    }

    const status = await getAccountStatus();

    // Administrative accounts must not load the assistant.
    if (

        !status.enabled ||

        !isGuidePetEnabled(status.role, page)

    ) {

        console.info(
            `[DSC] Disabled for ${status.role} / ${page}`
        );

        return null;
    }

    await Promise.all([

        loadStylesheet(),

        loadLive2DDependencies()
    ]);

    // Import the main module after loading its runtime dependencies.
    const { mountGuidePet } = await import(

        "./guide-pet.js"
    );

    assistant = await mountGuidePet(

        status.role,

        {
            page,

            theme: status.theme,

            onboardingPending:
                status.onboardingPending
        }
    );

    if (!assistant) {

        throw new Error(
            "Assistant initialization failed."
        );
    }

    console.info(

        `[DSC] Initialized: ${status.role} / ${page} / ${status.theme}`
    );

    return assistant;
}


// Start initialization while preventing duplicate instances.
export function loadGuidePet() {

    if (assistant?.initialized && !assistant.destroyed) {

        return Promise.resolve(assistant);
    }

    if (initializationTask) {

        return initializationTask;
    }

    initializationTask = initializeAssistant()

        .catch(error => {

            console.warn(
                "[DSC] Assistant loading failed:",
                error
            );

            return null;
        })

        .finally(() => {

            initializationTask = null;
        });

    return initializationTask;
}


// Return the currently active assistant.
export function getGuidePet() {

    if (

        !assistant ||

        assistant.destroyed ||

        !assistant.initialized

    ) {

        return null;
    }

    return assistant;
}


// Destroy the assistant without changing stored user settings.
export async function unloadGuidePet() {

    if (initializationTask) {

        await initializationTask;
    }

    const current = assistant;

    assistant = null;

    if (current) {

        await current.destroy();
    }
}


// Restore the assistant when returning from the browser cache.
window.addEventListener("pageshow", event => {

    if (event.persisted) {

        loadGuidePet();
    }
});


// Automatically initialize when the loader is imported.
loadGuidePet();
