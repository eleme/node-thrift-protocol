inline Local<String> U(const char *data, Isolate *isolate = Isolate::GetCurrent()) {
    return String::NewFromUtf8(isolate, data);
}

template<class T>
inline Local<T> GET(Local<Object> obj, const char *name) {
    return Local<T>::Cast(obj->Get(U(name)));
}

inline void SET(Local<Object> obj, const char *name, Local<Value> value) {
    obj->Set(U(name), value);
}

inline Local<Value> CALL(Local<Function> fun, Local<Value> base) {
    return fun->Call((base), 0, NULL);
}

inline Local<Value> CALL(Local<Function> fun, Local<Value> base, Local<Value> arg1) {
    Local<Value> argv[] = { (arg1) };
    return fun->Call((base), 1, argv);
}

inline Local<Object> MERGE_TWO_BUFFER(Isolate *isolate, Local<Object> a, Local<Object> b) {
    char *as = Buffer::Data(a);
    int al = Buffer::Length(a);
    char *bs = Buffer::Data(b);
    int bl = Buffer::Length(b);
    auto buffer = Buffer::New(isolate, al + bl).ToLocalChecked();
    char *s = Buffer::Data(buffer);
    memcpy(s, as, al);
    memcpy(s + al, bs, bl);
    return buffer;
}

inline long I64BE(char *bytes) {
    char tmp[] = { bytes[7], bytes[6], bytes[5], bytes[4], bytes[3], bytes[2], bytes[1], bytes[0] };
    return *(long *)tmp;
}

inline int I32BE(char *bytes) {
    char tmp[] = { bytes[3], bytes[2], bytes[1], bytes[0] };
    return *(int *)tmp;
}

inline short I16BE(char *bytes) {
    char tmp[] = { bytes[1], bytes[0] };
    return *(short *)tmp;
}

inline double F64BE(char *bytes) {
    char tmp[] = { bytes[7], bytes[6], bytes[5], bytes[4], bytes[3], bytes[2], bytes[1], bytes[0] };
    return *(double *)tmp;
}

inline Local<String> GET_VALUE_TYPE_NAME(int type) {
    switch (type) {
        case 2: return U("BOOL");
        case 3: return U("BYTE");
        case 4: return U("DOUBLE");
        case 6: return U("I16");
        case 8: return U("I32");
        case 10: return U("I64");
        case 11: return U("STRING");
        case 12: return U("STRUCT");
        case 13: return U("MAP");
        case 14: return U("SET");
        case 15: return U("LIST");
    }
    return U("UNKNOWN");
}

inline Local<String> GET_METHOD_TYPE_NAME(int type) {
    switch (type) {
        case 1: return U("CALL");
        case 2: return U("REPLY");
        case 3: return U("EXCEPTION");
        case 4: return U("ONEWAY");
    }
    return U("UNKNOWN");
}
