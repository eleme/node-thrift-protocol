let assert = require('assert');
let BigNumber = require('bignumber.js');
let Thrift = require('../thrift');

it('i64 must be supportd', done => {

  /* Server */

  let server = Thrift.createServer((thrift, x) => {
    thrift.on('data', message => {
      let { name, id, type, fields } = message;
      thrift.write({
        name,
        id,
        type: 'REPLY',
        fields: [
          { id: 0, type: 'I64', value: fields[0].value }
        ]
      });
    });
  }).listen();


  /* Client */

  let thrift = Thrift.connect(server.address());

  let tests = [
    '1234567890123456789',
    '-1234567890123456789',
    '9223372036854775807',
    '-9223372036854775808'
  ];

  let inc = 0;
  thrift.on('data', message => {
    let { id, name, type, fields } = message;
    let { value } = fields[0];
    assert.equal(value + '', tests[id]);
    if (++inc === 4) done();
  });

  tests.forEach((value, id) => {
    thrift.write({
      name: 'test',
      type: 'CALL',
      id,
      fields: [
        { id: 2, type: 'I64', value: new BigNumber(value) }
      ]
    });
  });

});
