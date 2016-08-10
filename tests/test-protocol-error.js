let assert = require('assert');
let Thrift = require('../thrift');

/* Server */

let server = Thrift.createServer((thrift, x) => {
  thrift.on('error', error => {
    assert(error.name, 'THRIFT_PROTOCOL_ERROR');
    process.exit(0);
  });
}).listen();


/* Client */

let { port } = server.address();

require('http').request({ port }).end();
