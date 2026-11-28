export class GuidePetModel {

    constructor(canvas, options = {}) {

        this.canvas = canvas;

        this.modelPath = options.modelPath ||
            "/live2d/models/guide-pet/c_0120.model3.json";

        this.width = options.width || 300;
        this.height = options.height || 300;
        this.scaleFactor = options.scaleFactor || 0.9;

        this.app = null;
        this.model = null;
        this.modelConfig = null;

        this.originalWidth = 0;
        this.originalHeight = 0;

        this.activeExpression = null;
        this.initialized = false;
        this.paused = false;
    }

    async initialize() {

        if (this.initialized) {
            return this;
        }

        if (this.app) {
            throw new Error("Model is already initializing.");
        }

        if (!window.Live2DCubismCore) {
            throw new Error("Live2D Cubism Core is unavailable.");
        }

        if (!window.PIXI || !window.PIXI.live2d?.Live2DModel) {
            throw new Error("Live2D rendering libraries are unavailable.");
        }

        try {

            this.app = new PIXI.Application({
                view: this.canvas,
                width: this.width,
                height: this.height,
                backgroundAlpha: 0,
                antialias: true
            });

            const response = await fetch(this.modelPath);

            if (!response.ok) {
                throw new Error("Failed to load model configuration.");
            }

            this.modelConfig = await response.json();

            this.model = await PIXI.live2d.Live2DModel.from(
                this.modelPath,
                {
                    autoInteract: false,
                    autoUpdate: true
                }
            );

            this.app.stage.addChild(this.model);

            this.originalWidth = this.model.width;
            this.originalHeight = this.model.height;

            this.model.anchor.set(0.5, 0.5);

            this.resize(this.width, this.height);

            this.initialized = true;

            this.resetGaze();

            console.log("[Guide Pet] Model initialized.");

            return this;

        } catch (error) {

            this.destroy();

            console.error(
                "[Guide Pet] Initialization failed:",
                error
            );

            throw error;
        }
    }

    async playMotion(group, index = 0, priority = 3) {

        if (!this.initialized || this.paused) {
            return false;
        }

        const motions =
            this.modelConfig.FileReferences.Motions || {};

        if (!motions[group] || !motions[group][index]) {

            console.warn(
                "[Guide Pet] Unknown motion:",
                group,
                index
            );

            return false;
        }

        try {

            if (priority === 3) {

                const motionManager =
                    this.model.internalModel?.motionManager;

                motionManager?.stopAllMotions?.();

                this.resetMotionParameters();
            }

            return await this.model.motion(
                group,
                index,
                priority
            );

        } catch (error) {

            console.error(
                "[Guide Pet] Motion failed:",
                error
            );

            return false;
        }
    }

    resetMotionParameters() {

        if (!this.initialized || !this.model) {
            return false;
        }

        const coreModel =
            this.model.internalModel?.coreModel;

        if (!coreModel) {
            return false;
        }

        const parameters = [
            "chuipaopao",
            "chuipaopao1",
            "chuipaopao2",
            "chuipaopao3",
            "chuipaopao4",
            "chuipaopao5",
            "chuipaopao6",
            "chuipaopao7",

            "phone",
            "phone2",
            "phone3",
            "phone4",
            "phone5",
            "phone6",

            "danbaoX",
            "danbaoY",
            "danbaoz",
            "aixing",
            "Param9",

            "Param70",
            "Param71",
            "Param72",

            "keyboard",
            "xbox",
            "pointZ2",
            "pengshui"
        ];

        if (
            typeof coreModel.loadParameters !== "function" ||
            typeof coreModel.saveParameters !== "function" ||
            typeof coreModel.getParameterIndex !== "function" ||
            typeof coreModel.getParameterCount !== "function" ||
            typeof coreModel.getParameterDefaultValue !== "function" ||
            typeof coreModel.setParameterValueByIndex !== "function"
        ) {

            console.warn(
                "[Guide Pet] Motion parameter reset is unavailable."
            );

            return false;
        }

        try {

            coreModel.loadParameters();

            const parameterCount =
                coreModel.getParameterCount();

            for (const id of parameters) {

                const index =
                    coreModel.getParameterIndex(id);

                if (index < 0 || index >= parameterCount) {
                    continue;
                }

                const defaultValue =
                    coreModel.getParameterDefaultValue(index);

                if (!Number.isFinite(defaultValue)) {
                    continue;
                }

                coreModel.setParameterValueByIndex(
                    index,
                    defaultValue
                );
            }

            coreModel.saveParameters();

            return true;

        } catch (error) {

            console.warn(
                "[Guide Pet] Failed to reset motion parameters:",
                error
            );

            return false;
        }
    }

    async setExpression(name) {

        if (!this.initialized || this.paused) {
            return false;
        }

        if (!this.getExpressions().includes(name)) {

            console.warn(
                "[Guide Pet] Unknown expression:",
                name
            );

            return false;
        }

        if (this.activeExpression === name) {
            return true;
        }

        try {

            const success =
                await this.model.expression(name);

            if (success) {
                this.activeExpression = name;
            }

            return success;

        } catch (error) {

            console.error(
                "[Guide Pet] Expression failed:",
                error
            );

            return false;
        }
    }

    resetExpression() {

        if (!this.initialized) {
            return false;
        }

        const expressionManager =
            this.model.internalModel
                ?.motionManager
                ?.expressionManager;

        if (
            !expressionManager ||
            typeof expressionManager.resetExpression !== "function"
        ) {
            return false;
        }

        expressionManager.currentExpression =
            expressionManager.defaultExpression;

        expressionManager.resetExpression();

        this.activeExpression = null;

        return true;
    }

    lookAtPosition(clientX, clientY) {

        if (!this.initialized || this.paused) {
            return;
        }

        const bounds =
            this.canvas.getBoundingClientRect();

        if (bounds.width === 0 || bounds.height === 0) {
            return;
        }

        const x =
            (clientX - bounds.left) *
            this.app.screen.width / bounds.width;

        const y =
            (clientY - bounds.top) *
            this.app.screen.height / bounds.height;

        this.model.focus(x, y, false);
    }

    lookAtElement(element) {

        if (!this.initialized || !element) {
            return;
        }

        const bounds =
            element.getBoundingClientRect();

        const centerX =
            bounds.left + bounds.width / 2;

        const centerY =
            bounds.top + bounds.height / 2;

        this.lookAtPosition(centerX, centerY);
    }

    resetGaze() {

        if (!this.initialized) {
            return;
        }

        const focusController =
            this.model.internalModel?.focusController;

        if (focusController) {

            focusController.focus(
                0,
                0,
                false
            );
        }
    }

    getExpressions() {

        const expressions =
            this.modelConfig?.FileReferences?.Expressions || [];

        return expressions.map(
            expression => expression.Name
        );
    }

    getMotions() {

        const motions =
            this.modelConfig?.FileReferences?.Motions || {};

        return Object.keys(motions);
    }

    resize(width, height) {

        if (!this.app || !this.model) {
            return;
        }

        if (width <= 0 || height <= 0) {
            return;
        }

        this.width = width;
        this.height = height;

        this.app.renderer.resize(width, height);

        const scale = Math.min(
            width / this.originalWidth,
            height / this.originalHeight
        ) * this.scaleFactor;

        this.model.scale.set(scale);

        this.model.position.set(
            width / 2,
            height / 2
        );
    }

    pause() {

        if (!this.initialized || this.paused) {
            return;
        }

        this.resetGaze();

        this.model.autoUpdate = false;

        this.app.stop();

        this.paused = true;
    }

    resume() {

        if (!this.initialized || !this.paused) {
            return;
        }

        this.model.autoUpdate = true;

        this.app.start();

        this.paused = false;

        this.resetGaze();
    }

    destroy() {

        if (this.model) {
            this.model.autoUpdate = false;
        }

        if (this.app) {

            this.app.destroy(false, {
                children: true,
                texture: true,
                baseTexture: true
            });
        }

        this.app = null;
        this.model = null;
        this.modelConfig = null;

        this.originalWidth = 0;
        this.originalHeight = 0;

        this.activeExpression = null;
        this.initialized = false;
        this.paused = false;
    }
}
