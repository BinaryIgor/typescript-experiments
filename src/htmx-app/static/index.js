console.log("Loading index js...");

const SUBMIT_ATTRIBUTE_LABEL = "data-submit";

initErrorModal();

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

const Events =  {
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
    isInputValid(e) {
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