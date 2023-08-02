console.log("Loading index js...");

initErrorModal();
initBackendTriggersListeners();

function initErrorModal() {
    const errorModal = document.getElementById("error-modal");
    const errorModalContent = document.getElementById("error-modal-content");

    document.getElementById("error-modal-close").onclick = () => {
        errorModal.classList.toggle("hidden");
    };

    document.addEventListener("htmx:responseError", e => {
        console.log("Response error!", e);
        errorModalContent.innerHTML = e.detail.xhr.response;
        errorModal.classList.toggle("hidden");
    });

    document.addEventListener("htmx:sendError", e => {
        console.log("Send error!", e);
        errorModalContent.innerHTML = "Server unavailable";
        errorModal.classList.toggle("hidden");
    });
}

function initBackendTriggersListeners() {
    document.addEventListener("input-validated", e => {
        console.log("Input validated...", e);
    });
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