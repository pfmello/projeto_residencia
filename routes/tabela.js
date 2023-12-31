const express = require("express");
const mongodb = require("mongodb");
const bcrypt = require("bcryptjs");

const loginManager = require("../routes/login-manager");
const db = require("../data/database");

const ObjectId = mongodb.ObjectId;

const router = express.Router();

// Página INDEX, redireciona para a rota de /tabela
router.get("/", async function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      savedLogin: "",
      savedPassword: "",
      savedRegisterMail: "",
      savedRegisterLogin: "",
    };
  }

  const autenticado = res.locals.isAuth;
  const thisUser = req.session.user;

  if (autenticado) {
    const admin = res.locals.isAdmin;
    res.render("user-panel", { thisUser, isAdmin: admin });
  } else {
    res.render("index", { inputData: sessionInputData });
  }
});

// Sistema login e senha
router.post("/register", async function (req, res) {
  const userData = req.body;

  if (Object.keys(userData).length === 0) {
    // userData is an empty object
    console.log("User data is empty.");
    return res.status(500).render("500");
  } else {
    // userData is not empty
    console.log("User data is not empty.");
  }

  const enteredLogin = userData.login;
  const enteredPassword = userData.password;
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData["email-confirm"];

  //Função que verifica se tem uppercase e número
  function containsUppercaseAndNumber(password) {
    return /[A-Z]/.test(password) && /\d/.test(password);
  }

  // Condição de verificação de requisitos dos dados
  if (
    enteredEmail != enteredConfirmEmail ||
    enteredPassword.length < 6 ||
    !containsUppercaseAndNumber(enteredPassword)
  ) {
    return res.status(500).render("500");
  }

  async function verificaExistencia(campo, valor) {
    const resultado = await db
      .getDb()
      .collection("users")
      .findOne({ [campo]: valor });
    return !!resultado; // Retorna true se o documento existe, false se não existe
  }

  const [existingUser, existingEmail] = await Promise.all([
    verificaExistencia("login", enteredLogin),
    verificaExistencia("email", enteredEmail),
  ]);

  if (existingUser) {
    req.session.inputData = {
      savedRegisterMail: enteredEmail,
    };
    req.session.save();

    return renderRegisterInfo(
      "Errou !",
      "Esse usuário já existe !",
      "Tente novamente com outro nome de usuário !"
    );
  } else if (existingEmail) {
    req.session.inputData = {
      savedRegisterLogin: enteredLogin,
    };

    req.session.save();

    return renderRegisterInfo(
      "Errou !",
      "Já existe um usuário cadastrado com esse email !",
      "Tente novamente com outro email !"
    );
  } else {
    try {
      const hashedPassword = await bcrypt.hash(enteredPassword, 12);
      const newUser = {
        login: enteredLogin,
        password: hashedPassword,
        email: enteredEmail,
        isAdmin: false,
      };
      const query = await db.getDb().collection("users").insertOne(newUser);

      req.session.inputData = {
        savedLogin: enteredLogin,
      };
      req.session.save();

      return renderRegisterInfo(
        "Registrado com sucesso !",
        "Parabéns, você foi registrado !",
        "Um ADM ainda precisa ativar a sua conta!"
      );
    } catch (error) {
      console.error("Erro ao inserir usuário:", error);
      return res.status(500).render("500");
    }
  }

  function renderRegisterInfo(title, h1Text, pText) {
    return res.render("register-info", {
      title,
      h1Text,
      pText,
    });
  }
});

router.post("/login", async function (req, res) {
  const ip = req.ip;

  const userData = req.body;

  if (!userData) return res.status(500).render("500");

  const enteredUser = userData.logon;
  const enteredPw = userData.logonpw;

  // Checar se já existe usuário com omesmo nome
  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ login: enteredUser });

  if (!existingUser) {
    // Aumenta a quantidade de tentativas de login
    loginManager.incrementLoginAttempt(ip);

    req.session.inputData = null;
    req.session.save();
    return renderLoginInfo(
      "Erro !",
      "Acesso negado !",
      "Esse usuário não existe !"
    );
  }

  const validPassword = await bcrypt.compare(enteredPw, existingUser.password);

  if (!validPassword) {
    // Aumenta a quantidade de tentativas de login
    loginManager.incrementLoginAttempt(ip);

    req.session.inputData = {
      savedLogin: enteredUser,
    };

    req.session.save();

    return renderLoginInfo(
      "Erro !",
      "Acesso negado !",
      "Senha totalmente errada !"
    );
  }

  if (!existingUser.isActive) {
    req.session.inputData = {
      savedLogin: enteredUser,
      savedPassword: enteredPw,
    };

    req.session.save();

    return renderLoginInfo(
      "Erro !",
      "Sua conta ainda não está ativada !",
      "Um ADM ainda precisa ativar a sua conta !"
    );
  }

  // Executa apenas se o login for sucesso

  // Reseta tentativas de login
  loginManager.resetLoginAttempts(ip);

  req.session.user = {
    id: existingUser._id,
    login: existingUser.login,
    email: existingUser.email,
  };
  req.session.isAuthenticated = true;

  req.session.inputData = {
    savedLogin: enteredUser,
    savedPassword: enteredPw,
  };

  req.session.save(function () {
    console.log(`Usuário ${existingUser.login} autenticado !`);
    return res.redirect("/");
  });

  function renderLoginInfo(title, h1Text, pText) {
    return res.render("register-info", {
      title,
      h1Text,
      pText,
    });
  }
});

router.get("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect("/");
});

router.get("/adm", async function (req, res) {
  const admUser = res.locals.isAdmin;

  if (admUser) {
    const admLogin = req.session.user.login;
    console.log(
      `O adm de login: ${admLogin} está acessando o painel de usuário !`
    );

    const users = await db
      .getDb()
      .collection("users")
      .find(
        {},
        { projection: { login: 1, email: 1, isAdmin: 1, _id: 1, isActive: 1 } }
      )
      .toArray();

    return res.render("adm-panel", { users });
  } else {
    console.log("Alguém que não é adm tentou acessar o painel de adm !");
    return res.status(401).render("401-adm");
  }
});

router.get("/:id/make_adm", async function (req, res) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let userId = req.params.id;

  try {
    userId = new ObjectId(userId);

    const result = await db
      .getDb()
      .collection("users")
      .updateOne({ _id: userId }, { $set: { isAdmin: true } });

    if (result.modifiedCount === 1) {
      console.log("Usuario foi colocado como admin !");
    } else {
      console.log("Nenhum usuário foi modificado. Verifique o ID.");
    }

    res.redirect("/adm");
  } catch (error) {
    console.log("Erro ao tentar colocar um usuário como administrador:");
    res.status(500).render("505");
  }
});

router.get("/:id/remove_adm", async function (req, res) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let userId = req.params.id;

  try {
    userId = new ObjectId(userId);

    const result = await db
      .getDb()
      .collection("users")
      .updateOne({ _id: userId }, { $set: { isAdmin: false } });

    if (result.modifiedCount === 1) {
      console.log("Um usuário foi removido como admin!");
    } else {
      console.log("Nenhum usuário foi modificado. Verifique o ID.");
    }

    res.redirect("/adm");
  } catch (error) {
    console.log("Erro ao tentar remover um usuário como administrador");
    res.status(500).render("505");
  }
});

router.get("/:id/activate_account", async function (req, res) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let userId = req.params.id;

  try {
    userId = new ObjectId(userId);

    const result = await db
      .getDb()
      .collection("users")
      .updateOne({ _id: userId }, { $set: { isActive: true } });

    if (result.modifiedCount === 1) {
      console.log("Um usuário teve a conta ativada !");
    } else {
      console.log("Nenhum usuário foi modificado. Verifique o ID.");
    }

    res.redirect("/adm");
  } catch (error) {
    console.log("Erro ao tentar ativar a conta de um usuário");
    res.status(500).render("505");
  }
});

router.post("/:id/remove_user", async function (req, res) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let dataToRemove = req.params.id;

  try {
    dataToRemove = new ObjectId(dataToRemove);

    await db.getDb().collection("users").deleteOne({ _id: dataToRemove });
    res.redirect("/adm");
  } catch (error) {
    console.log("Erro ao tentar remover um usuário !");
    res.status(500).render("505");
  }
});

router.post("/:id/change_password", async function (req, res) {
  let userId = req.params.id;
  let formData = req.body;

  try {
    userId = new ObjectId(userId);

    const insertedPassword = formData.password;
    const newPassword = formData["new-password"];

    const userToEdit = await db
      .getDb()
      .collection("users")
      .findOne({ _id: userId });

    const oldPassword = userToEdit.password;

    const validPassword = await bcrypt.compare(insertedPassword, oldPassword);

    if (!validPassword) {
      return res.render("register-info", {
        title: "Errou !",
        h1Text: "Senha totalmente errada !",
        pText: "Tente novamente !",
      });
    }

    const finalPassword = await bcrypt.hash(newPassword, 12);

    await db
      .getDb()
      .collection("users")
      .updateOne({ _id: userId }, { $set: { password: finalPassword } });

    req.session.user = null;
    req.session.isAuthenticated = false;

    return res.render("register-info", {
      title: "Parabéns !",
      h1Text: "Senha alterada com sucesso !",
      pText: "Agora teste ela !",
    });
  } catch (error) {
    console.log("Erro ao tentar alterar senha !");
    return res.status(500).render("500");
  }
});

// Página da tabela
router.get("/tabela", async function (req, res) {
  // Verifica se o usuário está autenticado
  if (!res.locals.isAuth || !res.locals.isActive)
    return res.status(401).render("401");

  //Apenas com usuários autenticados
  try {
    const [sectors, drivers, data, plates] = await Promise.all([
      db.getDb().collection("sectors").find().toArray(),
      db.getDb().collection("drivers").find().toArray(),
      db.getDb().collection("data").find().toArray(),
      db.getDb().collection("plates").find().toArray(),
    ]);

    // Convertendo as datas para o formato correto
    for (const td of data) {
      let firstDateToConvert = new Date(td.data_retirada + "T00:00:00Z"); // Convert to UTC
      let returnDateToConvert = new Date(td.data_devolucao + "T00:00:00Z"); // Convert to UTC

      // Adicionando o fuso horário local
      firstDateToConvert.setMinutes(
        firstDateToConvert.getMinutes() + firstDateToConvert.getTimezoneOffset()
      );
      returnDateToConvert.setMinutes(
        returnDateToConvert.getMinutes() +
          returnDateToConvert.getTimezoneOffset()
      );

      td.data_retirada = firstDateToConvert.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      td.data_devolucao = returnDateToConvert.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }

    const userName = req.session.user.login;

    res.render("tabela", { sectors, drivers, data, plates, userName });
  } catch (error) {
    res.status(500).render("500");
  }
});

// Método POST para envio do formulário
router.post("/tabela", async function (req, res) {
  if (!req.body) return res.status(500).render("500");

  const sectorId = new ObjectId(req.body.sector);
  const driverId = new ObjectId(req.body.driver);
  const plateId = new ObjectId(req.body.plate);

  const [selectedDriver, selectedSector, selectedPlate] = await Promise.all([
    db.getDb().collection("drivers").findOne({ _id: driverId }),
    db.getDb().collection("sectors").findOne({ _id: sectorId }),
    db.getDb().collection("plates").findOne({ _id: plateId }),
  ]);

  const kmUsuario = parseInt(req.body.km_dev);
  const kmTabela = parseInt(selectedPlate.km_dev);

  if (kmUsuario >= kmTabela) {
    // const mensagem = `O km de usuario ${kmUsuario} é maior ou igual do que ${kmTabela} pois entao o if passou`;

    // console.log(mensagem);

    const newInfo = {
      data_retirada: req.body.data_retirada,
      hora_retirada: req.body.hora_retirada,
      plate: {
        _id: plateId,
        register: selectedPlate.register,
        km_ret: selectedPlate.km_dev,
        km_dev: req.body.km_dev,
      },
      driver: {
        _id: driverId,
        ...selectedDriver,
      },
      sector: {
        _id: sectorId,
        ...selectedSector,
      },
      destino: req.body.destino,
      ass_ret: req.body.ass_ret,
      data_devolucao: req.body.data_devolucao,
      hora_devolucao: req.body.hora_devolucao,
      ass_dev: req.body.ass_dev,
    };

    const query = await db.getDb().collection("data").insertOne(newInfo);
    const query2 = await db
      .getDb()
      .collection("plates")
      .updateOne(
        { _id: plateId },
        {
          $set: {
            km_dev: req.body.km_dev,
          },
        }
      );

    res.redirect("/tabela");
  } else {
    let erro = selectedPlate.km_dev;
    res.render("erro-km", { erro });
  }
});

router.post("/tabela/:id/delete", async function (req, res, next) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let dataId = req.params.id;

  try {
    dataId = new ObjectId(dataId);
  } catch (error) {
    return next(error);
  }

  const query = await db.getDb().collection("data").deleteOne({ _id: dataId });

  res.redirect("/tabela");
});

router.get("/tabela/:id/edit", async function (req, res) {
  let editId = req.params.id;

  try {
    editId = new ObjectId(editId);

    const dataToEdit = await db
      .getDb("tabela")
      .collection("data")
      .findOne({ _id: editId });

    const [sectors, drivers, plates] = await Promise.all([
      db.getDb().collection("sectors").find().toArray(),
      db.getDb().collection("drivers").find().toArray(),
      db.getDb().collection("plates").find().toArray(),
    ]);

    res.render("editar-tabela", { dado: dataToEdit, sectors, drivers, plates });
  } catch (error) {
    return res.status(404).render("404");
  }
});

router.post("/tabela/:id/edit", async function (req, res, next) {
  let editId = req.params.id;

  let sectorId = req.body.sector;
  let driverId = req.body.driver;
  let plateId = req.body.plate;

  try {
    editId = new ObjectId(editId);
    sectorId = new ObjectId(sectorId);
    driverId = new ObjectId(driverId);
    plateId = new ObjectId(plateId);
  } catch (error) {
    return next(error);
  }

  const [selectedDriver, selectedSector, selectedPlate] = await Promise.all([
    db.getDb().collection("drivers").findOne({ _id: driverId }),
    db.getDb().collection("sectors").findOne({ _id: sectorId }),
    db.getDb().collection("plates").findOne({ _id: plateId }),
  ]);

  const kmUsuario = parseInt(req.body.km_dev);
  const kmTabela = parseInt(selectedPlate.km_dev);

  console.log("km usuario" + kmUsuario);
  console.log("km tabela" + kmTabela);

  if (kmUsuario >= kmTabela) {
    const query = await db
      .getDb()
      .collection("data")
      .updateOne(
        { _id: editId },
        {
          $set: {
            data_retirada: req.body.data_retirada,
            hora_retirada: req.body.hora_retirada,
            plate: {
              _id: plateId,
              register: selectedPlate.register,
              km_ret: selectedPlate.km_dev,
              km_dev: req.body.km_dev,
            },
            driver: {
              _id: driverId,
              ...selectedDriver,
            },
            sector: {
              _id: sectorId,
              ...selectedSector,
            },
            destino: req.body.destino,
            data_devolucao: req.body.data_devolucao,
            hora_devolucao: req.body.hora_devolucao,
          },
        }
      );

    const query2 = await db
      .getDb()
      .collection("plates")
      .updateOne(
        { _id: plateId },
        {
          $set: {
            km_dev: req.body.km_dev,
          },
        }
      );

    res.redirect("/tabela");
  } else {
    let erro = selectedPlate.km_dev;
    res.render("erro-km", { erro });
  }
});

// Rotas da página de setores
router.get("/setores", async function (req, res) {
  if (!res.locals.isAuth) return res.status(401).render("401");

  const sectors = await db.getDb().collection("sectors").find().toArray();

  res.render("setores", { setores: sectors });
});

router.post("/setores", async function (req, res) {
  const newInfo = {
    name: req.body.name,
    abv: req.body.abv,
  };

  if (!newInfo) return res.status(500).render("500");

  const query = await db.getDb().collection("sectors").insertOne(newInfo);

  res.redirect("/setores");
});

router.post("/setores/:id/delete", async function (req, res, next) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let dataId = req.params.id;

  try {
    dataId = new ObjectId(dataId);
  } catch (error) {
    return next(error);
  }

  const query = await db
    .getDb()
    .collection("sectors")
    .deleteOne({ _id: dataId });

  res.redirect("/setores");
});

router.get("/setores/:id/edit", async function (req, res, next) {
  let editId = req.params.id;

  try {
    editId = new ObjectId(editId);
  } catch (error) {
    return next(error);
  }

  const dataToEdit = await db
    .getDb("tabela")
    .collection("sectors")
    .findOne({ _id: editId });

  if (!dataToEdit) {
    return res.status(404).render("404");
  }

  res.render("editar-setor", { setor: dataToEdit });
});

router.post("/setores/:id/edit", async function (req, res, next) {
  let editId = req.params.id;

  try {
    editId = new ObjectId(editId);
  } catch (error) {
    return next(error);
  }

  const query = await db
    .getDb()
    .collection("sectors")
    .updateOne(
      { _id: editId },
      {
        $set: {
          name: req.body.name,
          abv: req.body.abv,
        },
      }
    );

  res.redirect("/setores");
});

// Rotas da Página de Motoristas
router.get("/motoristas", async function (req, res) {
  if (!res.locals.isAuth) return res.status(401).render("401");

  const drivers = await db.getDb().collection("drivers").find().toArray();

  res.render("motoristas", { motoristas: drivers });
});

router.post("/motoristas", async function (req, res) {
  const newInfo = {
    firstName: req.body.firstName,
    surname: req.body.surname,
  };

  if (!newInfo) return res.status(500).render("500");

  const query = await db.getDb().collection("drivers").insertOne(newInfo);

  res.redirect("/motoristas");
});

router.post("/motoristas/:id/delete", async function (req, res, next) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let dataId = req.params.id;

  try {
    dataId = new ObjectId(dataId);
  } catch (error) {
    return next(error);
  }

  const query = await db
    .getDb()
    .collection("drivers")
    .deleteOne({ _id: dataId });

  res.redirect("/motoristas");
});

router.get("/motorista/:id/edit", async function (req, res, next) {
  let editId = req.params.id;

  try {
    editId = new ObjectId(editId);
  } catch (error) {
    return next(error);
  }

  const dataToEdit = await db
    .getDb("tabela")
    .collection("drivers")
    .findOne({ _id: editId });

  if (!dataToEdit) {
    return res.status(404).render("404");
  }

  res.render("editar-motorista", { motorista: dataToEdit });
});

router.post("/motoristas/:id/edit", async function (req, res, next) {
  let editId = req.params.id;

  try {
    editId = new ObjectId(editId);
  } catch (error) {
    return next(error);
  }

  const query = await db
    .getDb()
    .collection("drivers")
    .updateOne(
      { _id: editId },
      {
        $set: {
          firstName: req.body.firstName,
          surname: req.body.surname,
        },
      }
    );

  res.redirect("/motoristas");
});

// Rotas da Página de Placas
router.get("/placas", async function (req, res) {
  if (!res.locals.isAuth) return res.status(401).render("401");

  const plates = await db.getDb().collection("plates").find().toArray();

  res.render("placas", { placas: plates });
});

router.post("/placas", async function (req, res) {
  const newInfo = {
    register: req.body.register,
    km_dev: req.body.km_dev,
  };

  if (!newInfo) return res.status(500).render("500");

  const query = await db.getDb().collection("plates").insertOne(newInfo);

  res.redirect("/placas");
});

router.post("/placas/:id/delete", async function (req, res, next) {
  const admUser = res.locals.isAdmin;
  if (!admUser) return res.status(401).render("401-adm");

  let dataId = req.params.id;

  try {
    dataId = new ObjectId(dataId);
  } catch (error) {
    return next(error);
  }

  const query = await db
    .getDb()
    .collection("plates")
    .deleteOne({ _id: dataId });

  res.redirect("/placas");
});

router.get("/placas/:id/edit", async function (req, res, next) {
  let editId = req.params.id;

  try {
    editId = new ObjectId(editId);
  } catch (error) {
    return next(error);
  }

  const dataToEdit = await db
    .getDb("tabela")
    .collection("plates")
    .findOne({ _id: editId });

  if (!dataToEdit) {
    return res.status(404).render("404");
  }

  res.render("editar-placa", { placa: dataToEdit });
});

router.post("/placas/:id/edit", async function (req, res, next) {
  let editId = req.params.id;

  try {
    editId = new ObjectId(editId);
  } catch (error) {
    return next(error);
  }

  const editPlate = await db
    .getDb()
    .collection("plates")
    .findOne({ _id: editId });

  const kmTabela = parseInt(editPlate.km_dev);
  const kmUsuario = parseInt(req.body.km_dev);

  if (kmUsuario < kmTabela) {
    return res.status(500).render("500");
  }

  const query = await db
    .getDb()
    .collection("plates")
    .updateOne(
      { _id: editId },
      {
        $set: {
          register: req.body.register,
          km_dev: kmUsuario,
        },
      }
    );

  res.redirect("/placas");
});

// Outras rotas
router.get("/geolocal", function (req, res) {
  res.render("geolocal");
});

module.exports = router;
