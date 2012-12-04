(function(o2, window) {
    'use strict';

    var classes = o2.protecteds.classes,

        /*
         * # Aliases
         */

        dbg    = o2.Debugger,
        assert = dbg.assert,
        log    = dbg.log,
        init   = dbg.init,
        error  = dbg.error,

        /*
         * # State Information
         */

        /*
         * Contains meta information about the modules to be tested.
         */
        queue   = [],

        /*
         * A stack of <code>RunPromise</code>s
         */
        promises = [];

        /*
         * Contains an aggregated data for the overall status of the test Suites
         * that have run so far.
         */
        state = {
            totalFailureCount : 0,
            totalSuccessCount : 0
        };

    /*
     *
     */
    (function initialize() {
        init('Output', false);

        var key     = null,
            itemKey = null,
            modules = {},
            items   = null;

        for (key in classes) {
            if (classes.hasOwnProperty(key)) {
                items = classes[key].items;

                for (itemKey in items) {
                    if (items.hasOwnProperty(itemKey)) {
                        modules[items[itemKey].MODULE] = items[itemKey].MODULE;
                    }
                }
            }
        }

        for (key in modules) {
            if (modules.hasOwnProperty(key)) {
                queue.push(key);
            }
        }
    }());


    /*
     *
     */
    var RunPromise = (function() {

        /*
         *
         */
        function incrementFailureCount() {
            state.totalFailureCount++;
        }

        /*
         *
         */
        function incrementSuccessCount() {
            state.totalSuccessCount++;
        }

        /*
         *
         */
        function RunPromise(file) {
            this.file      = file;
            this.timerId   = null;
            this.delegates = [];
        }

        /*
         *
         */
        RunPromise.prototype.keep = function() {
            clearTimeout(this.timerId);

            var file            = this.file,
                id              = 0,
                kPromiseTimeout = 1000;

            log(['Started testing "', this.file , '"...'].join(''));

            if (!file) {
                this.reject();

                return;
            }

            var self = this;

            this.timerId = setTimeout(function() {
                error(['Rejecting "', self.file,
                      '". Test suite timed out.'].join(''));

                self.reject();
            }, kPromiseTimeout);
        };

        /*
         *
         */
        RunPromise.prototype.reject = function() {
            incrementFailureCount();

            for(var i = 0, len = this.delegates.length; i < len; i++) {
                this.delegates[i]();
            }

            window.scrollTop = window.scrollHeight;
        };

        /*
         *
         */
        RunPromise.prototype.resolve = function() {
            incrementSuccessCount();

            for(var i = 0, len = this.delegates.length; i < len; i++) {
                this.delegates[i]();
            }

            window.scrollTop = window.scrollHeight;
        };

        /*
         *
         */
        RunPromise.prototype.always = function(delegate) {
            this.delegates.push(delegate);
        };

        return { klass : RunPromise };
    }()).klass;

    /*
     *
     */
    var Runner = (function() {
        var isRunnerInited = false;

        /*
         *
         */
        var Runner = {

            /*
             *
             */
            init : function() {
                if (isRunnerInited) { return Runner; }

                o2.Debugger.init('Output', false);

                return Runner;
            },

            /*
             *
             */
            run : function() {
                if (!isRunnerInited) { throw 'Initialize Runner first.'; }

                var promise = new RunPromise(queue.pop());

                promises.push(promise);

                promise.always(function() {
                    if (queue.length === 0) {
                        assert(state.totalFailureCount === 0, [
                            '<p><b>All done!</b> ',
                            'Total failure count: <b>',
                            state.totalFailureCount, '</b>, ',
                            'Total success count: <b>',
                            state.totalSuccessCount, '</b>.</p>'
                        ].join(''));

                        return;
                    }

                    Runner.run();
                });

                promise.keep();

                log('<p>Started <b>"Test Suite Runner"</b>.</p>');

                isRunnerInited = true;

                return Runner;
            }
        };

        return { klass : Runner };
    }()).klass.init().run();

    (function(window, promises) {

        function findPromise(file) {
            var i       = 0,
                len     = promises.length,
                promise = null;

            for (i = 0; i < len; i++) {
                promise = promises[i];

                if (promise.file === file) {
                    return promise;
                }
            }

            return null;
        }

        function deletePromise(promise) {
            var i              = 0,
                len            = promises.length,
                currentPromise = null;

            for (i = 0; i < len; i++) {
                currentPromise = promises[i];

                if (currentPromise === promise) {
                    promises.splice(i, 1);

                    return;
                }
            }

            return;
        }

        /*
         * Runner extends Observer
         */
        window.Runner = {
            notify : function(file) {
                var promise = findPromise(file);

                if (promise) {
                    promise.resolve();
                }

                deletePromise(promise);
            }
        };
    }(window, promises));
}(this.o2, this));

