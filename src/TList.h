class TList {
    public:
        ~TList();
        bool Feed(char *bytes, int length, int &position);
        Local<Object> ToObject(Isolate *isolate);
    private:
        int state = 1;
        int type;
        unsigned long count;
        TValue *remain = NULL;
        list<TValue *> data;
};
