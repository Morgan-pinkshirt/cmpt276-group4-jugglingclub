import {
    GUIDE_PET_CONFIG,
    getPetSize,
    getCurrentPage,
    getPageBehavior,
    shouldDefaultDock,
    shouldRememberPlacement,
    getDockDragThreshold
} from "./guide-pet-config.js";


export class GuidePetState {

    constructor(
        role = "GUEST",
        page = getCurrentPage()
    ) {

        this.role = role;
        this.page = page;

        this.pageBehavior = getPageBehavior(page);

        this.rememberPlacement =
            shouldRememberPlacement(page);

        this.storageKey =
            "jugglingclub.dsc.state." + role.toLowerCase();

        this.sizeChanged = false;

        this.state = this.load();
    }


    // Create the global default state
    getDefaultState() {

        const appearance =
            GUIDE_PET_CONFIG.appearance;

        return {

            size: appearance.defaultSize,

            position: {
                right: appearance.defaultPosition.right,
                bottom: appearance.defaultPosition.bottom
            },

            hidden: appearance.defaultHidden,

            dockSide: appearance.defaultHidden
                ? "right"
                : null
        };
    }


    // Apply page-specific initial settings
    applyPageDefaults(state) {

        const defaults = this.getDefaultState();

        const result = {

            ...state,

            position: {
                ...state.position
            }
        };

        if (!this.rememberPlacement) {

            result.position = {
                ...defaults.position
            };

            result.hidden = false;

            result.dockSide = null;
        }

        if (shouldDefaultDock(this.page)) {

            result.hidden = true;

            result.dockSide =
                this.pageBehavior.dockSide === "left"
                    ? "left"
                    : "right";

            result.position = {

                right: defaults.position.right,

                bottom:
                    this.pageBehavior.dockBottom ??
                    defaults.position.bottom
            };
        }

        return result;
    }


    // Read globally saved settings
    readSavedState() {

        try {

            const saved =
                window.localStorage.getItem(
                    this.storageKey
                );

            if (!saved) {
                return this.getDefaultState();
            }

            return this.validateState(
                JSON.parse(saved)
            );

        } catch (error) {

            console.warn(
                "[DSC] Failed to read saved state:",
                error
            );

            return this.getDefaultState();
        }
    }


    // Load saved settings and apply page-specific behavior
    load() {

        return this.applyPageDefaults(
            this.readSavedState()
        );
    }


    // Validate saved settings
    validateState(saved) {

        const defaults =
            this.getDefaultState();

        const interaction =
            GUIDE_PET_CONFIG.interaction;

        const sizes =
            GUIDE_PET_CONFIG.appearance.sizes;

        const validSize =

            typeof saved?.size === "string" &&

            Object.prototype.hasOwnProperty.call(
                sizes,
                saved.size
            );

        const validRight =
            Number.isFinite(saved?.position?.right);

        const validBottom =
            Number.isFinite(saved?.position?.bottom);

        const hidden =

            GUIDE_PET_CONFIG.docking.enabled &&

            (
                interaction.rememberVisibility &&
                typeof saved?.hidden === "boolean"

                    ? saved.hidden

                    : defaults.hidden
            );

        const validDockSide =

            saved?.dockSide === "left" ||

            saved?.dockSide === "right";

        return {

            size:

                interaction.rememberSize && validSize

                    ? saved.size

                    : defaults.size,

            position: {

                right:

                    interaction.rememberPosition && validRight

                        ? Math.max(0, saved.position.right)

                        : defaults.position.right,

                bottom:

                    interaction.rememberPosition && validBottom

                        ? Math.max(0, saved.position.bottom)

                        : defaults.position.bottom
            },

            hidden,

            dockSide:

                hidden

                    ? (
                        validDockSide
                            ? saved.dockSide
                            : "right"
                    )

                    : null
        };
    }


    // Save global settings without overwriting temporary placement
    save() {

        const interaction =
            GUIDE_PET_CONFIG.interaction;

        const defaults =
            this.getDefaultState();

        const previous =
            this.readSavedState();

        const current =
            this.validateState(this.state);

        const savedState = {

            size:

                interaction.rememberSize

                    ? (
                        this.sizeChanged
                            ? current.size
                            : previous.size
                    )

                    : defaults.size,

            position:

                interaction.rememberPosition

                    ? (
                        this.rememberPlacement
                            ? { ...current.position }
                            : { ...previous.position }
                    )

                    : { ...defaults.position },

            hidden:

                interaction.rememberVisibility

                    ? (
                        this.rememberPlacement
                            ? current.hidden
                            : previous.hidden
                    )

                    : defaults.hidden,

            dockSide:

                interaction.rememberVisibility

                    ? (
                        this.rememberPlacement
                            ? current.dockSide
                            : previous.dockSide
                    )

                    : defaults.dockSide
        };

        try {

            window.localStorage.setItem(
                this.storageKey,
                JSON.stringify(savedState)
            );

            this.sizeChanged = false;

            return true;

        } catch (error) {

            console.warn(
                "[DSC] Failed to save state:",
                error
            );

            return false;
        }
    }


    // Return a copy of the current state
    getState() {

        return {

            size: this.state.size,

            position: {
                ...this.state.position
            },

            hidden: this.state.hidden,

            dockSide: this.state.dockSide
        };
    }


    // Return globally saved settings
    getPersistentState() {

        return this.readSavedState();
    }


    // Return whether the current page uses temporary placement
    usesTemporaryPlacement() {

        return !this.rememberPlacement;
    }


    // Return the selected size
    getSize() {

        return this.state.size;
    }


    // Return the configured canvas size
    getSizePixels() {

        return getPetSize(
            this.state.size
        );
    }


    // Return the effective size for the current viewport
    getEffectiveSize() {

        const margin =
            GUIDE_PET_CONFIG.appearance.screenMargin;

        return Math.max(

            1,

            Math.min(

                this.getSizePixels(),

                window.innerWidth - margin * 2,

                window.innerHeight - margin * 2
            )
        );
    }


    // Update the selected size
    setSize(size, persist = true) {

        const sizes =
            GUIDE_PET_CONFIG.appearance.sizes;

        if (
            !Object.prototype.hasOwnProperty.call(
                sizes,
                size
            )
        ) {

            return false;
        }

        if (this.state.size === size) {

            return true;
        }

        this.state.size = size;

        this.sizeChanged = true;

        if (persist) {

            this.save();
        }

        return true;
    }


    // Return the current normal display position
    getPosition() {

        return {
            ...this.state.position
        };
    }


    // Update the normal display position
    setPosition(right, bottom, persist = true) {

        if (

            !Number.isFinite(right) ||

            !Number.isFinite(bottom)

        ) {

            return false;
        }

        this.state.position = {

            right: Math.max(0, right),

            bottom: Math.max(0, bottom)
        };

        if (persist) {

            this.save();
        }

        return true;
    }


    // Convert screen coordinates to right-bottom coordinates
    setPositionFromCoordinates(

        left,

        top,

        elementWidth,

        elementHeight,

        persist = true

    ) {

        const right =

            window.innerWidth -

            left -

            elementWidth;

        const bottom =

            window.innerHeight -

            top -

            elementHeight;

        return this.setPosition(

            right,

            bottom,

            persist
        );
    }


    // Return valid coordinates for an expanded assistant
    clampCoordinates(

        left,

        top,

        elementWidth,

        elementHeight,

        margin = GUIDE_PET_CONFIG.appearance.screenMargin

    ) {

        const availableWidth = Math.max(

            0,

            window.innerWidth - elementWidth
        );

        const availableHeight = Math.max(

            0,

            window.innerHeight - elementHeight
        );

        const minLeft = Math.min(
            margin,
            availableWidth / 2
        );

        const minTop = Math.min(
            margin,
            availableHeight / 2
        );

        const maxLeft = Math.max(

            minLeft,

            availableWidth - margin
        );

        const maxTop = Math.max(

            minTop,

            availableHeight - margin
        );

        return {

            left: Math.min(

                Math.max(left, minLeft),

                maxLeft
            ),

            top: Math.min(

                Math.max(top, minTop),

                maxTop
            )
        };
    }


    // Return the expanded position in screen coordinates
    getExpandedCoordinates(

        elementWidth = this.getEffectiveSize(),

        elementHeight = elementWidth

    ) {

        const position =
            this.getPosition();

        return {

            left:

                window.innerWidth -

                position.right -

                elementWidth,

            top:

                window.innerHeight -

                position.bottom -

                elementHeight
        };
    }


    // Detect whether the assistant has reached a horizontal edge
    detectDockSide(bounds) {

        if (!GUIDE_PET_CONFIG.docking.enabled) {

            return null;
        }

        if (

            !bounds ||

            !Number.isFinite(bounds.left) ||

            !Number.isFinite(bounds.right)

        ) {

            return null;
        }

        const threshold =
            GUIDE_PET_CONFIG.docking.threshold;

        const leftDistance =
            bounds.left;

        const rightDistance =
            window.innerWidth - bounds.right;

        const nearLeft =
            leftDistance <= threshold;

        const nearRight =
            rightDistance <= threshold;

        if (nearLeft && nearRight) {

            return leftDistance <= rightDistance

                ? "left"

                : "right";
        }

        if (nearLeft) {

            return "left";
        }

        if (nearRight) {

            return "right";
        }

        return null;
    }


    // Find the nearest horizontal edge
    getNearestDockSide(

        elementWidth = this.getEffectiveSize()

    ) {

        const rightDistance =
            this.state.position.right;

        const leftDistance =

            window.innerWidth -

            rightDistance -

            elementWidth;

        return leftDistance < rightDistance

            ? "left"

            : "right";
    }


    // Return whether the assistant is docked
    isDocked() {

        return (

            this.state.hidden &&

            (
                this.state.dockSide === "left" ||

                this.state.dockSide === "right"
            )
        );
    }


    // Return the current docking direction
    getDockSide() {

        return this.state.dockSide;
    }


    // Dock the assistant
    dock(side, persist = true) {

        if (!GUIDE_PET_CONFIG.docking.enabled) {

            return false;
        }

        if (side !== "left" && side !== "right") {

            return false;
        }

        this.state.hidden = true;

        this.state.dockSide = side;

        if (persist) {

            this.save();
        }

        return true;
    }


    // Dock the assistant to the nearest horizontal edge
    dockToNearestEdge(

        elementWidth = this.getEffectiveSize(),

        persist = true

    ) {

        return this.dock(

            this.getNearestDockSide(elementWidth),

            persist
        );
    }


    // Change the docking direction
    setDockSide(side, persist = true) {

        return this.dock(
            side,
            persist
        );
    }


    // Return whether the assistant is hidden at an edge
    isHidden() {

        return this.state.hidden;
    }


    // Calculate the position of the rotated container
    getDockPosition(

        elementWidth,

        elementHeight,

        visibleDepth

    ) {

        if (!this.isDocked()) {

            return null;
        }

        if (

            !Number.isFinite(elementWidth) ||

            !Number.isFinite(elementHeight) ||

            !Number.isFinite(visibleDepth)

        ) {

            return null;
        }

        const width =
            Math.max(0, elementWidth);

        const height =
            Math.max(0, elementHeight);

        const depth = Math.min(

            Math.max(0, visibleDepth),

            height
        );

        const horizontalOffset =

            -(width + height) / 2 + depth;

        const margin =
            GUIDE_PET_CONFIG.appearance.screenMargin;

        const rotation =

            this.state.dockSide === "left"

                ? 90

                : -90;

        const maxBottom = Math.max(

            0,

            window.innerHeight -

            width -

            margin
        );

        const rotatedBottom = Math.min(

            Math.max(
                0,
                this.state.position.bottom
            ),

            maxBottom
        );

        const bottom =

            rotatedBottom +

            (width - height) / 2;

        return {

            side: this.state.dockSide,

            left:

                this.state.dockSide === "left"

                    ? horizontalOffset

                    : null,

            right:

                this.state.dockSide === "right"

                    ? horizontalOffset

                    : null,

            bottom,

            rotation
        };
    }


    // Return the center of the docked container
    getDockCenter(

        elementWidth = this.getEffectiveSize(),

        elementHeight = elementWidth,

        peekDistance = 0

    ) {

        const visibleDepth =

            elementHeight *

            GUIDE_PET_CONFIG.docking.visibleRatio;

        const dockPosition = this.getDockPosition(

            elementWidth,

            elementHeight,

            visibleDepth
        );

        if (!dockPosition) {

            return null;
        }

        const left =

            dockPosition.side === "left"

                ? dockPosition.left

                : (
                    window.innerWidth -

                    dockPosition.right -

                    elementWidth
                );

        const top =

            window.innerHeight -

            dockPosition.bottom -

            elementHeight;

        const inwardDirection =

            dockPosition.side === "left"

                ? 1

                : -1;

        return {

            x:

                left +

                elementWidth / 2 +

                peekDistance * inwardDirection,

            y:

                top +

                elementHeight / 2,

            rotation:
                dockPosition.rotation
        };
    }


    // Calculate a nearby position for click restoration
    getRestorePosition(

        elementWidth = this.getEffectiveSize(),

        elementHeight = elementWidth

    ) {

        const docking =
            GUIDE_PET_CONFIG.docking;

        if (

            !this.isDocked() ||

            !docking.restoreNearEdge

        ) {

            const original =
                this.getExpandedCoordinates(
                    elementWidth,
                    elementHeight
                );

            return this.clampCoordinates(

                original.left,

                original.top,

                elementWidth,

                elementHeight
            );
        }

        const center = this.getDockCenter(

            elementWidth,

            elementHeight
        );

        const edgeMargin =
            docking.restoreEdgeMargin;

        const left =

            this.state.dockSide === "left"

                ? edgeMargin

                : (
                    window.innerWidth -

                    elementWidth -

                    edgeMargin
                );

        const top =

            center.y -

            elementHeight / 2;

        return this.clampCoordinates(

            left,

            top,

            elementWidth,

            elementHeight
        );
    }


    // Restore the assistant near its current docking edge
    restoreFromDock(

        elementWidth = this.getEffectiveSize(),

        elementHeight = elementWidth,

        persist = true

    ) {

        if (!this.isDocked()) {

            return this.getPosition();
        }

        const position = this.getRestorePosition(

            elementWidth,

            elementHeight
        );

        this.state.hidden = false;

        this.state.dockSide = null;

        this.setPositionFromCoordinates(

            position.left,

            position.top,

            elementWidth,

            elementHeight,

            false
        );

        if (persist) {

            this.save();
        }

        return this.getPosition();
    }


    // Restore the assistant from docking
    undock(persist = true) {

        const size =
            this.getEffectiveSize();

        return this.restoreFromDock(

            size,

            size,

            persist
        );
    }


    // Rotate a two-dimensional point
    rotatePoint(x, y, degrees) {

        const radians =
            degrees * Math.PI / 180;

        const cosine =
            Math.cos(radians);

        const sine =
            Math.sin(radians);

        return {

            x: x * cosine - y * sine,

            y: x * sine + y * cosine
        };
    }


    // Create a temporary drag state from a docked position
    createDockDrag(

        clientX,

        clientY,

        elementWidth = this.getEffectiveSize(),

        elementHeight = elementWidth,

        visualBounds = null

    ) {

        const docking =
            GUIDE_PET_CONFIG.docking;

        if (

            !this.isDocked() ||

            !docking.restoreOnDrag ||

            !GUIDE_PET_CONFIG.interaction.enableDragging ||

            !Number.isFinite(clientX) ||

            !Number.isFinite(clientY)

        ) {

            return null;
        }

        const center = this.getDockCenter(

            elementWidth,

            elementHeight
        );

        if (!center) {

            return null;
        }

        // Use the actual visual center when hovering or animating
        const centerX =

            Number.isFinite(visualBounds?.left) &&
            Number.isFinite(visualBounds?.width)

                ? (
                    visualBounds.left +
                    visualBounds.width / 2
                )

                : center.x;

        const centerY =

            Number.isFinite(visualBounds?.top) &&
            Number.isFinite(visualBounds?.height)

                ? (
                    visualBounds.top +
                    visualBounds.height / 2
                )

                : center.y;

        // Store the grabbed point in unrotated model coordinates
        const anchor = this.rotatePoint(

            clientX - centerX,

            clientY - centerY,

            -center.rotation
        );

        return {

            side: this.state.dockSide,

            startX: clientX,

            startY: clientY,

            centerX,

            centerY,

            anchorX: anchor.x,

            anchorY: anchor.y,

            startRotation: center.rotation,

            width: elementWidth,

            height: elementHeight,

            threshold: getDockDragThreshold(
                elementWidth
            )
        };
    }


    // Calculate a temporary frame during dock dragging
    getDockDragFrame(

        drag,

        clientX,

        clientY

    ) {

        if (

            !drag ||

            !this.isDocked() ||

            drag.side !== this.state.dockSide ||

            !Number.isFinite(clientX) ||

            !Number.isFinite(clientY)

        ) {

            return null;
        }

        const docking =
            GUIDE_PET_CONFIG.docking;

        const deltaX =
            clientX - drag.startX;

        const deltaY =
            clientY - drag.startY;

        const direction =

            drag.side === "left"

                ? 1

                : -1;

        // Only inward movement contributes to restoration
        const inwardDistance = Math.max(

            0,

            deltaX * direction
        );

        const progress = Math.min(

            1,

            inwardDistance /

            Math.max(1, drag.threshold)
        );

        const shouldRestore =

            progress >= 1;

        const rotation =

            docking.progressiveRotation

                ? (
                    drag.startRotation *
                    (1 - progress)
                )

                : (
                    shouldRestore
                        ? 0
                        : drag.startRotation
                );

        // Keep the grabbed point close to the cursor
        const rotatedAnchor = this.rotatePoint(

            drag.anchorX,

            drag.anchorY,

            rotation
        );

        const effectiveX =

            drag.startX +

            inwardDistance * direction;

        const centerX =

            effectiveX -

            rotatedAnchor.x;

        const centerY =

            clientY -

            rotatedAnchor.y;

        const rawLeft =

            centerX -

            drag.width / 2;

        const rawTop =

            centerY -

            drag.height / 2;

        const clamped = this.clampCoordinates(

            rawLeft,

            rawTop,

            drag.width,

            drag.height
        );

        // Gradually move the container inside the viewport
        const left =

            rawLeft +

            (clamped.left - rawLeft) * progress;

        const top =

            rawTop +

            (clamped.top - rawTop) * progress;

        const moved =

            Math.hypot(deltaX, deltaY) >=

            docking.dragClickThreshold;

        return {

            side: drag.side,

            left,

            top,

            centerX:
                left + drag.width / 2,

            centerY:
                top + drag.height / 2,

            width: drag.width,

            height: drag.height,

            rotation,

            progress,

            inwardDistance,

            threshold: drag.threshold,

            shouldRestore,

            moved,

            clientX,

            clientY
        };
    }


    // Commit the final position after crossing the drag threshold
    completeDockDrag(

        frame,

        persist = true

    ) {

        if (

            !frame ||

            !frame.shouldRestore ||

            !this.isDocked() ||

            frame.side !== this.state.dockSide

        ) {

            return false;
        }

        const position = this.clampCoordinates(

            frame.left,

            frame.top,

            frame.width,

            frame.height
        );

        this.state.hidden = false;

        this.state.dockSide = null;

        this.setPositionFromCoordinates(

            position.left,

            position.top,

            frame.width,

            frame.height,

            false
        );

        if (persist) {

            this.save();
        }

        return {

            left: position.left,

            top: position.top,

            rotation: 0,

            right: this.state.position.right,

            bottom: this.state.position.bottom
        };
    }


    // Update the visibility state
    setHidden(hidden, persist = true) {

        if (hidden) {

            if (!this.isDocked()) {

                this.dockToNearestEdge(

                    this.getEffectiveSize(),

                    persist
                );
            }

        } else {

            this.undock(persist);
        }

        return this.state.hidden;
    }


    // Hide the assistant at the nearest horizontal edge
    hide() {

        return this.setHidden(true);
    }


    // Restore the assistant
    show() {

        return this.setHidden(false);
    }


    // Toggle docking
    toggleVisibility() {

        return this.setHidden(
            !this.state.hidden
        );
    }


    // Keep the expanded assistant within the viewport
    clampPosition(

        elementWidth,

        elementHeight,

        persist = true

    ) {

        if (this.isDocked()) {

            return this.getPosition();
        }

        const original = this.getExpandedCoordinates(

            elementWidth,

            elementHeight
        );

        const clamped = this.clampCoordinates(

            original.left,

            original.top,

            elementWidth,

            elementHeight
        );

        this.setPositionFromCoordinates(

            clamped.left,

            clamped.top,

            elementWidth,

            elementHeight,

            persist
        );

        return this.getPosition();
    }


    // Restore the default position and expand the assistant
    resetPosition() {

        const defaults =
            this.getDefaultState();

        this.state.position = {
            ...defaults.position
        };

        this.state.hidden = false;

        this.state.dockSide = null;

        this.save();

        return this.getPosition();
    }


    // Restore the default size
    resetSize() {

        this.state.size =
            this.getDefaultState().size;

        this.sizeChanged = true;

        this.save();

        return this.state.size;
    }


    // Restore the initial placement for the current page
    resetPagePlacement() {

        const defaults = this.applyPageDefaults(

            this.getDefaultState()
        );

        this.state.position = {
            ...defaults.position
        };

        this.state.hidden =
            defaults.hidden;

        this.state.dockSide =
            defaults.dockSide;

        this.save();

        return this.getState();
    }


    // Restore all default settings
    resetAll() {

        this.state = this.applyPageDefaults(

            this.getDefaultState()
        );

        this.sizeChanged = true;

        this.save();

        return this.getState();
    }


    // Clear saved settings
    clearSavedState() {

        if (!this.rememberPlacement) {

            return this.resetAll();
        }

        try {

            window.localStorage.removeItem(
                this.storageKey
            );

        } catch (error) {

            console.warn(
                "[DSC] Failed to clear saved state:",
                error
            );
        }

        this.state = this.applyPageDefaults(

            this.getDefaultState()
        );

        this.sizeChanged = false;

        return this.getState();
    }
}
