import { GuidePetModel } from "./guide-pet-model.js";
import { GuidePetState } from "./guide-pet-state.js";
import { GuidePetIdle } from "./guide-pet-idle.js";

import {
    GUIDE_PET_CONFIG,
    getCurrentPage,
    getPageBehavior,
    isGuidePetEnabled,
    getRandomDialogue,
    getNavigationActions,
    getTutorialNavigationAction,
    isOnboardingEnabled,
    getPetSize
} from "./guide-pet-config.js";

import {
    getResizeDialogue,
    getOnboardingDialogue,
    getOnboardingTip,
    getOnboardingTipCount,
    getPageDialogues,
    selectDialogue
} from "./guide-pet-dialogues.js";

export class GuidePet {

    constructor(role, options = {}) {
        this.role = role;
        this.config = GUIDE_PET_CONFIG;

        this.page = options.page ?? getCurrentPage();

        this.pageBehavior = getPageBehavior(this.page);

        this.theme = role === "GUEST"
            ? "light"
            : (options.theme || "purple");

        this.state = new GuidePetState(role, this.page);

        this.onboardingPending =
            options.onboardingPending === true;

        this.onOnboardingComplete =
            options.onOnboardingComplete || null;

        this.onboardingActive = false;
        this.onboardingBusy = false;
        this.onboardingTipIndex = -1;

        this.model = null;
        this.idle = null;
        this.layer = null;
        this.container = null;
        this.canvas = null;

        this.currentSize = 0;
        this.currentMenu = null;

        this.dialogueTimer = null;
        this.dialogueGeneration = 0;
        this.dialogueWork = Promise.resolve();

        this.dialogueMotion = false;
        this.dialogueActive = false;

        this.previousDialogues = {};
        this.previousExpression = null;

        this.drag = null;
        this.hoveredNavigation = null;
        this.lastClickTime = 0;

        this.initialized = false;
        this.destroyed = false;

        this.suppressed = false;
        this.suppressionGeneration = 0;

        this.momentObserver = null;
        this.gazeFrameObserver = null;
        this.gazeFrameDocuments = new Map();

        this.gazeAnimationFrame = null;
        this.lastPointerPosition = null;

        this.events = new AbortController();
    }

    async initialize() {
        if (
            this.initialized ||
            this.destroyed ||
            !isGuidePetEnabled(this.role, this.page)
        ) {
            return false;
        }

        try {
            this.createUI();

            const size = this.getEffectiveSize();

            this.currentSize = size;

            this.container.style.setProperty(
                "--dsc-size",
                `${size}px`
            );

            this.model = new GuidePetModel(this.canvas, {
                modelPath: this.config.appearance.modelPath,
                width: size,
                height: size,
                scaleFactor: this.config.appearance.scaleFactor
            });

            await this.model.initialize();

            if (!this.model.initialized) {
                throw new Error("Model initialization failed");
            }

            this.idle = new GuidePetIdle(this.model);

            this.initialized = true;
            this.status.hidden = true;

            this.bindEvents();

            this.withoutTransition(() => {
                this.applyPosition();
            });

            await this.idle.setDocked(
                this.state.isDocked()
            );

            this.idle.start();

            this.observeMomentEditor();

            const startOnboarding =
                this.onboardingPending &&
                isOnboardingEnabled(this.role, this.page) &&
                this.config.onboarding.showAutomatically &&
                !this.suppressed;

            if (
                startOnboarding &&
                this.config.onboarding.suppressRegularWelcome
            ) {
                this.startOnboarding();

            } else if (
                !this.state.isDocked() &&
                !this.suppressed &&
                this.pageBehavior.showWelcome
            ) {
                this.showDialogue("welcome");
            }

            if (startOnboarding && !this.onboardingActive) {
                this.startOnboarding();
            }

            return true;

        } catch (error) {
            console.error(
                "[DSC] Initialization failed:",
                error
            );

            await this.destroy();

            return false;
        }
    }

    createUI() {
        this.layer = document.createElement("div");

        this.layer.className = "dsc-layer";
        this.layer.dataset.theme = this.theme;

        this.container = document.createElement("div");
        this.container.className = "dsc-container";

        this.container.innerHTML = `
            <div class="dsc-model">
                <canvas class="dsc-canvas"
                        tabindex="0"
                        role="button"
                        aria-expanded="false">
                </canvas>

                <button type="button"
                        class="dsc-dock-handle">
                </button>
            </div>

            <div class="dsc-panel">
                <section class="dsc-dialogue" hidden>

                    <div class="dsc-dialogue-header">
                        <span class="dsc-dialogue-name"></span>

                        <button type="button"
                                class="dsc-dialogue-close">
                            &times;
                        </button>
                    </div>

                    <p class="dsc-dialogue-text"
                       aria-live="polite">
                    </p>

                    <div class="dsc-onboarding-progress" hidden>

                        <span class="dsc-onboarding-progress-label">
                        </span>

                        <div class="dsc-onboarding-progress-track"
                             role="progressbar"
                             aria-valuemin="0"
                             aria-valuemax="100"
                             aria-valuenow="0">

                            <div class="dsc-onboarding-progress-fill">
                            </div>

                        </div>
                    </div>

                    <div class="dsc-dialogue-actions" hidden>
                    </div>

                    <p class="dsc-inline-error"
                       role="alert"
                       hidden>
                    </p>
                </section>

                <div class="dsc-menu" hidden></div>
            </div>

            <div class="dsc-status"></div>
        `;

        this.layer.appendChild(this.container);

        document.body.appendChild(this.layer);

        const find = selector =>
            this.container.querySelector(selector);

        this.canvas = find(".dsc-canvas");
        this.dockHandle = find(".dsc-dock-handle");

        this.panel = find(".dsc-panel");

        this.dialogue = find(".dsc-dialogue");
        this.dialogueText = find(".dsc-dialogue-text");
        this.dialogueClose = find(".dsc-dialogue-close");
        this.dialogueActions = find(".dsc-dialogue-actions");

        this.progress = find(".dsc-onboarding-progress");

        this.progressLabel =
            find(".dsc-onboarding-progress-label");

        this.progressTrack =
            find(".dsc-onboarding-progress-track");

        this.inlineError = find(".dsc-inline-error");

        this.menu = find(".dsc-menu");
        this.status = find(".dsc-status");

        const ui = this.config.ui;

        find(".dsc-dialogue-name").textContent =
            ui.petName;

        this.canvas.setAttribute(
            "aria-label",
            ui.petName
        );

        this.dialogueClose.setAttribute(
            "aria-label",
            ui.buttons.closeDialogue
        );

        this.dockHandle.setAttribute(
            "aria-label",
            ui.buttons.restore
        );

        this.dockHandle.title = ui.docking.hoverHint;

        this.status.textContent = ui.messages.loading;

        this.container.style.setProperty(
            "--dsc-animation-duration",
            `${this.config.docking.animationDuration}ms`
        );

        this.container.style.setProperty(
            "--dsc-hover-duration",
            `${this.config.docking.hoverDuration}ms`
        );
    }

    listen(target, event, handler, options = {}) {
        target.addEventListener(event, handler, {
            ...options,
            signal: this.events.signal
        });
    }

    bindEvents() {
        for (const target of [this.canvas, this.dockHandle]) {

            this.listen(target, "pointerdown", event =>
                this.startDrag(event)
            );

            this.listen(target, "pointermove", event =>
                this.moveDrag(event)
            );

            this.listen(target, "pointerup", event =>
                this.endDrag(event)
            );

            this.listen(target, "pointercancel", event =>
                this.cancelDrag(event)
            );

            this.listen(target, "lostpointercapture", event =>
                this.cancelDrag(event)
            );
        }

        this.listen(this.canvas, "keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.handleModelClick();
            }
        });

        this.listen(this.dockHandle, "click", event => {
            if (
                event.detail === 0 &&
                !this.drag &&
                this.config.docking.restoreOnClick
            ) {
                this.restore();
            }
        });

        this.listen(this.dockHandle, "pointerenter", event => {
            if (event.pointerType !== "touch") {
                this.setPeeking(true);
            }
        });

        this.listen(this.dockHandle, "pointerleave", () => {
            this.setPeeking(false);
        });

        this.listen(this.dialogueClose, "click", () => {
            if (!this.onboardingActive) {
                this.closeDialogue();
            }
        });

        this.listen(document, "pointerover", event => {
            this.handleNavigationEnter(event);
        });

        this.listen(document, "pointerout", event => {
            this.handleNavigationLeave(event);
        });

        this.listen(document, "pointerdown", event => {
            if (!this.container.contains(event.target)) {
                this.closeMenu();
            }
        });

        this.listen(document, "keydown", event => {
            if (event.key === "Escape") {

                if (this.drag) {
                    this.cancelDrag();

                } else if (!this.onboardingActive) {
                    this.closeMenu();
                    this.closeDialogue();
                }
            }
        });

        this.listen(window, "resize", () => {
            this.handleResize();
        });

        this.listen(window, "blur", () => {
            this.cancelDrag();
            this.clearNavigationGaze();
            this.setPeeking(false);
        });

        this.listen(window, "pagehide", event => {
            if (!event.persisted) {
                this.destroy();
            }
        });

        this.bindGlobalGaze();
    }

    bindGlobalGaze() {
        if (
            !this.config.gaze.enabled ||
            !this.config.gaze.continuousMouseTracking
        ) {
            return;
        }

        this.listen(
            document,
            "pointermove",
            event => this.handleGlobalPointerMove(event),
            {
                capture: true,
                passive: true
            }
        );

        this.listen(
            document,
            "pointerout",
            event => {
                if (
                    event.relatedTarget === null &&
                    this.config.gaze.resetOnLeave
                ) {
                    this.clearNavigationGaze();
                }
            },
            {
                capture: true,
                passive: true
            }
        );

        this.listen(document, "visibilitychange", () => {
            if (document.hidden) {
                this.clearNavigationGaze();
            }
        });

        this.listen(
            document,
            "load",
            event => {
                if (event.target?.tagName === "IFRAME") {
                    this.refreshGazeFrameListeners();
                }
            },
            {
                capture: true
            }
        );

        this.refreshGazeFrameListeners();

        if (document.body && window.MutationObserver) {

            this.gazeFrameObserver = new MutationObserver(
                records => {
                    const framesChanged = records.some(record =>
                        [...record.addedNodes, ...record.removedNodes]
                            .some(node =>
                                node.nodeType === 1 &&
                                (
                                    node.tagName === "IFRAME" ||
                                    node.querySelector?.("iframe")
                                )
                            )
                    );

                    if (framesChanged) {
                        this.refreshGazeFrameListeners();
                    }
                }
            );

            this.gazeFrameObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    handleGlobalPointerMove(event, frame = null) {
        if (
            !this.config.gaze.continuousMouseTracking ||
            (event.pointerType && event.pointerType !== "mouse") ||
            !this.canUseGaze()
        ) {
            return;
        }

        let clientX = event.clientX;
        let clientY = event.clientY;

        if (frame) {
            const rect = frame.getBoundingClientRect();

            const scaleX =
                rect.width / Math.max(1, frame.offsetWidth);

            const scaleY =
                rect.height / Math.max(1, frame.offsetHeight);

            clientX = rect.left +
                (frame.clientLeft + clientX) * scaleX;

            clientY = rect.top +
                (frame.clientTop + clientY) * scaleY;
        }

        if (
            !Number.isFinite(clientX) ||
            !Number.isFinite(clientY)
        ) {
            return;
        }

        this.lastPointerPosition = {
            x: clientX,
            y: clientY
        };

        if (this.gazeAnimationFrame !== null) {
            return;
        }

        this.gazeAnimationFrame =
            window.requestAnimationFrame(() => {

                this.gazeAnimationFrame = null;

                if (
                    !this.canUseGaze() ||
                    !this.lastPointerPosition
                ) {
                    return;
                }

                this.model.lookAtPosition(
                    this.lastPointerPosition.x,
                    this.lastPointerPosition.y
                );
            });
    }

    refreshGazeFrameListeners() {
        if (
            this.destroyed ||
            !this.config.gaze.continuousMouseTracking
        ) {
            return;
        }

        const frames = new Set(
            document.querySelectorAll("iframe")
        );

        for (
            const [frame, entry]
            of this.gazeFrameDocuments
        ) {
            let currentDocument = null;

            if (frames.has(frame)) {
                try {
                    currentDocument = frame.contentDocument;
                } catch {
                }
            }

            if (currentDocument !== entry.document) {
                entry.controller.abort();

                this.gazeFrameDocuments.delete(frame);
            }
        }

        for (const frame of frames) {
            if (this.gazeFrameDocuments.has(frame)) {
                continue;
            }

            try {
                const frameDocument = frame.contentDocument;

                if (!frameDocument) {
                    continue;
                }

                const controller = new AbortController();

                frameDocument.addEventListener(
                    "pointermove",
                    event => {
                        this.handleGlobalPointerMove(
                            event,
                            frame
                        );
                    },
                    {
                        capture: true,
                        passive: true,
                        signal: controller.signal
                    }
                );

                frameDocument.addEventListener(
                    "pointerout",
                    event => {
                        if (
                            event.relatedTarget === null &&
                            this.config.gaze.resetOnLeave
                        ) {
                            this.clearNavigationGaze();
                        }
                    },
                    {
                        capture: true,
                        passive: true,
                        signal: controller.signal
                    }
                );

                this.gazeFrameDocuments.set(frame, {
                    document: frameDocument,
                    controller
                });

            } catch {
            }
        }
    }

    clearGlobalGaze() {
        if (this.gazeAnimationFrame !== null) {

            window.cancelAnimationFrame(
                this.gazeAnimationFrame
            );

            this.gazeAnimationFrame = null;
        }

        this.lastPointerPosition = null;

        if (
            this.model &&
            this.config.gaze.resetOnLeave
        ) {
            this.model.resetGaze();
        }
    }

    destroyGlobalGaze() {
        this.clearGlobalGaze();

        this.gazeFrameObserver?.disconnect();

        this.gazeFrameObserver = null;

        for (
            const entry
            of this.gazeFrameDocuments.values()
        ) {
            entry.controller.abort();
        }

        this.gazeFrameDocuments.clear();
    }

    observeMomentEditor() {
        if (this.page !== "synchro") {
            return;
        }

        this.momentObserver = new MutationObserver(() => {
            this.syncMomentEditorState();
        });

        this.momentObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.syncMomentEditorState();
    }

    syncMomentEditorState() {
        if (this.destroyed) {
            return;
        }

        const editor = document.querySelector(
            ".design-modal .design-modal-frame"
        );

        this.setSuppressed(Boolean(editor))
            .catch(error => {
                console.warn(
                    "[DSC] Suppression failed:",
                    error
                );
            });
    }

    async setSuppressed(active) {
        if (
            !this.initialized ||
            this.destroyed ||
            this.suppressed === active
        ) {
            return;
        }

        this.suppressed = active;

        const generation =
            ++this.suppressionGeneration;

        if (active) {
            const ready =
                this.idle.setSuppressed(true);

            this.cancelDrag();
            this.closeMenu();
            this.closeDialogue();
            this.clearNavigationGaze();
            this.setPeeking(false);

            this.layer.hidden = true;

            await ready;
            await this.dialogueWork;

            if (
                !this.destroyed &&
                this.suppressed &&
                generation === this.suppressionGeneration
            ) {
                this.model.pause();
            }

        } else {
            this.model.resume();

            const saved =
                this.state.getPersistentState();

            if (
                this.config.interaction.rememberSize &&
                saved.size !== this.state.getSize()
            ) {
                this.state.setSize(saved.size, false);
            }

            this.layer.hidden = false;

            this.withoutTransition(() => {
                this.applySize();
                this.applyPosition();
            });

            this.idle.setSuppressed(false);
        }
    }

    getEffectiveSize() {
        return this.state.getEffectiveSize();
    }

    applySize() {
        this.currentSize =
            this.getEffectiveSize();

        this.container.style.setProperty(
            "--dsc-size",
            `${this.currentSize}px`
        );

        this.model.resize(
            this.currentSize,
            this.currentSize
        );
    }

    setSize(sizeName) {
        if (
            !this.initialized ||
            this.suppressed ||
            this.onboardingActive ||
            !this.config.interaction.enableResizing
        ) {
            return false;
        }

        const previous = this.state.getSize();

        if (!this.state.setSize(sizeName)) {
            return false;
        }

        if (previous === sizeName) {
            return true;
        }

        this.clearNavigationGaze();

        this.withoutTransition(() => {
            this.applySize();
            this.applyPosition();
        });

        this.state.save();

        if (this.currentMenu === "size") {
            this.openMenu("size");
        }

        const resize = this.config.resize;

        if (resize.enabled && !this.state.isDocked()) {

            const reaction = getResizeDialogue(
                getPetSize(previous),
                getPetSize(sizeName),
                {
                    previousText:
                        this.previousDialogues.resize
                }
            );

            if (reaction) {
                this.previousDialogues.resize =
                    reaction.text;

                if (
                    resize.showExpression ||
                    resize.showDialogue
                ) {
                    const larger =
                        getPetSize(sizeName) >
                        getPetSize(previous);

                    this.presentDialogue({
                        ...reaction,

                        expression: resize.showExpression
                            ? (
                                larger
                                    ? resize.largerExpression
                                    : resize.smallerExpression
                              ) || reaction.expression
                            : null
                    }, {
                        kind: "resize",
                        visible: resize.showDialogue,
                        duration: resize.reactionDuration
                    });
                }
            }

            this.container.classList.remove(
                "is-resizing"
            );

            void this.container.offsetWidth;

            this.container.classList.add(
                "is-resizing"
            );
        }

        return true;
    }

    withoutTransition(task) {
        this.container.classList.add(
            "is-positioning"
        );

        try {
            return task();

        } finally {
            void this.container.offsetWidth;

            this.container.classList.remove(
                "is-positioning"
            );
        }
    }

    getVisualFrame() {
        const rect =
            this.container.getBoundingClientRect();

        const transform =
            getComputedStyle(this.container).transform;

        let rotation = 0;

        if (transform && transform !== "none") {

            const matrix =
                new DOMMatrixReadOnly(transform);

            rotation =
                Math.atan2(matrix.b, matrix.a) *
                180 / Math.PI;
        }

        return {
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            rotation
        };
    }

    setVisualFrame(frame) {
        const base =
            this.state.getExpandedCoordinates(
                this.currentSize,
                this.currentSize
            );

        this.container.style.setProperty(
            "--dsc-dock-x",
            `${frame.centerX - base.left - this.currentSize / 2}px`
        );

        this.container.style.setProperty(
            "--dsc-dock-y",
            `${frame.centerY - base.top - this.currentSize / 2}px`
        );

        this.container.style.setProperty(
            "--dsc-drag-rotation",
            `${frame.rotation}deg`
        );
    }

    applyPosition() {
        const size = this.currentSize;

        if (!this.state.isDocked()) {
            this.state.clampPosition(
                size,
                size,
                false
            );
        }

        const position =
            this.state.getPosition();

        this.container.style.left = "auto";
        this.container.style.top = "auto";

        this.container.style.right =
            `${position.right}px`;

        this.container.style.bottom =
            `${position.bottom}px`;

        this.container.style.removeProperty(
            "--dsc-drag-rotation"
        );

        this.container.classList.remove(
            "is-peeking"
        );

        if (this.state.isDocked()) {
            this.applyDockPosition();

        } else {
            this.container.classList.remove(
                "is-docked"
            );

            delete this.container.dataset.dockSide;

            this.container.style.setProperty(
                "--dsc-dock-x",
                "0px"
            );

            this.container.style.setProperty(
                "--dsc-dock-y",
                "0px"
            );

            this.canvas.tabIndex = 0;
            this.dockHandle.tabIndex = -1;

            this.updatePanelPosition();
        }
    }

    applyDockPosition() {
        const size = this.currentSize;

        const docking =
            this.config.docking;

        const depth =
            size * docking.visibleRatio;

        const target =
            this.state.getDockPosition(
                size,
                size,
                depth
            );

        if (!target) {
            return;
        }

        const base = this.state.getPosition();

        const baseLeft =
            window.innerWidth - base.right - size;

        const x = target.side === "left"
            ? target.left - baseLeft
            : base.right - target.right;

        const y = base.bottom - target.bottom;

        this.container.style.setProperty(
            "--dsc-visible-depth",
            `${depth}px`
        );

        this.container.style.setProperty(
            "--dsc-peek-distance",
            `${size * docking.hoverExtraRatio}px`
        );

        this.container.style.setProperty(
            "--dsc-dock-x",
            `${x}px`
        );

        this.container.style.setProperty(
            "--dsc-dock-y",
            `${y}px`
        );

        this.container.dataset.dockSide =
            target.side;

        this.container.classList.add(
            "is-docked"
        );

        this.canvas.tabIndex = -1;
        this.dockHandle.tabIndex = 0;
    }

    animateFrom(frame) {
        this.withoutTransition(() => {
            this.applyPosition();
            this.setVisualFrame(frame);
        });

        void getComputedStyle(
            this.container
        ).transform;

        this.applyPosition();
    }

    handleResize() {
        if (!this.initialized || this.suppressed) {
            return;
        }

        this.cancelDrag();

        this.withoutTransition(() => {

            this.applySize();

            const { left } =
                this.state.getExpandedCoordinates(
                    this.currentSize,
                    this.currentSize
                );

            const right =
                left + this.currentSize;

            if (
                !this.onboardingActive &&
                !this.state.isDocked() &&
                this.config.docking.enabled &&
                (
                    left < 0 ||
                    right > window.innerWidth
                )
            ) {
                const side =
                    this.state.detectDockSide({
                        left,
                        right
                    });

                if (side) {
                    this.state.dock(side);

                    this.closeMenu();
                    this.closeDialogue();
                    this.clearNavigationGaze();

                    this.idle.setDocked(true);
                }
            }

            this.applyPosition();
        });

        this.state.save();
    }

    setPeeking(active) {
        if (!this.container || this.drag) {
            return;
        }

        this.container.classList.toggle(
            "is-peeking",
            Boolean(
                active &&
                !this.suppressed &&
                this.state.isDocked() &&
                this.config.docking.enableHoverPeek
            )
        );
    }

    startDrag(event) {
        if (
            !this.initialized ||
            this.suppressed ||
            this.onboardingActive ||
            this.drag ||
            event.button !== 0 ||
            event.isPrimary === false
        ) {
            return;
        }

        const docked =
            this.state.isDocked();

        if (
            docked !==
            (event.currentTarget === this.dockHandle)
        ) {
            return;
        }

        event.preventDefault();

        const visual =
            this.getVisualFrame();

        const position =
            this.state.getPosition();

        const size = this.currentSize;

        const drag = {
            mode: docked ? "dock" : "normal",

            fromDock: docked,

            side: this.state.getDockSide(),

            originalPosition: position,

            target: event.currentTarget,

            pointerId: event.pointerId,

            startX: event.clientX,
            startY: event.clientY,

            startLeft: visual.centerX - size / 2,
            startTop: visual.centerY - size / 2,

            left: visual.centerX - size / 2,
            top: visual.centerY - size / 2,

            moved: false,

            dockData: null
        };

        if (docked) {

            drag.dockData =
                this.state.createDockDrag(
                    event.clientX,
                    event.clientY,
                    size,
                    size,
                    {
                        left: visual.centerX - size / 2,
                        top: visual.centerY - size / 2,
                        width: size,
                        height: size
                    }
                );

            if (drag.dockData) {

                drag.dockData.startRotation =
                    visual.rotation;

                const anchor =
                    this.state.rotatePoint(
                        event.clientX - visual.centerX,
                        event.clientY - visual.centerY,
                        -visual.rotation
                    );

                drag.dockData.anchorX = anchor.x;
                drag.dockData.anchorY = anchor.y;
            }
        }

        this.drag = drag;

        try {
            drag.target.setPointerCapture(
                event.pointerId
            );

        } catch {
            this.drag = null;
            return;
        }

        this.clearNavigationGaze();

        if (docked) {
            this.container.classList.add(
                "is-dock-dragging"
            );

            this.container.classList.remove(
                "is-peeking"
            );

            this.setVisualFrame(visual);

            this.idle.setDockDragging(true);
        }
    }

    moveDrag(event) {
        const drag = this.drag;

        if (
            !drag ||
            drag.pointerId !== event.pointerId
        ) {
            return;
        }

        const dx =
            event.clientX - drag.startX;

        const dy =
            event.clientY - drag.startY;

        const threshold = drag.fromDock
            ? this.config.docking.dragClickThreshold
            : this.config.interaction.dragThreshold;

        if (
            !drag.moved &&
            Math.hypot(dx, dy) < threshold
        ) {
            return;
        }

        if (drag.mode === "dock") {

            drag.moved = true;

            if (!drag.dockData) {
                return;
            }

            const frame =
                this.state.getDockDragFrame(
                    drag.dockData,
                    event.clientX,
                    event.clientY
                );

            if (!frame) {
                return;
            }

            this.setVisualFrame(frame);

            if (frame.shouldRestore) {

                const result =
                    this.state.completeDockDrag(
                        frame,
                        false
                    );

                if (!result) {
                    return;
                }

                this.container.classList.add(
                    "is-dragging-from-dock",
                    "is-dragging"
                );

                this.container.classList.remove(
                    "is-dock-dragging"
                );

                drag.mode = "normal";

                drag.startX = event.clientX;
                drag.startY = event.clientY;

                drag.startLeft =
                    drag.left = result.left;

                drag.startTop =
                    drag.top = result.top;

                this.idle.setDragging(true);
                this.idle.setDocked(false);

                this.applyPosition();
            }

            return;
        }

        if (!this.config.interaction.enableDragging) {
            drag.moved = true;
            return;
        }

        if (!drag.moved) {

            drag.moved = true;

            this.idle.setDragging(true);

            this.closeMenu();
            this.closeDialogue();
            this.clearNavigationGaze();

            this.container.classList.add(
                "is-dragging"
            );

            this.container.classList.remove(
                "is-peeking"
            );
        }

        const size = this.currentSize;

        const margin =
            this.config.appearance.screenMargin;

        const allowance =
            !drag.fromDock &&
            this.config.docking.enabled
                ? size * 0.5
                : 0;

        drag.left = Math.min(
            Math.max(
                drag.startLeft + dx,
                -allowance
            ),
            Math.max(
                0,
                window.innerWidth - size
            ) + allowance
        );

        drag.top = Math.min(
            Math.max(
                drag.startTop + dy,
                0
            ),
            Math.max(
                0,
                window.innerHeight - size - margin
            )
        );

        this.setVisualFrame({
            centerX: drag.left + size / 2,
            centerY: drag.top + size / 2,
            rotation: 0
        });
    }

    releasePointer(drag) {
        this.drag = null;

        if (
            drag.target.hasPointerCapture(
                drag.pointerId
            )
        ) {
            drag.target.releasePointerCapture(
                drag.pointerId
            );
        }

        this.container.classList.remove(
            "is-dragging",
            "is-dock-dragging",
            "is-dragging-from-dock"
        );
    }

    endDrag(event) {
        const drag = this.drag;

        if (
            !drag ||
            drag.pointerId !== event.pointerId
        ) {
            return;
        }

        this.moveDrag(event);

        const visual =
            this.getVisualFrame();

        const size =
            this.currentSize;

        this.releasePointer(drag);

        if (drag.mode === "dock") {

            if (
                !drag.moved &&
                this.config.docking.restoreOnClick
            ) {
                this.restore(visual);

            } else {
                this.animateFrom(visual);
            }

        } else if (drag.moved) {

            const side =
                !drag.fromDock &&
                this.config.docking.enabled
                    ? this.state.detectDockSide({
                        left: drag.left,
                        right: drag.left + size
                    })
                    : null;

            const position =
                this.state.clampCoordinates(
                    drag.left,
                    drag.top,
                    size,
                    size
                );

            this.state.setPositionFromCoordinates(
                position.left,
                position.top,
                size,
                size,
                false
            );

            if (side) {
                this.dock(side, visual);

            } else {
                this.animateFrom(visual);
                this.state.save();
            }

        } else {
            this.handleModelClick();
        }

        this.idle.setDragging(false);
        this.idle.setDockDragging(false);

        this.idle.restartTimer?.();

        if (this.canUseGaze()) {
            this.handleGlobalPointerMove(event);
        }
    }

    cancelDrag(event = null) {
        const drag = this.drag;

        if (
            !drag ||
            (
                event &&
                event.pointerId !== drag.pointerId
            )
        ) {
            return;
        }

        const visual =
            this.getVisualFrame();

        this.releasePointer(drag);

        this.state.setPosition(
            drag.originalPosition.right,
            drag.originalPosition.bottom,
            false
        );

        if (drag.fromDock) {
            this.state.dock(drag.side, false);
        }

        this.animateFrom(visual);

        this.idle.setDocked(
            this.state.isDocked()
        );

        this.idle.setDragging(false);
        this.idle.setDockDragging(false);
    }

    dock(side = null, visual = null) {
        if (
            !this.initialized ||
            this.suppressed ||
            this.onboardingActive ||
            !this.config.docking.enabled ||
            this.drag
        ) {
            return false;
        }

        const frame =
            visual || this.getVisualFrame();

        const target =
            side ||
            this.state.getNearestDockSide(
                this.currentSize
            );

        if (!this.state.dock(target)) {
            return false;
        }

        this.idle.setDocked(true);

        this.closeMenu();
        this.closeDialogue();
        this.clearNavigationGaze();

        this.animateFrom(frame);

        return true;
    }

    restore(
        visual = null,
        showReaction = true,
        persist = true
    ) {
        if (
            !this.initialized ||
            !this.state.isDocked() ||
            this.suppressed ||
            this.drag
        ) {
            return false;
        }

        const frame =
            visual || this.getVisualFrame();

        this.state.restoreFromDock(
            this.currentSize,
            this.currentSize,
            persist
        );

        this.animateFrom(frame);

        if (showReaction) {
            this.showDialogue("restore");
        }

        this.idle.setDocked(false);

        return true;
    }

    handleModelClick() {
        if (
            !this.initialized ||
            this.suppressed ||
            this.state.isDocked() ||
            this.onboardingActive
        ) {
            return;
        }

        const now = Date.now();

        if (
            now - this.lastClickTime <
            this.config.interaction.clickCooldown
        ) {
            return;
        }

        this.lastClickTime = now;

        if (!this.menu.hidden) {
            this.closeMenu();
            this.closeDialogue();

            return;
        }

        this.openMenu("main");

        this.showDialogue("click");
    }

    queueDialogue(task) {
        this.dialogueWork =
            this.dialogueWork
                .then(task)
                .catch(error => {
                    console.warn(
                        "[DSC] Dialogue operation failed:",
                        error
                    );
                });

        return this.dialogueWork;
    }

    clearDialogueTimer() {
        if (this.dialogueTimer !== null) {
            window.clearTimeout(
                this.dialogueTimer
            );

            this.dialogueTimer = null;
        }
    }

    isDialogueCurrent(generation) {
        return (
            generation === this.dialogueGeneration &&
            !this.destroyed &&
            !this.suppressed &&
            !this.state.isDocked()
        );
    }

    showDialogue(type = "click") {
        if (
            !this.initialized ||
            this.destroyed ||
            this.suppressed ||
            this.state.isDocked() ||
            this.onboardingActive
        ) {
            return Promise.resolve();
        }

        const key =
            type === "click" || type === "talk"
                ? "talk"
                : type;

        const expressions =
            this.model.getExpressions();

        const previous =
            this.previousDialogues[key];

        let item;

        if (this.role === "GUEST" && key === "talk") {

            item = selectDialogue(
                getPageDialogues(
                    this.role,
                    this.page
                )?.click,
                {
                    previousText: previous,

                    previousExpression:
                        this.previousExpression,

                    availableExpressions:
                        expressions
                }
            );

        } else {
            item = getRandomDialogue(
                this.role,
                this.page,
                type,
                previous,
                this.previousExpression,
                expressions
            );
        }

        if (!item) {
            return Promise.resolve();
        }

        this.previousDialogues[key] =
            item.text;

        return this.presentDialogue(item, {
            duration: type === "welcome"
                ? this.config.interaction.welcomeDuration
                : this.config.interaction.dialogueDuration
        });
    }

    clearDialogueActions() {
        this.dialogueActions.replaceChildren();

        this.dialogueActions.hidden = true;

        this.dialogueActions.classList.remove(
            "is-horizontal"
        );

        this.progress.hidden = true;

        this.inlineError.hidden = true;
        this.inlineError.textContent = "";
    }

    presentDialogue(item, options = {}) {
        if (
            !item ||
            this.destroyed ||
            this.suppressed ||
            this.state.isDocked()
        ) {
            return Promise.resolve();
        }

        const generation =
            ++this.dialogueGeneration;

        this.dialogueActive = true;

        this.clearDialogueTimer();

        const idleReady =
            this.idle.setDialogueActive(true);

        const resizeReady =
            this.idle.setResizeActive(
                options.kind === "resize"
            );

        this.clearDialogueActions();

        this.dialogue.classList.toggle(
            "is-onboarding",
            this.onboardingActive
        );

        this.dialogue.classList.toggle(
            "is-resize-reaction",
            options.kind === "resize"
        );

        this.dialogueClose.hidden =
            this.onboardingActive;

        this.dialogueText.textContent =
            item.text;

        this.dialogue.hidden =
            options.visible === false;

        if (options.actions) {
            this.renderDialogueActions(
                options.actions,
                options.horizontal
            );
        }

        if (Number.isInteger(options.tipIndex)) {
            this.renderOnboardingProgress(
                options.tipIndex
            );
        }

        this.updatePanelPosition();

        return this.queueDialogue(async () => {

            await Promise.all([
                idleReady,
                resizeReady
            ]);

            if (!this.isDialogueCurrent(generation)) {
                return;
            }

            try {
                if (this.dialogueMotion) {
                    await this.model.playMotion(
                        this.config.idle.defaultMotion,
                        0,
                        3
                    );

                    this.dialogueMotion = false;
                }

                if (!this.isDialogueCurrent(generation)) {
                    return;
                }

                if (
                    this.config.conversation
                        .resetExpressionBeforeDialogue ||
                    !item.expression
                ) {
                    this.model.resetExpression();
                }

                if (
                    item.expression &&
                    this.model.getExpressions()
                        .includes(item.expression)
                ) {
                    const applied =
                        await this.model.setExpression(
                            item.expression
                        );

                    if (applied) {
                        this.previousExpression =
                            item.expression;
                    }
                }

                if (!this.isDialogueCurrent(generation)) {
                    return;
                }

                if (
                    item.motion &&
                    this.model.getMotions()
                        .includes(item.motion)
                ) {
                    this.dialogueMotion =
                        await this.model.playMotion(
                            item.motion,
                            0,
                            3
                        );
                }

            } finally {
                if (
                    this.isDialogueCurrent(generation) &&
                    !options.persistent &&
                    !item.persistent
                ) {
                    const duration =
                        options.kind === "resize"
                            ? options.duration
                            : (
                                item.duration ??
                                options.duration ??
                                this.config.interaction
                                    .dialogueDuration
                              );

                    this.dialogueTimer =
                        window.setTimeout(
                            () => this.closeDialogue(),
                            duration
                        );
                }
            }
        });
    }

    closeDialogue(force = false) {
        if (
            !this.model ||
            !this.idle ||
            (
                this.onboardingActive &&
                !force
            )
        ) {
            return;
        }

        if (!this.dialogueActive) {
            this.idle.setResizeActive(false);
            this.idle.setDialogueActive(false);

            return;
        }

        this.dialogueActive = false;

        const generation =
            ++this.dialogueGeneration;

        this.clearDialogueTimer();

        this.dialogue.hidden = true;

        this.clearDialogueActions();

        this.dialogue.classList.remove(
            "is-resize-reaction"
        );

        this.container.classList.remove(
            "is-resizing"
        );

        this.queueDialogue(async () => {

            if (
                generation !== this.dialogueGeneration ||
                this.destroyed
            ) {
                return;
            }

            try {
                if (
                    this.config.conversation
                        .resetExpressionAfterDialogue
                ) {
                    this.model.resetExpression();
                }

                if (this.dialogueMotion) {

                    await this.model.playMotion(
                        this.config.idle.defaultMotion,
                        0,
                        3
                    );

                    this.dialogueMotion = false;
                }

            } finally {
                if (
                    generation === this.dialogueGeneration &&
                    !this.destroyed
                ) {
                    this.idle.setResizeActive(false);
                    this.idle.setDialogueActive(false);

                    this.idle.restartTimer?.();
                }
            }
        });

        this.updatePanelPosition();
    }

    createButton(label, handler, options = {}) {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "dsc-button";

        button.textContent = label;

        if (options.primary) {
            button.classList.add(
                "dsc-button-primary"
            );
        }

        if (options.secondary) {
            button.classList.add(
                "dsc-button-secondary"
            );
        }

        if (options.tutorial) {
            button.classList.add(
                "dsc-button-tutorial"
            );
        }

        if (options.selected !== undefined) {
            button.setAttribute(
                "aria-pressed",
                String(options.selected)
            );
        }

        if (options.navigation) {
            button.setAttribute(
                "data-guide-gaze",
                ""
            );
        }

        button.addEventListener(
            "click",
            handler
        );

        return button;
    }

    addMenuButton(
        label,
        handler,
        options = {},
        parent = this.menu
    ) {
        const button =
            this.createButton(
                label,
                handler,
                options
            );

        parent.appendChild(button);

        return button;
    }

    addMenuTitle(text) {
        const title =
            document.createElement("div");

        title.className = "dsc-menu-title";
        title.textContent = text;

        this.menu.appendChild(title);
    }

    openMenu(type = "main") {
        if (
            !this.initialized ||
            this.suppressed ||
            this.state.isDocked() ||
            this.onboardingActive
        ) {
            return;
        }

        this.idle.setMenuActive(true);

        if (
            this.hoveredNavigation &&
            this.menu.contains(this.hoveredNavigation)
        ) {
            this.clearNavigationGaze();
        }

        this.currentMenu = type;

        this.menu.replaceChildren();

        this.menu.hidden = false;

        this.canvas.setAttribute(
            "aria-expanded",
            "true"
        );

        if (type === "size") {
            this.buildSizeMenu();

        } else if (type === "navigation") {
            this.buildNavigationMenu();

        } else if (type === "help") {
            this.buildHelpMenu();

        } else {
            this.buildMainMenu();
        }

        this.updatePanelPosition();
    }

    buildMainMenu() {
        const ui = this.config.ui;

        this.addMenuButton(
            ui.menu.talk,
            () => this.showDialogue("talk")
        );

        this.addMenuButton(
            ui.menu.help,
            () => {
                this.openMenu("help");
                this.showDialogue("tips");
            }
        );

        if (
            getNavigationActions(
                this.role,
                this.page
            ).length
        ) {
            this.addMenuButton(
                ui.menu.navigation,
                () => this.openMenu("navigation")
            );
        }

        if (this.config.interaction.enableResizing) {
            this.addMenuButton(
                ui.menu.size,
                () => this.openMenu("size")
            );
        }

        if (
            this.config.interaction.enableHide &&
            this.config.docking.enabled
        ) {
            this.addMenuButton(
                ui.menu.hide,
                () => this.dock()
            );
        }

        this.addMenuButton(
            ui.menu.close,
            () => this.closeMenu()
        );
    }

    buildHelpMenu() {
        const ui = this.config.ui;

        this.addMenuTitle(
            ui.menu.help
        );

        this.addMenuButton(
            ui.buttons.nextTip,
            () => this.showDialogue("tips")
        );

        if (
            this.config.tutorials.showInHelpMenu &&
            getTutorialNavigationAction(this.role)
        ) {
            this.addMenuButton(
                ui.buttons.tutorials,
                () => this.openTutorials(),
                {
                    tutorial: true,
                    navigation: true
                }
            );
        }

        this.addMenuButton(
            ui.menu.back,
            () => this.openMenu("main")
        );
    }

    buildSizeMenu() {
        const ui = this.config.ui;

        this.addMenuTitle(
            ui.menu.size
        );

        const sizes =
            document.createElement("div");

        sizes.className = "dsc-size-options";

        this.menu.appendChild(sizes);

        for (
            const name
            of Object.keys(this.config.appearance.sizes)
        ) {
            this.addMenuButton(
                ui.sizes[name] || name,
                () => this.setSize(name),
                {
                    selected:
                        this.state.getSize() === name
                },
                sizes
            );
        }

        this.addMenuButton(
            ui.buttons.resetPosition,
            () => {
                const frame =
                    this.getVisualFrame();

                this.state.resetPosition();

                this.animateFrom(frame);
            }
        );

        this.addMenuButton(
            ui.menu.back,
            () => this.openMenu("main")
        );
    }

    buildNavigationMenu() {
        this.addMenuTitle(
            this.config.ui.menu.navigation
        );

        for (
            const action
            of getNavigationActions(
                this.role,
                this.page
            )
        ) {
            this.addMenuButton(
                action.label,
                () => this.navigate(action),
                {
                    navigation: true
                }
            );
        }

        this.addMenuButton(
            this.config.ui.menu.back,
            () => this.openMenu("main")
        );
    }

    closeMenu() {
        if (!this.menu) {
            return;
        }

        if (this.menu.hidden) {
            this.idle?.setMenuActive(false);
            return;
        }

        if (
            this.hoveredNavigation &&
            this.menu.contains(this.hoveredNavigation)
        ) {
            this.clearNavigationGaze();
        }

        this.menu.hidden = true;

        this.currentMenu = null;

        this.canvas.setAttribute(
            "aria-expanded",
            "false"
        );

        this.idle?.setMenuActive(false);

        this.updatePanelPosition();
    }

    startOnboarding() {
        if (
            !this.initialized ||
            this.destroyed ||
            this.suppressed ||
            this.onboardingActive ||
            !this.onboardingPending ||
            !isOnboardingEnabled(
                this.role,
                this.page
            )
        ) {
            return false;
        }

        if (
            this.state.isDocked() &&
            !this.config.onboarding.expandWhenDocked
        ) {
            return false;
        }

        this.onboardingActive = true;

        this.onboardingTipIndex = -1;

        this.idle.setOnboardingActive(true);

        this.closeMenu();

        if (this.state.isDocked()) {
            this.restore(null, false, false);
        }

        this.container.classList.add(
            "is-onboarding"
        );

        this.showOnboardingWelcome();

        return true;
    }

    renderDialogueActions(
        actions,
        horizontal = false
    ) {
        this.dialogueActions.hidden = false;

        this.dialogueActions.classList.toggle(
            "is-horizontal",
            Boolean(horizontal)
        );

        for (const action of actions) {
            this.dialogueActions.appendChild(
                this.createButton(
                    action.label,
                    action.handler,
                    action
                )
            );
        }
    }

    renderOnboardingProgress(index) {
        const total =
            getOnboardingTipCount();

        const percent = Math.round(
            (index + 1) /
            Math.max(total, 1) * 100
        );

        this.progress.hidden = false;

        this.progressLabel.textContent =
            this.config.ui.onboarding.progress
                .replace(
                    "{current}",
                    String(index + 1)
                )
                .replace(
                    "{total}",
                    String(total)
                );

        this.progressTrack.setAttribute(
            "aria-valuenow",
            String(percent)
        );

        this.progress.style.setProperty(
            "--dsc-onboarding-progress",
            `${percent}%`
        );
    }

    showOnboardingWelcome() {
        const ui =
            this.config.ui.onboarding;

        const actions = [
            {
                label: ui.accept,
                primary: true,
                handler: () =>
                    this.showOnboardingTip(0)
            }
        ];

        if (this.config.onboarding.allowSkip) {
            actions.push({
                label: ui.skip,
                secondary: true,
                handler: () =>
                    this.finishOnboarding("skipped")
            });
        }

        this.presentDialogue(
            getOnboardingDialogue("welcome"),
            {
                persistent: true,
                actions,
                horizontal: true
            }
        );
    }

    showOnboardingTip(index) {
        if (
            !this.onboardingActive ||
            this.onboardingBusy
        ) {
            return;
        }

        const item =
            getOnboardingTip(index);

        if (!item) {
            return;
        }

        this.onboardingTipIndex = index;

        const ui =
            this.config.ui.onboarding;

        const last =
            index === getOnboardingTipCount() - 1;

        const actions = [
            {
                label: last
                    ? ui.finish
                    : ui.next,

                primary: true,

                handler: () => last
                    ? this.finishOnboarding("completed")
                    : this.showOnboardingTip(index + 1)
            }
        ];

        if (index > 0) {
            actions.push({
                label: ui.previous,
                secondary: true,

                handler: () =>
                    this.showOnboardingTip(index - 1)
            });
        }

        if (
            this.config.onboarding.allowVideoTutorials &&
            this.config.tutorials.showDuringOnboarding &&
            getTutorialNavigationAction(this.role)
        ) {
            actions.push({
                label: ui.tutorials,
                tutorial: true,

                handler: () =>
                    this.openTutorials()
            });
        }

        if (!last) {
            actions.push({
                label: ui.finish,
                secondary: true,

                handler: () =>
                    this.finishOnboarding("completed")
            });
        }

        this.presentDialogue(item, {
            persistent: true,
            actions,
            tipIndex: index
        });
    }

    async saveOnboardingCompletion(result) {
        if (this.onOnboardingComplete) {

            const accepted =
                await this.onOnboardingComplete(result);

            if (accepted === false) {
                throw new Error(
                    "Completion rejected"
                );
            }

            return;
        }

        const headers = {
            "Content-Type": "application/json"
        };

        const token =
            document.querySelector(
                'meta[name="_csrf"]'
            )?.content;

        const header =
            document.querySelector(
                'meta[name="_csrf_header"]'
            )?.content;

        if (token && header) {
            headers[header] = token;
        }

        const response = await fetch(
            this.config.onboarding.endpoints.complete,
            {
                method: "POST",

                credentials: "same-origin",

                redirect: "error",

                headers,

                body: JSON.stringify({
                    result
                }),

                signal: this.events.signal
            }
        );

        if (!response.ok) {
            throw new Error(
                `Completion failed: ${response.status}`
            );
        }
    }

    async finishOnboarding(result = "completed") {
        if (
            !this.onboardingActive ||
            this.onboardingBusy ||
            this.destroyed
        ) {
            return false;
        }

        this.onboardingBusy = true;

        this.inlineError.hidden = true;

        const buttons = Array.from(
            this.dialogueActions.querySelectorAll(
                "button"
            )
        );

        buttons.forEach(button => {
            button.disabled = true;
        });

        try {
            await this.saveOnboardingCompletion(
                result
            );

            if (this.destroyed) {
                return false;
            }

            this.onboardingPending = false;
            this.onboardingActive = false;
            this.onboardingTipIndex = -1;

            this.container.classList.remove(
                "is-onboarding"
            );

            this.presentDialogue(
                getOnboardingDialogue(
                    result === "skipped"
                        ? "skipped"
                        : "completed"
                ),
                {
                    duration:
                        this.config.onboarding
                            .completionDuration
                }
            );

            this.idle.setOnboardingActive(false);

            return true;

        } catch (error) {

            if (!this.destroyed) {

                this.inlineError.textContent =
                    this.config.ui.messages
                        .onboardingSaveFailed;

                this.inlineError.hidden = false;

                this.updatePanelPosition();

                console.warn(
                    "[DSC] Onboarding completion failed:",
                    error
                );
            }

            return false;

        } finally {
            this.onboardingBusy = false;

            buttons.forEach(button => {
                button.disabled = false;
            });
        }
    }

    openTutorials() {
        const action =
            getTutorialNavigationAction(this.role);

        if (action) {
            this.navigate(action);
        }
    }

    updatePanelPosition() {
        if (
            !this.container ||
            !this.panel ||
            this.suppressed ||
            this.state.isDocked() ||
            this.drag?.moved
        ) {
            return;
        }

        const size =
            this.currentSize;

        const position =
            this.state.getExpandedCoordinates(
                size,
                size
            );

        const margin = 12;
        const gap = 8;

        const above =
            position.top - margin - gap;

        const below =
            window.innerHeight -
            position.top -
            size -
            margin -
            gap;

        const left =
            position.left - margin - gap;

        const right =
            window.innerWidth -
            position.left -
            size -
            margin -
            gap;

        for (
            const key
            of [
                "left",
                "right",
                "top",
                "bottom",
                "transform",
                "maxHeight",
                "overflowY",
                "pointerEvents"
            ]
        ) {
            this.panel.style[key] = "";
        }

        this.dialogue.style.flexShrink = "";

        this.container.dataset.panelSide =
            above >= below
                ? "above"
                : "below";

        this.container.style.setProperty(
            "--dsc-panel-shift-x",
            "0px"
        );

        this.container.style.setProperty(
            "--dsc-menu-max-height",
            "320px"
        );

        const width =
            this.panel.offsetWidth || 280;

        const desired =
            this.panel.scrollHeight;

        let height =
            Math.max(above, below);

        if (
            height < desired &&
            Math.max(left, right) >= width
        ) {
            this.container.dataset.panelSide =
                left >= right
                    ? "left"
                    : "right";

            height =
                window.innerHeight -
                position.top -
                margin;

        } else {
            const center =
                position.left + size / 2;

            const min =
                margin + width / 2;

            const max = Math.max(
                min,
                window.innerWidth -
                margin -
                width / 2
            );

            this.container.style.setProperty(
                "--dsc-panel-shift-x",
                `${Math.min(Math.max(center, min), max) - center}px`
            );
        }

        const dialogueHeight =
            this.dialogue.hidden
                ? 0
                : this.dialogue.offsetHeight + gap;

        const minimum =
            dialogueHeight +
            (this.menu.hidden ? 0 : 48);

        if (
            minimum > height &&
            (
                !this.dialogue.hidden ||
                !this.menu.hidden
            )
        ) {
            const panelLeft = Math.min(
                Math.max(
                    position.left +
                    size / 2 -
                    width / 2,
                    margin
                ),
                Math.max(
                    margin,
                    window.innerWidth -
                    width -
                    margin
                )
            );

            this.panel.style.left =
                `${panelLeft - position.left}px`;

            this.panel.style.right = "auto";

            this.panel.style.top =
                `${margin - position.top}px`;

            this.panel.style.bottom = "auto";

            this.panel.style.transform = "none";

            this.panel.style.maxHeight =
                `${Math.max(1, window.innerHeight - 2 * margin)}px`;

            this.panel.style.overflowY = "auto";

            this.panel.style.pointerEvents = "auto";

            height =
                window.innerHeight - 2 * margin;

            if (!this.dialogue.hidden) {
                this.dialogue.style.flexShrink = "0";
            }
        }

        this.container.style.setProperty(
            "--dsc-menu-max-height",
            `${Math.max(48, Math.min(320, height - dialogueHeight))}px`
        );
    }

    canUseGaze() {
        return (
            this.initialized &&
            !this.destroyed &&
            !this.suppressed &&
            !this.drag &&
            this.model &&
            !this.model.paused &&
            !document.hidden &&
            this.config.gaze.enabled &&
            (
                !this.state.isDocked() ||
                !this.config.docking.disableGazeOnDock
            )
        );
    }

    findNavigationElement(target) {
        return target instanceof Element
            ? target.closest(
                this.config.gaze.selector
            )
            : null;
    }

    handleNavigationEnter(event) {
        if (
            !this.canUseGaze() ||
            event.pointerType === "touch"
        ) {
            return;
        }

        const element =
            this.findNavigationElement(
                event.target
            );

        if (
            !element ||
            element === this.hoveredNavigation
        ) {
            return;
        }

        this.hoveredNavigation = element;

        if (!this.config.gaze.continuousMouseTracking) {

            this.idle.setNavigationHovered(true);

            this.model.lookAtElement(element);
        }
    }

    handleNavigationLeave(event) {
        const previous =
            this.findNavigationElement(
                event.target
            );

        if (
            !previous ||
            previous !== this.hoveredNavigation
        ) {
            return;
        }

        const next =
            this.findNavigationElement(
                event.relatedTarget
            );

        if (next === previous) {
            return;
        }

        if (this.config.gaze.continuousMouseTracking) {
            this.hoveredNavigation = next;

            this.idle?.setNavigationHovered(false);

            return;
        }

        if (next && this.canUseGaze()) {
            this.hoveredNavigation = next;

            this.model.lookAtElement(next);

        } else {
            this.clearNavigationGaze();
        }
    }

    clearNavigationGaze() {
        this.hoveredNavigation = null;

        this.clearGlobalGaze();

        this.idle?.setNavigationHovered(false);
    }

    navigate(action) {
        if (
            !action?.url ||
            this.suppressed ||
            (
                this.page === "momentEditor" &&
                !action.allowEmbeddedEditor
            )
        ) {
            return false;
        }

        const destination = new URL(
            action.url,
            window.location.href
        );

        if (
            !["http:", "https:"].includes(
                destination.protocol
            )
        ) {
            return false;
        }

        this.state.save();

        if (action.openInNewTab) {

            window.open(
                destination.href,
                "_blank",
                "noopener,noreferrer"
            );

            return true;
        }

        if (
            this.onboardingActive ||
            destination.origin !== window.location.origin
        ) {
            return false;
        }

        const existing = Array.from(
            document.querySelectorAll("a[href]")
        ).find(link => {

            if (this.layer.contains(link)) {
                return false;
            }

            const target = new URL(
                link.href,
                window.location.href
            );

            return (
                target.origin === destination.origin &&
                target.pathname === destination.pathname &&
                (
                    link.getAttribute("onclick") || ""
                ).includes("saveStateAndRedirect")
            );
        });

        if (existing) {
            existing.click();

            return true;
        }

        const needsTransfer = (
            (
                this.page === "editor3d" ||
                this.page === "savedProductEditor"
            ) &&
            action.id === "editor2d"
        ) || (
            this.page === "editor2d" &&
            action.id === "editor3d"
        );

        if (needsTransfer) {
            this.presentDialogue({
                text:
                    this.config.ui.messages
                        .navigationUnavailable,

                expression: "question-mark"
            });

            return false;
        }

        window.location.assign(
            destination.href
        );

        return true;
    }

    async destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        this.initialized = false;

        this.dialogueGeneration++;
        this.suppressionGeneration++;

        this.clearDialogueTimer();

        this.events.abort();

        this.momentObserver?.disconnect();

        this.destroyGlobalGaze();

        if (this.drag) {
            this.releasePointer(this.drag);
        }

        if (this.idle) {
            await this.idle.destroy();
        }

        await this.dialogueWork;

        this.model?.destroy();

        this.layer?.remove();

        this.idle = null;
        this.model = null;
        this.layer = null;
    }
}

export async function mountGuidePet(
    role,
    options = {}
) {
    const page =
        options.page ?? getCurrentPage();

    if (
        !isGuidePetEnabled(role, page) ||
        document.querySelector(".dsc-layer")
    ) {
        return null;
    }

    const pet = new GuidePet(role, {
        ...options,
        page
    });

    return await pet.initialize()
        ? pet
        : null;
}
