class TStruct {
    public:
        TStruct();
        ~TStruct();
        bool Feed(char *bytes, int length, int &position);
        Local<Object> ToObject(Isolate *isolate);
    private:
        TField *remain = NULL;
        list<TField *> fields;
};
