let assert = require('assert');
let Thrift = require('../thrift');

it('type error must be caught', () => {

  let server = Thrift.createServer(() => { /* pass */ }).listen();
  let thrift = Thrift.connect(server.address());

  const test = (type, value, expectation) => {
    try {
      thrift.write({
        name: 'test',
        type: 'CALL',
        id: 0,
        fields: [ { id: 1, type, value } ]
      });
      let error = new Error();
      error.name = 'OK';
      throw error;
    } catch (error) {
      assert.equal(error.name, expectation);
    }
  };

  [ 'BYTE', 'I16', 'I32', 'I64', 'DOUBLE' ].forEach(type => {
    test(type, 123, 'OK');
    test(type, '123', 'OK');
    test(type, Object(123), 'OK');
    test(type, true, 'OK');
    test(type, false, 'OK');
    test(type, 'hehe', 'THRIFT_TYPE_ERROR');
    test(type, null, 'THRIFT_TYPE_ERROR');
    test(type, void 0, 'OK');
    test(type, '', 'OK');
    test(type, new Proxy({}, {}), 'THRIFT_TYPE_ERROR');
    test(type, Symbol(), 'TypeError');
  });

  test('BOOL', true, 'OK');
  test('BOOL', Object(true), 'OK');
  test('BOOL', 'true', 'OK');
  test('BOOL', 'false', 'OK');
  test('BOOL', 1, 'OK');
  test('BOOL', { valueOf() { return 1; } }, 'OK');
  test('BOOL', null, 'THRIFT_TYPE_ERROR');
  test('BOOL', '123', 'THRIFT_TYPE_ERROR');
  test('BOOL', {}, 'THRIFT_TYPE_ERROR');
  test('BOOL', '', 'THRIFT_TYPE_ERROR');
  test('BOOL', new Proxy({}, {}), 'THRIFT_TYPE_ERROR');
  test('BOOL', Symbol(), 'TypeError');

  test('STRING', '123', 'OK');
  test('STRING', true, 'OK');
  test('STRING', false, 'OK');
  test('STRING', Object(true), 'OK');
  test('STRING', Object(true), 'OK');
  test('STRING', Object(true), 'OK');
  test('STRING', 'true', 'OK');
  test('STRING', 'false', 'OK');
  test('STRING', '', 'OK');
  test('STRING', null, 'OK');
  test('STRING', new Proxy({}, {}), 'OK');
  test('STRING', Symbol(), 'TypeError');

});
