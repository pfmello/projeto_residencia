// Seletores de classes e IDs do HTML
const backdropOverlay = document.getElementById("backdrop");
const addBtnElement = document.getElementById("add");
const formElement = document.getElementById("add_form");
const cancelBtn = document.getElementById("cancel_btn");

const deleteDataButton = document.querySelectorAll(".delete");
const deleteFormElement = document.getElementById("delete-form");

// Botão + de adicionar, quando clica, abre o formulário e ativa o backdrop
addBtnElement.addEventListener("click", () => {
  backdropOverlay.style.display = "block";
  formElement.style.display = "block";
});

// Botão de Cancelar, dentro do formulário
cancelBtn.addEventListener("click", () => {
  backdropOverlay.style.display = "none";
  formElement.style.display = "none";
});

formElement.addEventListener("submit", function () {
  document.getElementById("ass_dev").disabled = false;
  document.getElementById("ass_ret").disabled = false;
});

// Alerta de confirmar antes de DELETAR
function confirmSubmit() {
  let agree = confirm("Tem certeza que deseja deletar este dado ?");
  if (agree) return true;
  else return false;
}

function confirmAdmin() {
  let agree = confirm(
    "Tem certeza que deseja alterar os privilégios desse usuário ?"
  );
  if (agree) return true;
  else return false;
}

function userActive() {
  alert(
    "A conta desse usuário esta ativa !" +
      "\nPara desativar, clicar no botão de deletar !"
  );
}
