TList::~TList() {
    for (auto i = data.begin(); i != data.end(); i++) delete *i;
}

Local<Object> TList::ToObject(Isolate *isolate) {
    auto obj = Object::New(isolate);
    SET(obj, "valueType", Number::New(isolate, type));
    auto array = Array::New(isolate);
    SET(obj, "data", array);
    auto push = GET<Function>(array, "push");
    for (auto i = data.begin(); i != data.end(); i++) {
        CALL(push, array, (*i)->ToObject(isolate));
    }
    return obj;
}

bool TList::Feed(char *bytes, int length, int &position) {
    while (true) {
        switch (state) {
            case 1:
                if (length - position >= 1) {
                    type = bytes[position++];
                    state = 2;
                    break;
                }
                return false;
            case 2:
                if (length - position >= 4) {
                    count = I32BE(bytes + position);
                    position += 4;
                    state = 3;
                    if (count == 0) return true;
                    remain = new TValue(type);
                    break;
                }
                return false;
            case 3:
                while (remain->Feed(bytes, length, position)) {
                    data.push_front(remain);
                    if (data.size() == count) return true;
                    remain = new TValue(type);
                }
                return false;
        }
    }
    return false;
}
