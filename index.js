// Daemon realizado por Martin Casas e Ivan Aprea
// TP1 - SOFTWARE LIBRE - FI UNMDP - 2022

// lib
const http = require("http");
const dbus = require("dbus-next");
const fs = require("fs");

// host config
const hostname = "0.0.0.0";
const port = process.env.NODE_PORT || 6151;

const bus = dbus.systemBus();

let obj, colorMngr;

function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

function formatDate(date) {
  return `${[
    padTo2Digits(date.getDate()),
    padTo2Digits(date.getMonth() + 1),
    date.getFullYear(),
  ].join("/")} ${date.getHours()}:${date.getMinutes()}`;
}

fs.appendFileSync(
  "/home/ivan/tp1_daemon_sl/log",
  `[${formatDate(new Date())}] El daemon fue inicializado.\n`
);

const initialize = async () => {
  obj = await bus.getProxyObject(
    "org.freedesktop.ColorManager",
    "/org/freedesktop/ColorManager"
  );
  colorMngr = await obj.getInterface("org.freedesktop.ColorManager");
  colorMngr.on("DeviceAdded", async (iface, changed, invalidated) => {
    bus
      .getProxyObject("org.freedesktop.ColorManager", `${iface}`)
      .then((newMonitor) => {
        const properties = newMonitor.getInterface(
          "org.freedesktop.DBus.Properties"
        );
        properties
          .Get("org.freedesktop.ColorManager.Device", "Model")
          .then((monitorModel) => {
            fs.appendFileSync(
              "/home/ivan/tp1_daemon_sl/log",
              `[${formatDate(
                new Date()
              )}] Nuevo dispositivo de salida detectado. Se conecto ${
                monitorModel.value
              }\n`
            );
          });
      });
  });
};

const getAvailableDevices = () => {
  return colorMngr.GetDevices();
};

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  getAvailableDevices().then((response) => {
    res.statusCode = 200;
    res.write(JSON.stringify(response));
    res.end();
  });
});

initialize();
server.listen(port, hostname, () => {
  fs.appendFileSync(
    "/home/ivan/tp1_daemon_sl/log",
    "Server running at http://" + hostname + ":" + port + "/\n"
  );
});

process.on("exit", () => {
  fs.appendFileSync(
    "/home/ivan/tp1_daemon_sl/log",
    `[${formatDate(new Date())}] El daemon ha finalizado su ejecución\n`
  );
  process.exit(1);
});

process.on("SIGTERM", () => {
  fs.appendFileSync(
    "/home/ivan/tp1_daemon_sl/log",
    `[${formatDate(new Date())}] El daemon ha finalizado abruptamente\n`
  );
  process.exit(1);
});