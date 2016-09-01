let assert = require('assert');
let Thrift = require('../thrift');

let server = Thrift.createServer(thrift => { /* pass */ }).listen();
let thrift = Thrift.connect(server.address());

const test = (type, value, expectation) => {
  try {
    let a = thrift.write({
      name: 'test',
      type: 'CALL',
      id: 0,
      fields: [ { id: 1, type, value } ]
    });
    throw { name: 'OK' };
  } catch(error) {
    assert.equal(error.name, expectation);
  }
};

[ 'BYTE', 'I16', 'I32', 'I64', 'DOUBLE' ].forEach(type => {
  test(type, 123, 'OK');
  test(type, '123', 'OK');
  test(type, new Number(123), 'OK');
  test(type, true, 'OK');
  test(type, false, 'OK');
  test(type, 'hehe', 'THRIFT_TYPE_ERROR');
  test(type, null, 'THRIFT_TYPE_ERROR');
});

test('BOOL', true, 'OK');
test('BOOL', new Boolean(true), 'OK');
test('BOOL', 'true', 'OK');
test('BOOL', 1, 'OK');
test('BOOL', { valueOf() { return 1; } }, 'OK');
test('BOOL', null, 'THRIFT_TYPE_ERROR');
test('BOOL', '123', 'THRIFT_TYPE_ERROR');
test('BOOL', {}, 'THRIFT_TYPE_ERROR');

test('STRING', '123', 'OK');
test('STRING', true, 'OK');
test('STRING', false, 'OK');
test('STRING', new Boolean(true), 'OK');
test('STRING', new Number(true), 'OK');
test('STRING', new String(true), 'OK');
test('STRING', 'true', 'OK');
test('STRING', 'false', 'OK');
test('STRING', null, 'OK');

process.exit();
