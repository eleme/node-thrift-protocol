let assert = require('assert');
let Thrift = require('../thrift');

it('transmited data must correct', done => {

  /* Server */

  let server = Thrift.createServer((thrift) => {
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
  }).listen();

  /* Client */

  let thrift = Thrift.connect(server.address());

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
    let { fields } = message;
    JSON.stringify(fields, function(key) {
      if (this[key] instanceof Buffer) this[key] = this[key] + '';
      return this[key];
    });
    assert.deepEqual(fields, FIELDS);
    done();
  });

});
