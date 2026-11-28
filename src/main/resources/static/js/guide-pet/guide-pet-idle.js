import {
    GUIDE_PET_CONFIG,
    pickRandom,
    randomBetween
} from "./guide-pet-config.js";

export class GuidePetIdle {

    constructor(model) {
        this.model = model;
        this.config = GUIDE_PET_CONFIG.idle;

        this.running = false;
        this.destroyed = false;

        this.timer = null;
        this.waitTimer = null;
        this.waitResolver = null;

        this.activeTask = null;
        this.activeGeneration = null;
        this.generation = 0;

        this.pauseReasons = new Set();

        this.lastBehavior = null;
        this.lastActivityTime = 0;
        this.nextBehaviorTime = 0;

        this.motionDurations = new Map();
        this.durationRequest = null;

        this.frameDocuments = new Map();
        this.frameObserver = null;

        this.handleVisibilityChange =
            this.handleVisibilityChange.bind(this);

        this.handlePointerActivity =
            this.handlePointerActivity.bind(this);

        this.handleFrameLoad =
            this.handleFrameLoad.bind(this);
    }

    start() {
        if (
            !this.config.enabled ||
            !this.model.initialized ||
            this.running ||
            this.destroyed
        ) {
            return false;
        }

        this.running = true;

        this.resetCountdown();

        document.addEventListener(
            "visibilitychange",
            this.handleVisibilityChange
        );

        document.addEventListener(
            "pointermove",
            this.handlePointerActivity,
            {
                capture: true,
                passive: true
            }
        );

        document.addEventListener(
            "load",
            this.handleFrameLoad,
            true
        );

        this.refreshFrameListeners();

        if (document.body && window.MutationObserver) {
            this.frameObserver = new MutationObserver(() => {
                this.refreshFrameListeners();
            });

            this.frameObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        this.handleVisibilityChange();

        this.schedule();

        return true;
    }

    getIdleDelay() {
        const interval = this.config.interval;

        if (
            interval &&
            Number.isFinite(interval.min) &&
            interval.min > 0 &&
            interval.min === interval.max
        ) {
            return interval.min;
        }

        const timeout = this.config.inactivityTimeout;

        return Number.isFinite(timeout) && timeout > 0
            ? timeout
            : 30000;
    }

    resetCountdown() {
        const now = performance.now();

        this.lastActivityTime = now;

        this.nextBehaviorTime =
            now + this.getIdleDelay();
    }

    handlePointerActivity(event) {
        if (
            !this.running ||
            this.destroyed ||
            this.config.resetOnMouseMove === false ||
            (event.pointerType && event.pointerType !== "mouse")
        ) {
            return;
        }

        this.resetCountdown();

        if (
            this.activeTask &&
            this.activeGeneration === this.generation
        ) {
            this.cancelBehavior();
        }

        if (this.timer === null && !this.activeTask) {
            this.schedule();
        }
    }

    handleFrameLoad(event) {
        if (event.target?.tagName === "IFRAME") {
            this.refreshFrameListeners();
        }
    }

    refreshFrameListeners() {
        if (!this.running || this.destroyed) {
            return;
        }

        const frames = new Set(
            document.querySelectorAll("iframe")
        );

        for (const [frame, frameDocument] of this.frameDocuments) {

            let currentDocument = null;

            if (frames.has(frame)) {
                try {
                    currentDocument = frame.contentDocument;
                } catch {
                }
            }

            if (currentDocument !== frameDocument) {

                frameDocument.removeEventListener(
                    "pointermove",
                    this.handlePointerActivity,
                    true
                );

                this.frameDocuments.delete(frame);
            }
        }

        for (const frame of frames) {

            if (this.frameDocuments.has(frame)) {
                continue;
            }

            try {
                const frameDocument = frame.contentDocument;

                if (!frameDocument) {
                    continue;
                }

                frameDocument.addEventListener(
                    "pointermove",
                    this.handlePointerActivity,
                    {
                        capture: true,
                        passive: true
                    }
                );

                this.frameDocuments.set(
                    frame,
                    frameDocument
                );

            } catch {
            }
        }
    }

    clearFrameListeners() {
        if (this.frameObserver) {
            this.frameObserver.disconnect();
            this.frameObserver = null;
        }

        for (const frameDocument of this.frameDocuments.values()) {

            frameDocument.removeEventListener(
                "pointermove",
                this.handlePointerActivity,
                true
            );
        }

        this.frameDocuments.clear();
    }

    canRun() {
        return (
            this.config.enabled &&
            this.running &&
            !this.destroyed &&
            this.model.initialized &&
            !this.model.paused &&
            this.pauseReasons.size === 0
        );
    }

    isCurrent(generation) {
        return (
            this.canRun() &&
            generation === this.generation
        );
    }

    schedule() {
        this.clearTimer();

        if (!this.canRun() || this.activeTask) {
            return;
        }

        if (this.nextBehaviorTime <= 0) {
            this.resetCountdown();
        }

        const remaining = Math.max(
            0,
            this.nextBehaviorTime - performance.now()
        );

        this.timer = window.setTimeout(() => {

            this.timer = null;

            if (!this.canRun()) {
                return;
            }

            if (performance.now() < this.nextBehaviorTime) {
                this.schedule();
                return;
            }

            this.runBehavior();

        }, Math.ceil(remaining));
    }

    clearTimer() {
        if (this.timer !== null) {

            window.clearTimeout(this.timer);

            this.timer = null;
        }
    }

    wait(duration, generation) {
        if (!this.isCurrent(generation)) {
            return Promise.resolve(false);
        }

        return new Promise(resolve => {

            this.waitResolver = resolve;

            this.waitTimer = window.setTimeout(() => {

                this.waitTimer = null;
                this.waitResolver = null;

                resolve(
                    this.isCurrent(generation)
                );

            }, duration);
        });
    }

    cancelWait() {
        if (this.waitTimer !== null) {

            window.clearTimeout(this.waitTimer);

            this.waitTimer = null;
        }

        if (this.waitResolver) {

            const resolve = this.waitResolver;

            this.waitResolver = null;

            resolve(false);
        }
    }

    getAvailableExpressions(expressions) {
        const available =
            this.model.getExpressions() || [];

        const excluded =
            this.config.excludedExpressions || [];

        return [...new Set(expressions || [])]
            .filter(name =>
                available.includes(name) &&
                !excluded.includes(name)
            );
    }

    getAvailableMotions() {
        const available =
            this.model.getMotions() || [];

        return [...new Set(this.config.randomMotions || [])]
            .filter(name =>
                available.includes(name) &&
                name !== this.config.defaultMotion
            );
    }

    getBehaviorCategories() {
        const probability =
            this.config.probability;

        const commonExpressions =
            this.getAvailableExpressions(
                this.config.commonExpressions
            );

        const rareExpressions =
            this.getAvailableExpressions(
                this.config.rareExpressions
            ).filter(name =>
                !commonExpressions.includes(name)
            );

        const categories = [
            {
                type: "expression",
                category: "common",
                weight: probability.commonExpression,
                items: commonExpressions
            },
            {
                type: "expression",
                category: "rare",
                weight: probability.rareExpression,
                items: rareExpressions
            },
            {
                type: "motion",
                category: "motion",
                weight: probability.motion,
                items: this.getAvailableMotions()
            }
        ];

        return categories.filter(category =>
            Number.isFinite(category.weight) &&
            category.weight > 0 &&
            category.items.length > 0
        );
    }

    removePreviousBehavior(categories) {
        if (
            !this.config.avoidConsecutiveRepeats ||
            !this.lastBehavior
        ) {
            return categories;
        }

        const filtered = categories
            .map(category => ({
                ...category,

                items: category.items.filter(name =>
                    category.type !== this.lastBehavior.type ||
                    name !== this.lastBehavior.name
                )
            }))
            .filter(category =>
                category.items.length > 0
            );

        return filtered.length > 0
            ? filtered
            : categories;
    }

    chooseBehavior() {
        const categories =
            this.removePreviousBehavior(
                this.getBehaviorCategories()
            );

        if (categories.length === 0) {
            return null;
        }

        const totalWeight = categories.reduce(
            (total, category) => total + category.weight,
            0
        );

        let random = Math.random() * totalWeight;

        let selected =
            categories[categories.length - 1];

        for (const category of categories) {

            random -= category.weight;

            if (random < 0) {
                selected = category;
                break;
            }
        }

        const name = pickRandom(selected.items);

        if (!name) {
            return null;
        }

        return {
            type: selected.type,
            category: selected.category,
            name
        };
    }

    runBehavior() {
        if (!this.canRun() || this.activeTask) {
            return false;
        }

        this.clearTimer();

        this.nextBehaviorTime =
            performance.now() + this.getIdleDelay();

        const behavior = this.chooseBehavior();

        if (!behavior) {
            this.schedule();
            return false;
        }

        const generation = this.generation;

        this.activeGeneration = generation;

        const task = Promise.resolve()

            .then(() =>
                this.executeBehavior(
                    behavior,
                    generation
                )
            )

            .catch(error => {
                console.warn(
                    "[DSC] Idle behavior failed:",
                    error
                );
            })

            .finally(() => {
                if (this.activeTask === task) {

                    this.activeTask = null;
                    this.activeGeneration = null;

                    this.schedule();
                }
            });

        this.activeTask = task;

        return true;
    }

    async executeBehavior(behavior, generation) {
        if (!this.isCurrent(generation)) {
            return;
        }

        if (behavior.type === "expression") {

            await this.playExpression(
                behavior,
                generation
            );

        } else if (behavior.type === "motion") {

            await this.playMotion(
                behavior,
                generation
            );
        }
    }

    resetExpression() {
        if (!this.model.initialized) {
            return;
        }

        try {
            this.model.resetExpression();

        } catch (error) {

            console.warn(
                "[DSC] Failed to reset expression:",
                error
            );
        }
    }

    async restoreDefaultMotion() {
        if (
            !this.model.initialized ||
            this.model.paused
        ) {
            return;
        }

        try {
            this.model.resetMotionParameters?.();

            await this.model.playMotion(
                this.config.defaultMotion,
                0,
                3
            );

        } catch (error) {

            console.warn(
                "[DSC] Failed to restore idle motion:",
                error
            );
        }
    }

    async playExpression(behavior, generation) {
        const name = behavior.name;

        let attempted = false;
        let applied = false;

        try {
            if (!this.isCurrent(generation)) {
                return;
            }

            if (this.config.resetExpressionBeforeIdle) {
                this.resetExpression();
            }

            attempted = true;

            applied =
                await this.model.setExpression(name);

            if (!applied || !this.isCurrent(generation)) {
                return;
            }

            this.lastBehavior = {
                type: "expression",
                category: behavior.category,
                name
            };

            const duration = randomBetween(
                this.config.expressionDuration.min,
                this.config.expressionDuration.max
            );

            await this.wait(
                duration,
                generation
            );

        } finally {

            if (
                attempted &&
                (
                    this.config.resetExpressionAfterIdle ||
                    !this.isCurrent(generation) ||
                    !applied
                )
            ) {
                this.resetExpression();
            }
        }
    }

    async getMotionDuration(name) {
        if (this.motionDurations.has(name)) {
            return this.motionDurations.get(name);
        }

        const fallback =
            this.config.motionTimeout || 15000;

        const motion =
            this.model.modelConfig
                ?.FileReferences
                ?.Motions
                ?.[name]
                ?.[0];

        if (!motion?.File) {
            return fallback;
        }

        const controller = new AbortController();

        this.durationRequest = controller;

        const timeout = window.setTimeout(() => {
            controller.abort();
        }, 3000);

        try {
            const modelUrl = new URL(
                this.model.modelPath ||
                    GUIDE_PET_CONFIG.appearance.modelPath,
                window.location.href
            );

            const motionUrl = new URL(
                motion.File,
                modelUrl
            );

            const response = await fetch(
                motionUrl,
                {
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                return fallback;
            }

            const data = await response.json();

            const seconds = data.Meta?.Duration;

            if (!Number.isFinite(seconds) || seconds <= 0) {
                return fallback;
            }

            const duration = Math.min(
                seconds * 1000,
                fallback
            );

            this.motionDurations.set(
                name,
                duration
            );

            return duration;

        } catch (error) {

            if (error.name !== "AbortError") {

                console.warn(
                    "[DSC] Failed to read motion duration:",
                    name,
                    error
                );
            }

            return fallback;

        } finally {

            window.clearTimeout(timeout);

            if (this.durationRequest === controller) {
                this.durationRequest = null;
            }
        }
    }

    async playMotion(behavior, generation) {
        const name = behavior.name;

        const duration =
            await this.getMotionDuration(name);

        if (!this.isCurrent(generation)) {
            return;
        }

        let attempted = false;

        try {
            if (this.config.resetExpressionBeforeIdle) {
                this.resetExpression();
            }

            attempted = true;

            const started =
                await this.model.playMotion(
                    name,
                    0,
                    3
                );

            if (!started || !this.isCurrent(generation)) {
                return;
            }

            this.lastBehavior = {
                type: "motion",
                category: behavior.category,
                name
            };

            await this.wait(
                duration,
                generation
            );

        } finally {

            if (attempted) {

                if (
                    this.config.resetExpressionAfterIdle ||
                    !this.isCurrent(generation)
                ) {
                    this.resetExpression();
                }

                await this.restoreDefaultMotion();
            }
        }
    }

    cancelBehavior() {
        this.generation++;

        this.clearTimer();

        this.cancelWait();

        if (this.durationRequest) {
            this.durationRequest.abort();
        }

        return this.activeTask ||
            Promise.resolve();
    }

    pause(reason = "manual") {
        if (this.destroyed) {
            return Promise.resolve();
        }

        if (this.pauseReasons.has(reason)) {
            return this.activeTask ||
                Promise.resolve();
        }

        this.pauseReasons.add(reason);

        this.resetCountdown();

        return this.cancelBehavior();
    }

    resume(reason = "manual") {
        const removed =
            this.pauseReasons.delete(reason);

        if (removed && this.pauseReasons.size === 0) {

            this.resetCountdown();

            this.schedule();
        }
    }

    setPauseReason(reason, active, enabled = true) {
        if (!enabled) {

            this.resume(reason);

            return Promise.resolve();
        }

        if (active) {
            return this.pause(reason);
        }

        this.resume(reason);

        return Promise.resolve();
    }

    setInteractionActive(active) {
        return this.setPauseReason(
            "interaction",
            active,
            this.config.pauseDuringInteraction
        );
    }

    setMenuActive(active) {
        return this.setPauseReason(
            "menu",
            active,
            this.config.pauseDuringInteraction
        );
    }

    setDialogueActive(active) {
        return this.setPauseReason(
            "dialogue",
            active,
            this.config.pauseDuringInteraction
        );
    }

    setDragging(active) {
        return this.setPauseReason(
            "drag",
            active,
            this.config.pauseDuringInteraction
        );
    }

    setNavigationHovered(active) {
        return this.setPauseReason(
            "navigation",
            active,
            this.config.pauseDuringNavigationHover
        );
    }

    setDocked(active) {
        return this.setPauseReason(
            "docked",
            active,
            this.config.pauseWhenHidden &&
                GUIDE_PET_CONFIG.docking.pauseIdleOnDock
        );
    }

    setDockDragging(active) {
        return this.setPauseReason(
            "dock-drag",
            active,
            this.config.pauseDuringDockDrag
        );
    }

    setResizeActive(active) {
        return this.setPauseReason(
            "resize",
            active,
            this.config.pauseDuringResize &&
                GUIDE_PET_CONFIG.resize.pauseIdleDuringReaction
        );
    }

    setOnboardingActive(active) {
        return this.setPauseReason(
            "onboarding",
            active,
            this.config.pauseDuringOnboarding &&
                GUIDE_PET_CONFIG.onboarding.pauseIdleDuringOnboarding
        );
    }

    setSuppressed(active) {
        return this.setPauseReason(
            "moment-editor",
            active
        );
    }

    handleVisibilityChange() {
        return this.setPauseReason(
            "page-inactive",
            document.hidden,
            this.config.pauseWhenPageInactive
        );
    }

    isPaused() {
        return this.pauseReasons.size > 0;
    }

    isPlaying() {
        return this.activeTask !== null;
    }

    getPauseReasons() {
        return Array.from(this.pauseReasons);
    }

    getLastBehavior() {
        return this.lastBehavior
            ? { ...this.lastBehavior }
            : null;
    }

    getExpressionPools() {
        const common =
            this.getAvailableExpressions(
                this.config.commonExpressions
            );

        const rare =
            this.getAvailableExpressions(
                this.config.rareExpressions
            ).filter(name =>
                !common.includes(name)
            );

        return {
            common,
            rare,
            total: common.length + rare.length,
            excluded: [
                ...(this.config.excludedExpressions || [])
            ]
        };
    }

    getRemainingTime() {
        if (!this.canRun()) {
            return this.getIdleDelay();
        }

        return Math.max(
            0,
            this.nextBehaviorTime - performance.now()
        );
    }

    getInactivityTime() {
        if (!this.running) {
            return 0;
        }

        return Math.max(
            0,
            performance.now() - this.lastActivityTime
        );
    }

    getStatus() {
        return {
            running: this.running,

            paused: this.isPaused(),

            playing: this.isPlaying(),

            scheduled: this.timer !== null,

            pauseReasons: this.getPauseReasons(),

            lastBehavior: this.getLastBehavior(),

            expressions: this.getExpressionPools(),

            motions: this.getAvailableMotions(),

            cachedMotionCount: this.motionDurations.size,

            idleDelay: this.getIdleDelay(),

            remainingTime: Math.round(
                this.getRemainingTime()
            ),

            inactivityTime: Math.round(
                this.getInactivityTime()
            ),

            monitoredFrames: this.frameDocuments.size
        };
    }

    restartTimer() {
        this.resetCountdown();

        this.schedule();
    }

    async stop() {
        this.running = false;

        document.removeEventListener(
            "visibilitychange",
            this.handleVisibilityChange
        );

        document.removeEventListener(
            "pointermove",
            this.handlePointerActivity,
            true
        );

        document.removeEventListener(
            "load",
            this.handleFrameLoad,
            true
        );

        this.clearFrameListeners();

        await this.cancelBehavior();

        this.nextBehaviorTime = 0;
        this.lastActivityTime = 0;
    }

    async destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        await this.stop();

        this.pauseReasons.clear();

        this.motionDurations.clear();

        this.lastBehavior = null;
        this.activeGeneration = null;
        this.durationRequest = null;
    }
}
