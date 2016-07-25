const FrameGenerator = require('FrameGenerator');
const net = require('net');
const { Duplex } = require('stream');

const VERSION_1 = 0x80010000 | 0;

const TYPES = {
  STOP: 0,
  VOID: 1,
  BOOL: 2,
  BYTE: 3,
  I08: 3,
  DOUBLE: 4,
  I16: 6,
  I32: 8,
  I64: 10,
  UTF7: 11,
  BINARY: 11,
  STRING: 11,
  STRUCT: 12,
  MAP: 13,
  SET: 14,
  LIST: 15,
  UTF8: 16,
  UTF16: 17
};

const TYPES_R = Object.keys(TYPES).reduce((base, key) => {
  base[TYPES[key]] = key;
  return base;
}, {});

const METHODS = {
  CALL: 1,
  REPLY: 2,
  EXCEPTION: 3,
  ONEWAY: 4
};

const METHODS_R = Object.keys(METHODS).reduce((base, key) => {
  base[METHODS[key]] = key;
  return base;
}, {});

class TString extends Buffer {
  constructor(str = '', enc = 'utf8') {
    let sbuf = new Buffer(str, enc);
    super(Buffer.concat([ new TInt32(sbuf.length), sbuf ]));
  }
}

class TInt32 extends Buffer {
  constructor(value = 0) {
    super(4);
    this.writeInt32BE(value);
  }
}

class TInt16 extends Buffer {
  constructor(value = 0) {
    super(2);
    this.writeInt16BE(value);
  }
}

class TInt8 extends Buffer {
  constructor(value = 0) {
    super(1);
    this.writeInt8(value);
  }
}

class TDouble extends Buffer {
  constructor(value = 0) {
    super(8);
    this.writeDoubleBE(value);
  }
}

class TInt64 extends Buffer {
  constructor(value = 0) {
    super(8);
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      throw new Error('Thrift: JSON safe integer overflowed');
    }
    const M = 0xFFFFFFFF;
    let minus = value < 0;
    if (minus) value = -value;
    let l = (value & M) >>> 0;
    let h = (value - l) / 0x100000000;
    if (minus) {
      l = M - l;
      h = M - h;
      l++;
      if (l > M) l = 0, h++;
      if (h > M) h = 0;
    }
    this.writeUInt32BE(h);
    this.writeUInt32BE(l, 4);
  }
}

class TMessage extends Buffer {
  constructor({ id, name, type, fields = [], strict = true }) {
    let bufs = [];
    type = METHODS[type];
    if (strict) {
      bufs.push(
        new TInt32(VERSION_1 | type),
        new TString(name)
      );
    } else {
      bufs.push(
        new TString(name),
        new TInt8(type)
      );
    }
    bufs.push(new TInt32(id), new TStruct({ fields }));
    super(Buffer.concat(bufs));
  }
}

class TStruct extends Buffer {
  constructor({ fields }) {
    super(Buffer.concat([
      ...[].concat(...fields.map(({ type, id, value }) => [
        new TInt8(TYPES[type]),
        new TInt16(id),
        new TValue({ type, value })
      ])),
      new TInt8(TYPES.STOP)
    ]));
  }
}

class TMap extends Buffer {
  constructor({ keyType, valueType, data }) {
    super(Buffer.concat([
      new TInt8(TYPES[keyType]),
      new TInt8(TYPES[valueType]),
      new TInt32(data.length),
      ...[].concat(...data.map(({ key, value }) => [
        new TValue({ type: keyType, value: key }),
        new TValue({ type: valueType, value: value })
      ]))
    ]))
  }
}

class TList extends Buffer {
  constructor({ valueType, data }) {
    super(Buffer.concat([
      new TInt8(TYPES[valueType]),
      new TInt32(data.length),
      ...data.map(value => new TValue({ type: valueType, value: value }))
    ]))
  }
}

class TValue extends Buffer {
  constructor({ type, value }) {
    switch (TYPES[type]) {
      case TYPES.VOID: return new Buffer(0);
      case TYPES.BOOL: return new TInt8(value);
      case TYPES.I8: return new TInt8(value)
      case TYPES.I16: return new TInt16(value)
      case TYPES.I32: return new TInt32(value)
      case TYPES.I64: return new TInt64(value)
      case TYPES.DOUBLE: return new TDouble(value)
      case TYPES.BYTE: return new TInt8(value);
      case TYPES.STRING: return new TString(value);
      case TYPES.MAP: return new TMap(value);
      case TYPES.LIST: return new TList(value);
      case TYPES.STRUCT: return new TStruct(value);
      case TYPES.UTF16: return new TUtf16(value, 'utf16le');
      default: throw new Error(`Thrift: Unknown type ${type}`);
    }
  }
}

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
    this.socket = socket;
    this.fg = socket.pipe(new FrameGenerator(() => this.parser()));
    this.wrap(this.fg);
  }
  _read() {}
  _write(message, enc, callback) {
    this.socket.write(new TMessage(message), enc, callback);
  }
  *parser() {
    let buf = (this.fg.readBytes(8) || (yield 8));
    let version = buf.readInt32BE(0);
    let nameLength = buf.readInt32BE(4);
    let type = version ^ VERSION_1;
    let name = String(yield nameLength);
    let id = (this.fg.readBytes(4) || (yield 4)).readInt32BE(0);
    let { fields } = yield this.valueParser(TYPES.STRUCT);
    type = METHODS_R[type];
    return { type, name, id, fields };
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
      default: throw new Error(`Thrift: Unknown type code ${type}`);
    }
  }
  *i64Parser() {
    let buf = (this.fg.readBytes(8) || (yield 8));
    let h = buf.readUInt32BE(0);
    let l = buf.readUInt32BE(4);
    const M = 0xFFFFFFFF;
    let minus = h & 0x80000000;
    if (minus) {
      l = M - l;
      h = M - h;
      l++;
      if (l > M) l = 0, h++;
      if (h > M) h = 0;
    }
    let value = h * (M + 1) + l;
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      throw new Error('Thrift: JSON safe integer overflowed');
    }
    return value;
  }
  *structParser() {
    let fields = [];
    while (true) {
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
