
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    function attribute_to_object(attributes) {
        const result = {};
        for (const attribute of attributes) {
            result[attribute.name] = attribute.value;
        }
        return result;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set($$props) {
                if (this.$$set && !is_empty($$props)) {
                    this.$$.skip_bound = true;
                    this.$$set($$props);
                    this.$$.skip_bound = false;
                }
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }

    let wasm;

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    let cachegetUint8Memory0 = null;
    function getUint8Memory0() {
        if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }

    const heap = new Array(32).fill(undefined);

    heap.push(undefined, null, true, false);

    let heap_next = heap.length;

    function addHeapObject(obj) {
        if (heap_next === heap.length) heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];

        heap[idx] = obj;
        return idx;
    }

    function getObject(idx) { return heap[idx]; }

    let WASM_VECTOR_LEN = 0;

    let cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachegetInt32Memory0 = null;
    function getInt32Memory0() {
        if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachegetInt32Memory0;
    }

    function dropObject(idx) {
        if (idx < 36) return;
        heap[idx] = heap_next;
        heap_next = idx;
    }

    function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
    }

    function isLikeNone(x) {
        return x === undefined || x === null;
    }

    let cachegetFloat64Memory0 = null;
    function getFloat64Memory0() {
        if (cachegetFloat64Memory0 === null || cachegetFloat64Memory0.buffer !== wasm.memory.buffer) {
            cachegetFloat64Memory0 = new Float64Array(wasm.memory.buffer);
        }
        return cachegetFloat64Memory0;
    }

    function debugString(val) {
        // primitive types
        const type = typeof val;
        if (type == 'number' || type == 'boolean' || val == null) {
            return  `${val}`;
        }
        if (type == 'string') {
            return `"${val}"`;
        }
        if (type == 'symbol') {
            const description = val.description;
            if (description == null) {
                return 'Symbol';
            } else {
                return `Symbol(${description})`;
            }
        }
        if (type == 'function') {
            const name = val.name;
            if (typeof name == 'string' && name.length > 0) {
                return `Function(${name})`;
            } else {
                return 'Function';
            }
        }
        // objects
        if (Array.isArray(val)) {
            const length = val.length;
            let debug = '[';
            if (length > 0) {
                debug += debugString(val[0]);
            }
            for(let i = 1; i < length; i++) {
                debug += ', ' + debugString(val[i]);
            }
            debug += ']';
            return debug;
        }
        // Test for built-in
        const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
        let className;
        if (builtInMatches.length > 1) {
            className = builtInMatches[1];
        } else {
            // Failed to match the standard '[object ClassName]'
            return toString.call(val);
        }
        if (className == 'Object') {
            // we're a user defined class or Object
            // JSON.stringify avoids problems with cycles, and is generally much
            // easier than looping through ownProperties of `val`.
            try {
                return 'Object(' + JSON.stringify(val) + ')';
            } catch (_) {
                return 'Object';
            }
        }
        // errors
        if (val instanceof Error) {
            return `${val.name}: ${val.message}\n${val.stack}`;
        }
        // TODO we could test for more things here, like `Set`s and `Map`s.
        return className;
    }

    function makeMutClosure(arg0, arg1, dtor, f) {
        const state = { a: arg0, b: arg1, cnt: 1, dtor };
        const real = (...args) => {
            // First up with a closure we increment the internal reference
            // count. This ensures that the Rust closure environment won't
            // be deallocated while we're invoking it.
            state.cnt++;
            const a = state.a;
            state.a = 0;
            try {
                return f(a, state.b, ...args);
            } finally {
                if (--state.cnt === 0) {
                    wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

                } else {
                    state.a = a;
                }
            }
        };
        real.original = state;

        return real;
    }
    function __wbg_adapter_32(arg0, arg1, arg2) {
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3ac5b583b0bf3a8f(arg0, arg1, addHeapObject(arg2));
    }

    function _assertClass(instance, klass) {
        if (!(instance instanceof klass)) {
            throw new Error(`expected instance of ${klass.name}`);
        }
        return instance.ptr;
    }

    let stack_pointer = 32;

    function addBorrowedObject(obj) {
        if (stack_pointer == 1) throw new Error('out of js stack');
        heap[--stack_pointer] = obj;
        return stack_pointer;
    }
    /**
    * Publishes a DID Document to the Tangle, params looks like { node: "http://localhost:14265", network: "main" }
    * @param {any} doc
    * @param {any} params
    * @returns {any}
    */
    function publish(doc, params) {
        var ret = wasm.publish(addHeapObject(doc), addHeapObject(params));
        return takeObject(ret);
    }

    /**
    * Resolves the latest DID Document from the Tangle, params looks like { node: "http://localhost:14265", network: "main" }
    * @param {string} did
    * @param {any} params
    * @returns {any}
    */
    function resolve(did, params) {
        var ptr0 = passStringToWasm0(did, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.resolve(ptr0, len0, addHeapObject(params));
        return takeObject(ret);
    }

    /**
    * Validates credential with the DID Document from the Tangle, params looks like { node: "http://localhost:14265", network: "main" }
    * @param {string} data
    * @param {any} params
    * @returns {any}
    */
    function checkCredential(data, params) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.checkCredential(ptr0, len0, addHeapObject(params));
        return takeObject(ret);
    }

    /**
    * Validates credential with the DID Document from the Tangle, params looks like { node: "http://localhost:14265", network: "main" }
    * @param {string} data
    * @param {any} params
    * @returns {any}
    */
    function checkPresentation(data, params) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.checkPresentation(ptr0, len0, addHeapObject(params));
        return takeObject(ret);
    }

    /**
    */
    function start() {
        wasm.start();
    }

    /**
    * Initializes the console_error_panic_hook for better error messages
    * @returns {any}
    */
    function initialize() {
        var ret = wasm.initialize();
        return takeObject(ret);
    }

    function handleError(f) {
        return function () {
            try {
                return f.apply(this, arguments);

            } catch (e) {
                wasm.__wbindgen_exn_store(addHeapObject(e));
            }
        };
    }

    function getArrayU8FromWasm0(ptr, len) {
        return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
    }
    function __wbg_adapter_174(arg0, arg1, arg2, arg3) {
        wasm.wasm_bindgen__convert__closures__invoke2_mut__h58f39d7e933aee21(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
    }

    /**
    */
    class DID {

        static __wrap(ptr) {
            const obj = Object.create(DID.prototype);
            obj.ptr = ptr;

            return obj;
        }

        toJSON() {
            return {
                network: this.network,
                shard: this.shard,
                tag: this.tag,
                address: this.address,
            };
        }

        toString() {
            return JSON.stringify(this);
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_did_free(ptr);
        }
        /**
        * Creates a new `DID` from a `Key` object.
        * @param {Key} key
        * @param {string | undefined} network
        */
        constructor(key, network) {
            _assertClass(key, Key);
            var ptr0 = isLikeNone(network) ? 0 : passStringToWasm0(network, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ret = wasm.did_new(key.ptr, ptr0, len0);
            return DID.__wrap(ret);
        }
        /**
        * Creates a new `DID` from a base58-encoded public key.
        * @param {string} key
        * @param {string | undefined} network
        * @returns {DID}
        */
        static fromBase58Key(key, network) {
            var ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(network) ? 0 : passStringToWasm0(network, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.did_fromBase58Key(ptr0, len0, ptr1, len1);
            return DID.__wrap(ret);
        }
        /**
        * Creates a new `DID` from a base64-encoded public key.
        * @param {string} key
        * @param {string | undefined} network
        * @returns {DID}
        */
        static fromBase64Key(key, network) {
            var ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(network) ? 0 : passStringToWasm0(network, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.did_fromBase64Key(ptr0, len0, ptr1, len1);
            return DID.__wrap(ret);
        }
        /**
        * Parses a `DID` from the input string.
        * @param {string} input
        * @returns {DID}
        */
        static parse(input) {
            var ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ret = wasm.did_parse(ptr0, len0);
            return DID.__wrap(ret);
        }
        /**
        * Returns the IOTA tangle network of the `DID`.
        * @returns {string}
        */
        get network() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.did_network(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * Returns the IOTA tangle shard of the `DID` (if any).
        * @returns {string | undefined}
        */
        get shard() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.did_shard(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                let v0;
                if (r0 !== 0) {
                    v0 = getStringFromWasm0(r0, r1).slice();
                    wasm.__wbindgen_free(r0, r1 * 1);
                }
                return v0;
            } finally {
                wasm.__wbindgen_export_4.value += 16;
            }
        }
        /**
        * Returns the unique tag of the `DID`.
        * @returns {string}
        */
        get tag() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.did_tag(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * Returns the IOTA tangle address of the `DID`.
        * @returns {string}
        */
        get address() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.did_address(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * Returns the `DID` object as a string.
        * @returns {string}
        */
        toString() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.did_toString(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
    }
    /**
    */
    class Doc {

        static __wrap(ptr) {
            const obj = Object.create(Doc.prototype);
            obj.ptr = ptr;

            return obj;
        }

        toJSON() {
            return {
                did: this.did,
                id: this.id,
                authChain: this.authChain,
                diffChain: this.diffChain,
                proof: this.proof,
            };
        }

        toString() {
            return JSON.stringify(this);
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_doc_free(ptr);
        }
        /**
        * @param {PubKey} authentication
        */
        constructor(authentication) {
            _assertClass(authentication, PubKey);
            var ret = wasm.doc_new(authentication.ptr);
            return Doc.__wrap(ret);
        }
        /**
        * Generates a keypair and DID Document, supported key_type is "Ed25519VerificationKey2018"
        * @param {string} key_type
        * @param {string | undefined} network
        * @param {string | undefined} tag
        * @returns {NewDoc}
        */
        static generateRandom(key_type, network, tag) {
            var ptr0 = passStringToWasm0(key_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(network) ? 0 : passStringToWasm0(network, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ptr2 = isLikeNone(tag) ? 0 : passStringToWasm0(tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len2 = WASM_VECTOR_LEN;
            var ret = wasm.doc_generateRandom(ptr0, len0, ptr1, len1, ptr2, len2);
            return NewDoc.__wrap(ret);
        }
        /**
        * Generates an Ed25519 keypair and DID Document
        * @param {string | undefined} network
        * @param {string | undefined} tag
        * @returns {NewDoc}
        */
        static generateEd25519(network, tag) {
            var ptr0 = isLikeNone(network) ? 0 : passStringToWasm0(network, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(tag) ? 0 : passStringToWasm0(tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.doc_generateEd25519(ptr0, len0, ptr1, len1);
            return NewDoc.__wrap(ret);
        }
        /**
        * @returns {DID}
        */
        get did() {
            var ret = wasm.doc_did(this.ptr);
            return DID.__wrap(ret);
        }
        /**
        * @returns {string}
        */
        get id() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.doc_id(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * @returns {string}
        */
        get authChain() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.doc_authChain(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * @returns {string}
        */
        get diffChain() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.doc_diffChain(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * @returns {any}
        */
        get proof() {
            var ret = wasm.doc_proof(this.ptr);
            return takeObject(ret);
        }
        /**
        * @param {Key} key
        * @returns {any}
        */
        sign(key) {
            _assertClass(key, Key);
            var ret = wasm.doc_sign(this.ptr, key.ptr);
            return takeObject(ret);
        }
        /**
        * Verify the signature with the authentication_key
        * @returns {boolean}
        */
        verify() {
            var ret = wasm.doc_verify(this.ptr);
            return ret !== 0;
        }
        /**
        * Generate the difference between two DID Documents and sign it
        * @param {Doc} other
        * @param {Key} key
        * @returns {any}
        */
        diff(other, key) {
            _assertClass(other, Doc);
            _assertClass(key, Key);
            var ret = wasm.doc_diff(this.ptr, other.ptr, key.ptr);
            return takeObject(ret);
        }
        /**
        * Verify the signature in a diff with the authentication_key
        * @param {string} diff
        * @returns {boolean}
        */
        verifyDiff(diff) {
            var ptr0 = passStringToWasm0(diff, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ret = wasm.doc_verifyDiff(this.ptr, ptr0, len0);
            return ret !== 0;
        }
        /**
        * @param {DID} did
        * @param {string} url
        * @param {string} service_type
        */
        updateService(did, url, service_type) {
            _assertClass(did, DID);
            var ptr0 = did.ptr;
            did.ptr = 0;
            var ptr1 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ptr2 = passStringToWasm0(service_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len2 = WASM_VECTOR_LEN;
            wasm.doc_updateService(this.ptr, ptr0, ptr1, len1, ptr2, len2);
        }
        /**
        */
        clearServices() {
            wasm.doc_clearServices(this.ptr);
        }
        /**
        * @param {PubKey} public_key
        */
        updatePublicKey(public_key) {
            _assertClass(public_key, PubKey);
            wasm.doc_updatePublicKey(this.ptr, public_key.ptr);
        }
        /**
        */
        clearPublicKeys() {
            wasm.doc_clearPublicKeys(this.ptr);
        }
        /**
        * @param {PubKey} public_key
        */
        updateAuth(public_key) {
            _assertClass(public_key, PubKey);
            wasm.doc_updateAuth(this.ptr, public_key.ptr);
        }
        /**
        */
        clearAuth() {
            wasm.doc_clearAuth(this.ptr);
        }
        /**
        * @param {PubKey} public_key
        */
        updateAssert(public_key) {
            _assertClass(public_key, PubKey);
            wasm.doc_updateAssert(this.ptr, public_key.ptr);
        }
        /**
        */
        clearAssert() {
            wasm.doc_clearAssert(this.ptr);
        }
        /**
        * @param {PubKey} public_key
        */
        updateVerification(public_key) {
            _assertClass(public_key, PubKey);
            wasm.doc_updateVerification(this.ptr, public_key.ptr);
        }
        /**
        */
        clearVerification() {
            wasm.doc_clearVerification(this.ptr);
        }
        /**
        * @param {PubKey} public_key
        */
        updateDelegation(public_key) {
            _assertClass(public_key, PubKey);
            wasm.doc_updateDelegation(this.ptr, public_key.ptr);
        }
        /**
        */
        clearDelegation() {
            wasm.doc_clearDelegation(this.ptr);
        }
        /**
        * @param {PubKey} public_key
        */
        updateInvocation(public_key) {
            _assertClass(public_key, PubKey);
            wasm.doc_updateInvocation(this.ptr, public_key.ptr);
        }
        /**
        */
        clearInvocation() {
            wasm.doc_clearInvocation(this.ptr);
        }
        /**
        * @param {PubKey} public_key
        */
        updateAgreement(public_key) {
            _assertClass(public_key, PubKey);
            wasm.doc_updateAgreement(this.ptr, public_key.ptr);
        }
        /**
        */
        clearAgreement() {
            wasm.doc_clearAgreement(this.ptr);
        }
        /**
        */
        updateTime() {
            wasm.doc_updateTime(this.ptr);
        }
        /**
        * @param {any} ident
        * @param {string | undefined} scope
        * @returns {PubKey}
        */
        resolveKey(ident, scope) {
            var ptr0 = isLikeNone(scope) ? 0 : passStringToWasm0(scope, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ret = wasm.doc_resolveKey(this.ptr, addHeapObject(ident), ptr0, len0);
            return PubKey.__wrap(ret);
        }
        /**
        * Serializes a `Doc` object as a JSON object.
        * @returns {any}
        */
        toJSON() {
            var ret = wasm.doc_toJSON(this.ptr);
            return takeObject(ret);
        }
        /**
        * Deserializes a `Doc` object from a JSON object.
        * @param {any} json
        * @returns {Doc}
        */
        static fromJSON(json) {
            try {
                var ret = wasm.doc_fromJSON(addBorrowedObject(json));
                return Doc.__wrap(ret);
            } finally {
                heap[stack_pointer++] = undefined;
            }
        }
    }
    /**
    */
    class Key {

        static __wrap(ptr) {
            const obj = Object.create(Key.prototype);
            obj.ptr = ptr;

            return obj;
        }

        toJSON() {
            return {
                public: this.public,
                private: this.private,
            };
        }

        toString() {
            return JSON.stringify(this);
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_key_free(ptr);
        }
        /**
        * Generates a new `Key` object.
        * @param {string} key_type
        */
        constructor(key_type) {
            var ptr0 = passStringToWasm0(key_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ret = wasm.key_new(ptr0, len0);
            return Key.__wrap(ret);
        }
        /**
        * Generates a new `Key` object suitable for ed25519 signatures.
        * @returns {Key}
        */
        static generateEd25519() {
            var ret = wasm.key_generateEd25519();
            return Key.__wrap(ret);
        }
        /**
        * Parses a `Key` object from base58-encoded public/private keys.
        * @param {string} public_key
        * @param {string} private_key
        * @returns {Key}
        */
        static fromBase58(public_key, private_key) {
            var ptr0 = passStringToWasm0(public_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = passStringToWasm0(private_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.key_fromBase58(ptr0, len0, ptr1, len1);
            return Key.__wrap(ret);
        }
        /**
        * Parses a `Key` object from base64-encoded public/private keys.
        * @param {string} public_key
        * @param {string} private_key
        * @returns {Key}
        */
        static fromBase64(public_key, private_key) {
            var ptr0 = passStringToWasm0(public_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = passStringToWasm0(private_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.key_fromBase64(ptr0, len0, ptr1, len1);
            return Key.__wrap(ret);
        }
        /**
        * Returns the public key as a base58-encoded string.
        * @returns {string}
        */
        get public() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.key_public(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * Returns the private key as a base58-encoded string.
        * @returns {string}
        */
        get private() {
            try {
                const retptr = wasm.__wbindgen_export_4.value - 16;
                wasm.__wbindgen_export_4.value = retptr;
                wasm.key_private(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_4.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * Serializes a `Key` object as a JSON object.
        * @returns {any}
        */
        toJSON() {
            var ret = wasm.key_toJSON(this.ptr);
            return takeObject(ret);
        }
        /**
        * Deserializes a `Key` object from a JSON object.
        * @param {any} json
        * @returns {Key}
        */
        static fromJSON(json) {
            try {
                var ret = wasm.key_fromJSON(addBorrowedObject(json));
                return Key.__wrap(ret);
            } finally {
                heap[stack_pointer++] = undefined;
            }
        }
    }
    /**
    */
    class NewDoc {

        static __wrap(ptr) {
            const obj = Object.create(NewDoc.prototype);
            obj.ptr = ptr;

            return obj;
        }

        toJSON() {
            return {
                key: this.key,
                doc: this.doc,
            };
        }

        toString() {
            return JSON.stringify(this);
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_newdoc_free(ptr);
        }
        /**
        * @returns {Key}
        */
        get key() {
            var ret = wasm.newdoc_key(this.ptr);
            return Key.__wrap(ret);
        }
        /**
        * @returns {Doc}
        */
        get doc() {
            var ret = wasm.newdoc_doc(this.ptr);
            return Doc.__wrap(ret);
        }
    }
    /**
    */
    class PubKey {

        static __wrap(ptr) {
            const obj = Object.create(PubKey.prototype);
            obj.ptr = ptr;

            return obj;
        }

        toJSON() {
            return {
                id: this.id,
                controller: this.controller,
            };
        }

        toString() {
            return JSON.stringify(this);
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_pubkey_free(ptr);
        }
        /**
        * @param {DID} did
        * @param {string} key_type
        * @param {string} key_data
        * @param {string | undefined} tag
        */
        constructor(did, key_type, key_data, tag) {
            _assertClass(did, DID);
            var ptr0 = passStringToWasm0(key_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = passStringToWasm0(key_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ptr2 = isLikeNone(tag) ? 0 : passStringToWasm0(tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len2 = WASM_VECTOR_LEN;
            var ret = wasm.pubkey_new(did.ptr, ptr0, len0, ptr1, len1, ptr2, len2);
            return PubKey.__wrap(ret);
        }
        /**
        * Generates a new `PubKey` object suitable for ed25519 signatures.
        * @param {DID} did
        * @param {string} key_data
        * @param {string | undefined} tag
        * @returns {PubKey}
        */
        static generateEd25519(did, key_data, tag) {
            _assertClass(did, DID);
            var ptr0 = passStringToWasm0(key_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(tag) ? 0 : passStringToWasm0(tag, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.pubkey_generateEd25519(did.ptr, ptr0, len0, ptr1, len1);
            return PubKey.__wrap(ret);
        }
        /**
        * Returns the `id` DID of the `PubKey` object.
        * @returns {DID}
        */
        get id() {
            var ret = wasm.pubkey_id(this.ptr);
            return DID.__wrap(ret);
        }
        /**
        * Returns the `controller` DID of the `PubKey` object.
        * @returns {DID}
        */
        get controller() {
            var ret = wasm.pubkey_controller(this.ptr);
            return DID.__wrap(ret);
        }
        /**
        * Serializes a `PubKey` object as a JSON object.
        * @returns {any}
        */
        toJSON() {
            var ret = wasm.pubkey_toJSON(this.ptr);
            return takeObject(ret);
        }
        /**
        * Deserializes a `PubKey` object from a JSON object.
        * @param {any} json
        * @returns {PubKey}
        */
        static fromJSON(json) {
            try {
                var ret = wasm.pubkey_fromJSON(addBorrowedObject(json));
                return PubKey.__wrap(ret);
            } finally {
                heap[stack_pointer++] = undefined;
            }
        }
    }
    /**
    */
    class VerifiableCredential {

        static __wrap(ptr) {
            const obj = Object.create(VerifiableCredential.prototype);
            obj.ptr = ptr;

            return obj;
        }

        toJSON() {
            return {
            };
        }

        toString() {
            return JSON.stringify(this);
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_verifiablecredential_free(ptr);
        }
        /**
        * @param {Doc} issuer_doc
        * @param {Key} issuer_key
        * @param {any} subject_data
        * @param {string | undefined} credential_type
        * @param {string | undefined} credential_id
        */
        constructor(issuer_doc, issuer_key, subject_data, credential_type, credential_id) {
            _assertClass(issuer_doc, Doc);
            _assertClass(issuer_key, Key);
            var ptr0 = isLikeNone(credential_type) ? 0 : passStringToWasm0(credential_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(credential_id) ? 0 : passStringToWasm0(credential_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.verifiablecredential_new(issuer_doc.ptr, issuer_key.ptr, addHeapObject(subject_data), ptr0, len0, ptr1, len1);
            return VerifiableCredential.__wrap(ret);
        }
        /**
        * Signs the credential with the given issuer `Doc` and `Key` object.
        * @param {Doc} issuer
        * @param {Key} key
        */
        sign(issuer, key) {
            _assertClass(issuer, Doc);
            _assertClass(key, Key);
            wasm.verifiablecredential_sign(this.ptr, issuer.ptr, key.ptr);
        }
        /**
        * Verifies the credential signature against the issuer `Doc`.
        * @param {Doc} issuer
        * @returns {boolean}
        */
        verify(issuer) {
            _assertClass(issuer, Doc);
            var ret = wasm.verifiablecredential_verify(this.ptr, issuer.ptr);
            return ret !== 0;
        }
        /**
        * Serializes a `VerifiableCredential` object as a JSON object.
        * @returns {any}
        */
        toJSON() {
            var ret = wasm.verifiablecredential_toJSON(this.ptr);
            return takeObject(ret);
        }
        /**
        * Deserializes a `VerifiableCredential` object from a JSON object.
        * @param {any} json
        * @returns {VerifiableCredential}
        */
        static fromJSON(json) {
            try {
                var ret = wasm.verifiablecredential_fromJSON(addBorrowedObject(json));
                return VerifiableCredential.__wrap(ret);
            } finally {
                heap[stack_pointer++] = undefined;
            }
        }
    }
    /**
    */
    class VerifiablePresentation {

        static __wrap(ptr) {
            const obj = Object.create(VerifiablePresentation.prototype);
            obj.ptr = ptr;

            return obj;
        }

        toJSON() {
            return {
            };
        }

        toString() {
            return JSON.stringify(this);
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_verifiablepresentation_free(ptr);
        }
        /**
        * @param {Doc} holder_doc
        * @param {Key} holder_key
        * @param {any} credential_data
        * @param {string | undefined} presentation_type
        * @param {string | undefined} presentation_id
        */
        constructor(holder_doc, holder_key, credential_data, presentation_type, presentation_id) {
            _assertClass(holder_doc, Doc);
            _assertClass(holder_key, Key);
            var ptr0 = isLikeNone(presentation_type) ? 0 : passStringToWasm0(presentation_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(presentation_id) ? 0 : passStringToWasm0(presentation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            var ret = wasm.verifiablepresentation_new(holder_doc.ptr, holder_key.ptr, addHeapObject(credential_data), ptr0, len0, ptr1, len1);
            return VerifiablePresentation.__wrap(ret);
        }
        /**
        * Signs the credential with the given holder `Doc` and `Key` object.
        * @param {Doc} holder
        * @param {Key} key
        */
        sign(holder, key) {
            _assertClass(holder, Doc);
            _assertClass(key, Key);
            wasm.verifiablepresentation_sign(this.ptr, holder.ptr, key.ptr);
        }
        /**
        * Verifies the credential signature against the holder `Doc`.
        * @param {Doc} holder
        * @returns {boolean}
        */
        verify(holder) {
            _assertClass(holder, Doc);
            var ret = wasm.verifiablepresentation_verify(this.ptr, holder.ptr);
            return ret !== 0;
        }
        /**
        * Serializes a `VerifiablePresentation` object as a JSON object.
        * @returns {any}
        */
        toJSON() {
            var ret = wasm.verifiablepresentation_toJSON(this.ptr);
            return takeObject(ret);
        }
        /**
        * Deserializes a `VerifiablePresentation` object from a JSON object.
        * @param {any} json
        * @returns {VerifiablePresentation}
        */
        static fromJSON(json) {
            try {
                var ret = wasm.verifiablepresentation_fromJSON(addBorrowedObject(json));
                return VerifiablePresentation.__wrap(ret);
            } finally {
                heap[stack_pointer++] = undefined;
            }
        }
    }

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {

            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {

            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    async function initWasm(input) {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_json_parse = function(arg0, arg1) {
            var ret = JSON.parse(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_json_serialize = function(arg0, arg1) {
            const obj = getObject(arg1);
            var ret = JSON.stringify(obj === undefined ? null : obj);
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
            var ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
            takeObject(arg0);
        };
        imports.wbg.__wbindgen_cb_drop = function(arg0) {
            const obj = takeObject(arg0).original;
            if (obj.cnt-- == 1) {
                obj.a = 0;
                return true;
            }
            var ret = false;
            return ret;
        };
        imports.wbg.__wbindgen_is_object = function(arg0) {
            const val = getObject(arg0);
            var ret = typeof(val) === 'object' && val !== null;
            return ret;
        };
        imports.wbg.__wbg_new_59cb74e423758ede = function() {
            var ret = new Error();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_stack_558ba5917b466edd = function(arg0, arg1) {
            var ret = getObject(arg1).stack;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_error_4bb6c2a97407129a = function(arg0, arg1) {
            try {
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(arg0, arg1);
            }
        };
        imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
            var ret = getObject(arg0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_fetch_f5b2195afedb6a6b = function(arg0) {
            var ret = fetch(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_newwithu8arraysequenceandoptions_ae6479c676bebdcf = handleError(function(arg0, arg1) {
            var ret = new Blob(getObject(arg0), getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_instanceof_Response_328c03967a8e8902 = function(arg0) {
            var ret = getObject(arg0) instanceof Response;
            return ret;
        };
        imports.wbg.__wbg_url_67bbdafba8ff6e85 = function(arg0, arg1) {
            var ret = getObject(arg1).url;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_status_eb6dbb31556c329f = function(arg0) {
            var ret = getObject(arg0).status;
            return ret;
        };
        imports.wbg.__wbg_headers_c736e1fe38752cff = function(arg0) {
            var ret = getObject(arg0).headers;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_arrayBuffer_dc33ab7b8cdf0d63 = handleError(function(arg0) {
            var ret = getObject(arg0).arrayBuffer();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_newwithstrandinit_d1de1bfcd175e38a = handleError(function(arg0, arg1, arg2) {
            var ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_new_43d9cb1835f877ad = handleError(function() {
            var ret = new FormData();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_append_f76809690e4b2f3a = handleError(function(arg0, arg1, arg2, arg3) {
            getObject(arg0).append(getStringFromWasm0(arg1, arg2), getObject(arg3));
        });
        imports.wbg.__wbg_append_eaa42b75460769af = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5) {
            getObject(arg0).append(getStringFromWasm0(arg1, arg2), getObject(arg3), getStringFromWasm0(arg4, arg5));
        });
        imports.wbg.__wbg_new_8469604d5504c189 = handleError(function() {
            var ret = new Headers();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_append_cc6fe0273163a31b = handleError(function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        });
        imports.wbg.__wbg_getRandomValues_3ac1b33c90b52596 = function(arg0, arg1, arg2) {
            getObject(arg0).getRandomValues(getArrayU8FromWasm0(arg1, arg2));
        };
        imports.wbg.__wbg_randomFillSync_6f956029658662ec = function(arg0, arg1, arg2) {
            getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
        };
        imports.wbg.__wbg_self_1c83eb4471d9eb9b = handleError(function() {
            var ret = self.self;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_static_accessor_MODULE_abf5ae284bffdf45 = function() {
            var ret = module;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_require_5b2b5b594d809d9f = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_crypto_c12f14e810edcaa2 = function(arg0) {
            var ret = getObject(arg0).crypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_msCrypto_679be765111ba775 = function(arg0) {
            var ret = getObject(arg0).msCrypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_undefined = function(arg0) {
            var ret = getObject(arg0) === undefined;
            return ret;
        };
        imports.wbg.__wbg_getRandomValues_05a60bf171bfc2be = function(arg0) {
            var ret = getObject(arg0).getRandomValues;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_function = function(arg0) {
            var ret = typeof(getObject(arg0)) === 'function';
            return ret;
        };
        imports.wbg.__wbg_next_edda7e0003e5daf9 = function(arg0) {
            var ret = getObject(arg0).next;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_next_2966fa909601a075 = handleError(function(arg0) {
            var ret = getObject(arg0).next();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_done_037d0a173aef1834 = function(arg0) {
            var ret = getObject(arg0).done;
            return ret;
        };
        imports.wbg.__wbg_value_e60bbfb7d52af62f = function(arg0) {
            var ret = getObject(arg0).value;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_iterator_09191f8878ea9877 = function() {
            var ret = Symbol.iterator;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_get_0e3f2950cdf758ae = handleError(function(arg0, arg1) {
            var ret = Reflect.get(getObject(arg0), getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_call_8e95613cc6524977 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).call(getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_call_d713ea0274dfc6d2 = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_getTime_29addd71c7089c47 = function(arg0) {
            var ret = getObject(arg0).getTime();
            return ret;
        };
        imports.wbg.__wbg_new0_a3af66503e735141 = function() {
            var ret = new Date();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_3e06d4f36713e4cb = function() {
            var ret = new Object();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_d0c63652ab4d825c = function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return __wbg_adapter_174(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                var ret = new Promise(cb0);
                return addHeapObject(ret);
            } finally {
                state0.a = state0.b = 0;
            }
        };
        imports.wbg.__wbg_resolve_2529512c3bb73938 = function(arg0) {
            var ret = Promise.resolve(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_then_4a7a614abbbe6d81 = function(arg0, arg1) {
            var ret = getObject(arg0).then(getObject(arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_then_3b7ac098cfda2fa5 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_buffer_49131c283a06686f = function(arg0) {
            var ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_newwithbyteoffsetandlength_c0f38401daad5a22 = function(arg0, arg1, arg2) {
            var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_length_2b13641a9d906653 = function(arg0) {
            var ret = getObject(arg0).length;
            return ret;
        };
        imports.wbg.__wbg_new_9b295d24cf1d706f = function(arg0) {
            var ret = new Uint8Array(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_3bb960a9975f3cd2 = function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        };
        imports.wbg.__wbg_set_304f2ec1a3ab3b79 = handleError(function(arg0, arg1, arg2) {
            var ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
            return ret;
        });
        imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
            const obj = getObject(arg1);
            var ret = typeof(obj) === 'number' ? obj : undefined;
            getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
            getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
        };
        imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
            const obj = getObject(arg1);
            var ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
            var ret = debugString(getObject(arg1));
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbindgen_rethrow = function(arg0) {
            throw takeObject(arg0);
        };
        imports.wbg.__wbindgen_memory = function() {
            var ret = wasm.memory;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper2270 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 462, __wbg_adapter_32);
            return addHeapObject(ret);
        };

        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }

        const { instance, module } = await load(await input, imports);

        wasm = instance.exports;
        initWasm.__wbindgen_wasm_module = module;
        wasm.__wbindgen_start();
        return wasm;
    }

    let __initializedIotaWasm = false;

    function init$1(path) {
        if (__initializedIotaWasm) {
            return Promise.resolve(wasm)
        }
        return initWasm(path || 'iota_identity_wasm_bg.wasm').then(() => {
            __initializedIotaWasm = true;
            return wasm
        })
    }

    var lib = /*#__PURE__*/Object.freeze({
        __proto__: null,
        publish: publish,
        resolve: resolve,
        checkCredential: checkCredential,
        checkPresentation: checkPresentation,
        start: start,
        initialize: initialize,
        DID: DID,
        Doc: Doc,
        Key: Key,
        NewDoc: NewDoc,
        PubKey: PubKey,
        VerifiableCredential: VerifiableCredential,
        VerifiablePresentation: VerifiablePresentation,
        init: init$1
    });

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src/components/create-did/create-did.svelte generated by Svelte v3.32.1 */

    const { console: console_1 } = globals;
    const file = "src/components/create-did/create-did.svelte";

    // (73:2) {#if !state.loading}
    function create_if_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Create DID";
    			add_location(button, file, 73, 4, 1769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*create_did*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(73:2) {#if !state.loading}",
    		ctx
    	});

    	return block;
    }

    // (77:2) {#if state.loading}
    function create_if_block(ctx) {
    	let p0;
    	let t1;
    	let pre0;
    	let t2;
    	let t3;
    	let p1;
    	let t5;
    	let pre1;
    	let t6;
    	let t7;
    	let p2;
    	let t9;
    	let pre2;
    	let t10;
    	let t11;
    	let t12;
    	let if_block1_anchor;
    	let if_block0 = !/*result*/ ctx[4] && create_if_block_2(ctx);
    	let if_block1 = /*result*/ ctx[4] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "alice_keypair:";
    			t1 = space();
    			pre0 = element("pre");
    			t2 = text(/*alice_keypair*/ ctx[1]);
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "alice_did:";
    			t5 = space();
    			pre1 = element("pre");
    			t6 = text(/*alice_did*/ ctx[2]);
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "alice_doc:";
    			t9 = space();
    			pre2 = element("pre");
    			t10 = text(/*alice_doc*/ ctx[3]);
    			t11 = space();
    			if (if_block0) if_block0.c();
    			t12 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			add_location(p0, file, 77, 4, 1854);
    			add_location(pre0, file, 78, 4, 1880);
    			add_location(p1, file, 79, 4, 1911);
    			add_location(pre1, file, 80, 4, 1933);
    			add_location(p2, file, 81, 4, 1960);
    			add_location(pre2, file, 82, 4, 1982);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, pre0, anchor);
    			append_dev(pre0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, pre1, anchor);
    			append_dev(pre1, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, pre2, anchor);
    			append_dev(pre2, t10);
    			insert_dev(target, t11, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t12, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*alice_keypair*/ 2) set_data_dev(t2, /*alice_keypair*/ ctx[1]);
    			if (dirty & /*alice_did*/ 4) set_data_dev(t6, /*alice_did*/ ctx[2]);
    			if (dirty & /*alice_doc*/ 8) set_data_dev(t10, /*alice_doc*/ ctx[3]);

    			if (!/*result*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t12.parentNode, t12);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*result*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(pre2);
    			if (detaching) detach_dev(t11);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t12);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(77:2) {#if state.loading}",
    		ctx
    	});

    	return block;
    }

    // (85:4) {#if !result}
    function create_if_block_2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Publish DIDDoc";
    			add_location(button, file, 85, 6, 2030);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*publish*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(85:4) {#if !result}",
    		ctx
    	});

    	return block;
    }

    // (88:4) {#if result}
    function create_if_block_1(ctx) {
    	let p;
    	let t1;
    	let pre;
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Document Published!";
    			t1 = space();
    			pre = element("pre");
    			t2 = text(/*result*/ ctx[4]);
    			add_location(p, file, 88, 6, 2114);
    			add_location(pre, file, 89, 6, 2147);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*result*/ 16) set_data_dev(t2, /*result*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(88:4) {#if result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t;
    	let if_block0 = !/*state*/ ctx[0].loading && create_if_block_3(ctx);
    	let if_block1 = /*state*/ ctx[0].loading && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			this.c = noop;
    			add_location(div, file, 71, 0, 1736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*state*/ ctx[0].loading) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*state*/ ctx[0].loading) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("create-did", slots, []);
    	console.log("hello create!!!");
    	let state = { loading: false };
    	let alice_keypair = {};
    	let alice_did = {};
    	let alice_doc = {};
    	let result = false;

    	const IOTA_CLIENT_CONFIG = {
    		network: "main",
    		node: "https://nodes.thetangle.org:443"
    	};

    	async function create_did() {
    		$$invalidate(0, state.loading = !state.loading, state);
    		await init$1();
    		console.log(lib);

    		// Generate Keypairs
    		$$invalidate(1, alice_keypair = Key.generateEd25519("main"));

    		console.log("alice_keypair: ", alice_keypair);

    		// Create the DID
    		$$invalidate(2, alice_did = new DID(alice_keypair, "main"));

    		console.log("alice_did: ", alice_did);

    		// Create the DID Document
    		$$invalidate(3, alice_doc = new Doc(PubKey.generateEd25519(alice_did, alice_keypair.public)));

    		console.log("alice_doc: ", alice_doc);
    		console.log("sending...");
    	}

    	async function publish$1() {
    		console.log("Publishing to the tangle...");
    		console.log(alice_did);
    		console.log("alice_doc: ", alice_doc);

    		// Sign all DID documents
    		alice_doc.sign(alice_keypair);

    		console.log("Signed Doc: ", alice_doc.verify());

    		// Publish the DID document
    		$$invalidate(4, result = await publish(alice_doc.toJSON(), IOTA_CLIENT_CONFIG));

    		console.log("Publish Result: https://explorer.iota.org/mainnet/transaction/" + result);
    	}

    	let _user = {
    		key: alice_keypair,
    		did: alice_did,
    		doc: alice_doc
    	};

    	const store = writable(localStorage.setItem("user", JSON.stringify(_user)));
    	const user = writable(_user);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<create-did> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		identity: lib,
    		writable,
    		state,
    		alice_keypair,
    		alice_did,
    		alice_doc,
    		result,
    		IOTA_CLIENT_CONFIG,
    		create_did,
    		publish: publish$1,
    		_user,
    		store,
    		user
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("alice_keypair" in $$props) $$invalidate(1, alice_keypair = $$props.alice_keypair);
    		if ("alice_did" in $$props) $$invalidate(2, alice_did = $$props.alice_did);
    		if ("alice_doc" in $$props) $$invalidate(3, alice_doc = $$props.alice_doc);
    		if ("result" in $$props) $$invalidate(4, result = $$props.result);
    		if ("_user" in $$props) _user = $$props._user;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [state, alice_keypair, alice_did, alice_doc, result, create_did, publish$1, user];
    }

    class Create_did extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes)
    			},
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{ user: 7 }
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["user"];
    	}

    	get user() {
    		return this.$$.ctx[7];
    	}

    	set user(value) {
    		throw new Error("<create-did>: Cannot set read-only property 'user'");
    	}
    }

    customElements.define("create-did", Create_did);

    /* src/components/create-vc/create-vc.svelte generated by Svelte v3.32.1 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/components/create-vc/create-vc.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Create VC";
    			this.c = noop;
    			add_location(button, file$1, 40, 4, 913);
    			add_location(div, file$1, 39, 0, 903);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*create_vc*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("create-vc", slots, []);
    	console.log("hello create-vc");

    	const IOTA_CLIENT_CONFIG = {
    		network: "main",
    		node: "https://nodes.thetangle.org:443"
    	};

    	let state = { loading: false };

    	async function create_vc() {
    		state.loading = !state.loading;
    		await init$1();
    		console.log(lib);

    		let credentialSubject = {
    			id: "0001",
    			name: "Alice",
    			degree: {
    				name: "Credential of a Company",
    				type: "CompanyCredential"
    			}
    		};

    		// Issue a signed `CompanyCredential` credential to Alice
    		let vc = new VerifiableCredential(alice_doc, alice_key, credentialSubject, "CompanyCredential", "http://company.com/credentials/1337");

    		console.log("Verifiable Credential: ", JSON.stringify(vc));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<create-vc> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		identity: lib,
    		IOTA_CLIENT_CONFIG,
    		state,
    		create_vc
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) state = $$props.state;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [create_vc];
    }

    class Create_vc extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes)
    			},
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("create-vc", Create_vc);

    /* src/components/resolver/resolver.svelte generated by Svelte v3.32.1 */

    const { console: console_1$2 } = globals;
    const file$2 = "src/components/resolver/resolver.svelte";

    // (106:4) {#if !visible}
    function create_if_block_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Add node";
    			add_location(button, file$2, 105, 18, 2741);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", visibility, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(106:4) {#if !visible}",
    		ctx
    	});

    	return block;
    }

    // (107:4) {#if visible}
    function create_if_block$1(ctx) {
    	let div0;
    	let input0;
    	let t0;
    	let div1;
    	let label0;
    	let input1;
    	let t1;
    	let t2;
    	let label1;
    	let input2;
    	let t3;
    	let t4;
    	let label2;
    	let input3;
    	let t5;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div1 = element("div");
    			label0 = element("label");
    			input1 = element("input");
    			t1 = text("\n          Mainnet");
    			t2 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t3 = text("\n          Comnet");
    			t4 = space();
    			label2 = element("label");
    			input3 = element("input");
    			t5 = text("\n          Devnet");
    			t6 = space();
    			button = element("button");
    			button.textContent = "Add node";
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "NodeURL");
    			add_location(input0, file$2, 107, 11, 2823);
    			add_location(div0, file$2, 107, 6, 2818);
    			attr_dev(input1, "type", "radio");
    			input1.__value = "main";
    			input1.value = input1.__value;
    			/*$$binding_groups*/ ctx[2][0].push(input1);
    			add_location(input1, file$2, 110, 10, 2929);
    			add_location(label0, file$2, 109, 8, 2911);
    			attr_dev(input2, "type", "radio");
    			input2.__value = "com";
    			input2.value = input2.__value;
    			/*$$binding_groups*/ ctx[2][0].push(input2);
    			add_location(input2, file$2, 114, 10, 3055);
    			add_location(label1, file$2, 113, 8, 3037);
    			attr_dev(input3, "type", "radio");
    			input3.__value = "dev";
    			input3.value = input3.__value;
    			/*$$binding_groups*/ ctx[2][0].push(input3);
    			add_location(input3, file$2, 118, 10, 3179);
    			add_location(label2, file$2, 117, 8, 3161);
    			add_location(div1, file$2, 108, 6, 2897);
    			add_location(button, file$2, 122, 6, 3296);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input0);
    			set_input_value(input0, node);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label0);
    			append_dev(label0, input1);
    			input1.checked = input1.__value === networkoption;
    			append_dev(label0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, label1);
    			append_dev(label1, input2);
    			input2.checked = input2.__value === networkoption;
    			append_dev(label1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, label2);
    			append_dev(label2, input3);
    			input3.checked = input3.__value === networkoption;
    			append_dev(label2, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[0]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[1]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[3]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[4]),
    					listen_dev(button, "click", addNode, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*node*/ 0 && input0.value !== node) {
    				set_input_value(input0, node);
    			}

    			if (dirty & /*networkoption*/ 0) {
    				input1.checked = input1.__value === networkoption;
    			}

    			if (dirty & /*networkoption*/ 0) {
    				input2.checked = input2.__value === networkoption;
    			}

    			if (dirty & /*networkoption*/ 0) {
    				input3.checked = input3.__value === networkoption;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			/*$$binding_groups*/ ctx[2][0].splice(/*$$binding_groups*/ ctx[2][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[2][0].splice(/*$$binding_groups*/ ctx[2][0].indexOf(input2), 1);
    			/*$$binding_groups*/ ctx[2][0].splice(/*$$binding_groups*/ ctx[2][0].indexOf(input3), 1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(107:4) {#if visible}",
    		ctx
    	});

    	return block;
    }

    // (137:2) {:catch error}
    function create_catch_block(ctx) {
    	let t0_value = console.log(/*error*/ ctx[7]) + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*error*/ ctx[7] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			set_style(p, "color", "red");
    			add_location(p, file$2, 138, 4, 3771);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(137:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (134:2) {:then resolved_doc}
    function create_then_block(ctx) {
    	let p;
    	let t1;
    	let pre;
    	let t2_value = JSON.stringify(/*resolved_doc*/ ctx[6], null, 1) + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Resolved document:";
    			t1 = space();
    			pre = element("pre");
    			t2 = text(t2_value);
    			add_location(p, file$2, 134, 4, 3644);
    			add_location(pre, file$2, 135, 4, 3674);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(134:2) {:then resolved_doc}",
    		ctx
    	});

    	return block;
    }

    // (132:21)      <p>Resolving...</p>   {:then resolved_doc}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Resolving...";
    			add_location(p, file$2, 132, 4, 3597);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(132:21)      <p>Resolving...</p>   {:then resolved_doc}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let div1;
    	let t7;
    	let a;
    	let t8;
    	let t9;
    	let mounted;
    	let dispose;
    	let if_block0 = !visible && create_if_block_1$1(ctx);
    	let if_block1 = visible && create_if_block$1(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 6,
    		error: 7
    	};

    	handle_promise(resolveDID, info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Resolve DID";
    			t4 = space();
    			div1 = element("div");
    			div1.textContent = `Network: ${network}`;
    			t7 = space();
    			a = element("a");
    			t8 = text("Explorerlink");
    			t9 = space();
    			info.block.c();
    			this.c = noop;
    			add_location(div0, file$2, 104, 2, 2717);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter a DID");
    			add_location(input, file$2, 126, 2, 3363);
    			add_location(button, file$2, 127, 2, 3430);
    			add_location(div1, file$2, 128, 2, 3484);
    			attr_dev(a, "href", addressUrl);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$2, 129, 2, 3516);
    			add_location(main, file$2, 103, 0, 2708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(main, t1);
    			append_dev(main, input);
    			set_input_value(input, did);
    			append_dev(main, t2);
    			append_dev(main, button);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			append_dev(main, t7);
    			append_dev(main, a);
    			append_dev(a, t8);
    			append_dev(main, t9);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(button, "click", handleClick, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (!visible) if_block0.p(ctx, dirty);
    			if (visible) if_block1.p(ctx, dirty);

    			if (dirty & /*did*/ 0 && input.value !== did) {
    				set_input_value(input, did);
    			}

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[6] = child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let node;

    let nodes = [
    	// Mainnet
    	{
    		network: "main",
    		url: "https://nodes.thetangle.org:443"
    	},
    	{
    		network: "main",
    		url: "https://nodes.iota.org:443"
    	},
    	{
    		network: "main",
    		url: "https://iotanode.us:14267"
    	},
    	{
    		network: "main",
    		url: "https://gewirr.com:14267"
    	},
    	{
    		network: "main",
    		url: "https://hornet.beeiota.host:14265"
    	},
    	// Comnet
    	{
    		network: "com",
    		url: "https://nodes.comnet.thetangle.org:443"
    	},
    	// Devnet
    	{
    		network: "dev",
    		url: "https://nodes.devnet.iota.org:443"
    	}
    ];

    let did = "did:iota:3tukwL7jMP5cfxtUB8je7wAUkaPSAgBMeGnY6YBivpHf";
    let network = "";
    let networkoption = "main";
    let resolveDID = "";
    let addressUrl = "https://explorer.iota.org/mainnet/";
    let visible = false;

    function visibility() {
    	visible = !visible;
    }

    async function resolve_did() {
    	await init$1();

    	//parse did to get the network
    	let parsed_did = DID.parse(did);

    	console.log(parsed_did);

    	switch (parsed_did.network) {
    		case "main":
    			network = "Mainnet";
    			addressUrl = "https://explorer.iota.org/mainnet/address/" + parsed_did.address;
    			break;
    		case "com":
    			network = "Comnet";
    			addressUrl = "https://comnet.thetangle.org/address/" + parsed_did.address;
    			break;
    		case "dev":
    			addressUrl = "https://explorer.iota.org/devnet/address/" + parsed_did.address;
    			network = "Devnet";
    	}

    	let networkNodes = nodes.filter(node => node.network == parsed_did.network);
    	let doc = "";

    	for (let t = 0; t < 10; t++) {
    		if (doc != "" && typeof doc != "undefined") {
    			return doc;
    		}

    		doc = await resolve(did, {
    			nodes: networkNodes.map(node => node.url),
    			network: parsed_did.network
    		}).catch(e => console.log(e));
    	}

    	return "No document found. Maybe the transaction was deleted on this node?";
    }

    function handleClick() {
    	resolveDID = resolve_did();
    }

    function addNode() {
    	nodes.push({ network: networkoption, url: node });
    	visibility();
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("did-resolver", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<did-resolver> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_input_handler() {
    		node = this.value;
    	}

    	function input1_change_handler() {
    		networkoption = this.__value;
    	}

    	function input2_change_handler() {
    		networkoption = this.__value;
    	}

    	function input3_change_handler() {
    		networkoption = this.__value;
    	}

    	function input_input_handler() {
    		did = this.value;
    	}

    	$$self.$capture_state = () => ({
    		lib,
    		node,
    		nodes,
    		did,
    		network,
    		networkoption,
    		resolveDID,
    		addressUrl,
    		visible,
    		visibility,
    		resolve_did,
    		handleClick,
    		addNode
    	});

    	return [
    		input0_input_handler,
    		input1_change_handler,
    		$$binding_groups,
    		input2_change_handler,
    		input3_change_handler,
    		input_input_handler
    	];
    }

    class Resolver extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>main{text-align:center;padding:1em;margin:0 auto}pre{display:inline-block;text-align:left;max-width:50em;width:630px;word-wrap:break-word}input[type="text"]{width:35em}@media(min-width: 640px){main{max-width:none}}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes)
    			},
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("did-resolver", Resolver);

    /* src/apps/create-vc-demo/create-vc-demo.svelte generated by Svelte v3.32.1 */

    const { console: console_1$3 } = globals;
    const file$3 = "src/apps/create-vc-demo/create-vc-demo.svelte";

    // (39:2) {:else}
    function create_else_block(ctx) {
    	let pre;
    	let t_value = { _user: /*_user*/ ctx[0] } + "";
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(t_value);
    			add_location(pre, file$3, 39, 4, 838);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*_user*/ 1 && t_value !== (t_value = { _user: /*_user*/ ctx[0] } + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(39:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:2) {#if state.loading}
    function create_if_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(37:2) {#if state.loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let t2;
    	let button;
    	let t4;
    	let createdid;
    	let updating_user;
    	let t5;
    	let createvc;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[1].loading) return create_if_block$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function createdid_user_binding(value) {
    		/*createdid_user_binding*/ ctx[3].call(null, value);
    	}

    	let createdid_props = {};

    	if (/*_user*/ ctx[0] !== void 0) {
    		createdid_props.user = /*_user*/ ctx[0];
    	}

    	createdid = new Create_did({ props: createdid_props, $$inline: true });
    	binding_callbacks.push(() => bind(createdid, "user", createdid_user_binding));
    	createvc = new Create_vc({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Demo";
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			button = element("button");
    			button.textContent = "Test";
    			t4 = space();
    			create_component(createdid.$$.fragment);
    			t5 = space();
    			create_component(createvc.$$.fragment);
    			this.c = noop;
    			add_location(h1, file$3, 34, 2, 772);
    			add_location(button, file$3, 41, 4, 873);
    			add_location(div, file$3, 33, 0, 764);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			if_block.m(div, null);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(div, t4);
    			mount_component(createdid, div, null);
    			append_dev(div, t5);
    			mount_component(createvc, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*test*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			}

    			const createdid_changes = {};

    			if (!updating_user && dirty & /*_user*/ 1) {
    				updating_user = true;
    				createdid_changes.user = /*_user*/ ctx[0];
    				add_flush_callback(() => updating_user = false);
    			}

    			createdid.$set(createdid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(createdid.$$.fragment, local);
    			transition_in(createvc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(createdid.$$.fragment, local);
    			transition_out(createvc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			destroy_component(createdid);
    			destroy_component(createvc);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("create-vc-demo", slots, []);
    	console.log("hello create-vc-demo");
    	const store = writable(localStorage.getItem("user") || "");
    	let _user;
    	store.subscribe(value => $$invalidate(0, _user = JSON.parse(value)));
    	let state = { loading: false };
    	console.log("User: ");
    	console.log(_user);

    	onMount(async () => {
    		setTimeout(
    			() => {
    				console.log("loaded!", state);
    				$$invalidate(1, state.loading = false, state);
    				console.log("loaded!", state);
    			},
    			1000
    		);
    	});

    	async function test() {
    		console.log("user");
    		console.log(_user);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<create-vc-demo> was created with unknown prop '${key}'`);
    	});

    	function createdid_user_binding(value) {
    		_user = value;
    		$$invalidate(0, _user);
    	}

    	$$self.$capture_state = () => ({
    		CreateDID: Create_did,
    		CreateVC: Create_vc,
    		onMount,
    		writable,
    		store,
    		_user,
    		state,
    		test
    	});

    	$$self.$inject_state = $$props => {
    		if ("_user" in $$props) $$invalidate(0, _user = $$props._user);
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [_user, state, test, createdid_user_binding];
    }

    class Create_vc_demo extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes)
    			},
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("create-vc-demo", Create_vc_demo);

    /* src/App.svelte generated by Svelte v3.32.1 */

    const { console: console_1$4 } = globals;
    const file$4 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let createvcdemo;
    	let t0;
    	let createdid;
    	let t1;
    	let didresolver0;
    	let t2;
    	let didresolver1;
    	let current;
    	createvcdemo = new Create_vc_demo({ $$inline: true });
    	createdid = new Create_did({ $$inline: true });
    	didresolver0 = new Resolver({ $$inline: true });
    	didresolver1 = new Resolver({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(createvcdemo.$$.fragment);
    			t0 = space();
    			create_component(createdid.$$.fragment);
    			t1 = space();
    			create_component(didresolver0.$$.fragment);
    			t2 = space();
    			create_component(didresolver1.$$.fragment);
    			this.c = noop;
    			attr_dev(div, "class", "wrapper");
    			add_location(div, file$4, 21, 0, 442);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(createvcdemo, div, null);
    			append_dev(div, t0);
    			mount_component(createdid, div, null);
    			append_dev(div, t1);
    			mount_component(didresolver0, div, null);
    			append_dev(div, t2);
    			mount_component(didresolver1, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(createvcdemo.$$.fragment, local);
    			transition_in(createdid.$$.fragment, local);
    			transition_in(didresolver0.$$.fragment, local);
    			transition_in(didresolver1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(createvcdemo.$$.fragment, local);
    			transition_out(createdid.$$.fragment, local);
    			transition_out(didresolver0.$$.fragment, local);
    			transition_out(didresolver1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(createvcdemo);
    			destroy_component(createdid);
    			destroy_component(didresolver0);
    			destroy_component(didresolver1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("undefined", slots, []);
    	console.log("hello app");
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<undefined> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		CreateDID: Create_did,
    		CreateVC: Create_vc,
    		DIDResolver: Resolver,
    		CreateVCDemo: Create_vc_demo
    	});

    	return [];
    }

    class App extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>:global(body){padding:0 !important;margin:0 !important}.wrapper{width:100vw;height:100vh;display:flex;align-items:center}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes)
    			},
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    const app = new App({
        target: document.querySelector('#target'),
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
