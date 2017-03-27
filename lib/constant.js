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

const METHODS = {
  CALL: 1,
  REPLY: 2,
  EXCEPTION: 3,
  ONEWAY: 4
};

const VERSION_1 = 0x80010000 | 0;

const TYPES_R = Object.keys(TYPES).reduce((base, key) => {
  base[TYPES[key]] = key;
  return base;
}, {});

const METHODS_R = Object.keys(METHODS).reduce((base, key) => {
  base[METHODS[key]] = key;
  return base;
}, {});

module.exports = { TYPES, METHODS, VERSION_1, TYPES_R, METHODS_R };
