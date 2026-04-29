const app = require("./app");

const DEFAULT_PORT = Number(process.env.INVENTORY_API_PORT || 4000);
const PORT_SCAN_LIMIT = 20;

let server;

const tryListen = (port) =>
  new Promise((resolve, reject) => {
    const candidate = app.listen(port, () => resolve({ server: candidate, port }));
    candidate.once("error", (error) => reject(error));
  });

const startServer = async (port = DEFAULT_PORT) => {
  if (server) {
    return server;
  }

  for (let offset = 0; offset <= PORT_SCAN_LIMIT; offset += 1) {
    const candidatePort = port + offset;

    try {
      const { server: startedServer, port: resolvedPort } = await tryListen(candidatePort);
      server = startedServer;
      process.env.INVENTORY_API_PORT = String(resolvedPort);
      console.log(`Inventory JSON API running on port ${resolvedPort}`);

      if (resolvedPort !== port) {
        console.log(`Port ${port} busy tha, fallback port ${resolvedPort} use hua.`);
      }

      return server;
    } catch (error) {
      if (error?.code !== "EADDRINUSE" || offset === PORT_SCAN_LIMIT) {
        throw error;
      }
    }
  }

  throw new Error("No free API port found in configured range.");
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
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { startServer, stopServer };
