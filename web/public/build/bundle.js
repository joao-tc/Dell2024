
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
    function empty() {
        return text('');
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

    const file$9 = "src\\Component\\Box.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(div, file$9, 4, 0, 49);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$9.name
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
    const file$8 = "src\\Stages\\AddBet.svelte";

    function create_fragment$8(ctx) {
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
    			attr_dev(h2, "class", "svelte-1cv8mqf");
    			add_location(h2, file$8, 24, 4, 493);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Nome");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-1cv8mqf");
    			toggle_class(input0, "dark", /*darkMode*/ ctx[0]);
    			add_location(input0, file$8, 25, 4, 519);
    			add_location(br0, file$8, 25, 91, 606);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "pattern", "[0-9]");
    			attr_dev(input1, "minlength", "11");
    			attr_dev(input1, "placeholder", "CPF");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-1cv8mqf");
    			toggle_class(input1, "dark", /*darkMode*/ ctx[0]);
    			add_location(input1, file$8, 26, 4, 616);
    			add_location(br1, file$8, 26, 122, 734);
    			add_location(label, file$8, 28, 4, 806);
    			option0.__value = "auto";
    			option0.value = option0.__value;
    			add_location(option0, file$8, 30, 8, 903);
    			option1.__value = "manual";
    			option1.value = option1.__value;
    			add_location(option1, file$8, 31, 8, 960);
    			attr_dev(select, "class", "svelte-1cv8mqf");
    			if (/*betType*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
    			toggle_class(select, "dark", /*darkMode*/ ctx[0]);
    			add_location(select, file$8, 29, 4, 842);
    			attr_dev(hr, "class", "svelte-1cv8mqf");
    			add_location(hr, file$8, 33, 4, 1026);
    			attr_dev(button, "class", "svelte-1cv8mqf");
    			toggle_class(button, "dark", /*darkMode*/ ctx[0]);
    			add_location(button, file$8, 34, 4, 1036);
    			add_location(form, file$8, 23, 0, 441);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { darkMode: 0, generalId: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddBet",
    			options,
    			id: create_fragment$8.name
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

    const { console: console_1$2 } = globals;
    const file$7 = "src\\Stages\\ManualBet.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(h2, file$7, 40, 4, 997);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "num svelte-14lmu5h");
    			attr_dev(input0, "min", "1");
    			attr_dev(input0, "max", "50");
    			attr_dev(input0, "pattern", "[0-9]");
    			input0.required = true;
    			toggle_class(input0, "dark", /*darkMode*/ ctx[0]);
    			add_location(input0, file$7, 45, 8, 1183);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "num svelte-14lmu5h");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "50");
    			attr_dev(input1, "pattern", "[0-9]");
    			input1.required = true;
    			toggle_class(input1, "dark", /*darkMode*/ ctx[0]);
    			add_location(input1, file$7, 46, 8, 1306);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "num svelte-14lmu5h");
    			attr_dev(input2, "min", "1");
    			attr_dev(input2, "max", "50");
    			attr_dev(input2, "pattern", "[0-9]");
    			input2.required = true;
    			toggle_class(input2, "dark", /*darkMode*/ ctx[0]);
    			add_location(input2, file$7, 47, 8, 1429);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "num svelte-14lmu5h");
    			attr_dev(input3, "min", "1");
    			attr_dev(input3, "max", "50");
    			attr_dev(input3, "pattern", "[0-9]");
    			input3.required = true;
    			toggle_class(input3, "dark", /*darkMode*/ ctx[0]);
    			add_location(input3, file$7, 48, 8, 1552);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "num svelte-14lmu5h");
    			attr_dev(input4, "min", "1");
    			attr_dev(input4, "max", "50");
    			attr_dev(input4, "pattern", "[0-9]");
    			input4.required = true;
    			toggle_class(input4, "dark", /*darkMode*/ ctx[0]);
    			add_location(input4, file$7, 49, 8, 1675);
    			attr_dev(div, "class", "grid svelte-14lmu5h");
    			add_location(div, file$7, 44, 4, 1155);
    			attr_dev(button, "class", "svelte-14lmu5h");
    			toggle_class(button, "dark", /*darkMode*/ ctx[0]);
    			add_location(button, file$7, 52, 4, 1808);
    			add_location(form, file$7, 39, 0, 945);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ManualBet', slots, []);
    	let { darkMode } = $$props;
    	let currBet = new Set();
    	let dispatch = createEventDispatcher();
    	let n1, n2, n3, n4, n5;

    	const handleSubmit = () => {
    		currBet = new Set([n1, n2, n3, n4, n5]);

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
    			console_1$2.warn("<ManualBet> was created without expected prop 'darkMode'");
    		}
    	});

    	const writable_props = ['darkMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<ManualBet> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ManualBet",
    			options,
    			id: create_fragment$7.name
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

    const file$6 = "src\\Stages\\Menu.svelte";

    function create_fragment$6(ctx) {
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
    			attr_dev(h1, "class", "svelte-1bwokaz");
    			add_location(h1, file$6, 7, 4, 732);
    			add_location(h2, file$6, 8, 4, 765);
    			add_location(hr, file$6, 10, 4, 796);
    			attr_dev(textarea, "cols", "37");
    			attr_dev(textarea, "rows", "10");
    			textarea.disabled = true;
    			textarea.value = "" + /*text*/ ctx[1] + "\r\n        ";
    			attr_dev(textarea, "class", "svelte-1bwokaz");
    			toggle_class(textarea, "dark", /*darkMode*/ ctx[0]);
    			add_location(textarea, file$6, 13, 8, 836);
    			attr_dev(div0, "class", "text svelte-1bwokaz");
    			add_location(div0, file$6, 12, 4, 808);
    			attr_dev(div1, "class", "box svelte-1bwokaz");
    			add_location(div1, file$6, 6, 0, 709);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	let { darkMode } = $$props;
    	let text = "Etapa1: Apostas\nAs apostas são estritamente de 5 números;\nOs números podem ser escolhidos manualmente ou de forma aleatória;\nOs participantes podem fazer quantas apostas quiserem.\n\nEtapa 2: Apuração\nSão inicialmente sorteados 5 números;\nCaso nenhum participante tenha acertado os números, mais um número será sorteado;\nEsse processo se repete até algum participante ter seus números sorteados, ou ao chegar no turno 25.\n\nEtapa 3: premiação\nO valor do prêmio se inicia em 2535 reais e aumenta a cada turno de apuração;\nO valor então será distribuído paro o(s) vencedor(es);\nCaso ninguém acerte os números, não haverá premiação.";

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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$6.name
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
    const file$5 = "src\\Stages\\StartDraw.svelte";

    function create_fragment$5(ctx) {
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
    			attr_dev(h20, "class", "svelte-1qa9nbq");
    			add_location(h20, file$5, 93, 4, 2104);
    			attr_dev(h30, "class", "svelte-1qa9nbq");
    			add_location(h30, file$5, 94, 4, 2137);
    			add_location(hr0, file$5, 96, 4, 2165);
    			attr_dev(h21, "class", "svelte-1qa9nbq");
    			add_location(h21, file$5, 98, 4, 2177);
    			attr_dev(h31, "class", "svelte-1qa9nbq");
    			add_location(h31, file$5, 99, 4, 2208);
    			add_location(hr1, file$5, 101, 4, 2231);
    			attr_dev(h22, "class", "svelte-1qa9nbq");
    			add_location(h22, file$5, 103, 4, 2243);
    			attr_dev(h32, "class", "svelte-1qa9nbq");
    			add_location(h32, file$5, 104, 4, 2273);
    			add_location(hr2, file$5, 106, 4, 2314);
    			attr_dev(button, "class", "svelte-1qa9nbq");
    			toggle_class(button, "dark", /*darkMode*/ ctx[1]);
    			add_location(button, file$5, 108, 4, 2326);
    			add_location(div, file$5, 92, 0, 2093);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		const winInfo = { turn, prize };
    		dispatch('winnersInfo', winInfo);
    	};

    	const checkForWinner = () => {
    		let hasWinner = true;

    		for (let i = 0; i < nBet; i++) {
    			hasWinner = true;
    			let currBet = new Set();
    			currBet = allBets[1000 + i].bet;
    			const setIter = currBet.values();

    			for (let j = 0; j < 5; j++) {
    				let currNum = setIter.next().value;

    				try {
    					if (draw.has(currNum) == false) {
    						hasWinner = false;
    						break;
    					}
    				} catch(error) {
    					hasWinner = false;
    					break;
    				}
    			}

    			if (hasWinner == true) {
    				winners.push(1000 + i);
    				break;
    			}
    		} //console.log("Verificando participante", i);

    		if (hasWinner == true || turn >= 25) {
    			handleHasWinner();
    		}

    		if (hasWinner == false) {
    			drawNewNum();
    			$$invalidate(3, drawnNums = getDrawnNums());
    			$$invalidate(2, turn += 1);
    			$$invalidate(0, prize = prize * 1.2);
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

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console.warn("<StartDraw> was created without expected prop 'darkMode'");
    		}

    		if (prize === undefined && !('prize' in $$props || $$self.$$.bound[$$self.$$.props['prize']])) {
    			console.warn("<StartDraw> was created without expected prop 'prize'");
    		}

    		if (nBet === undefined && !('nBet' in $$props || $$self.$$.bound[$$self.$$.props['nBet']])) {
    			console.warn("<StartDraw> was created without expected prop 'nBet'");
    		}
    	});

    	const writable_props = ['darkMode', 'prize', 'nBet', 'draw', 'allBets'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StartDraw> was created with unknown prop '${key}'`);
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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
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
    			id: create_fragment$5.name
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

    /* src\Component\Modal.svelte generated by Svelte v3.59.2 */

    const file$4 = "src\\Component\\Modal.svelte";

    // (6:0) {#if showModal}
    function create_if_block$2(ctx) {
    	let div1;
    	let div0;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "modal svelte-h9phcs");
    			toggle_class(div0, "dark", /*darkMode*/ ctx[0]);
    			add_location(div0, file$4, 7, 8, 153);
    			attr_dev(div1, "class", "backdrop svelte-h9phcs");
    			toggle_class(div1, "darkBD", /*darkMode*/ ctx[0]);
    			add_location(div1, file$4, 6, 4, 97);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*darkMode*/ 1) {
    				toggle_class(div0, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (!current || dirty & /*darkMode*/ 1) {
    				toggle_class(div1, "darkBD", /*darkMode*/ ctx[0]);
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
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(6:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showModal*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[1]) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	validate_slots('Modal', slots, ['default']);
    	let { darkMode } = $$props;
    	let showModal = true;

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console.warn("<Modal> was created without expected prop 'darkMode'");
    		}
    	});

    	const writable_props = ['darkMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ darkMode, showModal });

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('showModal' in $$props) $$invalidate(1, showModal = $$props.showModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkMode, showModal, $$scope, slots];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\AddGhost.svelte generated by Svelte v3.59.2 */
    const file$3 = "src\\AddGhost.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let form;
    	let h3;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			form = element("form");
    			h3 = element("h3");
    			h3.textContent = "Quantidade de participantes:";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Confirmar";
    			add_location(h3, file$3, 17, 8, 325);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "pattern", "[0-9]");
    			input.required = true;
    			attr_dev(input, "class", "svelte-n1jveq");
    			toggle_class(input, "dark", /*darkMode*/ ctx[0]);
    			add_location(input, file$3, 18, 8, 372);
    			attr_dev(button, "class", "svelte-n1jveq");
    			add_location(button, file$3, 19, 8, 489);
    			add_location(form, file$3, 16, 4, 269);
    			add_location(div, file$3, 15, 0, 258);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, form);
    			append_dev(form, h3);
    			append_dev(form, t1);
    			append_dev(form, input);
    			set_input_value(input, /*nGhosts*/ ctx[1]);
    			append_dev(form, t2);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[2]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nGhosts*/ 2 && to_number(input.value) !== /*nGhosts*/ ctx[1]) {
    				set_input_value(input, /*nGhosts*/ ctx[1]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(input, "dark", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots('AddGhost', slots, []);
    	let { darkMode } = $$props;
    	let dispatch = createEventDispatcher();
    	let nGhosts;

    	const handleSubmit = e => {
    		dispatch('addGhost', nGhosts);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console.warn("<AddGhost> was created without expected prop 'darkMode'");
    		}
    	});

    	const writable_props = ['darkMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddGhost> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		nGhosts = to_number(this.value);
    		$$invalidate(1, nGhosts);
    	}

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		darkMode,
    		dispatch,
    		nGhosts,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('dispatch' in $$props) dispatch = $$props.dispatch;
    		if ('nGhosts' in $$props) $$invalidate(1, nGhosts = $$props.nGhosts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkMode, nGhosts, handleSubmit, input_input_handler];
    }

    class AddGhost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { darkMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddGhost",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<AddGhost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<AddGhost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Stages\Winners.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\Stages\\Winners.svelte";

    // (50:4) {:else}
    function create_else_block_1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Não houveram vencedores";
    			add_location(h1, file$2, 50, 8, 1212);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(50:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:4) {#if winners.length > 0}
    function create_if_block$1(ctx) {
    	let t0;
    	let hr0;
    	let t1;
    	let textarea;
    	let t2;
    	let hr1;
    	let t3;
    	let h30;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let h2;
    	let t9;
    	let h31;
    	let t10_value = /*prize*/ ctx[2].toFixed(2) + "";
    	let t10;
    	let t11;

    	function select_block_type_1(ctx, dirty) {
    		if (/*winners*/ ctx[1].length === 1) return create_if_block_1$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			t0 = space();
    			hr0 = element("hr");
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			hr1 = element("hr");
    			t3 = space();
    			h30 = element("h3");
    			t4 = text("Após ");
    			t5 = text(/*turn*/ ctx[3]);
    			t6 = text(" turnos:");
    			t7 = space();
    			h2 = element("h2");
    			h2.textContent = "Valor final do prêmio:";
    			t9 = space();
    			h31 = element("h3");
    			t10 = text(t10_value);
    			t11 = text(" reais");
    			add_location(hr0, file$2, 41, 8, 925);
    			attr_dev(textarea, "cols", "34");
    			attr_dev(textarea, "rows", "10");
    			textarea.disabled = true;
    			textarea.value = "" + /*getWinnersText*/ ctx[4]() + "            \r\n        ";
    			attr_dev(textarea, "class", "svelte-f2znbs");
    			toggle_class(textarea, "dark", /*darkMode*/ ctx[0]);
    			add_location(textarea, file$2, 42, 8, 939);
    			add_location(hr1, file$2, 45, 8, 1063);
    			add_location(h30, file$2, 46, 8, 1077);
    			attr_dev(h2, "class", "svelte-f2znbs");
    			add_location(h2, file$2, 47, 8, 1115);
    			add_location(h31, file$2, 48, 8, 1156);
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, textarea, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h30, anchor);
    			append_dev(h30, t4);
    			append_dev(h30, t5);
    			append_dev(h30, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h31, anchor);
    			append_dev(h31, t10);
    			append_dev(h31, t11);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(textarea, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*turn*/ 8) set_data_dev(t5, /*turn*/ ctx[3]);
    			if (dirty & /*prize*/ 4 && t10_value !== (t10_value = /*prize*/ ctx[2].toFixed(2) + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h31);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(36:4) {#if winners.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {:else}
    function create_else_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Vencedores:";
    			add_location(h1, file$2, 39, 8, 884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if winners.length === 1}
    function create_if_block_1$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Vencedor:";
    			add_location(h1, file$2, 37, 8, 841);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(37:4) {#if winners.length === 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*winners*/ ctx[1].length > 0) return create_if_block$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "svelte-f2znbs");
    			toggle_class(div, "dark", /*darkMode*/ ctx[0]);
    			add_location(div, file$2, 34, 0, 742);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(div, "dark", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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
    	validate_slots('Winners', slots, []);
    	let { darkMode } = $$props;
    	let { allBets = new Set() } = $$props;
    	let { winners = [] } = $$props;
    	let { prize } = $$props;
    	let { turn } = $$props;

    	const getWinnersText = () => {
    		let aux = "";

    		for (let i = 0; i < winners.length; i++) {
    			let currBet = allBets[winners[i]];
    			aux += "ID da aposta: " + currBet.id;
    			aux += "\nNome do participante: " + currBet.name;
    			aux += "\nNúmeros apostados: " + setToString(currBet.bet) + "\n";
    		}

    		return aux;
    	};

    	const setToString = e => {
    		let aux = "";
    		console.log(e);

    		e.forEach(i => {
    			aux += i + " ";
    		});

    		return aux;
    	};

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console_1$1.warn("<Winners> was created without expected prop 'darkMode'");
    		}

    		if (prize === undefined && !('prize' in $$props || $$self.$$.bound[$$self.$$.props['prize']])) {
    			console_1$1.warn("<Winners> was created without expected prop 'prize'");
    		}

    		if (turn === undefined && !('turn' in $$props || $$self.$$.bound[$$self.$$.props['turn']])) {
    			console_1$1.warn("<Winners> was created without expected prop 'turn'");
    		}
    	});

    	const writable_props = ['darkMode', 'allBets', 'winners', 'prize', 'turn'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Winners> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('allBets' in $$props) $$invalidate(5, allBets = $$props.allBets);
    		if ('winners' in $$props) $$invalidate(1, winners = $$props.winners);
    		if ('prize' in $$props) $$invalidate(2, prize = $$props.prize);
    		if ('turn' in $$props) $$invalidate(3, turn = $$props.turn);
    	};

    	$$self.$capture_state = () => ({
    		darkMode,
    		allBets,
    		winners,
    		prize,
    		turn,
    		getWinnersText,
    		setToString
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('allBets' in $$props) $$invalidate(5, allBets = $$props.allBets);
    		if ('winners' in $$props) $$invalidate(1, winners = $$props.winners);
    		if ('prize' in $$props) $$invalidate(2, prize = $$props.prize);
    		if ('turn' in $$props) $$invalidate(3, turn = $$props.turn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkMode, winners, prize, turn, getWinnersText, allBets];
    }

    class Winners extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			darkMode: 0,
    			allBets: 5,
    			winners: 1,
    			prize: 2,
    			turn: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Winners",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<Winners>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<Winners>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allBets() {
    		throw new Error("<Winners>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allBets(value) {
    		throw new Error("<Winners>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winners() {
    		throw new Error("<Winners>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winners(value) {
    		throw new Error("<Winners>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prize() {
    		throw new Error("<Winners>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prize(value) {
    		throw new Error("<Winners>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get turn() {
    		throw new Error("<Winners>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set turn(value) {
    		throw new Error("<Winners>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Stages\ListBets.svelte generated by Svelte v3.59.2 */

    const file$1 = "src\\Stages\\ListBets.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let textarea;
    	let textarea_value_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			textarea = element("textarea");
    			attr_dev(textarea, "cols", "34");
    			attr_dev(textarea, "rows", "15");
    			textarea.disabled = true;
    			textarea.value = textarea_value_value = "" + /*allText*/ ctx[1] + "\r\n    ";
    			attr_dev(textarea, "class", "svelte-bzjpxf");
    			toggle_class(textarea, "dark", /*darkMode*/ ctx[0]);
    			add_location(textarea, file$1, 35, 4, 718);
    			attr_dev(div, "class", "svelte-bzjpxf");
    			toggle_class(div, "dark", /*darkMode*/ ctx[0]);
    			add_location(div, file$1, 34, 0, 685);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, textarea);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*allText*/ 2 && textarea_value_value !== (textarea_value_value = "" + /*allText*/ ctx[1] + "\r\n    ")) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(textarea, "dark", /*darkMode*/ ctx[0]);
    			}

    			if (dirty & /*darkMode*/ 1) {
    				toggle_class(div, "dark", /*darkMode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots('ListBets', slots, []);
    	let { darkMode } = $$props;
    	let { allBets } = $$props;
    	let { nBet } = $$props;
    	let allText;

    	const getAllBets = () => {
    		let aux = "";

    		for (let i = 0; i < nBet; i++) {
    			let currBet = allBets[1000 + i];
    			aux += "ID da aposta " + currBet.id;
    			aux += "\nNome do participante: " + currBet.name;
    			aux += "\nNúmeros apostados: " + setToString(currBet.bet) + "\n\n";
    		}

    		return aux;
    	};

    	const setToString = e => {
    		let aux = "";

    		e.forEach(i => {
    			aux += i + " ";
    		});

    		return aux;
    	};

    	allText = getAllBets();

    	$$self.$$.on_mount.push(function () {
    		if (darkMode === undefined && !('darkMode' in $$props || $$self.$$.bound[$$self.$$.props['darkMode']])) {
    			console.warn("<ListBets> was created without expected prop 'darkMode'");
    		}

    		if (allBets === undefined && !('allBets' in $$props || $$self.$$.bound[$$self.$$.props['allBets']])) {
    			console.warn("<ListBets> was created without expected prop 'allBets'");
    		}

    		if (nBet === undefined && !('nBet' in $$props || $$self.$$.bound[$$self.$$.props['nBet']])) {
    			console.warn("<ListBets> was created without expected prop 'nBet'");
    		}
    	});

    	const writable_props = ['darkMode', 'allBets', 'nBet'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListBets> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('allBets' in $$props) $$invalidate(2, allBets = $$props.allBets);
    		if ('nBet' in $$props) $$invalidate(3, nBet = $$props.nBet);
    	};

    	$$self.$capture_state = () => ({
    		darkMode,
    		allBets,
    		nBet,
    		allText,
    		getAllBets,
    		setToString
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    		if ('allBets' in $$props) $$invalidate(2, allBets = $$props.allBets);
    		if ('nBet' in $$props) $$invalidate(3, nBet = $$props.nBet);
    		if ('allText' in $$props) $$invalidate(1, allText = $$props.allText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkMode, allText, allBets, nBet];
    }

    class ListBets extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { darkMode: 0, allBets: 2, nBet: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListBets",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get darkMode() {
    		throw new Error("<ListBets>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<ListBets>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allBets() {
    		throw new Error("<ListBets>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allBets(value) {
    		throw new Error("<ListBets>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nBet() {
    		throw new Error("<ListBets>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nBet(value) {
    		throw new Error("<ListBets>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (100:1) {#if showModal}
    function create_if_block_11(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};
    			if (dirty & /*darkMode*/ 256) modal_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode*/ 4194560) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(100:1) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    // (101:2) <Modal {darkMode}>
    function create_default_slot_7(ctx) {
    	let addghost;
    	let current;

    	addghost = new AddGhost({
    			props: { darkMode: /*darkMode*/ ctx[8] },
    			$$inline: true
    		});

    	addghost.$on("addGhost", /*addGhost*/ ctx[15]);

    	const block = {
    		c: function create() {
    			create_component(addghost.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(addghost, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const addghost_changes = {};
    			if (dirty & /*darkMode*/ 256) addghost_changes.darkMode = /*darkMode*/ ctx[8];
    			addghost.$set(addghost_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addghost.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addghost.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addghost, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(101:2) <Modal {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (106:2) {#if currStage === "menu"}
    function create_if_block_10(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				$$slots: { default: [create_default_slot_6] },
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
    			if (dirty & /*darkMode*/ 256) box_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode*/ 4194560) {
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
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(106:2) {#if currStage === \\\"menu\\\"}",
    		ctx
    	});

    	return block;
    }

    // (107:3) <Box {darkMode}>
    function create_default_slot_6(ctx) {
    	let menu;
    	let current;

    	menu = new Menu({
    			props: { darkMode: /*darkMode*/ ctx[8] },
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
    			if (dirty & /*darkMode*/ 256) menu_changes.darkMode = /*darkMode*/ ctx[8];
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
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(107:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (112:2) {#if currStage === "bet"}
    function create_if_block_9(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				$$slots: { default: [create_default_slot_5] },
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
    			if (dirty & /*darkMode*/ 256) box_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode, generalId*/ 4194562) {
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
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(112:2) {#if currStage === \\\"bet\\\"}",
    		ctx
    	});

    	return block;
    }

    // (113:3) <Box {darkMode}>
    function create_default_slot_5(ctx) {
    	let addbet;
    	let current;

    	addbet = new AddBet({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				generalId: /*generalId*/ ctx[1]
    			},
    			$$inline: true
    		});

    	addbet.$on("addBet", /*addBet*/ ctx[11]);

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
    			if (dirty & /*darkMode*/ 256) addbet_changes.darkMode = /*darkMode*/ ctx[8];
    			if (dirty & /*generalId*/ 2) addbet_changes.generalId = /*generalId*/ ctx[1];
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
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(113:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (118:2) {#if currStage === "manual"}
    function create_if_block_8(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
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
    			if (dirty & /*darkMode*/ 256) box_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode, generalId*/ 4194562) {
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
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(118:2) {#if currStage === \\\"manual\\\"}",
    		ctx
    	});

    	return block;
    }

    // (119:3) <Box {darkMode}>
    function create_default_slot_4(ctx) {
    	let manualbet;
    	let current;

    	manualbet = new ManualBet({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				generalId: /*generalId*/ ctx[1]
    			},
    			$$inline: true
    		});

    	manualbet.$on("manualBet", /*manualBet*/ ctx[12]);

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
    			if (dirty & /*darkMode*/ 256) manualbet_changes.darkMode = /*darkMode*/ ctx[8];
    			if (dirty & /*generalId*/ 2) manualbet_changes.generalId = /*generalId*/ ctx[1];
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(119:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (124:2) {#if currStage === "betDone"}
    function create_if_block_7(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
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
    			if (dirty & /*darkMode*/ 256) box_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode, currStage*/ 4194688) {
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
    		source: "(124:2) {#if currStage === \\\"betDone\\\"}",
    		ctx
    	});

    	return block;
    }

    // (125:3) <Box {darkMode}>
    function create_default_slot_3(ctx) {
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
    			add_location(h1, file, 125, 4, 2346);
    			attr_dev(button, "class", "svelte-cfsnx6");
    			toggle_class(button, "dark", /*darkMode*/ ctx[8]);
    			add_location(button, file, 126, 4, 2377);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[16], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 256) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[8]);
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
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(125:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (131:2) {#if currStage === "list"}
    function create_if_block_6(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
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
    			if (dirty & /*darkMode*/ 256) box_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode, allBets, nBet*/ 4194572) {
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
    		source: "(131:2) {#if currStage === \\\"list\\\"}",
    		ctx
    	});

    	return block;
    }

    // (132:3) <Box {darkMode}>
    function create_default_slot_2(ctx) {
    	let listbets;
    	let current;

    	listbets = new ListBets({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				allBets: /*allBets*/ ctx[2],
    				nBet: /*nBet*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(listbets.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listbets, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listbets_changes = {};
    			if (dirty & /*darkMode*/ 256) listbets_changes.darkMode = /*darkMode*/ ctx[8];
    			if (dirty & /*allBets*/ 4) listbets_changes.allBets = /*allBets*/ ctx[2];
    			if (dirty & /*nBet*/ 8) listbets_changes.nBet = /*nBet*/ ctx[3];
    			listbets.$set(listbets_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listbets.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listbets.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listbets, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(132:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (137:2) {#if currStage === "draw"}
    function create_if_block_5(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
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
    			if (dirty & /*darkMode*/ 256) box_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode, prize, allBets, nBet*/ 4194588) {
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
    		source: "(137:2) {#if currStage === \\\"draw\\\"}",
    		ctx
    	});

    	return block;
    }

    // (138:3) <Box {darkMode}>
    function create_default_slot_1(ctx) {
    	let startdraw;
    	let current;

    	startdraw = new StartDraw({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				prize: /*prize*/ ctx[4],
    				allBets: /*allBets*/ ctx[2],
    				nBet: /*nBet*/ ctx[3],
    				draw: /*newRandomBet*/ ctx[9]()
    			},
    			$$inline: true
    		});

    	startdraw.$on("winnersList", /*handleWinners*/ ctx[13]);
    	startdraw.$on("winnersInfo", /*handleWinnersInfo*/ ctx[14]);

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
    			if (dirty & /*darkMode*/ 256) startdraw_changes.darkMode = /*darkMode*/ ctx[8];
    			if (dirty & /*prize*/ 16) startdraw_changes.prize = /*prize*/ ctx[4];
    			if (dirty & /*allBets*/ 4) startdraw_changes.allBets = /*allBets*/ ctx[2];
    			if (dirty & /*nBet*/ 8) startdraw_changes.nBet = /*nBet*/ ctx[3];
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(138:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (143:2) {#if currStage === "winners"}
    function create_if_block_4(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
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
    			if (dirty & /*darkMode*/ 256) box_changes.darkMode = /*darkMode*/ ctx[8];

    			if (dirty & /*$$scope, darkMode, winners, allBets, prize, turn*/ 4194676) {
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
    		source: "(143:2) {#if currStage === \\\"winners\\\"}",
    		ctx
    	});

    	return block;
    }

    // (144:3) <Box {darkMode}>
    function create_default_slot(ctx) {
    	let winners_1;
    	let current;

    	winners_1 = new Winners({
    			props: {
    				darkMode: /*darkMode*/ ctx[8],
    				winners: /*winners*/ ctx[5],
    				allBets: /*allBets*/ ctx[2],
    				prize: /*prize*/ ctx[4],
    				turn: /*turn*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(winners_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(winners_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const winners_1_changes = {};
    			if (dirty & /*darkMode*/ 256) winners_1_changes.darkMode = /*darkMode*/ ctx[8];
    			if (dirty & /*winners*/ 32) winners_1_changes.winners = /*winners*/ ctx[5];
    			if (dirty & /*allBets*/ 4) winners_1_changes.allBets = /*allBets*/ ctx[2];
    			if (dirty & /*prize*/ 16) winners_1_changes.prize = /*prize*/ ctx[4];
    			if (dirty & /*turn*/ 64) winners_1_changes.turn = /*turn*/ ctx[6];
    			winners_1.$set(winners_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(winners_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(winners_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(winners_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(144:3) <Box {darkMode}>",
    		ctx
    	});

    	return block;
    }

    // (153:2) {#if currStage === "menu" || currStage === "list"}
    function create_if_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Apostar";
    			attr_dev(button, "class", "svelte-cfsnx6");
    			toggle_class(button, "dark", /*darkMode*/ ctx[8]);
    			add_location(button, file, 153, 3, 3124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[17], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 256) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[8]);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(153:2) {#if currStage === \\\"menu\\\" || currStage === \\\"list\\\"}",
    		ctx
    	});

    	return block;
    }

    // (157:2) {#if currStage === "bet"}
    function create_if_block_2(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Voltar ao menu";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Adicionar participantes fantasma";
    			attr_dev(button0, "class", "svelte-cfsnx6");
    			toggle_class(button0, "dark", /*darkMode*/ ctx[8]);
    			add_location(button0, file, 157, 3, 3244);
    			attr_dev(button1, "class", "svelte-cfsnx6");
    			toggle_class(button1, "dark", /*darkMode*/ ctx[8]);
    			add_location(button1, file, 158, 3, 3335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[18], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[19], { once: true }, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 256) {
    				toggle_class(button0, "dark", /*darkMode*/ ctx[8]);
    			}

    			if (dirty & /*darkMode*/ 256) {
    				toggle_class(button1, "dark", /*darkMode*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(157:2) {#if currStage === \\\"bet\\\"}",
    		ctx
    	});

    	return block;
    }

    // (162:2) {#if nBet > 0 && currStage !== "list" && currStage !== "draw"}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Ver apostas";
    			attr_dev(button, "class", "svelte-cfsnx6");
    			toggle_class(button, "dark", /*darkMode*/ ctx[8]);
    			add_location(button, file, 162, 3, 3519);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[20], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 256) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[8]);
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
    		source: "(162:2) {#if nBet > 0 && currStage !== \\\"list\\\" && currStage !== \\\"draw\\\"}",
    		ctx
    	});

    	return block;
    }

    // (166:2) {#if nBet > 0 && currStage !== "draw"}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Iniciar Sorteio";
    			attr_dev(button, "class", "svelte-cfsnx6");
    			toggle_class(button, "dark", /*darkMode*/ ctx[8]);
    			add_location(button, file, 166, 3, 3657);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[21], { once: true }, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*darkMode*/ 256) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[8]);
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
    		source: "(166:2) {#if nBet > 0 && currStage !== \\\"draw\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let div1;
    	let button;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showModal*/ ctx[0] && create_if_block_11(ctx);
    	let if_block1 = /*currStage*/ ctx[7] === "menu" && create_if_block_10(ctx);
    	let if_block2 = /*currStage*/ ctx[7] === "bet" && create_if_block_9(ctx);
    	let if_block3 = /*currStage*/ ctx[7] === "manual" && create_if_block_8(ctx);
    	let if_block4 = /*currStage*/ ctx[7] === "betDone" && create_if_block_7(ctx);
    	let if_block5 = /*currStage*/ ctx[7] === "list" && create_if_block_6(ctx);
    	let if_block6 = /*currStage*/ ctx[7] === "draw" && create_if_block_5(ctx);
    	let if_block7 = /*currStage*/ ctx[7] === "winners" && create_if_block_4(ctx);
    	let if_block8 = (/*currStage*/ ctx[7] === "menu" || /*currStage*/ ctx[7] === "list") && create_if_block_3(ctx);
    	let if_block9 = /*currStage*/ ctx[7] === "bet" && create_if_block_2(ctx);
    	let if_block10 = /*nBet*/ ctx[3] > 0 && /*currStage*/ ctx[7] !== "list" && /*currStage*/ ctx[7] !== "draw" && create_if_block_1(ctx);
    	let if_block11 = /*nBet*/ ctx[3] > 0 && /*currStage*/ ctx[7] !== "draw" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			t5 = space();
    			if (if_block6) if_block6.c();
    			t6 = space();
    			if (if_block7) if_block7.c();
    			t7 = space();
    			div1 = element("div");
    			button = element("button");
    			t8 = text("Dark Mode: ");
    			t9 = text(/*darkMode*/ ctx[8]);
    			t10 = space();
    			if (if_block8) if_block8.c();
    			t11 = space();
    			if (if_block9) if_block9.c();
    			t12 = space();
    			if (if_block10) if_block10.c();
    			t13 = space();
    			if (if_block11) if_block11.c();
    			attr_dev(div0, "class", "mainDiv svelte-cfsnx6");
    			add_location(div0, file, 104, 1, 1919);
    			attr_dev(button, "class", "svelte-cfsnx6");
    			toggle_class(button, "dark", /*darkMode*/ ctx[8]);
    			add_location(button, file, 151, 2, 2981);
    			attr_dev(div1, "class", "buttons svelte-cfsnx6");
    			add_location(div1, file, 150, 1, 2957);
    			attr_dev(main, "class", "backGround svelte-cfsnx6");
    			toggle_class(main, "dark", /*darkMode*/ ctx[8]);
    			add_location(main, file, 98, 0, 1765);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			append_dev(main, div0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block3) if_block3.m(div0, null);
    			append_dev(div0, t3);
    			if (if_block4) if_block4.m(div0, null);
    			append_dev(div0, t4);
    			if (if_block5) if_block5.m(div0, null);
    			append_dev(div0, t5);
    			if (if_block6) if_block6.m(div0, null);
    			append_dev(div0, t6);
    			if (if_block7) if_block7.m(div0, null);
    			append_dev(main, t7);
    			append_dev(main, div1);
    			append_dev(div1, button);
    			append_dev(button, t8);
    			append_dev(button, t9);
    			append_dev(div1, t10);
    			if (if_block8) if_block8.m(div1, null);
    			append_dev(div1, t11);
    			if (if_block9) if_block9.m(div1, null);
    			append_dev(div1, t12);
    			if (if_block10) if_block10.m(div1, null);
    			append_dev(div1, t13);
    			if (if_block11) if_block11.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleDarkMode*/ ctx[10], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*showModal*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_11(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[7] === "menu") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*currStage*/ 128) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_10(ctx);
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

    			if (/*currStage*/ ctx[7] === "bet") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*currStage*/ 128) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_9(ctx);
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

    			if (/*currStage*/ ctx[7] === "manual") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*currStage*/ 128) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_8(ctx);
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

    			if (/*currStage*/ ctx[7] === "betDone") {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*currStage*/ 128) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_7(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div0, t4);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[7] === "list") {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty & /*currStage*/ 128) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_6(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(div0, t5);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[7] === "draw") {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty & /*currStage*/ 128) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block_5(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(div0, t6);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (/*currStage*/ ctx[7] === "winners") {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);

    					if (dirty & /*currStage*/ 128) {
    						transition_in(if_block7, 1);
    					}
    				} else {
    					if_block7 = create_if_block_4(ctx);
    					if_block7.c();
    					transition_in(if_block7, 1);
    					if_block7.m(div0, null);
    				}
    			} else if (if_block7) {
    				group_outros();

    				transition_out(if_block7, 1, 1, () => {
    					if_block7 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*darkMode*/ 256) set_data_dev(t9, /*darkMode*/ ctx[8]);

    			if (!current || dirty & /*darkMode*/ 256) {
    				toggle_class(button, "dark", /*darkMode*/ ctx[8]);
    			}

    			if (/*currStage*/ ctx[7] === "menu" || /*currStage*/ ctx[7] === "list") {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);
    				} else {
    					if_block8 = create_if_block_3(ctx);
    					if_block8.c();
    					if_block8.m(div1, t11);
    				}
    			} else if (if_block8) {
    				if_block8.d(1);
    				if_block8 = null;
    			}

    			if (/*currStage*/ ctx[7] === "bet") {
    				if (if_block9) {
    					if_block9.p(ctx, dirty);
    				} else {
    					if_block9 = create_if_block_2(ctx);
    					if_block9.c();
    					if_block9.m(div1, t12);
    				}
    			} else if (if_block9) {
    				if_block9.d(1);
    				if_block9 = null;
    			}

    			if (/*nBet*/ ctx[3] > 0 && /*currStage*/ ctx[7] !== "list" && /*currStage*/ ctx[7] !== "draw") {
    				if (if_block10) {
    					if_block10.p(ctx, dirty);
    				} else {
    					if_block10 = create_if_block_1(ctx);
    					if_block10.c();
    					if_block10.m(div1, t13);
    				}
    			} else if (if_block10) {
    				if_block10.d(1);
    				if_block10 = null;
    			}

    			if (/*nBet*/ ctx[3] > 0 && /*currStage*/ ctx[7] !== "draw") {
    				if (if_block11) {
    					if_block11.p(ctx, dirty);
    				} else {
    					if_block11 = create_if_block(ctx);
    					if_block11.c();
    					if_block11.m(div1, null);
    				}
    			} else if (if_block11) {
    				if_block11.d(1);
    				if_block11 = null;
    			}

    			if (!current || dirty & /*darkMode*/ 256) {
    				toggle_class(main, "dark", /*darkMode*/ ctx[8]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);
    			transition_in(if_block7);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			transition_out(if_block7);
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
    			if (if_block8) if_block8.d();
    			if (if_block9) if_block9.d();
    			if (if_block10) if_block10.d();
    			if (if_block11) if_block11.d();
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
    	let showModal = false;
    	let generalId = 1000;
    	let allBets = new Set();
    	let nBet = 0;
    	let prize = 2535;
    	let winners = [];
    	let turn;
    	let currStage = "menu";
    	let darkMode = true;

    	const newRandomBet = () => {
    		let currBet = new Set();
    		while (currBet.size < 5) currBet.add(Math.floor(Math.random() * 50) + 1);
    		return currBet;
    	};

    	const handleDarkMode = () => {
    		$$invalidate(8, darkMode = !darkMode);
    	};

    	const addBet = e => {
    		$$invalidate(2, allBets[generalId] = e.detail, allBets);

    		if (e.detail.betType == "auto") {
    			e.detail.bet = newRandomBet();
    			$$invalidate(7, currStage = "betDone");
    			$$invalidate(1, generalId++, generalId);
    			$$invalidate(3, nBet++, nBet);
    		} else {
    			$$invalidate(7, currStage = "manual");
    		}
    	};

    	const manualBet = e => {
    		let aux = allBets[generalId];
    		aux.bet = e.detail;
    		$$invalidate(1, generalId++, generalId);
    		$$invalidate(3, nBet++, nBet);
    		$$invalidate(7, currStage = "betDone");
    	};

    	const handleWinners = e => {
    		$$invalidate(5, winners = e.detail);
    		$$invalidate(7, currStage = "winners");
    		$$invalidate(3, nBet = 0);
    	};

    	const handleWinnersInfo = e => {
    		$$invalidate(6, turn = e.detail.turn);
    		$$invalidate(4, prize = e.detail.prize);
    		console.log(turn, prize);
    	};

    	const addGhost = n => {
    		$$invalidate(0, showModal = false);
    		let phName = "Name";
    		let phCpf = "CPF";

    		for (let i = 0; i < n.detail; i++) {
    			$$invalidate(
    				2,
    				allBets[generalId] = {
    					name: phName + (generalId - 1000),
    					cpf: phCpf + (generalId - 1000),
    					betType: "auto",
    					bet: newRandomBet(),
    					id: generalId
    				},
    				allBets
    			);

    			$$invalidate(1, generalId++, generalId);
    			$$invalidate(3, nBet++, nBet);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(7, currStage = "bet");
    	};

    	const click_handler_1 = () => {
    		$$invalidate(7, currStage = "bet");
    	};

    	const click_handler_2 = () => {
    		$$invalidate(7, currStage = "menu");
    	};

    	const click_handler_3 = () => $$invalidate(0, showModal = true);

    	const click_handler_4 = () => {
    		$$invalidate(7, currStage = "list");
    	};

    	const click_handler_5 = () => {
    		$$invalidate(7, currStage = "draw");
    	};

    	$$self.$capture_state = () => ({
    		Box,
    		AddBet,
    		ManualBet,
    		Menu,
    		StartDraw,
    		Modal,
    		AddGhost,
    		Winners,
    		ListBets,
    		showModal,
    		generalId,
    		allBets,
    		nBet,
    		prize,
    		winners,
    		turn,
    		currStage,
    		darkMode,
    		newRandomBet,
    		handleDarkMode,
    		addBet,
    		manualBet,
    		handleWinners,
    		handleWinnersInfo,
    		addGhost
    	});

    	$$self.$inject_state = $$props => {
    		if ('showModal' in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ('generalId' in $$props) $$invalidate(1, generalId = $$props.generalId);
    		if ('allBets' in $$props) $$invalidate(2, allBets = $$props.allBets);
    		if ('nBet' in $$props) $$invalidate(3, nBet = $$props.nBet);
    		if ('prize' in $$props) $$invalidate(4, prize = $$props.prize);
    		if ('winners' in $$props) $$invalidate(5, winners = $$props.winners);
    		if ('turn' in $$props) $$invalidate(6, turn = $$props.turn);
    		if ('currStage' in $$props) $$invalidate(7, currStage = $$props.currStage);
    		if ('darkMode' in $$props) $$invalidate(8, darkMode = $$props.darkMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showModal,
    		generalId,
    		allBets,
    		nBet,
    		prize,
    		winners,
    		turn,
    		currStage,
    		darkMode,
    		newRandomBet,
    		handleDarkMode,
    		addBet,
    		manualBet,
    		handleWinners,
    		handleWinnersInfo,
    		addGhost,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
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
