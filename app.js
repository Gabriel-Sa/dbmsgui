const express = require('express');
const bodyparser = require("body-parser");
const path = require('path');
const { Client } = require('pg');
const { Router } = require('express');

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

const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyparser.urlencoded({ extended: false }));


const eRouter = express.Router();
app.use("/", eRouter);

app.post("/addCustomer", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.custName;
  queryInput[1] = req.body.custPhone;
  const query = `INSERT INTO customer(name, phone) values
   ('${queryInput[0]}', '${queryInput[1]}');`
  client.query(query);
  res.redirect('/');
});

app.post("/addVehicle", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.vehicleId;
  queryInput[1] = req.body.description;
  queryInput[2] = req.body.year;
  queryInput[3] = req.body.type;
  queryInput[4] = req.body.category;
  const query =
    `INSERT INTO vehicle
    VALUES('${queryInput[0]}',
         '${queryInput[1]}',
          ${queryInput[2]},
          ${queryInput[3]},
          ${queryInput[4]});`;
  client.query(query);
  res.redirect('addVehicle.html');
});

var addRentalData = {
  headers: [],
  data: []
};

app.post("/addReservation", async (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.type;
  queryInput[1] = req.body.category;
  const query =
    `SELECT V.VehicleID as VIN, V.Description AS Vehicle, V.Year
   FROM vehicle AS V LEFT JOIN rental AS R ON R.VehicleID = V.VehicleID
   WHERE V.Category = '${queryInput[1]}' AND V.Type = '${queryInput[0]}' AND R.VehicleID IS NULL;`;
  const data = await client.query(query);
  for (var i = 0; i < 3; i++) {
    addRentalData.headers[i] = data.fields[i].name;
  }
  addRentalData.data = data.rows;
  res.redirect('/availableVehicles.html');
});

app.get("/getRentalData", (req, res) => {
  res.send(addRentalData);
});

var amountDue = {
  headers: ['Name', 'Total Amount Due'],
  data: []
}

app.post("/returnVehicle", async (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.custName;
  queryInput[1] = req.body.vehicleID;
  queryInput[2] = req.body.returnDate;

  console.log(queryInput);

  const query = `
  SELECT Customer.name, SUM(TotalAmount)AS TOTAL_AMOUNT_DUE
  FROM CUSTOMER JOIN RENTAL ON CUSTOMER.CustID = RENTAL.Custid JOIN VEHICLE ON VEHICLE.vehicleid = RENTAL.vehicleid
  WHERE CUSTOMER.custid = (SELECT custId FROM CUSTOMER WHERE name LIKE '%${queryInput[0]}%')
  AND VEHICLE.vehicleid = '${queryInput[1]}'
  AND RENTAL.returndate = '${queryInput[2]}'
  AND (RENTAL.paymentdate = 'NULL' OR RENTAL.paymentdate IS NULL)
  GROUP BY customer.name;
  `;

  const updateQuery = `
  UPDATE rental
  SET paymentdate = CAST(CURRENT_DATE AS character(20))
  WHERE vehicleid='${queryInput[1]}';
  `;
  data = await client.query(query);
  await client.query(updateQuery);
  amountDue.data = data.rows;
  if (amountDue.data.length == 0) {
    amountDue.data = [{ Name: 'No Payment Due' }];
  }
  res.redirect('return.html');
});

app.get("/getAmountDue", (req, res) => {
  res.send(amountDue);
});

// Part 3 Code
app.post("/addRental", async (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.custID;
  queryInput[1] = req.body.vehicleID;
  queryInput[2] = req.body.orderDate;
  queryInput[3] = req.body.startDate;
  queryInput[4] = req.body.qty;
  queryInput[5] = req.body.payNow;
  queryInput[6] = req.body.rentalType;
  if (queryInput[5] == 0) {
    queryInput[5] = req.body.orderDate;
  }
  else if (queryInput[5] == 1) {
    queryInput[5] = "NULL";
  }

  if (queryInput[6] == 1) {
    queryInput[6] = 7;
  }
  else if (queryInput[6] == 0) {
    queryInput[6] = 1;
  }
  const query = `select type, category from vehicle where vehicleid='${queryInput[1]}';`
  const data = await client.query(query);
  var query1;
  if (queryInput[6] == 1) {
    query1 = `select daily as dRate from rate where type = ${data.rows[0].type} AND category = ${data.rows[0].category}`
  } else {
    query1 = `select weekly as dRate from rate where type = ${data.rows[0].type} AND category = ${data.rows[0].category}`
  }
  const data1 = await client.query(query1);
  queryInput[7] = data1.rows[0].drate * queryInput[4];
  const query2 = `INSERT INTO rental (CustID, VehicleID, StartDate, OrderDate, RentalType, Qty, totalamount, paymentdate)
    VALUES(${queryInput[0]}, '${queryInput[1]}', CAST('${queryInput[3]}' AS DATE),
    CAST ('${queryInput[2]}' AS DATE), ${queryInput[6]}, ${queryInput[4]}, ${queryInput[7]},
    '${queryInput[5]}')`;
  client.query(query2);
  res.redirect('index.html');
});
// End of Part 3 Code

// 5
var searchVResults = {
  headers: ['VIN', 'Vehicle', 'Avg Daily Price'],
  data: []
}
var searchCResults = {
  headers: ['Customer ID', 'Name', 'Remaining Balance'],
  data: []
}

//5a
app.post("/searchCustomers", async (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.searchInput;
  queryInput[1] = req.body.searchBy;
  if (queryInput[1] == 1) {
    const query = `
    SELECT C.CustID AS CustID, C.name AS Customer,
    CASE
      WHEN R.totalamount > 0 THEN CAST(R.totalamount AS MONEY)
      WHEN R.totalamount IS NULL THEN '$0.00'
    END AS tamount
    FROM Customer AS C, Rental AS R
    Where C.custID = ${queryInput[0]}
    AND C.custID = R.custID GROUP BY C.CustID, C.name, R.totalamount;
    `;
    const dataset = await client.query(query);
    searchCResults.data = dataset.rows;
  } else if (queryInput[1] == 2) {
    const query = `
    SELECT C.custID, C.Name,
    CASE
      WHEN R.totalamount > 0 THEN CAST(R.totalamount AS MONEY)
      WHEN R.totalamount IS NULL THEN '$0.00'
    END AS tamount
    FROM customer as c, rental as R
    WHERE C.Name LIKE '%${queryInput[0]}%' AND r.custid = c.custid GROUP BY c.custid, c.Name, R.totalamount;
    `;
    const query1 = `
    SELECT C.CustID AS custID, C.Name AS Customer,
    CASE WHEN R.totalamount IS NULL THEN '$0.00' END
    FROM Customer AS C NATURAL LEFT JOIN Rental as R
    WHERE R.CustID IS NULL AND C.name LIKE '%${queryInput[0]}%';
    `
    const dataSet = await client.query(query);
    const dataSet1 = await client.query(query1);
    searchCResults.data = dataSet.rows.concat(dataSet1.rows);
  } else {
    const query = `
    SELECT C.CustID AS custID, C.name as Customer,
    CASE
      WHEN R.totalamount > 0 THEN CAST(R.totalamount AS money)
      WHEN r.totalamount IS NULL THEN '$0.00'
    END AS totalamt
    FROM rental AS R, customer AS C
    WHERE C.custID = R.custID GROUP BY C.custID, C.name, R.totalamount ORDER BY C.custid, r.totalamount;
    `;
    const query1 = `
    SELECT C.custID AS custID, C.Name AS Customer,
    CASE WHEN R.totalamount IS NULL THEN '$0.00' END
    FROM Customer AS C NATURAL LEFT JOIN Rental as R
    WHERE R.custID IS NULL ORDER BY C.custid, r.totalamount;
    `
    const dataSet = await client.query(query);
    const dataSet1 = await client.query(query1);
    searchCResults.data = dataSet.rows.concat(dataSet1.rows);
  }
  res.redirect('/scResults.html')
});

app.get("/getCustomers", (req, res) => {
  res.send(searchCResults);
});

//5b
app.post("/searchVehicles", async (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.searchVIN;
  queryInput[1] = req.body.searchDescription;
  if (queryInput[0] != "" && queryInput[1] == "") {
    const query = `
    SELECT V.VehicleId AS VIN, V.Description AS Vehicle,
    CAST(ROUND(AVG(R.totalAmount/(R.qty*R.rentaltype)),2) AS MONEY) AS Daily
    FROM Vehicle AS V, Rental AS R
    Where V.VehicleId = '${queryInput[0]}'
    AND V.VehicleID = R.VehicleID GROUP BY VIN, Vehicle ORDER BY Daily;
    `;
    const query1 = `
    SELECT V.VehicleID AS VIN, V.description AS Vehicle,
    CASE WHEN R.totalamount IS NULL THEN 'Not-applicable' END AS Daily
    FROM Vehicle AS V NATURAL LEFT JOIN Rental as R
    WHERE R.vehicleid IS NULL AND V.id = '%${queryInput[0]}%';
    `
    const dataset = await client.query(query);
    searchVResults.data = dataset.rows;
  } else if (queryInput[1] != "" && queryInput[0] == "") {
    const query = `
    SELECT V.VehicleId, V.Description, CAST(ROUND(AVG(R.totalamount/(R.qty*R.rentaltype)),2) AS money) AS Daily
    FROM vehicle as v, rental as R
    WHERE description LIKE '${queryInput[1]}%' AND r.vehicleid = v.vehicleid GROUP BY v.vehicleid, v.description ORDER BY daily;
    `;
    const query1 = `
    SELECT V.VehicleID AS VIN, V.description AS Vehicle,
    CASE WHEN R.totalamount IS NULL THEN 'Not-applicable' END AS Daily
    FROM Vehicle AS V NATURAL LEFT JOIN Rental as R
    WHERE R.vehicleid IS NULL AND V.description LIKE '${queryInput[1]}%';
    `
    const dataSet = await client.query(query);
    const dataSet1 = await client.query(query1);
    searchVResults.data = dataSet.rows.concat(dataSet1.rows);
  } else {
    const query = `
    SELECT V.VehicleId AS VIN, V.description as Vehicle,
    CASE WHEN R.totalamount IS NOT NULL THEN CAST(ROUND(AVG(R.totalamount/(R.qty*R.rentaltype)),2) AS money) END AS Daily
    FROM rental AS R, vehicle AS V
    WHERE V.vehicleId = R.vehicleid GROUP BY VIN, Vehicle, R.totalamount ORDER BY Daily;
    `;
    const query1 = `
    SELECT V.VehicleID AS VIN, V.description AS Vehicle,
    CASE WHEN R.totalamount IS NULL THEN 'Not-applicable' END AS Daily
    FROM Vehicle AS V NATURAL LEFT JOIN Rental as R
    WHERE R.vehicleid IS NULL;
    `
    const dataSet = await client.query(query);
    const dataSet1 = await client.query(query1);
    searchVResults.data = dataSet.rows.concat(dataSet1.rows);
  }
  res.redirect('/svResults.html')
});

app.get("/getVehicles", (req, res) => {
  res.send(searchVResults);
});

app.listen(port, () => {
  console.log(`App started listening at http://localhost:${port}`);
});
