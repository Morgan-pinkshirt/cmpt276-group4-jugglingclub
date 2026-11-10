(() => {
    const selector = document.getElementById("lobby-theme");

    if (!selector) return;

    const container = selector.closest(".lobby-theme-control");
    const mode = container?.dataset.themeMode;

    const allowedThemes = ["light", "dark", "purple"];
    const storageKey = "jester-guest-theme";

    const stylesheet = document.getElementById("lobby-theme-stylesheet");

    function applyGuestTheme(theme) {
        if (!stylesheet) return;

        const selected = allowedThemes.includes(theme)
            ? theme
            : "light";

        const option = Array.from(selector.options)
            .find(item => item.value === selected);

        if (!option?.dataset.url) return;

        stylesheet.href = option.dataset.url;
        selector.value = selected;
    }

    if (mode === "guest") {
        let savedTheme = "light";

        try {
            savedTheme =
                localStorage.getItem(storageKey) || "light";
        } catch (error) {
        }

        applyGuestTheme(savedTheme);

        selector.addEventListener("change", () => {
            const selected = selector.value;

            applyGuestTheme(selected);

            try {
                localStorage.setItem(storageKey, selected);
            } catch (error) {
            }
        });

        return;
    }

    if (mode === "account") {
        selector.addEventListener("change", async () => {
            const selected = selector.value;

            if (!allowedThemes.includes(selected)) return;

            selector.disabled = true;

            try {
                const response = await fetch(
                    "/settings/theme",
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },
                        body: new URLSearchParams({
                            theme: selected
                        })
                    }
                );

                if (!response.ok ||
                    new URL(response.url).pathname === "/userlogin") {
                    throw new Error("Theme could not be saved.");
                }

                window.location.reload();

            } catch (error) {
                console.error(error);

                selector.disabled = false;
                alert(
                    "Unable to save your theme. Please try again."
                );
            }
        });
    }
})();