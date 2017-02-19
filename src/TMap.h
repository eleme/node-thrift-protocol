class TMap {
    public:
        ~TMap();
        bool Feed(char *bytes, int length, int &position);
        Local<Object> ToObject(Isolate *isolate);
    private:
        int state = 1;
        int keyType;
        int valueType;
        unsigned long count;
        TMapItem *remain = NULL;
        list<TMapItem *> data;
};
