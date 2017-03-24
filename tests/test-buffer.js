let assert = require('assert');
let Thrift = require('../');

it('simple invoking must be supported', done => {

  /* Server */

  let server = Thrift.createServer((thrift) => {
    thrift.on('data', message => {
      let { name, id, type, fields } = message;
      assert.equal(name, 'test');
      assert.equal(id, 1);
      assert.equal(type, 'CALL');
      assert.equal(fields.length, 1);
      fields.forEach(item => {
        let { id, type, value } = item;
        assert.equal(id, 1);
        assert.equal(type, 'STRING');
        assert(value instanceof Buffer);
        assert.equal(value.toString(), 'strbuf');
      });
      thrift.write({
        name,
        id,
        type: 'REPLY',
        fields: fields
      });
    });
  }).listen();

  /* Client */

  let thrift = Thrift.connect(server.address());

  thrift.write({
    name: 'test',
    type: 'CALL',
    id: 1,
    fields: [
      { id: 1, type: 'STRING', value: Buffer.from('strbuf') }
    ]
  });

  thrift.on('data', message => {
    let { id, name, type, fields } = message;
    assert.equal(id, 1);
    assert.equal(name, 'test');
    assert.equal(type, 'REPLY');
    assert.equal(fields.length, 1);
    fields.forEach(item => {
      let { id, type, value } = item;
      assert.equal(id, 1);
      assert.equal(type, 'STRING');
      assert(value instanceof Buffer);
      assert.equal(value.toString(), 'strbuf');
    });
    done();
  });

});
