class TValue {
    public:
        TValue(int type);
        ~TValue();
        bool Feed(char *bytes, int length, int &position);
        Local<Value> ToObject(Isolate *isolate);
    private:
        int type;
        void *ptr = NULL;
};
