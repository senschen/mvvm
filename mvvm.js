/**
 * Created by sens on 2017/7/16.
 */
function Mvvm(options) {
    this._data = options.data;
    this._proxy(this._data);
    observe(this._data);
    compile(document.querySelector(options.el),this);
}
Mvvm.prototype._proxy = function (data) {
    var vm = this;
    Object.keys(data).forEach(function (key) {
        Object.defineProperty(vm, key, {
            get: function () {
                return vm._data[key];
            },
            set: function (newVal) {
                vm._data[key] = newVal;
            }
        });
    });
};

function observe(data) {
    if(Object.prototype.toString.call(data) !== '[object Object]') return;

    Object.keys(data).forEach(function (key) {
        defineReactive(data, key);
    });
}
function defineReactive (data, key) {
    observe(data[key]);

    var _val = data[key];
    var _dep = new Dep();
    Object.defineProperty(data, key, {
        get: function () {
            if (Dep.target){
                _dep.addSub(Dep.target);
            }
            return _val
        },
        set: function (newVal) {
            if (newVal === _val) return;
            _val = newVal;
            _dep.notify();
        }
    });
}

function compile(el, vm) {
    compileNode(el, vm);
    var children = el.childNodes;
    if(children.length){
        Array.prototype.forEach.call(
            children,
            function (item) {
                compile(item, vm);
            }
        );
    }
}
function compileNode(node, vm) {
    if (node.nodeType === 3) {
        compileTextNode(vm, node)
    }
    else if(node.nodeType === 1){
        compileElementNode(vm, node)
    }
}
function compileTextNode(vm, node) {
    node.initText = node.initText || node.nodeValue;
    node.nodeValue = node.initText.replace(/{{([^{}]+?)}}/g, function (match, $1) {
        if ($1 && !node.watched) {
            new Watcher(vm, node, compileTextNode, $1);
        }
        return vm[$1];
    });
    node.watched = true;
}
function compileElementNode(vm, node) {
    Array.prototype.forEach.call(
        node.attributes,
        function (item) {
            if (item.nodeName === 'v-model') {
                var name = item.nodeValue;
                if(!node.watched){
                    new Watcher(vm, node, compileElementNode, name);
                }
                node.addEventListener('input', function (e) {
                    vm[name] = e.target.value;
                });

                node.value = vm[name];
            }
        }
    );
    node.watched = true;
}

function Watcher (vm, node, cb, name) {
    Dep.target = this;
    this.value = vm[name];
    Dep.target = null;
    this.vm = vm;
    this.node = node;
    this.cb = cb;
}
Watcher.prototype.update = function () {
    this.cb(this.vm,this.node);
};

function Dep() {
    this.subs = [];
}
Dep.target = null;
Dep.prototype.addSub =  function(sub) {
    this.subs.push(sub);
};
Dep.prototype.notify =  function() {
    this.subs.forEach(function(sub) {
        sub.update();
    });
};