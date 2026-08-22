const fs = require('fs');
const logFile = 'h:/vite-dev-log.txt';

function log(msg) {
  fs.appendFileSync(logFile, new Date().toISOString() + ': ' + msg + '\n');
}

log('Script starting...');
log('CWD: ' + process.cwd());
log('Node: ' + process.version);

try {
  const { createServer } = require('./node_modules/vite/dist/node/index.cjs');
  log('Vite module loaded');
  
  createServer({
    server: { host: true }
  }).then(server => {
    log('Server created, listening...');
    return server.listen();
  }).then(server => {
    const info = server.config.server;
    const address = server.httpServer.address();
    log('Server running at http://localhost:' + address.port);
    log('Network: http://0.0.0.0:' + address.port);
  }).catch(err => {
    log('ERROR: ' + err.message);
    log(err.stack);
  });
} catch(err) {
  log('REQUIRE ERROR: ' + err.message);
  log(err.stack);
}
