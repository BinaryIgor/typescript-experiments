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