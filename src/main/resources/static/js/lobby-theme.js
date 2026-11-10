(() => {
    const selector = document.getElementById("guest-theme");
    const stylesheet = document.getElementById("lobby-theme-stylesheet");

    if (!selector || !stylesheet) return;

    const storageKey = "jester-guest-theme";
    const allowedThemes = ["light", "dark", "purple"];

    function applyTheme(theme) {
        const selected = allowedThemes.includes(theme) ? theme : "light";

        const option = Array.from(selector.options).find(item => item.value === selected);

        if (!option || !option.dataset.url) return;

        stylesheet.href = option.dataset.url;
        selector.value = selected;
    }

    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem(storageKey) || "light";
    } catch (error) {
    }

    applyTheme(savedTheme);

    selector.addEventListener("change", () => {
        const selected = selector.value;
        applyTheme(selected);

        try {
            localStorage.setItem(storageKey, selected);
        } catch (error) {
        }
    });
})();