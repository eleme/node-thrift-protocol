let assert = require('assert');
let Thrift = require('../thrift');

it('type conversion must be supported', done => {

  let counter = 0;

  /* Server */

  let server = Thrift.createServer((thrift) => {
    thrift.on('data', message => {
      let { fields } = message;
      let value1 = fields[0].value;
      let value2 = fields[1].value;
      assert.deepStrictEqual(value1, value2);
      if (!--counter) done();
    });
  }).listen();


  /* Client */

  let thrift = Thrift.connect(server.address());

  const test = (type, value1, value2) => {
    counter++;
    thrift.write({
      name: 'ping',
      type: 'CALL',
      id: 1,
      fields: [
        { id: 1, type, value: value1 },
        { id: 2, type, value: value2 }
      ]
    });
  };

  [ 'BYTE', 'I16', 'I32', 'I64', 'DOUBLE' ].forEach(type => {
    test(type, '123', 123);
    test(type, true, 1);
    test(type, false, 0);
  });

  test('STRING', 123, '123');
  test('STRING', null, 'null');
  test('STRING', true, 'true');
  test('STRING', false, 'false');
  test('STRING', {}, '[object Object]');

  test('BOOL', 'true', true);
  test('BOOL', 'false', false);
  test('BOOL', 0, false);
  test('BOOL', 1, true);
  test('BOOL', 2, true);
  test('BOOL', new Boolean(true), true);
  test('BOOL', new Boolean(false), false);
  test('BOOL', { valueOf() { return 1; } }, true);
  test('BOOL', { valueOf() { return 0; } }, false);
  test('BOOL', { toString() { return 'true'; } }, true);
  test('BOOL', { toString() { return 'false'; } }, false);

});
