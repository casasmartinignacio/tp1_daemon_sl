// Daemon realizado por Martin Casas e Ivan Aprea 
// TP1 - SOFTWARE LIBRE - FI UNMDP - 2022

// lib
const http = require("http");
const dbus = require("dbus-next");
const notifier = require("node-notifier");

// host config
const hostname = "0.0.0.0";
const port = process.env.NODE_PORT || 6152;

const bus = dbus.systemBus();

let obj, colorMngr;

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
            notifier.notify({
              title: "Nuevo monitor detectado!",
              message: `Se conecto ${monitorModel.value}`,
            });
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
  console.log("Server running at http://" + hostname + ":" + port + "/");
});
