const FrameGenerator = require('FrameGenerator');
const net = require('net');
const { Duplex } = require('stream');
const BigNumber = require('bignumber.js');

const { TYPES, TYPES_R, METHODS_R, VERSION_1 } = require('./constant');
const { ThriftProtocolError } = require('./error');
const encode = require('./encode');

class Thrift extends Duplex {
  static connect(settings, callback) {
    let socket = net.connect(settings);
    let thrift = new this(socket);
    if (callback) thrift.on('connect', callback);
    return thrift;
  }
  static createServer(callback) {
    return net.createServer(socket => {
      callback(new this(socket), this);
    });
  }
  end() {
    super.end();
    this.socket.end();
  }
  constructor(socket) {
    super({ writableObjectMode: true, readableObjectMode: true });
    socket.on('connect', (...args) => this.emit('connect', ...args));
    socket.on('timeout', (...args) => this.emit('timeout', ...args));
    socket.on('close', (...args) => this.emit('close', ...args));
    socket.on('error', (...args) => this.emit('error', ...args));
    socket.on('end', (...args) => this.emit('end', ...args));
    this.socket = socket;
    this.fg = socket.pipe(new FrameGenerator(() => this.parser()));
    this.wrap(this.fg);
  }
  _read() {}
  _write(message, enc, callback) {
    this.socket.write(message, enc, callback);
  }
  write(rawMessage) {
    return super.write(encode(rawMessage));
  }
  *parser() {
    let buf = (this.fg.readBytes(8) || (yield 8));
    let version = buf.readInt32BE(0);
    if ((version & VERSION_1) === VERSION_1) {
      let nameLength = buf.readInt32BE(4);
      let type = version ^ VERSION_1;
      let name = String(yield nameLength);
      let id = (this.fg.readBytes(4) || (yield 4)).readInt32BE(0);
      let fields = (yield this.valueParser(TYPES.STRUCT)).fields;
      type = METHODS_R[type];
      return { type, name, id, fields };
    } else {
      this.fg.position -= buf.length;
      let header = yield this.structParser();
      let result = yield this.parser();
      result.header = header;
      return result;
    }
  }
  *valueParser(type) {
    switch (type) {
      case TYPES.STOP: return;
      case TYPES.VOID: return null;
      case TYPES.BOOL: return !!(this.fg.readBytes(1) || (yield 1)).readInt8(0);
      case TYPES.BYTE: return (this.fg.readBytes(1) || (yield 1)).readInt8(0);
      case TYPES.I16: return (this.fg.readBytes(2) || (yield 2)).readInt16BE(0);
      case TYPES.I32: return (this.fg.readBytes(4) || (yield 4)).readInt32BE(0);
      case TYPES.I64: return yield this.i64Parser();
      case TYPES.DOUBLE: return (this.fg.readBytes(8) || (yield 8)).readDoubleBE(0);
      case TYPES.STRING: {
        let size = (this.fg.readBytes(4) || (yield 4)).readInt32BE(0);
        return this.fg.readBytes(size) || (yield size);
      }
      case TYPES.UTF16: {
        let size = (this.fg.readBytes(4) || (yield 4)).readInt32BE(0);
        let buf = this.fg.readBytes(size) || (yield size);
        return buf.toString('utf16le');
      }
      case TYPES.STRUCT: return yield this.structParser();
      case TYPES.LIST: return yield this.listParser();
      case TYPES.MAP: return yield this.mapParser();
      default: throw new ThriftProtocolError(`Unknown type code ${type}`);
    }
  }
  *i64Parser() {
    let buf = (this.fg.readBytes(8) || (yield 8));
    let h = buf.readUInt32BE(0);
    let l = buf.readUInt32BE(4);
    let nega = h & 0x80000000;
    if (nega) {
      l = ~l + 1 >>> 0;
      h = ~h + !l >>> 0;
    }
    let value = (nega ? '-' : '') + h.toString(16) + ('00000000' + l.toString(16)).slice(-8);
    return new BigNumber(value, 16);
  }
  *structParser() {
    let fields = [];
    for (;;) {
      let type = (this.fg.readBytes(1) || (yield 1)).readInt8(0);
      if (!type) break;
      let id = (this.fg.readBytes(2) || (yield 2)).readInt16BE(0);
      let value = yield this.valueParser(type);
      type = TYPES_R[type];
      fields.push({ id, type, value });
    }
    return { fields };
  }
  *listParser() {
    let buf = (this.fg.readBytes(5) || (yield 5));
    let valueType = buf.readInt8();
    let count = buf.readInt32BE(1);
    let data = [];
    for (let i = 0; i < count; i++) {
      let value = yield this.valueParser(valueType);
      data.push(value);
    }
    valueType = TYPES_R[valueType];
    return { valueType, data };
  }
  *mapParser() {
    let buf = (this.fg.readBytes(6) || (yield 6));
    let keyType = buf.readInt8(0);
    let valueType = buf.readInt8(1);
    let count = buf.readInt32BE(2);
    let data = [];
    for (let i = 0; i < count; i++) {
      let key = yield this.valueParser(keyType);
      let value = yield this.valueParser(valueType);
      data.push({ key, value });
    }
    keyType = TYPES_R[keyType];
    valueType = TYPES_R[valueType];
    return { keyType, valueType, data };
  }
}

module.exports = Thrift;
