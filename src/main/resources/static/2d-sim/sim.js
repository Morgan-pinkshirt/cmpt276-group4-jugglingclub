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
            document.getElementById("moving-visual").style.setProperty(
                "--visual-brightness", Number(brightness.value));
            
            document.getElementById("static-visual").style.setProperty(
                "--visual-brightness",
                Number(brightness.value));
            
            document.getElementById("moving-visual").style.setProperty(
                "--visual-saturation", Number(saturation.value));
            
            document.getElementById("static-visual").style.setProperty(
                "--visual-saturation",
                Number(saturation.value));
            
            document.getElementById("static-brightness-value").textContent =
                brightness.value;
            document.getElementById("moving-brightness-value").textContent =
                brightness.value;
            document.getElementById("static-saturation-value").textContent =
                saturation.value;
            document.getElementById("moving-saturation-value").textContent =
                saturation.value;
        };
        brightness.addEventListener("input", update);
        saturation.addEventListener("input", update);
        update();
    }
})();
