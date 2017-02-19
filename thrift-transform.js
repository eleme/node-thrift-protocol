let implement = require('./build/Release/ThriftTransform');
const { Transform } = require('stream');

class ThriftTransform extends Transform {
  constructor() {
    super({ readableObjectMode : true });
  }
}

implement(ThriftTransform.prototype);

module.exports = ThriftTransform;
