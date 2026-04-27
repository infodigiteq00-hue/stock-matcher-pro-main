const app = require("./app");

const DEFAULT_PORT = Number(process.env.INVENTORY_API_PORT || 4000);

let server;

const startServer = (port = DEFAULT_PORT) => {
  if (server) {
    return server;
  }

  server = app.listen(port, () => {
    console.log(`Inventory JSON API running on port ${port}`);
  });

  return server;
};

const stopServer = () =>
  new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      server = undefined;
      resolve();
    });
  });

if (require.main === module) {
  startServer();
}

module.exports = { startServer, stopServer };
