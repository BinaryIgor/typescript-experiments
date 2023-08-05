console.log("Loading index js...");

const FORM_LABEL = "data-form";
const CONFIRMABLE_FORM_LABEL = "data-confirmable-form";
const SUBMIT_FORM_LABEL = "data-submit-form";
const HIDDEN_CLASS = "hidden";
const DISABLED_CLASS = "disabled";

const HTMX_EVENTS = {
    configRequest: "htmx:configRequest",
    afterRequest: "htmx:afterRequest",
    confirm: "htmx:confirm"
};

initErrorModal();
initConfirmableModal();
initEventListeners();
registerHtmxExtensions();

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
        console.log("Canceling modal...");
        e.stopPropagation();
        hideModal();
    };
    document.getElementById("confirmable-modal-ok").onclick = e => {
        e.stopPropagation();
        console.log("Confirming modal....");
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
        const confirmableMessage = sourceElement.getAttribute(CONFIRMABLE_FORM_LABEL);
        console.log("Can you confirm it first?", confirmableMessage);
        if (confirmableMessage) {
            e.preventDefault();
            confirmableEvent = e;
            showModal();
            confirmableModalContent.innerHTML = confirmableMessage;
        }
    });

    document.addEventListener("click", () => {
        if (isModalShown()) {
            hideModal();
        }
    });
}

function initEventListeners() {
    window.addEventListener("popstate", e => {
        console.log("Popping state!", e);
    });
    window.addEventListener("htmx:pushedIntoHistory", e => {
        console.log("Element pushed into history", e);
    });

    window.addEventListener("form-validated", e => {
        console.log("Received form-validated event...", e);
        const label = e.detail.label;
        if (label) {
            const formValid = Events.isFormValid(e);

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
        console.log("Received reset-form event", e);
        const formToReset = document.querySelector(`[${FORM_LABEL}="${e.detail.value}"]`);
        console.log("Form to reset...", formToReset);
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
        console.log("Let's configure the request...", e);
        e.detail.headers['Authentication'] = crypto.randomUUID();
    });
}

function registerHtmxExtensions() {
    htmx.defineExtension('reset-form', {
        onEvent: function (name, e) {
            if (name != HTMX_EVENTS.afterRequest) {
                return;
            }
            console.log("Fired event: " + name, e);

        }
    })
}

const Events = {
    doesEventHaveAnyOfLabels(e, ...labels) {
        const eLabel = e.detail.label;
        for (let l of labels) {
            if (eLabel == l) {
                return true;
            }
        }
        return false;
    },
    doesEventHaveLabel(e, label) {
        return e.detail.label == label;
    },
    isFormValid(e) {
        return e.detail.valid == true;
    }
}

// function setFormChangeListener(submitSelector = "input[type='submit']", disabledClass = "disabled") {
//     const target = this.event.currentTarget;
//     console.log("Input has changed...", target);

//     const errors = target.getElementsByClassName("error-message active")

//     console.log("Errors: ", errors);

//     const submitButton = target.querySelector(submitSelector);

//     console.log("Submit: ", submitButton);

//     if (errors && errors.length > 0) {
//         submitButton.disabled = true;
//         submitButton.classList.add(disabledClass);
//     } else {
//         submitButton.disabled = false;
//         submitButton.classList.remove(disabledClass);
//     }
// }

function addSelfRemovingEventListener(event, callback, element = document) {
    const handler = (e) => {
        try {
            callback(e);
        } catch (ex) {
            console.error("Problem while calling scoped event listener", e);
        }
        element.removeEventListener(event, handler);
    }
    element.addEventListener(event, handler);
}