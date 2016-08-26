void TMessage::Init(Isolate *isolate) {
    Local<ObjectTemplate> ot = ObjectTemplate::New(isolate);
    ot->SetInternalFieldCount(1);
    OT.Reset(isolate, ot);
}

void TMessage::ValueOf(const FunctionCallbackInfo<Value>& args) {
    auto isolate = args.GetIsolate();
    auto tMessage = ObjectWrap::Unwrap<TMessage>(args.This());
    auto obj = tMessage->data.ToObject(isolate);
    SET(obj, "type", GET_METHOD_TYPE_NAME(tMessage->type));
    auto name = String::NewFromUtf8(isolate, tMessage->name.c_str(), NewStringType::kNormal, tMessage->name.length());
    SET(obj, "name", name.ToLocalChecked());
    SET(obj, "id", Number::New(isolate, tMessage->messageId));
    if (tMessage->header != NULL) SET(obj, "header", tMessage->header->ToObject(isolate));
    args.GetReturnValue().Set(obj);
}

void TMessage::Digest(Isolate *isolate, Local<Object> stream, Local<Object> buffer) {
    auto push = GET<Function>(stream, "push");
    // Get message object and internalTMessage object
    auto message = GET<Object>(stream, "_message");
    if (message->IsUndefined()) message = TMessage::New(isolate);
    auto internalTMessage = ObjectWrap::Unwrap<TMessage>(message);
    // Merge buffer and feed until false
    Local<Object> remain = GET<Object>(stream, "_remain");
    if (!remain->IsUndefined()) buffer = MERGE_TWO_BUFFER(isolate, remain, buffer);
    char *bytes = Buffer::Data(buffer);
    int length = Buffer::Length(buffer);
    int position = 0;
    while (position < length && internalTMessage->Feed(bytes, length, position)) {
        // Push to steam and create next message
        CALL(push, stream, message);
        message = TMessage::New(isolate);
        internalTMessage = ObjectWrap::Unwrap<TMessage>(message);
    }
    // Save info
    remain = Buffer::Copy(isolate, bytes + position, length - position).ToLocalChecked();
    SET(stream, "_remain", remain);
    SET(stream, "_message", message);
}

Local<Object> TMessage::New(Isolate *isolate) {
    auto ot = Local<ObjectTemplate>::New(isolate, OT);
    auto instance = ot->NewInstance(isolate->GetCurrentContext()).ToLocalChecked();
    NODE_SET_METHOD(instance, "valueOf", ValueOf);
    (new TMessage())->Wrap(instance);
    return instance;
}

bool TMessage::Feed(char *bytes, int length, int &position) {
    while (true) {
        switch (state) {
            case 1:
                if (length - position >= 8) {
                    int version = I32BE(bytes + position);
                    if ((version & VERSION_1) == VERSION_1) {
                        // Message
                        type = version ^ VERSION_1;
                        nameLength = I32BE(bytes + position + 4);
                        position += 8;
                        state = 2;
                        // cout << "type: " << (int)type << endl;
                        // cout << "nameLength: " << nameLength << endl;
                    } else {
                        state = 5;
                        if (header != NULL) {
                            delete header;
                            header = NULL;
                        }
                    }
                    break;
                }
                return false;
            case 2:
                if (length - position >= nameLength) {
                    name = string(bytes + position, nameLength);
                    // cout << "name: " << name << endl;
                    position += nameLength;
                    state = 3;
                    break;
                }
                return false;
            case 3:
                if (length - position >= 4) {
                    messageId = I32BE(bytes + position);
                    // cout << "messageId: " << messageId << endl;
                    position += nameLength;
                    state = 4;
                    break;
                }
                return false;
            case 4:
                return data.Feed(bytes, length, position);
            case 5:
                if (header == NULL) header = new TStruct();
                if (header->Feed(bytes, length, position)) {
                    state = 1;
                } else {
                    return false;
                }
        }
    }
}

Persistent<ObjectTemplate> TMessage::OT;
