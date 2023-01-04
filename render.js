const ipcRenderer = require("electron").ipcRenderer;
const stop = () => {
  console.log("stop");
  document.querySelector("#btn").textContent = "Stopping Script";
  ipcRenderer.send("terminate");
};
$(document).ready(function () {
  $("#dtBasicExample").DataTable();
  $(".dataTables_length").addClass("bs-select");
  document.getElementById("btn").onclick = stop;
});
ipcRenderer.on("addData", (event, data) => {
  console.log("data>> ", data);
  // var element = document.createElement("tr");
  $("#dtBasicExample").DataTable().row.add(data).draw();
  // data.forEach((i, j) => {
  //   var ele = document.createElement("td");
  //   if (j == 11) {
  //     var div = document.createElement("div");
  //     div.style.width = "500px";
  //     div.style.height = "300px";
  //     div.style.overflow = "auto";
  //     div.textContent = i;
  //     ele.appendChild(div);
  //   } else {
  //     ele.textContent = i;
  //   }

  //   element.appendChild(ele);
  // });
  // document.querySelector("table > tbody").appendChild(element);
});

ipcRenderer.on("scraped", (event, data) => {
  document.querySelector("#maindiv").remove();
  document.querySelector("#btn").textContent = "Generate CSV";
  document.querySelector("#btn").onclick = () => {
    document.querySelector("#btn").textContent = "Generating CSV";
    ipcRenderer.send("makecsv");
  };
});
ipcRenderer.on("generatedcsv", (event, data) => {
  document.querySelector("#btn").textContent = "Generated CSV";
  document.querySelector("#btn").disabled = true;
  alert("Genereated CSV");
});
