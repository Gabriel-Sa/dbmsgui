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

// => {
//   if (err) {
//     console.error(err);
//     return;
//   }
//   console.log('CREATE TABLE');
//   client.end();
// });

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
  client.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
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
    client.end();
  });
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

app.post("/returnVehicle", (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.custName;
  queryInput[1] = req.body.vehicleID;
  queryInput[2] = req.body.vehicleDesc;
  queryInput[3] = req.body.returnDate;

  console.log(queryInput);
  const query =
    `SELECT SUM(TotalAmount)AS TOTAL_AMOUNT_DUE
  FROM CUSTOMER JOIN RENTAL ON CUSTOMER.CustID = RENTAL.Custid JOIN VEHICLE ON VEHICLE.vehicleid = RENTAL.vehicleid
  WHERE CUSTOMER.custid = (SELECT custId FROM CUSTOMER WHERE name = '${queryInput[0]}')
  AND VEHICLE.vehicleid = '${queryInput[1]}'
  AND VEHICLE.description = '${queryInput[2]}'
  AND RENTAL.returndate = '${queryInput[3]}';`;

  client.query(query, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Output,", res.rows);
    console.log("RowCount:", res.rowCount);
  });
  res.redirect('returnVehicle.html');
});


app.get("/getRentalData", (req, res) => {
  res.send(addRentalData);
});

var searchVResults = {
  headers: ['VIN', 'Vehicle', 'Avg Daily Price'],
  data: []
}
var searchCResults = {
  headers: ['Customer ID', 'Name', 'Remaining Balance'],
  data: []
}

app.post("/searchVehicles", async (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.searchVIN;
  queryInput[1] = req.body.searchDescription;
  console.log(queryInput[0]);
  console.log(queryInput[1]);
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
    WHERE R.vehicleid IS NULL AND V.id = '${queryInput[0]}%';
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

app.post("/searchCustomers", async (req, res) => {
  var queryInput = new Array();
  queryInput[0] = req.body.searchcustID;
  queryInput[1] = req.body.searchcustName;
  console.log(queryInput[0]);
  console.log(queryInput[1]);
  if (queryInput[0] != "" && queryInput[1] == "") {
    const query = `
    SELECT C.CustID AS CustID, C.name AS Customer,
    CAST(R.totalamount AS MONEY)
    FROM Customer AS C, Rental AS R
    Where C.custID = ${queryInput[0]}
    AND C.custID = R.custID GROUP BY C.CustID, C.name, R.totalamount;
    `;
    const query1 = `
    SELECT C.custID AS CustID, C.Name AS Customer,
    CASE WHEN R.totalamount IS NULL THEN '$0.00' END
    FROM Customer AS C NATURAL LEFT JOIN Rental as R
    WHERE R.vehicleid IS NULL AND C.custID = ${queryInput[0]};
    `
    const dataset = await client.query(query);
    searchCResults.data = dataset.rows;
  } else if (queryInput[1] != "" && queryInput[0] == "") {
    const query = `
    SELECT C.custID, C.Name, CAST(R.totalamount AS money)
    FROM customer as c, rental as R
    WHERE description LIKE '${queryInput[1]}%' AND r.custid = c.custid GROUP BY c.custid, c.custname;
    `;
    const query1 = `
    SELECT C.CustID AS custID, C.Name AS Customer,
    CASE WHEN R.totalamount IS NULL THEN '$0.00' END
    FROM Customer AS C NATURAL LEFT JOIN Rental as R
    WHERE R.CustID IS NULL AND C.name LIKE '${queryInput[1]}%';
    `
    const dataSet = await client.query(query);
    const dataSet1 = await client.query(query1);
    searchCResults.data = dataSet.rows.concat(dataSet1.rows);
  } else {
    const query = `
    SELECT C.CustID AS custID, C.name as Customer,
    CASE WHEN R.totalamount IS NOT NULL THEN CAST(R.totalamount AS money) END
    FROM rental AS R, customer AS C
    WHERE C.custID = R.custID GROUP BY custID, Customer, R.totalamount;
    `;
    const query1 = `
    SELECT C.custID AS custID, C.Name AS Customer,
    CASE WHEN R.totalamount IS NULL THEN '$0.00' END
    FROM Customer AS C NATURAL LEFT JOIN Rental as R
    WHERE R.custID IS NULL;
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

app.listen(port, () => {
  console.log(`App started listening at http://localhost:${port}`);
});
