class ThriftProtocolError extends Error {
  constructor(message) {
    super(message);
    this.name = 'THRIFT_PROTOCOL_ERROR';
  }
}

class ThriftRangeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'THRIFT_RANGE_ERROR';
  }
}

class ThriftTypeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'THRIFT_TYPE_ERROR';
  }
}

module.exports = {
  ThriftProtocolError,
  ThriftRangeError,
  ThriftTypeError
};
