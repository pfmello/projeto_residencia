// Botões da página
const logoutButtonElement = document.getElementById("logout-btn");
const admButtonElement = document.getElementById("adm-btn");
const changePWElement = document.getElementById("pw-btn");

// Controle do Formulário de Mudança de Senhas
const changePWSectionElement = document.getElementById("add_form");
const backdropOverlay = document.getElementById("backdrop");
const cancelBtn = document.getElementById("cancel_btn");

// Formulário de envio de nova senha
const changePWFormElement = document.getElementById("add_row_form");

// IDs dos inputs da tabela
const passwordElement = document.getElementById("password");
const newPasswordElement = document.getElementById("new-password");
const confirmNewPasswordElement = document.getElementById("confirm-password");

function userLogout() {
  window.location.href = "logout";
}

function adminPanel() {
  window.location.href = "adm";
}

function changePassword() {
  changePWSectionElement.style.display = "block";
  backdropOverlay.style.display = "block";
}

logoutButtonElement.addEventListener("click", userLogout);
changePWElement.addEventListener("click", changePassword);

// Botão de Cancelar, dentro do formulário
cancelBtn.addEventListener("click", () => {
  backdropOverlay.style.display = "none";
  changePWSectionElement.style.display = "none";
});

function verifyWeakPassword(password) {
  // Define os critérios de uma senha forte
  const comprimentoMinimo = 8;
  const possuiLetraMinuscula = /[a-z]/.test(password);
  const possuiLetraMaiuscula = /[A-Z]/.test(password);
  const possuiNumero = /[0-9]/.test(password);
  const possuiCaracterEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Verifica se a senha atende a todos os critérios
  const atendeComprimentoMinimo = password.length >= comprimentoMinimo;
  const atendeTodosOsCritérios =
    possuiLetraMinuscula && possuiLetraMaiuscula && possuiNumero;

  return atendeComprimentoMinimo && atendeTodosOsCritérios;
}

function verifyData(event) {
  event.preventDefault();

  const password = passwordElement.value;
  const newPassword = newPasswordElement.value;
  const confirmPassword = confirmNewPasswordElement.value;

  if (newPassword !== confirmPassword) {
    alert("As duas senhas não coincidem !");
    return;
  }

  // Exemplo de uso
  const senhaForte = "Senha@123";
  const weakPassword = !verifyWeakPassword(newPassword);

  // Verificação de Senha
  if (weakPassword) {
    alert(
      "A senha é fraca. Por favor, escolha uma senha mais forte. \n( MAIÚSCULA, MINÚSCULA E NÚMERO )"
    );
    return;
  }

  this.submit();
}

changePWFormElement.addEventListener("submit", verifyData);
admButtonElement.addEventListener("click", adminPanel);
