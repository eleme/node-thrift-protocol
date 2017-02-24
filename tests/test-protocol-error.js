let assert = require('assert');
let Thrift = require('../thrift');

it('protocol error must be caught', done => {

  /* Server */

  let server = Thrift.createServer((thrift, x) => {
    thrift.on('error', error => {
      assert(error.name, 'THRIFT_PROTOCOL_ERROR');
      done();
    });
  }).listen();


  /* Client */

  let { port } = server.address();

  require('http').request({ port }).end();

});
