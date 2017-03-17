let assert = require('assert');
let Thrift = require('../thrift');

it('range error must be caught', done => {

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

  const BYTE = 0x80;
  test('BYTE', -BYTE, 'OK');
  test('BYTE', BYTE, 'THRIFT_RANGE_ERROR');
  test('BYTE', BYTE - 1, 'OK');
  test('BYTE', -BYTE - 1, 'THRIFT_RANGE_ERROR');

  const I16 = 0x8000;
  test('I16', -I16, 'OK');
  test('I16', I16, 'THRIFT_RANGE_ERROR');
  test('I16', I16 - 1, 'OK');
  test('I16', -I16 - 1, 'THRIFT_RANGE_ERROR');

  const I32 = 0x80000000;
  test('I32', -I32, 'OK');
  test('I32', I32, 'THRIFT_RANGE_ERROR');
  test('I32', I32 - 1, 'OK');
  test('I32', -I32 - 1, 'THRIFT_RANGE_ERROR');

  done();

});
