TField::~TField() {
    delete value;
}

Local<Object> TField::ToObject(Isolate *isolate) {
    auto obj = Object::New(isolate);
    SET(obj, "type", GET_VALUE_TYPE_NAME(type));
    SET(obj, "id", Number::New(isolate, id));
    SET(obj, "value", value->ToObject(isolate));
    return obj;
}

bool TField::Feed(char *bytes, int length, int &position) {
    while (true) {
        switch (state) {
            case 1:
                if (length - position >= 1) {
                    type = bytes[position];
                    // cout << "field type: " << type << endl;
                    position++;
                    state = 2;
                    if (type == 0) return true;
                    break;
                }
                return false;
            case 2:
                if (length - position >= 2) {
                    id = I16BE(bytes + position);
                    position += 2;
                    state = 3;
                    // cout << "field id: " << id << endl;
                    value = new TValue(type);
                    break;
                }
                return false;
            case 3:
                return value->Feed(bytes, length, position);
        }
    }
    return false;
}
