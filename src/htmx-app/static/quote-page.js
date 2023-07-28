const addNoteForm = document.getElementById("add-note-form");

document.getElementById("add-note-btn").onclick = () => {
  console.log("Add note!");  
  addNoteForm.classList.toggle("hidden");
};