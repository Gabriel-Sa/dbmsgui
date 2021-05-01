const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const { Client } = require('pg');

//start connection with postgresql

const client = new Client({
  user: 'root', // Change username here
  host: 'localhost',
  database: 'project',
  password: 'root1234', //change password here
  port: 5432
});

client.connect();

function completeUserInput(query) {
  const inputQuery = query;
  // Implement adding of the customer data to the user database based off input.
  return inputQuery;
}
// const query =
//   `CREATE TABLE users (
//     email varchar,
//     firstName varchar,
//     lastName varchar,
//     age int
// );`;
//
// //Start database server
// client.query(query, (err, res) => {
//   if (err) {
//     console.error(err);
//     return;
//   }
//   console.log('CREATE TABLE');
//   client.end();
// });

const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

const eRouter = express.Router();
app.use("/", eRouter);

app.post("/addcustomer", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.custName;
  queryInput[1] = req.body.custPhone;
  console.log(queryInput);
  console.log(queryInput[1]);
  const query = `INSERT INTO customer(name, phone) values
   ('${queryInput[0]}', '${queryInput[1]}');`
  client.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(res.rows);
    client.end();
  });
  res.redirect("/addCustomer.html");
});

app.listen(port, () => {
  console.log(`App started listening at http://localhost:${port}`);
});
