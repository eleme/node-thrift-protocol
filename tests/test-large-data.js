let assert = require('assert');
let Thrift = require('../thrift');

it('large-data must not thrown', done => {

  /* Server */

  let data = [
    {
      id: 0,
      type: 'LIST',
      value: {
        valueType: 'STRUCT',
        data: Array.from({ length: 1000 }, (item, index) => {
          return {
            fields: Array.from({ length: 100 }, (item, index) => {
              return { id: index, type: 'STRING', value: Math.random() + '' };
            })
          };
        })
      }
    }
  ];

  let server = Thrift.createServer((thrift) => {
    thrift.on('data', message => {
      let { name, id, type } = message;
      thrift.write({
        name,
        id,
        type: 'REPLY',
        fields: data
      });
    });
  }).listen();


  /* Client */

  let thrift = Thrift.connect(server.address());

  thrift.write({
    name: 'test',
    type: 'CALL',
    id: 1
  });

  thrift.on('data', message => {
    let { id, name, type, fields } = message;
    let field = fields[0];
    let result = field.value.data.map(item => {
      let temp = {};
      item.fields.forEach(item => { temp[item.id] = item.value; });
      return temp;
    });
    assert.equal(result.length, 1000);
    done();
  });

});
