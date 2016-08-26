TMapItem::TMapItem(int keyType, int valueType) {
    key = new TValue(keyType);
    value = new TValue(valueType);
}

TMapItem::~TMapItem() {
    delete key;
    delete value;
}

Local<Object> TMapItem::ToObject(Isolate *isolate) {
    auto obj = Object::New(isolate);
    SET(obj, "key", key->ToObject(isolate));
    SET(obj, "value", value->ToObject(isolate));
    return obj;
}

bool TMapItem::Feed(char *bytes, int length, int &position) {
    while (true) {
        switch (state) {
            case 1:
                if (key->Feed(bytes, length, position)) {
                    state = 2;
                    break;
                }
                return false;
            case 2:
                return value->Feed(bytes, length, position);
        }
    }
}
