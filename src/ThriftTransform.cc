#include <node.h>
#include <node_buffer.h>
#include <node_object_wrap.h>
#include <iostream>
#include <string>
#include <list>

using namespace std;
using namespace v8;
using namespace node;

#include "utils.cc"

#include "TValue.h"
#include "TField.h"
#include "TStruct.h"
#include "TMapItem.h"
#include "TMap.h"
#include "TList.h"
#include "TMessage.h"

#include "TValue.cc"
#include "TField.cc"
#include "TStruct.cc"
#include "TMapItem.cc"
#include "TMap.cc"
#include "TList.cc"
#include "TMessage.cc"

void _write(const FunctionCallbackInfo<Value>& args) {
    // Create function scope
    auto isolate = args.GetIsolate();
    HandleScope scope(isolate);

    // Degist received data
    auto stream = args.This();
    auto buffer = Local<Object>::Cast(args[0]);
    TMessage::Digest(isolate, stream, buffer);

    // Call "next"
    auto next = Local<Function>::Cast(args[2]);
    CALL(next, Null(isolate));
}

void entry(const FunctionCallbackInfo<Value>& args) {
    // Create function scope
    auto isolate = args.GetIsolate();
    HandleScope scope(isolate);
    auto obj = Local<Object>::Cast(args[0]);
    NODE_SET_METHOD(obj, "_write", _write);
}

void init(Local<Object> exports, Local<Object> module) {
    TMessage::Init(exports->GetIsolate());
    NODE_SET_METHOD(module, "exports", entry);
}

NODE_MODULE(addon, init)
