let assert = require('assert');
let Thrift = require('../thrift');

/* Server */

let server = Thrift.createServer((thrift, x) => {
  thrift.on('data', message => {
    let { name, id, type, fields } = message;
    assert.equal(name, 'track');
    assert.equal(id, 1);
    assert.equal(type, 'CALL');
    thrift.write({
      name,
      id,
      type: 'REPLY',
      fields
    });
  });
}).listen(8102);


/* Client */

let thrift = Thrift.connect({
  port: 8102,
  host: '127.0.0.1'
});

const FIELDS = [
  { id: 1, type: 'BOOL', value: true },
  {
    id: 2,
    type: 'STRUCT',
    value: {
      fields: [
        { id: 1, type: 'I32', value: 233 }
      ]
    }
  },
  {
    id: 3,
    type: 'LIST',
    value: {
      valueType: 'I32',
      data: [ 1, 2, 3, 4 ]
    }
  },
  {
    id: 4,
    type: 'MAP',
    value: {
      keyType: 'I32',
      valueType: 'STRUCT',
      data: [
        {
          key: 1,
          value: {
            fields: [
              {
                id: 1,
                type: 'I32',
                value: 1
              },
              {
                id: 2,
                type: 'STRING',
                value: 'one'
              }
            ]
          }
        },
        {
          key: 2,
          value: {
            fields: [
              {
                id: 1,
                type: 'I32',
                value: 2
              },
              {
                id: 2,
                type: 'STRING',
                value: 'two'
              }
            ]
          }
        }
      ]
    }
  },
  {
    id: 5,
    type: 'DOUBLE',
    value: 3.1415926
  }
];

thrift.write({
  name: 'track',
  type: 'CALL',
  id: 1,
  fields: FIELDS
});

thrift.on('data', message => {
  let { id, name, type, fields } = message;
  // console.log(JSON.stringify(fields, null, 2));
  assert.deepEqual(fields, FIELDS);
  process.exit(0);
});
