console.log("Loading index js...");

const navigationId = "app-navigation";
const navigationDropdownId = "app-navigation-dropdown";
const FORM_LABEL = "data-form";
const CONFIRMABLE_ELEMENT_LABEL = "data-confirmable-element";
const SUBMIT_FORM_LABEL = "data-submit-form";
const HIDDEN_CLASS = "hidden";
const DISABLED_CLASS = "disabled";

const HTMX_EVENTS = {
    configRequest: "htmx:configRequest",
    afterRequest: "htmx:afterRequest",
    confirm: "htmx:confirm"
};

const TRIGGERS = {
    hideNavigation: "hide-navigation"
};

initErrorModal();
initConfirmableModal();
initNavigation();
initEventListeners();

function initErrorModal() {
    const errorModal = document.getElementById("error-modal");
    const errorModalContent = document.getElementById("error-modal-content");

    document.getElementById("error-modal-close").onclick = () => {
        errorModal.classList.toggle(HIDDEN_CLASS);
    };

    document.addEventListener("htmx:responseError", e => {
        console.log("Response error!", e);
        errorModalContent.innerHTML = e.detail.xhr.response;
        errorModal.classList.toggle(HIDDEN_CLASS);
    });

    document.addEventListener("htmx:sendError", e => {
        console.log("Send error!", e);
        errorModalContent.innerHTML = "Server unavailable";
        errorModal.classList.toggle(HIDDEN_CLASS);
    });
}

function initConfirmableModal() {
    const confirmableModal = document.getElementById("confirmable-modal");
    const confirmableModalContent = document.getElementById("confirmable-modal-content");
    let confirmableEvent = null;
    
    function isModalShown() {
        return !confirmableModal.classList.contains(HIDDEN_CLASS);
    }

    function hideModal() {
        confirmableModal.classList.add(HIDDEN_CLASS);
    }

    function showModal() {
        confirmableModal.classList.remove(HIDDEN_CLASS);
    }

    document.getElementById("confirmable-modal-cancel").onclick = () => {
        e.stopPropagation();
        hideModal();
    };
    document.getElementById("confirmable-modal-ok").onclick = e => {
        e.stopPropagation();
        hideModal();
        if (confirmableEvent) {
            confirmableEvent.detail.issueRequest();
            confirmableEvent = null;
        }
    };

    document.getElementById("confirmable-modal-close").onclick = () => {
        confirmableModal.classList.toggle(HIDDEN_CLASS);
        confirmableModal.classList.contains(HIDDEN_CLASS);
    };

    document.addEventListener(HTMX_EVENTS.confirm, e => {
        const sourceElement = e.detail.elt;
        const confirmableMessage = sourceElement.getAttribute(CONFIRMABLE_ELEMENT_LABEL);
        if (confirmableMessage) {
            e.preventDefault();
            confirmableEvent = e;
            confirmableModalContent.innerHTML = confirmableMessage;
            showModal();
        }
    });

    confirmableModal.addEventListener("click", () => {
        if (isModalShown()) {
            hideModal();
        }
    });
}

function initNavigation() {
    document.getElementById(navigationDropdownId).onmouseover = () => {
        console.log("On mouse over!");
    };
}

function initEventListeners() {
    window.addEventListener("popstate", e => {
        console.log("Popping state!", e);
    });
    window.addEventListener("htmx:pushedIntoHistory", e => {
        console.log("Element pushed into history", e);
    });

    window.addEventListener("form-validated", e => {
        const label = e.detail.label;
        if (label) {
            const formValid = e.detail.valid;

            const submitButtons = document.querySelectorAll(`[${SUBMIT_FORM_LABEL}="${label}"]`);
            submitButtons.forEach(sb => {
                if (formValid) {
                    sb.disabled = false;
                    sb.classList.remove(DISABLED_CLASS);
                } else {
                    sb.disabled = true;
                    sb.classList.add(DISABLED_CLASS);
                }
            });
        }
    });

    window.addEventListener("reset-form", e => {
        const formToReset = document.querySelector(`[${FORM_LABEL}="${e.detail.value}"]`);
        if (formToReset) {
            formToReset.querySelectorAll("input").forEach(i => {
                if (i.type != "submit") {
                    i.value = "";
                }
            });
            formToReset.querySelectorAll("textarea").forEach(i => i.value = "");
        }
    });

    document.addEventListener(HTMX_EVENTS.configRequest, e => {
        e.detail.headers['Authentication'] = crypto.randomUUID();
    });

    document.addEventListener(TRIGGERS.hideNavigation, e => {
        document.getElementById(navigationId).classList.add(HIDDEN_CLASS);
    });
}