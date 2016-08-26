TStruct::TStruct() {
    remain = new TField();
}

TStruct::~TStruct() {
    for (auto i = fields.begin(); i != fields.end(); i++) delete *i;
}

Local<Object> TStruct::ToObject(Isolate *isolate) {
    auto obj = Object::New(isolate);
    auto array = Array::New(isolate);
    SET(obj, "fields", array);
    auto push = GET<Function>(array, "push");
    for (auto i = fields.begin(); i != fields.end(); i++) {
        CALL(push, array, (*i)->ToObject(isolate));
    }
    return obj;
}

bool TStruct::Feed(char *bytes, int length, int &position) {
    while (remain->Feed(bytes, length, position)) {
        if (remain->type == 0) {
            delete remain;
            // cout << "field stop " << endl;
            return true;
        } else {
            fields.push_front(remain);
            remain = new TField();
        }
    }
    return false;
}
