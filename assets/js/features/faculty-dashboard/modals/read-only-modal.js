function buildSharedModal(id, title) {
  let modal = document.getElementById(id);
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = id;
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog--faculty-exam" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="${id}-title" class="modal-title">${title}</h2>
        </div>
        <button type="button" class="faculty-modal-close" data-modal-close="${id}" aria-label="Close modal">×</button>
      </div>
      <div id="${id}-content"></div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

export function initReadOnlyModal(id, title) {
  const modal = buildSharedModal(id, title);
  const content = document.getElementById(`${id}-content`);
  const closeButton = modal.querySelector(`[data-modal-close="${id}"]`);

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
  }

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  function openModal(html) {
    content.innerHTML = html;
    modal.hidden = false;
  }

  return { openModal, closeModal };
}