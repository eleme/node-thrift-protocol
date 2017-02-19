class TMapItem {
    public:
        TMapItem(int keyType, int valueType);
        ~TMapItem();
        bool Feed(char *bytes, int length, int &position);
        Local<Object> ToObject(Isolate *isolate);
    private:
        int state = 1;
        TValue *key = NULL;
        TValue *value = NULL;
};
