// Utilizar função do node para navegar nos arquivos locais
const path = require("path");

// Função para utilizar o Framework de Node Express (recursos para construção de servidores web)
const express = require("express");
//Pacote para controlar sessões e cookies
const session = require("express-session");
//Pacote para guardar informações de sessões no MongoDB
const mongodbStore = require("connect-mongodb-session");

// Configura rotas do servidor
const db = require("./data/database");
const tableRoutes = require("./routes/tabela");

const MongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new MongoDBStore({
  uri: "mongodb://127.0.0.1:27017",
  databaseName: "tabela",
  collection: "sessions",
});

// Ativar EJS como view engine padrão
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); // Função middleware necessária para dados do formulário
app.use(express.static("public")); //  Arquivos estáticos (e.g. CSS files, Script Javascript)
app.use(
  session({
    secret: "SEI#$%@./ADMIN-~~pass",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 3600000, // 1 hora em milisegundos
    },
  })
);

app.use(function checkOrigin(req, res, next) {
  if (req.method === "POST") {
    const referer = req.get("Referer");

    if (referer && referer.startsWith("http://127.0.0.1:3000/")) {
      // Request is a POST from your own server
      next();
    } else {
      // Request is a POST from a different origin, reject it
      console.log(
        "houve tentativa de acessar o servidor através de origens diferentes !"
      );
      res.status(401).render("401");
    }
  } else {
    // Request is not a POST, allow it to proceed
    next();
  }
});

app.use(async function (req, res, next) {
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;

  if (isAuth) {
    const dbUser = await db
      .getDb()
      .collection("users")
      .findOne({ login: user.login });

    const isAdmin = dbUser.isAdmin;

    res.locals.isAuth = isAuth;
    res.locals.isAdmin = isAdmin;
    res.locals.username = user.login;
  }

  next();
});

let loginAttempts = {};

app.use(function trackLoginAttempts(req, res, next) {
  const ip = req.ip;

  // Verifica se a requisição é uma tentativa de login
  if (req.path === "/login") {
    if (!loginAttempts[ip]) {
      loginAttempts[ip] = 1;
    } else {
      loginAttempts[ip]++;
    }
  }

  if (loginAttempts[ip] >= 3) {
    console.log(
      `IP ${ip} excedeu o limite de tentativas de login ! . Acesso dele está bloqueado.`
    );
    res.status(401).render("register-info", {
      title: "ERROU !",
      h1Text: "Banido !",
      pText: "Errou feio, errou rude !",
    });
  } else {
    next();
  }
});

app.use(tableRoutes);

app.use(function (error, req, res, next) {
  // Função de tratamento de erros
  // Vai ativar em caso de quaisquer crash
  console.log(error);
  res.status(500).render("500");
});

// Rota para erro 404 sempre que uma página não for encontrada
app.use((req, res, next) => {
  res.status(404).render("404");
});

const PORT = 3000;

db.connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor está online no link http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error ao conectar com o banco de dados !:", error);
  });
