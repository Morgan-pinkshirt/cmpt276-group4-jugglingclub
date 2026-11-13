(() => {
    for (const name of ["moving", "static"]) {

        const visual = document.getElementById(
            `${name}-visual`
        );
        const brightness = document.getElementById(
            `${name}-brightness`
        );
        const saturation = document.getElementById(
            `${name}-saturation`
        );
        const brightOutput = document.getElementById(
            `${name}-brightness-value`
        );
        const satOutput = document.getElementById(
            `${name}-saturation-value`
        );

        if (!visual || !brightness || !saturation ||
            !brightOutput || !satOutput) {
            continue;
        }

        const update = () => {
            visual.style.setProperty(
                "--visual-brightness",
                Number(brightness.value) / 100
            );
            visual.style.setProperty(
                "--visual-saturation",
                Number(saturation.value) / 100
            );
            brightOutput.textContent =
                brightness.value + "%";
            satOutput.textContent =
                saturation.value + "%";
        };
        brightness.addEventListener("input", update);
        saturation.addEventListener("input", update);
        update();
    }
})();
