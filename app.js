const express = require('express');
const bodyparser = require("body-parser");
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

app.post("/returnVehicle", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.custID;
  queryInput[1] = req.body.vehicleID;
  queryInput[2] = req.body.vehicleDesc;
  queryInput[3] = req.body.returnDate;

  console.log(queryInput);
  const query =
    `SELECT * FROM vehicle AS V JOIN rental AS R ON R.VehicleID = V.VehicleID
   WHERE V.Category = '${queryInput[2]}';`;
  client.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(res);
    client.end();
  });
  res.redirect('returnVehicle.html');
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
  client.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Output,", res.rows);
    console.log("RowCount:", res.rowCount);
    //client.end();
  });
  res.redirect('availableVehicles.html');
  //res.render('tempdisplay', {data: res.rows});
});


app.listen(port, () => {
  console.log(`App started listening at http://localhost:${port}`);
});
