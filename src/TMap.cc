TMap::~TMap() {
    for (auto i = data.begin(); i != data.end(); i++) delete *i;
}

Local<Object> TMap::ToObject(Isolate *isolate) {
    auto obj = Object::New(isolate);
    SET(obj, "keyType", Number::New(isolate, keyType));
    SET(obj, "valueType", Number::New(isolate, valueType));
    auto array = Array::New(isolate);
    SET(obj, "data", array);
    auto push = GET<Function>(array, "push");
    for (auto i = data.begin(); i != data.end(); i++) {
        CALL(push, array, (*i)->ToObject(isolate));
    }
    return obj;
}

bool TMap::Feed(char *bytes, int length, int &position) {
    while (true) {
        switch (state) {
            case 1:
                if (length - position >= 1) {
                    keyType = bytes[position++];
                    // cout << "key type: " << keyType << endl;
                    state = 2;
                    break;
                }
                return false;
            case 2:
                if (length - position >= 1) {
                    valueType = bytes[position++];
                    // cout << "value type: " << valueType << endl;
                    state = 3;
                    break;
                }
                return false;
            case 3:
                if (length - position >= 4) {
                    count = I32BE(bytes + position);
                    position += 4;
                    state = 4;
                    // cout << "count: " << count << endl;
                    if (count == 0) return true;
                    remain = new TMapItem(keyType, valueType);
                    break;
                }
                return false;
            case 4:
                while (remain->Feed(bytes, length, position)) {
                    data.push_front(remain);
                    if (data.size() == count) return true;
                    remain = new TMapItem(keyType, valueType);
                }
                return false;
        }
    }
}
