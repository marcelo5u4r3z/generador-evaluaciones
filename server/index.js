const { loadServerConfig } = require('./config');
const { createServer } = require('./http-server');

const PORT = Number(process.env.PORT) || 8787;
const HOST = '0.0.0.0';
const config = Object.freeze({ ...loadServerConfig(), port: PORT, host: HOST });

let server;
try {
  server = createServer({ config });
} catch (error) {
  console.error(`NERIO API failed to initialize: ${error.stack || error.message}`);
  process.exit(1);
}

server.on('error', (error) => {
  console.error(`NERIO API server error on ${HOST}:${PORT}: ${error.stack || error.message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.info(`NERIO API listening on ${HOST}:${PORT}`);
  console.info(`NERIO provider model=${config.openaiModel}; configured=${Boolean(config.openaiApiKey)}`);
});

function shutdown(signal) {
  console.info(`NERIO API received ${signal}; closing server.`);
  server.close((error) => {
    if (error) {
      console.error(`NERIO API shutdown failed: ${error.message}`);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
