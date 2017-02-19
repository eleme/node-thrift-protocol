TValue::TValue(int type) {
    this->type = type;
}

Local<Value> TValue::ToObject(Isolate *isolate) {
    switch (type) {
        case 2: return Boolean::New(isolate, *(bool *)ptr);
        case 3: return Number::New(isolate, *(unsigned char *)ptr);
        case 4: return Number::New(isolate, *(double *)ptr);
        case 6: return Number::New(isolate, *(short *)ptr);
        case 8: return Number::New(isolate, *(int *)ptr);
        case 10: return Number::New(isolate, *(long *)ptr);
        case 11:
            {
              auto raw = (string *)ptr;
              return Buffer::Copy(isolate, raw->c_str(), raw->length()).ToLocalChecked();
            }
        case 12: return ((TStruct *)ptr)->ToObject(isolate);
        case 14: return ((TMap *)ptr)->ToObject(isolate);
        case 15: return ((TList *)ptr)->ToObject(isolate);
    }
    return Undefined(isolate);
}

TValue::~TValue() {
    switch (type) {
        case 2:
            delete (bool *)ptr;
            break;
        case 3:
            delete (unsigned char *)ptr;
            break;
        case 4:
            delete (double *)ptr;
            break;
        case 6:
            delete (short *)ptr;
            break;
        case 8:
            delete (int *)ptr;
            break;
        case 10:
            delete (long *)ptr;
            break;
        case 11:
            delete (string *)ptr;
            break;
        case 12:
            delete (TStruct *)ptr;
            break;
        case 14:
            delete (TMap *)ptr;
            break;
        case 15:
            delete (TList *)ptr;
            break;
    }
}

bool TValue::Feed(char *bytes, int length, int &position) {
    switch (type) {
        case 2:
            if (length - position >= 1) {
                ptr = new bool(bytes[position++]);
                // cout << "value: " << *(bool *)ptr << endl;
                return true;
            }
            return false;
        case 3:
            if (length - position >= 1) {
                ptr = new unsigned char(bytes[position++]);
                // cout << "value: " << (int)*(char *)ptr << endl;
                return true;
            }
            return false;
        case 4:
            if (length - position >= 8) {
                ptr = new double(F64BE(bytes + position));
                position += 8;
                // cout << "value: " << *(double *)ptr << endl;
                return true;
            }
            return false;
        case 6:
            if (length - position >= 2) {
                ptr = new short(I16BE(bytes + position));
                position += 2;
                // cout << "value: " << *(short *)ptr << endl;
                return true;
            }
            return false;
        case 8:
            if (length - position >= 4) {
                ptr = new int(I32BE(bytes + position));
                position += 4;
                // cout << "value: " << *(int *)ptr << endl;
                return true;
            }
            return false;
        case 10:
            if (length - position >= 8) {
                ptr = new long(I64BE(bytes + position));
                position += 8;
                // cout << "value: " << *(long *)ptr << endl;
                return true;
            }
            return false;
        case 11:
            if (length - position >= 4) {
                auto stringLength = I32BE(bytes + position);
                // cout << "stringLength: " << stringLength << endl;
                if (length - position >= stringLength + 4) {
                    ptr = new string(bytes + position + 4, stringLength);
                    position += stringLength + 4;
                    // cout << "value: " << *(string *)ptr << endl;
                    return true;
                }
            }
            return false;
        case 12:
            if (ptr == NULL) ptr = new TStruct();
            return ((TStruct *)ptr)->Feed(bytes, length, position);
        case 14:
            if (ptr == NULL) ptr = new TMap();
            return ((TMap *)ptr)->Feed(bytes, length, position);
        case 15:
            if (ptr == NULL) ptr = new TList();
            return ((TList *)ptr)->Feed(bytes, length, position);
    }
    return false;
}
