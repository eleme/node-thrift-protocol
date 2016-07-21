let assert = require('assert');
let Thrift = require('../thrift');

/* Server */

let server = Thrift.createServer((thrift, x) => {
  thrift.on('data', message => {
    let { name, id, type } = message;
    assert.equal(name, 'ping');
    assert.equal(id, 1);
    assert.equal(type, 'CALL');
    thrift.write({
      name,
      id,
      type: 'REPLY',
      fields: [
        { id: 0, type: 'BOOL', value: true }
      ]
    });
  });
}).listen();


/* Client */

let thrift = Thrift.connect(server.address());

thrift.write({
  name: 'ping',
  type: 'CALL',
  id: 1
});

thrift.on('data', message => {
  let { id, name, type, fields } = message;
  assert.equal(id, 1);
  assert.equal(name, 'ping');
  assert.equal(type, 'REPLY');
  assert.equal(fields.length, 1);
  fields.forEach(item => {
    let { id, type, value } = item;
    assert.equal(id, 0);
    assert.equal(type, 'BOOL');
    assert.equal(value, true);
  });
  process.exit(0);
});
