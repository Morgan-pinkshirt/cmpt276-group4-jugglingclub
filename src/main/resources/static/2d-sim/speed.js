(() => {
    const control = document.getElementById(
        "moving-speed"
    );
    const label = document.getElementById(
        "moving-speed-value"
    );
    const club = document.getElementById(
        "clubDivision"
    );

    if (!control || !label || !club) {
        return;
    }

    const update = () => {
        const speed = Number(control.value) / 100;
        window.jestersSpeed = speed;
        label.textContent =
            speed.toFixed(1) + "×";

        if (speed === 0) {
            club.style.animationPlayState = "paused";
        } else {
            club.style.animationPlayState = "running";
            club.style.animationDuration =
                (2 / speed) + "s";
        }
    };
    control.addEventListener("input", update);
    update();
})();
