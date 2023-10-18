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
