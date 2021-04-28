const express = require('express');
const path = require('path');
const { Client } = require('pg');

//start connection with postgresql

const client = new Client({
  user: 'root', // Change username here
  host: 'localhost',
  database: 'test',
  password: 'root1234', //change password here
  port: 5432
});

client.connect();

const query =
  `CREATE TABLE users (
    email varchar,
    firstName varchar,
    lastName varchar,
    age int
);`;

//Start express server
client.query(query, (err, res) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('CREATE TABLE');
  client.end();
});

const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`App started listening at http://localhost:${port}`);
});
