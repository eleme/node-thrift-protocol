class TMessage : public ObjectWrap {
    public:
        static void Init(Isolate *isolate);
        static void Digest(Isolate *isolate, Local<Object> stream, Local<Object> buffer);
        static Persistent<ObjectTemplate> OT;
        bool Feed(char *bytes, int length, int &position);
    private:
        static void ValueOf(const FunctionCallbackInfo<Value>& args);
        int state = 1;
        static Local<Object> New(Isolate *isolate);
        static const int VERSION_1 = 0x80010000;
        int type;
        int nameLength;
        string name;
        int messageId;
        TStruct data;
        TStruct *header = NULL;
};
