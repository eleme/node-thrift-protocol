## node-thrift-protocol

An implementation of thrift-protocol with node.

### Demo

```javascript
let Thrift = require('node-thrift-protocol');

/* Server */

let server = Thrift.createServer(thrift => {
  thrift.on('data', message => {
    let { name, id, type } = message;
    thrift.write({
      name,
      id,
      type: 'REPLY',
      fields: [
        { id: 0, type: 'BOOL', value: true }
      ]
    });
  });
}).listen(8101);


/* Client */

let thrift = Thrift.connect({
  port: 8101,
  host: '127.0.0.1'
});

thrift.write({
  name: 'ping',
  type: 'CALL',
  id: 1
});

thrift.on('data', message => {
  let { id, name, type, fields } = message;
  fields.forEach(item => {
    let { id, type, value } = item;
  });
});
```

### Usage

#### class Thrift extends stream.Duplex { ... }

This class is used to crate a thrift or local server.

##### Thrift.createServer([options]);

Creates a new server. The connectionListener argument is automatically set as a listener for the 'connection' event.

`options` is an object as net.createServer in net module.

returns `socket`.

##### Thrift.connect(options[, callback]);

Opens the connection for a given socket.

`options` is an object as net.connect in net module.

return `thrift`.

##### new Thrift(socket);

Construct a new `thrift` object with a `socket`.

### Protocol

[thrift-protocol.txt](thrift-protocol.txt)
