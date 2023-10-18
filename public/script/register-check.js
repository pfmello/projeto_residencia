const registerFormElement = document.querySelector(".register-form");

const emailElement = document.querySelector(".register-form #email");
const emailConfirmElement = document.querySelector(
  ".register-form #email-confirm"
);
const passwordElement = document.querySelector(".register-form #password");
const logoutButtonElement = document.getElementById("logout-btn");

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

  const email = emailElement.value;
  const emailConfirm = emailConfirmElement.value;
  const password = passwordElement.value;

  // Verificação de Email
  if (email !== emailConfirm) {
    alert("Os emails não coincidem !");
    return;
  }

  // Exemplo de uso
  const senhaForte = "Senha@123";
  const weakPassword = !verifyWeakPassword(password);

  // Verificação de Senha
  if (weakPassword) {
    alert(
      "A senha é fraca. Por favor, escolha uma senha mais forte. \n( MAIÚSCULA, MINÚSCULA E NÚMERO )"
    );
    return;
  }

  this.submit();
}

registerFormElement.addEventListener("submit", verifyData);
