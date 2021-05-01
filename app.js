const express = require('express');
const bodyParser = require("body-parser");
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
// //Start express server
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
  res.redirect("/addCustomer.html");
});

app.listen(port, () => {
  console.log(`App started listening at http://localhost:${port}`);
});
