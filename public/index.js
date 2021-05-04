function AddCustomer() {
  window.location.replace("addcustomer.html");
}
function AddVehicle() {
  window.location.replace("addvehicle.html");
}
function AddReservation() {
  window.location.replace("addreservation.html");
}
function ReturnVehicle() {
  window.location.replace("returnvehicle.html");
}
function searchCustomer() {
  window.location.replace("searchcustomer.html");
}
function searchVehicle() {
  window.location.replace("searchvehicles.html");
}
function Homepage() {
  window.location.replace("index.html");
}
function loadPage() {
  window.location.replace("sPaid.html");
}

{
  async function updateTable(root) {
    const table = root.querySelector(".table-refresh__table");
    const response = await fetch(root.dataset.url);
    const data = await response.json();
    //clearing table

    table.querySelector("thead tr").innerHTML = "";
    table.querySelector("tbody").innerHTML = "";

    //Populate
    for (const header of data.headers) {
      table.querySelector("thead tr").insertAdjacentHTML("beforeend", `<th>${header}</th>`);
    }

    for (const row of data.data) {
      var cols = [];
      for (x in row) {
        cols.push(row[x]);
      }
      table.querySelector("tbody").insertAdjacentHTML("beforeend",
        `
        <tr>
          ${cols.map(col => `<td>${col}</td>`).join("")}
        </tr>
      `);
    }
  }

  for (const root of document.querySelectorAll(".table-refresh[data-url]")) {
    const table = document.createElement("table");
    table.classList.add("table-refresh__table");
    table.innerHTML = `
      <thead>
        <tr></tr>
      </thead>
      <tbody>
        <tr>
          <td>Loading</td>
        </tr>
      </tbody>
    `;
    root.append(table);

    updateTable(root);
  }
}
