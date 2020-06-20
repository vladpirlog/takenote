const searchField = document.getElementById("search-field");

if (window.location.pathname === "/dashboard")
    searchField.oninput = (ev) => {
        for (let container of document.getElementsByClassName(
            "sidebar-container"
        )) {
            container.style.display = null;
        }

        for (let element of document.querySelectorAll(
            ".sidebar-container-element"
        )) {
            element.style.display = null;
        }

        if (ev.target.value) {
            const regex = RegExp(ev.target.value.toLowerCase());
            for (let container of document.getElementsByClassName(
                "sidebar-container"
            )) {
                const collectionTitle = container
                    .querySelector(".sidebar-container-heading")
                    .textContent.trim()
                    .toLowerCase();
                if (regex.test(collectionTitle)) continue;
                else {
                    let ok = false;
                    for (let element of container.querySelectorAll(
                        ".sidebar-container-element"
                    )) {
                        const noteTitle = element.textContent
                            .trim()
                            .toLowerCase();
                        if (regex.test(noteTitle)) ok = true;
                        else element.style.display = "none";
                    }
                    if (!ok) container.style.display = "none";
                }
            }
        }
    };
