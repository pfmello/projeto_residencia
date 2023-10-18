const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let database;

async function connect() {
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017");
  database = client.db("tabela");
}

function getDb() {
  if (!database) {
    throw { message: "Conexão com o banco de dados não estabelecida !" };
  }

  return database;
}

module.exports = {
  connectToDatabase: connect,
  getDb: getDb,
};
