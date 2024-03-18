
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
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
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
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
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
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
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
        if (text.data === data)
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Component\Box.svelte generated by Svelte v3.59.2 */

    const file$5 = "src\\Component\\Box.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "box svelte-nc6dok");
    			toggle_class(div, "dark", /*darkMode*/ ctx[0]);
    			add_location(div, file$5, 4, 0, 49);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*darkMode*/ 1) {
    				toggle_class(div, "dark", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Box', slots, ['default']);
    	let { darkMode } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console.warn("<Box> was created without expected prop 'darkMode'");
    		}
    	});

    	const writable_props = ['darkMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ darkMode });

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkMode, $$scope, slots];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Stages\AddBet.svelte generated by Svelte v3.59.2 */
    const file$4 = "src\\Stages\\AddBet.svelte";

    function create_fragment$4(ctx) {
    	let form;
    	let h2;
    	let t1;
    	let input0;
    	let br0;
    	let t2;
    	let input1;
    	let br1;
    	let t3;
    	let label;
    	let t5;
    	let select;
    	let option0;
    	let option1;
    	let t8;
    	let hr;
    	let t9;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			h2 = element("h2");
    			h2.textContent = "Nova aposta";
    			t1 = space();
    			input0 = element("input");
    			br0 = element("br");
    			t2 = space();
    			input1 = element("input");
    			br1 = element("br");
    			t3 = space();
    			label = element("label");
    			label.textContent = "Tipo de aposta:";
    			t5 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Aposta automática";
    			option1 = element("option");
    			option1.textContent = "Aposta manual";
    			t8 = space();
    			hr = element("hr");
    			t9 = space();
    			button = element("button");
    			button.textContent = "Confirmar dados";
    			attr_dev(h2, "class", "svelte-15o6ydo");
    			add_location(h2, file$4, 24, 4, 493);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Nome");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-15o6ydo");
    			toggle_class(input0, "dark", /*darkMode*/ ctx[0]);
    			add_location(input0, file$4, 25, 4, 519);
    			add_location(br0, file$4, 25, 91, 606);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "pattern", "[0-9]");
    			attr_dev(input1, "minlength", "11");
    			attr_dev(input1, "placeholder", "CPF");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-15o6ydo");
    			toggle_class(input1, "dark", /*darkMode*/ ctx[0]);
    			add_location(input1, file$4, 26, 4, 616);
    			add_location(br1, file$4, 26, 122, 734);
    			add_location(label, file$4, 28, 4, 806);
    			option0.__value = "auto";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 30, 8, 903);
    			option1.__value = "manual";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 31, 8, 960);
    			attr_dev(select, "class", "svelte-15o6ydo");
    			if (/*betType*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
    			toggle_class(select, "dark", /*darkMode*/ ctx[0]);
    			add_location(select, file$4, 29, 4, 842);
    			attr_dev(hr, "class", "svelte-15o6ydo");
    			add_location(hr, file$4, 33, 4, 1026);
    			attr_dev(button, "class", "svelte-15o6ydo");
    			toggle_class(button, "dark", /*darkMode*/ ctx[0]);
    			add_location(button, file$4, 34, 4, 1036);
    			add_location(form, file$4, 23, 0, 441);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h2);
    			append_dev(form, t1);
    			append_dev(form, input0);
    			set_input_value(input0, /*name*/ ctx[1]);
    			append_dev(form, br0);
    			append_dev(form, t2);
    			append_dev(form, input1);
    			set_input_value(input1, /*cpf*/ ctx[2]);
    			append_dev(form, br1);
    			append_dev(form, t3);
    			append_dev(form, label);
    			append_dev(form, t5);
    			append_dev(form, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*betType*/ ctx[3], true);
    			append_dev(form, t8);
    			append_dev(form, hr);
    			append_dev(form, t9);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[8]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[4]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 2 && input0.value !== /*name*/ ctx[1]) {
    				set_input_value(input0, /*name*/ ctx[1]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input0, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*cpf*/ 4 && to_number(input1.value) !== /*cpf*/ ctx[2]) {
    				set_input_value(input1, /*cpf*/ ctx[2]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input1, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*betType*/ 8) {
    				select_option(select, /*betType*/ ctx[3]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(select, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('AddBet', slots, []);
    	let { darkMode, generalId } = $$props;
    	let dispatch = createEventDispatcher();
    	let name;
    	let cpf;
    	let betType;

    	const handleSubmit = () => {
    		const bet = {
    			name,
    			cpf,
    			betType,
    			bet: "placeHolder",
    			id: generalId
    		};

    		dispatch('addBet', bet);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console.warn("<AddBet> was created without expected prop 'darkMode'");
    		}

    		if (generalId === undefined && !('generalId' in $$props || $$self.$$.bound[$$self.$$.props['generalId']])) {
    			console.warn("<AddBet> was created without expected prop 'generalId'");
    		}
    	});

    	const writable_props = ['darkMode', 'generalId'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddBet> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	function input1_input_handler() {
    		cpf = to_number(this.value);
    		$$invalidate(2, cpf);
    	}

    	function select_change_handler() {
    		betType = select_value(this);
    		$$invalidate(3, betType);
    	}

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('generalId' in $$props) $$invalidate(5, generalId = $$props.generalId);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		darkMode,
    		generalId,
    		dispatch,
    		name,
    		cpf,
    		betType,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('generalId' in $$props) $$invalidate(5, generalId = $$props.generalId);
    		if ('dispatch' in $$props) dispatch = $$props.dispatch;
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('cpf' in $$props) $$invalidate(2, cpf = $$props.cpf);
    		if ('betType' in $$props) $$invalidate(3, betType = $$props.betType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		darkMode,
    		name,
    		cpf,
    		betType,
    		handleSubmit,
    		generalId,
    		input0_input_handler,
    		input1_input_handler,
    		select_change_handler
    	];
    }

    class AddBet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { darkMode: 0, generalId: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddBet",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<AddBet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<AddBet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get generalId() {
    		throw new Error("<AddBet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set generalId(value) {
    		throw new Error("<AddBet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Stages\ManualBet.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\Stages\\ManualBet.svelte";

    function create_fragment$3(ctx) {
    	let form;
    	let h2;
    	let t1;
    	let div;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let input3;
    	let t5;
    	let input4;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			h2 = element("h2");
    			h2.textContent = "Escolha seus números:";
    			t1 = space();
    			div = element("div");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			t5 = space();
    			input4 = element("input");
    			t6 = space();
    			button = element("button");
    			button.textContent = "Confirmar números";
    			add_location(h2, file$3, 44, 4, 1077);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "num svelte-14lmu5h");
    			attr_dev(input0, "min", "1");
    			attr_dev(input0, "max", "50");
    			attr_dev(input0, "pattern", "[0-9]");
    			input0.required = true;
    			toggle_class(input0, "dark", /*darkMode*/ ctx[0]);
    			add_location(input0, file$3, 49, 8, 1263);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "num svelte-14lmu5h");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "50");
    			attr_dev(input1, "pattern", "[0-9]");
    			input1.required = true;
    			toggle_class(input1, "dark", /*darkMode*/ ctx[0]);
    			add_location(input1, file$3, 50, 8, 1386);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "num svelte-14lmu5h");
    			attr_dev(input2, "min", "1");
    			attr_dev(input2, "max", "50");
    			attr_dev(input2, "pattern", "[0-9]");
    			input2.required = true;
    			toggle_class(input2, "dark", /*darkMode*/ ctx[0]);
    			add_location(input2, file$3, 51, 8, 1509);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "num svelte-14lmu5h");
    			attr_dev(input3, "min", "1");
    			attr_dev(input3, "max", "50");
    			attr_dev(input3, "pattern", "[0-9]");
    			input3.required = true;
    			toggle_class(input3, "dark", /*darkMode*/ ctx[0]);
    			add_location(input3, file$3, 52, 8, 1632);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "num svelte-14lmu5h");
    			attr_dev(input4, "min", "1");
    			attr_dev(input4, "max", "50");
    			attr_dev(input4, "pattern", "[0-9]");
    			input4.required = true;
    			toggle_class(input4, "dark", /*darkMode*/ ctx[0]);
    			add_location(input4, file$3, 53, 8, 1755);
    			attr_dev(div, "class", "grid svelte-14lmu5h");
    			add_location(div, file$3, 48, 4, 1235);
    			attr_dev(button, "class", "svelte-14lmu5h");
    			toggle_class(button, "dark", /*darkMode*/ ctx[0]);
    			add_location(button, file$3, 56, 4, 1888);
    			add_location(form, file$3, 43, 0, 1025);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h2);
    			append_dev(form, t1);
    			append_dev(form, div);
    			append_dev(div, input0);
    			set_input_value(input0, /*n1*/ ctx[1]);
    			append_dev(div, t2);
    			append_dev(div, input1);
    			set_input_value(input1, /*n2*/ ctx[2]);
    			append_dev(div, t3);
    			append_dev(div, input2);
    			set_input_value(input2, /*n3*/ ctx[3]);
    			append_dev(div, t4);
    			append_dev(div, input3);
    			set_input_value(input3, /*n4*/ ctx[4]);
    			append_dev(div, t5);
    			append_dev(div, input4);
    			set_input_value(input4, /*n5*/ ctx[5]);
    			append_dev(form, t6);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[9]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[10]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[11]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[6]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*n1*/ 2 && to_number(input0.value) !== /*n1*/ ctx[1]) {
    				set_input_value(input0, /*n1*/ ctx[1]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input0, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*n2*/ 4 && to_number(input1.value) !== /*n2*/ ctx[2]) {
    				set_input_value(input1, /*n2*/ ctx[2]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input1, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*n3*/ 8 && to_number(input2.value) !== /*n3*/ ctx[3]) {
    				set_input_value(input2, /*n3*/ ctx[3]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input2, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*n4*/ 16 && to_number(input3.value) !== /*n4*/ ctx[4]) {
    				set_input_value(input3, /*n4*/ ctx[4]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input3, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*n5*/ 32 && to_number(input4.value) !== /*n5*/ ctx[5]) {
    				set_input_value(input4, /*n5*/ ctx[5]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input4, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('ManualBet', slots, []);
    	let { darkMode } = $$props;
    	let currBet = new Set();
    	let dispatch = createEventDispatcher();
    	let n1, n2, n3, n4, n5;

    	const handleSubmit = () => {
    		currBet.add(n1);
    		currBet.add(n2);
    		currBet.add(n3);
    		currBet.add(n4);
    		currBet.add(n5);

    		if (currBet.size < 5) {
    			alert("Deve-se escolher 5 números diferentes");
    		} else {
    			dispatch('manualBet', currBet);
    		}
    	};

    	const handleClick = i => {
    		console.log(i);
    	};

    	const startButtons = () => {
    		for (let i = 1; i <= 50; i++) {
    			var newButton = document.createElement("button");
    			newButton.value = i;
    			newButton.textContent = i;
    			newButton.click(handleClick(i));
    			newButton.className = "numButton";
    			document.getElementById("here").appendChild(newButton);
    		}
    	};

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console_1$1.warn("<ManualBet> was created without expected prop 'darkMode'");
    		}
    	});

    	const writable_props = ['darkMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<ManualBet> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		n1 = to_number(this.value);
    		$$invalidate(1, n1);
    	}

    	function input1_input_handler() {
    		n2 = to_number(this.value);
    		$$invalidate(2, n2);
    	}

    	function input2_input_handler() {
    		n3 = to_number(this.value);
    		$$invalidate(3, n3);
    	}

    	function input3_input_handler() {
    		n4 = to_number(this.value);
    		$$invalidate(4, n4);
    	}

    	function input4_input_handler() {
    		n5 = to_number(this.value);
    		$$invalidate(5, n5);
    	}

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		darkMode,
    		currBet,
    		dispatch,
    		n1,
    		n2,
    		n3,
    		n4,
    		n5,
    		handleSubmit,
    		handleClick,
    		startButtons
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('currBet' in $$props) currBet = $$props.currBet;
    		if ('dispatch' in $$props) dispatch = $$props.dispatch;
    		if ('n1' in $$props) $$invalidate(1, n1 = $$props.n1);
    		if ('n2' in $$props) $$invalidate(2, n2 = $$props.n2);
    		if ('n3' in $$props) $$invalidate(3, n3 = $$props.n3);
    		if ('n4' in $$props) $$invalidate(4, n4 = $$props.n4);
    		if ('n5' in $$props) $$invalidate(5, n5 = $$props.n5);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		darkMode,
    		n1,
    		n2,
    		n3,
    		n4,
    		n5,
    		handleSubmit,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class ManualBet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ManualBet",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<ManualBet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<ManualBet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Stages\Menu.svelte generated by Svelte v3.59.2 */

    const file$2 = "src\\Stages\\Menu.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let hr;
    	let t4;
    	let div0;
    	let textarea;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Sorteio João Cena™";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Como funciona?";
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			div0 = element("div");
    			textarea = element("textarea");
    			attr_dev(h1, "class", "svelte-13wl3t9");
    			add_location(h1, file$2, 7, 4, 255);
    			add_location(h2, file$2, 8, 4, 288);
    			add_location(hr, file$2, 10, 4, 319);
    			attr_dev(textarea, "cols", "37");
    			attr_dev(textarea, "rows", "10");
    			textarea.disabled = true;
    			textarea.value = "" + /*text*/ ctx[1] + "\r\n        ";
    			attr_dev(textarea, "class", "svelte-13wl3t9");
    			toggle_class(textarea, "dark", /*darkMode*/ ctx[0]);
    			add_location(textarea, file$2, 13, 8, 359);
    			attr_dev(div0, "class", "text svelte-13wl3t9");
    			add_location(div0, file$2, 12, 4, 331);
    			attr_dev(div1, "class", "box svelte-13wl3t9");
    			add_location(div1, file$2, 6, 0, 232);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, h2);
    			append_dev(div1, t3);
    			append_dev(div1, hr);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, textarea);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(textarea, "dark", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	let { darkMode } = $$props;
    	let text = "Etapa1: Apostas\nOs participantes podem fazer quantas apostas quiserem;\nOs números podem ser escolhidos manualmente ou de forma aleatória.\n\nEtapa 2: Apuração\n";

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console.warn("<Menu> was created without expected prop 'darkMode'");
    		}
    	});

    	const writable_props = ['darkMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    	};

    	$$self.$capture_state = () => ({ darkMode, text });

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkMode, text];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Stages\StartDraw.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "src\\Stages\\StartDraw.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let h20;
    	let t1;
    	let h30;
    	let t2;
    	let t3;
    	let hr0;
    	let t4;
    	let h21;
    	let t6;
    	let h31;
    	let t7;
    	let t8;
    	let hr1;
    	let t9;
    	let h22;
    	let t11;
    	let h32;
    	let t12_value = /*prize*/ ctx[0].toFixed(2) + "";
    	let t12;
    	let t13;
    	let t14;
    	let hr2;
    	let t15;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h20 = element("h2");
    			h20.textContent = "Números Sorteados:";
    			t1 = space();
    			h30 = element("h3");
    			t2 = text(/*drawnNums*/ ctx[3]);
    			t3 = space();
    			hr0 = element("hr");
    			t4 = space();
    			h21 = element("h2");
    			h21.textContent = "Turno do Sorteio";
    			t6 = space();
    			h31 = element("h3");
    			t7 = text(/*turn*/ ctx[2]);
    			t8 = space();
    			hr1 = element("hr");
    			t9 = space();
    			h22 = element("h2");
    			h22.textContent = "Valor do Prêmio";
    			t11 = space();
    			h32 = element("h3");
    			t12 = text(t12_value);
    			t13 = text(" reais");
    			t14 = space();
    			hr2 = element("hr");
    			t15 = space();
    			button = element("button");
    			button.textContent = "Próximo Turno";
    			attr_dev(h20, "class", "svelte-mnsa5");
    			add_location(h20, file$1, 76, 4, 1619);
    			attr_dev(h30, "class", "svelte-mnsa5");
    			add_location(h30, file$1, 77, 4, 1652);
    			add_location(hr0, file$1, 79, 4, 1680);
    			attr_dev(h21, "class", "svelte-mnsa5");
    			add_location(h21, file$1, 81, 4, 1692);
    			attr_dev(h31, "class", "svelte-mnsa5");
    			add_location(h31, file$1, 82, 4, 1723);
    			add_location(hr1, file$1, 84, 4, 1746);
    			attr_dev(h22, "class", "svelte-mnsa5");
    			add_location(h22, file$1, 86, 4, 1758);
    			attr_dev(h32, "class", "svelte-mnsa5");
    			add_location(h32, file$1, 87, 4, 1788);
    			add_location(hr2, file$1, 89, 4, 1829);
    			attr_dev(button, "class", "svelte-mnsa5");
    			toggle_class(button, "dark", /*darkMode*/ ctx[1]);
    			add_location(button, file$1, 91, 4, 1841);
    			add_location(div, file$1, 75, 0, 1608);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h20);
    			append_dev(div, t1);
    			append_dev(div, h30);
    			append_dev(h30, t2);
    			append_dev(div, t3);
    			append_dev(div, hr0);
    			append_dev(div, t4);
    			append_dev(div, h21);
    			append_dev(div, t6);
    			append_dev(div, h31);
    			append_dev(h31, t7);
    			append_dev(div, t8);
    			append_dev(div, hr1);
    			append_dev(div, t9);
    			append_dev(div, h22);
    			append_dev(div, t11);
    			append_dev(div, h32);
    			append_dev(h32, t12);
    			append_dev(h32, t13);
    			append_dev(div, t14);
    			append_dev(div, hr2);
    			append_dev(div, t15);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*drawnNums*/ 8) set_data_dev(t2, /*drawnNums*/ ctx[3]);
    			if (dirty & /*turn*/ 4) set_data_dev(t7, /*turn*/ ctx[2]);
    			if (dirty & /*prize*/ 1 && t12_value !== (t12_value = /*prize*/ ctx[0].toFixed(2) + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*darkMode*/ 2) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[1]);
    			}
    		},
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
    	validate_slots('StartDraw', slots, []);
    	let { darkMode } = $$props;
    	let { prize } = $$props;
    	let { nBet } = $$props;
    	let { draw = new Set() } = $$props;
    	let { allBets = new Set() } = $$props;
    	let dispatch = createEventDispatcher();
    	let turn = 0;
    	let winners = [];
    	let drawnNums;

    	const drawNewNum = () => {
    		let len1 = draw.size;

    		while (draw.size == len1) {
    			draw.add(Math.floor(Math.random() * 50) + 1);
    		}
    	};

    	const handleHasWinner = () => {
    		dispatch('winnersList', winners);
    	};

    	const checkForWinner = () => {
    		let hasWinner = true;

    		for (let i = 0; i < nBet; i++) {
    			hasWinner = true;
    			let currBet = allBets[1000 + i];
    			currBet = currBet.bet;

    			for (let j = 0; j < 5; j++) {
    				if (!draw.has(currBet[j])) {
    					hasWinner = false;
    				}
    			}

    			if (hasWinner == true) {
    				winners.push(1000 + i);
    			}
    		}

    		if (hasWinner == true || turn >= 25) {
    			handleHasWinner();
    		}

    		if (hasWinner == false) {
    			drawNewNum();
    			$$invalidate(3, drawnNums = getDrawnNums());
    			$$invalidate(2, turn += 1);
    			$$invalidate(0, prize *= 1.2);
    		}
    	};

    	const getDrawnNums = () => {
    		$$invalidate(3, drawnNums = "");

    		draw.forEach(i => {
    			$$invalidate(3, drawnNums += i + " ");
    		});

    		return drawnNums;
    	};

    	drawnNums = getDrawnNums();
    	console.log(allBets);

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console_1.warn("<StartDraw> was created without expected prop 'darkMode'");
    		}

    		if (prize === undefined && !('prize' in $$props || $$self.$$.bound[$$self.$$.props['prize']])) {
    			console_1.warn("<StartDraw> was created without expected prop 'prize'");
    		}

    		if (nBet === undefined && !('nBet' in $$props || $$self.$$.bound[$$self.$$.props['nBet']])) {
    			console_1.warn("<StartDraw> was created without expected prop 'nBet'");
    		}
    	});

    	const writable_props = ['darkMode', 'prize', 'nBet', 'draw', 'allBets'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<StartDraw> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => checkForWinner();

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(1, darkMode = $$props.darkMode);
    		if ('prize' in $$props) $$invalidate(0, prize = $$props.prize);
    		if ('nBet' in $$props) $$invalidate(5, nBet = $$props.nBet);
    		if ('draw' in $$props) $$invalidate(6, draw = $$props.draw);
    		if ('allBets' in $$props) $$invalidate(7, allBets = $$props.allBets);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		darkMode,
    		prize,
    		nBet,
    		draw,
    		allBets,
    		dispatch,
    		turn,
    		winners,
    		drawnNums,
    		drawNewNum,
    		handleHasWinner,
    		checkForWinner,
    		getDrawnNums
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(1, darkMode = $$props.darkMode);
    		if ('prize' in $$props) $$invalidate(0, prize = $$props.prize);
    		if ('nBet' in $$props) $$invalidate(5, nBet = $$props.nBet);
    		if ('draw' in $$props) $$invalidate(6, draw = $$props.draw);
    		if ('allBets' in $$props) $$invalidate(7, allBets = $$props.allBets);
    		if ('dispatch' in $$props) dispatch = $$props.dispatch;
    		if ('turn' in $$props) $$invalidate(2, turn = $$props.turn);
    		if ('winners' in $$props) winners = $$props.winners;
    		if ('drawnNums' in $$props) $$invalidate(3, drawnNums = $$props.drawnNums);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		prize,
    		darkMode,
    		turn,
    		drawnNums,
    		checkForWinner,
    		nBet,
    		draw,
    		allBets,
    		click_handler
    	];
    }

    class StartDraw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			darkMode: 1,
    			prize: 0,
    			nBet: 5,
    			draw: 6,
    			allBets: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartDraw",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<StartDraw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<StartDraw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prize() {
    		throw new Error("<StartDraw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prize(value) {
    		throw new Error("<StartDraw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nBet() {
    		throw new Error("<StartDraw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nBet(value) {
    		throw new Error("<StartDraw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get draw() {
    		throw new Error("<StartDraw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set draw(value) {
    		throw new Error("<StartDraw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allBets() {
    		throw new Error("<StartDraw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allBets(value) {
    		throw new Error("<StartDraw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    // (67:2) {#if currStage === "menu"}
    function create_if_block_7(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};
    			if (dirty & /*darkMode*/ 16) box_changes.darkMode = /*darkMode*/ ctx[4];

    			if (dirty & /*$$scope, darkMode*/ 32784) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(67:2) {#if currStage === \\\"menu\\\"}",
    		ctx
    	});

    	return block;
    }

    // (68:3) <Box {darkMode}>
    function create_default_slot_4(ctx) {
    	let menu;
    	let current;

    	menu = new Menu({
    			props: { darkMode: /*darkMode*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menu_changes = {};
    			if (dirty & /*darkMode*/ 16) menu_changes.darkMode = /*darkMode*/ ctx[4];
    			menu.$set(menu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(68:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (73:2) {#if currStage === "bet"}
    function create_if_block_6(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};
    			if (dirty & /*darkMode*/ 16) box_changes.darkMode = /*darkMode*/ ctx[4];

    			if (dirty & /*$$scope, darkMode, generalId*/ 32785) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(73:2) {#if currStage === \\\"bet\\\"}",
    		ctx
    	});

    	return block;
    }

    // (74:3) <Box {darkMode}>
    function create_default_slot_3(ctx) {
    	let addbet;
    	let current;

    	addbet = new AddBet({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				generalId: /*generalId*/ ctx[0]
    			},
    			$$inline: true
    		});

    	addbet.$on("addBet", /*addBet*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(addbet.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(addbet, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const addbet_changes = {};
    			if (dirty & /*darkMode*/ 16) addbet_changes.darkMode = /*darkMode*/ ctx[4];
    			if (dirty & /*generalId*/ 1) addbet_changes.generalId = /*generalId*/ ctx[0];
    			addbet.$set(addbet_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addbet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addbet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addbet, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(74:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (79:2) {#if currStage === "manual"}
    function create_if_block_5(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};
    			if (dirty & /*darkMode*/ 16) box_changes.darkMode = /*darkMode*/ ctx[4];

    			if (dirty & /*$$scope, darkMode, generalId*/ 32785) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(79:2) {#if currStage === \\\"manual\\\"}",
    		ctx
    	});

    	return block;
    }

    // (80:3) <Box {darkMode}>
    function create_default_slot_2(ctx) {
    	let manualbet;
    	let current;

    	manualbet = new ManualBet({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				generalId: /*generalId*/ ctx[0]
    			},
    			$$inline: true
    		});

    	manualbet.$on("manualBet", /*manualBet*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(manualbet.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(manualbet, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const manualbet_changes = {};
    			if (dirty & /*darkMode*/ 16) manualbet_changes.darkMode = /*darkMode*/ ctx[4];
    			if (dirty & /*generalId*/ 1) manualbet_changes.generalId = /*generalId*/ ctx[0];
    			manualbet.$set(manualbet_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(manualbet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(manualbet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(manualbet, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(80:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (85:2) {#if currStage === "betDone"}
    function create_if_block_4(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};
    			if (dirty & /*darkMode*/ 16) box_changes.darkMode = /*darkMode*/ ctx[4];

    			if (dirty & /*$$scope, darkMode, currStage*/ 32792) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(85:2) {#if currStage === \\\"betDone\\\"}",
    		ctx
    	});

    	return block;
    }

    // (86:3) <Box {darkMode}>
    function create_default_slot_1(ctx) {
    	let h1;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Aposta concluida!";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Nova aposta";
    			add_location(h1, file, 86, 4, 1533);
    			attr_dev(button, "class", "svelte-jtoyal");
    			toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			add_location(button, file, 87, 4, 1564);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[11], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 16) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(86:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (92:2) {#if currStage === "draw"}
    function create_if_block_3(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};
    			if (dirty & /*darkMode*/ 16) box_changes.darkMode = /*darkMode*/ ctx[4];

    			if (dirty & /*$$scope, darkMode, allBets, nBet*/ 32790) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(92:2) {#if currStage === \\\"draw\\\"}",
    		ctx
    	});

    	return block;
    }

    // (93:3) <Box {darkMode}>
    function create_default_slot(ctx) {
    	let startdraw;
    	let current;

    	startdraw = new StartDraw({
    			props: {
    				darkMode: /*darkMode*/ ctx[4],
    				prize: /*prize*/ ctx[5],
    				allBets: /*allBets*/ ctx[1],
    				nBet: /*nBet*/ ctx[2],
    				draw: /*newRandomBet*/ ctx[6]()
    			},
    			$$inline: true
    		});

    	startdraw.$on("winnersList", /*handleWinners*/ ctx[10]);

    	const block = {
    		c: function create() {
    			create_component(startdraw.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(startdraw, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const startdraw_changes = {};
    			if (dirty & /*darkMode*/ 16) startdraw_changes.darkMode = /*darkMode*/ ctx[4];
    			if (dirty & /*allBets*/ 2) startdraw_changes.allBets = /*allBets*/ ctx[1];
    			if (dirty & /*nBet*/ 4) startdraw_changes.nBet = /*nBet*/ ctx[2];
    			startdraw.$set(startdraw_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(startdraw.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(startdraw.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(startdraw, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(93:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (101:2) {#if currStage === "menu"}
    function create_if_block_2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Iniciar apostas";
    			attr_dev(button, "class", "svelte-jtoyal");
    			toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			add_location(button, file, 101, 3, 1997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[12], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 16) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			}
    		},
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
    		source: "(101:2) {#if currStage === \\\"menu\\\"}",
    		ctx
    	});

    	return block;
    }

    // (104:2) {#if currStage === "bet"}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Voltar ao menu";
    			attr_dev(button, "class", "svelte-jtoyal");
    			toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			add_location(button, file, 104, 3, 2124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[13], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 16) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(104:2) {#if currStage === \\\"bet\\\"}",
    		ctx
    	});

    	return block;
    }

    // (107:2) {#if nBet > 0 && currStage !== "draw"}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Iniciar Sorteio";
    			attr_dev(button, "class", "svelte-jtoyal");
    			toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			add_location(button, file, 107, 3, 2264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[14], { once: true }, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 16) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(107:2) {#if nBet > 0 && currStage !== \\\"draw\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let button;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*currStage*/ ctx[3] === "menu" && create_if_block_7(ctx);
    	let if_block1 = /*currStage*/ ctx[3] === "bet" && create_if_block_6(ctx);
    	let if_block2 = /*currStage*/ ctx[3] === "manual" && create_if_block_5(ctx);
    	let if_block3 = /*currStage*/ ctx[3] === "betDone" && create_if_block_4(ctx);
    	let if_block4 = /*currStage*/ ctx[3] === "draw" && create_if_block_3(ctx);
    	let if_block5 = /*currStage*/ ctx[3] === "menu" && create_if_block_2(ctx);
    	let if_block6 = /*currStage*/ ctx[3] === "bet" && create_if_block_1(ctx);
    	let if_block7 = /*nBet*/ ctx[2] > 0 && /*currStage*/ ctx[3] !== "draw" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			div1 = element("div");
    			button = element("button");
    			t5 = text("Dark Mode: ");
    			t6 = text(/*darkMode*/ ctx[4]);
    			t7 = space();
    			if (if_block5) if_block5.c();
    			t8 = space();
    			if (if_block6) if_block6.c();
    			t9 = space();
    			if (if_block7) if_block7.c();
    			attr_dev(div0, "class", "mainDiv svelte-jtoyal");
    			add_location(div0, file, 65, 1, 1106);
    			attr_dev(button, "class", "darkButton svelte-jtoyal");
    			toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			add_location(button, file, 99, 2, 1859);
    			add_location(div1, file, 98, 1, 1851);
    			attr_dev(main, "class", "backGround svelte-jtoyal");
    			toggle_class(main, "dark", /*darkMode*/ ctx[4]);
    			add_location(main, file, 64, 0, 1057);
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
    			append_dev(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block3) if_block3.m(div0, null);
    			append_dev(div0, t3);
    			if (if_block4) if_block4.m(div0, null);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			append_dev(div1, button);
    			append_dev(button, t5);
    			append_dev(button, t6);
    			append_dev(div1, t7);
    			if (if_block5) if_block5.m(div1, null);
    			append_dev(div1, t8);
    			if (if_block6) if_block6.m(div1, null);
    			append_dev(div1, t9);
    			if (if_block7) if_block7.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleDarkMode*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*currStage*/ ctx[3] === "menu") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*currStage*/ 8) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[3] === "bet") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*currStage*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[3] === "manual") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*currStage*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div0, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[3] === "betDone") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*currStage*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div0, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[3] === "draw") {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*currStage*/ 8) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div0, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*darkMode*/ 16) set_data_dev(t6, /*darkMode*/ ctx[4]);

    			if (!current || dirty & /*darkMode*/ 16) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[4]);
    			}

    			if (/*currStage*/ ctx[3] === "menu") {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_2(ctx);
    					if_block5.c();
    					if_block5.m(div1, t8);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*currStage*/ ctx[3] === "bet") {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_1(ctx);
    					if_block6.c();
    					if_block6.m(div1, t9);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*nBet*/ ctx[2] > 0 && /*currStage*/ ctx[3] !== "draw") {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);
    				} else {
    					if_block7 = create_if_block(ctx);
    					if_block7.c();
    					if_block7.m(div1, null);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (!current || dirty & /*darkMode*/ 16) {
    				toggle_class(main, "dark", /*darkMode*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			mounted = false;
    			dispose();
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
    	validate_slots('App', slots, []);
    	let generalId = 1000;
    	let allBets = new Set();
    	let nBet = 0;
    	let prize = 2535;
    	let currStage = "bet";
    	let darkMode = true;

    	const newRandomBet = () => {
    		let currBet = new Set();
    		while (currBet.size < 5) currBet.add(Math.floor(Math.random() * 50) + 1);
    		return currBet;
    	};

    	const handleDarkMode = () => {
    		$$invalidate(4, darkMode = !darkMode);
    	};

    	const addBet = e => {
    		$$invalidate(1, allBets[generalId] = e.detail, allBets);

    		if (e.detail.betType == "auto") {
    			e.detail.bet = newRandomBet();
    			$$invalidate(3, currStage = "betDone");
    			$$invalidate(0, generalId++, generalId);
    			$$invalidate(2, nBet++, nBet);
    		} else {
    			$$invalidate(3, currStage = "manual");
    		}
    	};

    	const manualBet = e => {
    		let aux = allBets[generalId];
    		aux.bet = e.detail.currBet;
    		$$invalidate(0, generalId++, generalId);
    		$$invalidate(2, nBet++, nBet);
    		$$invalidate(3, currStage = "betDone");
    	};

    	const handleWinners = e => {
    		$$invalidate(3, currStage = "winners");
    		$$invalidate(2, nBet = 0);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(3, currStage = "bet");
    	};

    	const click_handler_1 = () => {
    		$$invalidate(3, currStage = "bet");
    	};

    	const click_handler_2 = () => {
    		$$invalidate(3, currStage = "menu");
    	};

    	const click_handler_3 = () => {
    		$$invalidate(3, currStage = "draw");
    	};

    	$$self.$capture_state = () => ({
    		Box,
    		AddBet,
    		ManualBet,
    		Menu,
    		StartDraw,
    		generalId,
    		allBets,
    		nBet,
    		prize,
    		currStage,
    		darkMode,
    		newRandomBet,
    		handleDarkMode,
    		addBet,
    		manualBet,
    		handleWinners
    	});

    	$$self.$inject_state = $$props => {
    		if ('generalId' in $$props) $$invalidate(0, generalId = $$props.generalId);
    		if ('allBets' in $$props) $$invalidate(1, allBets = $$props.allBets);
    		if ('nBet' in $$props) $$invalidate(2, nBet = $$props.nBet);
    		if ('prize' in $$props) $$invalidate(5, prize = $$props.prize);
    		if ('currStage' in $$props) $$invalidate(3, currStage = $$props.currStage);
    		if ('darkMode' in $$props) $$invalidate(4, darkMode = $$props.darkMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		generalId,
    		allBets,
    		nBet,
    		currStage,
    		darkMode,
    		prize,
    		newRandomBet,
    		handleDarkMode,
    		addBet,
    		manualBet,
    		handleWinners,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
