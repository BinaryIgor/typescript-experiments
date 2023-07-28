console.log("Loading index js...");

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

function setFormChangeListener(submitSelector="input[type='submit']") {
    const target = this.event.currentTarget;
    console.log("Input has changed...", target);
    console.log("Errors: ", target.getElementsByClassName("error-message active"));
    console.log("Submit: ", target.querySelector("input[type='submit']"));
}