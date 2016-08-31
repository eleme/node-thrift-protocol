let assert = require('assert');
let Thrift = require('../thrift');

let counter = 0;

/* Server */

let server = Thrift.createServer((thrift) => {
  thrift.on('data', message => {
    let { fields } = message;
    let value1 = fields[0].value;
    let value2 = fields[1].value;
    assert.deepStrictEqual(value1, value2);
    if (!--counter) process.exit();
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

[ 'BYTE', 'I16', 'I32', 'I64' ].forEach(type => {
  test(type, '123', 123);
  test(type, true, 1);
  test(type, false, 0);
  test(type, null, 0);
  test(type, {}, 0);
});

test('STRING', 123, '123');
test('STRING', null, 'null');
test('STRING', true, 'true');
test('STRING', false, 'false');
test('STRING', {}, '[object Object]');

test('BOOL', 'hehe', true);
test('BOOL', null, false);
test('BOOL', 1, true);
test('BOOL', 0, false);
test('BOOL', {}, true);
