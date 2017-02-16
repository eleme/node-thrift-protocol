let assert = require('assert');
let Thrift = require('../thrift');
let SequenceTester = require('sequence-tester');

let seq = new SequenceTester([ 1, 2, 3, 4 ]);

seq.then(() => {
  process.exit();
}, error => {
  process.exit(1);
});

/* Server */

let server = Thrift.createServer(thrift => {
  thrift.on('end', () => seq.assert(1));
  thrift.on('close', () => seq.assert(2));
  thrift.on('error', error => { throw error; });
}).listen();


/* Client */

let thrift = Thrift.connect(server.address());
thrift.on('end', () => seq.assert(3));
thrift.on('close', () => seq.assert(4));
thrift.on('error', error => { throw error; });

thrift.on('connect', () => {
  thrift.end();
});
