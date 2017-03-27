let assert = require('assert');
let Thrift = require('../');

it('thrift header must be supported', done => {

  /* Server */

  let server = Thrift.createServer((thrift) => {
    thrift.on('data', message => {
      let { name, id, type, header } = message;
      assert.equal(name, 'ping');
      assert.equal(id, 1);
      assert.equal(type, 'CALL');
      thrift.write({
        name,
        id,
        type: 'REPLY',
        fields: [
          { id: 0, type: 'BOOL', value: true }
        ],
        header
      });
    });
  }).listen();

  /* Client */

  let thrift = Thrift.connect(server.address());

  thrift.write({
    name: 'ping',
    type: 'CALL',
    id: 1,
    header: {
      fields: [
        { id: 1, type: 'STRING', value: 'hehe' }
      ]
    }
  });

  thrift.on('data', message => {
    let { id, name, type, fields, header } = message;
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
    assert(header);
    assert(header.fields.length);
    assert(header.fields[0].value + '' === 'hehe');
    done();
  });

});
