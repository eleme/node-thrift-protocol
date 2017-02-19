class TField {
    public:
        ~TField();
        bool Feed(char *bytes, int length, int &position);
        int type;
        Local<Object> ToObject(Isolate *isolate);
    private:
        int state = 1;
        int id;
        TValue *value;
};
