const express = require('express');
const bodyparser = require("body-parser");
const path = require('path');
const { Client } = require('pg');
const { Router } = require('express');
const { Pool } = require('pg');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

global.document = new JSDOM("availableVehicles.html").window.document;
//start connection with postgresql

const client = new Client({
  user: 'postgres', // Change username here
  host: 'localhost',
  database: 'Car_Rental',
  password: 'test', //change password here
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
app.use(bodyparser.urlencoded({ extended: false }));
//app.use(express.urlencoded());

const eRouter = express.Router();
app.use("/", eRouter);

app.post("/addCustomer", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.custName;
  queryInput[1] = req.body.custPhone;
  console.log(queryInput);
  const query = `INSERT INTO customer(name, phone) values
   ('${queryInput[0]}', '${queryInput[1]}');`
  client.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(res);
    client.end();
  });
  res.redirect('/');
});

app.post("/addVehicle", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.vehicleId;
  queryInput[1] = req.body.description;
  queryInput[2] = req.body.year;
  queryInput[3] = req.body.type;
  queryInput[4] = req.body.category;
  console.log(queryInput);
  const query =
    `INSERT INTO vehicle
    VALUES('${queryInput[0]}',
         '${queryInput[1]}',
          ${queryInput[2]},
          ${queryInput[3]},
          ${queryInput[4]});`;
  client.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(res);
    client.end();
  });
  res.redirect('addVehicle.html');
});


app.post("/addReservation", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.type;
  queryInput[1] = req.body.category;
  console.log(queryInput);
  const query =
  `SELECT V.VehicleID as VIN, V.Description, V.Year 
   FROM vehicle AS V LEFT JOIN rental AS R ON R.VehicleID = V.VehicleID 
   WHERE V.Category = '${queryInput[1]}' AND V.Type = '${queryInput[0]}' AND R.VehicleID IS NULL;`;
  pool.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }

    //console.log("Output,", res.rows);
    //console.log("RowCount:", res.rowCount);
    //client.end();
  });
  //document.getElementByID('printVehicle').innerHTML = "testing";
  res.redirect('availableVehicles.html');
  let table = document.getElementById("availableVehicle");
  //document.write("test");
  let data = Object.keys("vin", "description", "year");
  console.log(table);
  generateTableHead(table, data);

  console.log(table);
  console.log(data);
});

function generateTableHead(table, data) {
  let thead = table.createTHead();
  let row = thead.insertRow();
  for (let key of data) {
    let th = document.createElement("th");
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
}

app.listen(port, () => {
  console.log(`App started listening at http://localhost:${port}`);
});
