
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
      nativeForEach      = ArrayProto.forEach,
      nativeMap          = ArrayProto.map,
      nativeReduce       = ArrayProto.reduce,
      nativeReduceRight  = ArrayProto.reduceRight,
      nativeFilter       = ArrayProto.filter,
      nativeEvery        = ArrayProto.every,
      nativeSome         = ArrayProto.some,
      nativeIndexOf      = ArrayProto.indexOf,
      nativeLastIndexOf  = ArrayProto.lastIndexOf,
      nativeIsArray      = Array.isArray,
      nativeKeys         = Object.keys,
      nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
          var a = left.criteria;
          var b = right.criteria;
          if (a !== b) {
            if (a > b || a === void 0) return 1;
            if (a < b || b === void 0) return -1;
          }
          return left.index < right.index ? -1 : 1;
        }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

  // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
            a.global == b.global &&
            a.multiline == b.multiline &&
            a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
          _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
          .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD define happens at the end for compatibility with AMD loaders
  // that don't enforce next-turn semantics on modules.
  if (typeof define === 'function' && define.amd) {
    define('underscore',[], function() {
      return _;
    });
  }

}).call(this);

/*!
 * jQuery JavaScript Library v1.9.1
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2012 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-2-4
 */
(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//
var
	// The deferred used on DOM ready
	readyList,

	// A central reference to the root jQuery(document)
	rootjQuery,

	// Support: IE<9
	// For `typeof node.method` instead of `node.method !== undefined`
	core_strundefined = typeof undefined,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,
	location = window.location,

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// [[Class]] -> type pairs
	class2type = {},

	// List of deleted data cache ids, so we can reuse them
	core_deletedIds = [],

	core_version = "1.9.1",

	// Save a reference to some core methods
	core_concat = core_deletedIds.concat,
	core_push = core_deletedIds.push,
	core_slice = core_deletedIds.slice,
	core_indexOf = core_deletedIds.indexOf,
	core_toString = class2type.toString,
	core_hasOwn = class2type.hasOwnProperty,
	core_trim = core_version.trim,

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Used for matching numbers
	core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

	// Used for splitting on whitespace
	core_rnotwhite = /\S+/g,

	// Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

	// JSON RegExp
	rvalidchars = /^[\],:{}\s]*$/,
	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
	rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
	rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	},

	// The ready event handler
	completed = function( event ) {

		// readyState === "complete" is good enough for us to call the dom ready in oldIE
		if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
			detach();
			jQuery.ready();
		}
	},
	// Clean-up method for dom ready events
	detach = function() {
		if ( document.addEventListener ) {
			document.removeEventListener( "DOMContentLoaded", completed, false );
			window.removeEventListener( "load", completed, false );

		} else {
			document.detachEvent( "onreadystatechange", completed );
			window.detachEvent( "onload", completed );
		}
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: core_version,

	constructor: jQuery,
	init: function( selector, context, rootjQuery ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	// The number of elements contained in the matched element set
	size: function() {
		return this.length;
	},

	toArray: function() {
		return core_slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	ready: function( fn ) {
		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	},

	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: core_push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	noConflict: function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( !document.body ) {
			return setTimeout( jQuery.ready );
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	isWindow: function( obj ) {
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return String( obj );
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ core_toString.call(obj) ] || "object" :
			typeof obj;
	},

	isPlainObject: function( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!core_hasOwn.call(obj, "constructor") &&
				!core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.

		var key;
		for ( key in obj ) {}

		return key === undefined || core_hasOwn.call( obj, key );
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	error: function( msg ) {
		throw new Error( msg );
	},

	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	parseHTML: function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}
		context = context || document;

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[1] ) ];
		}

		parsed = jQuery.buildFragment( [ data ], context, scripts );
		if ( scripts ) {
			jQuery( scripts ).remove();
		}
		return jQuery.merge( [], parsed.childNodes );
	},

	parseJSON: function( data ) {
		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		if ( data === null ) {
			return data;
		}

		if ( typeof data === "string" ) {

			// Make sure leading/trailing whitespace is removed (IE can't handle it)
			data = jQuery.trim( data );

			if ( data ) {
				// Make sure the incoming data is actual JSON
				// Logic borrowed from http://json.org/json2.js
				if ( rvalidchars.test( data.replace( rvalidescape, "@" )
					.replace( rvalidtokens, "]" )
					.replace( rvalidbraces, "")) ) {

					return ( new Function( "return " + data ) )();
				}
			}
		}

		jQuery.error( "Invalid JSON: " + data );
	},

	// Cross-browser xml parsing
	parseXML: function( data ) {
		var xml, tmp;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		try {
			if ( window.DOMParser ) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString( data , "text/xml" );
			} else { // IE
				xml = new ActiveXObject( "Microsoft.XMLDOM" );
				xml.async = "false";
				xml.loadXML( data );
			}
		} catch( e ) {
			xml = undefined;
		}
		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	noop: function() {},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Use native String.trim function wherever possible
	trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
		function( text ) {
			return text == null ?
				"" :
				core_trim.call( text );
		} :

		// Otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				core_push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( core_indexOf ) {
				return core_indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var l = second.length,
			i = first.length,
			j = 0;

		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var retVal,
			ret = [],
			i = 0,
			length = elems.length;
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
		return core_concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = core_slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			length = elems.length,
			bulk = key == null;

		// Sets many values
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
			}

		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {
				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < length; i++ ) {
					fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
				}
			}
		}

		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				length ? fn( elems[0], key ) : emptyGet;
	},

	now: function() {
		return ( new Date() ).getTime();
	}
});

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );

		// If IE event model is used
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,
		// Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				args = args || [];
				args = [ context, args.slice ? args.slice() : args ];
				if ( list && ( !fired || stack ) ) {
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};
jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],
								fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});
jQuery.support = (function() {

	var support, all, a,
		input, select, fragment,
		opt, eventName, isSupported, i,
		div = document.createElement("div");

	// Setup
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// Support tests won't run in some limited or non-browser environments
	all = div.getElementsByTagName("*");
	a = div.getElementsByTagName("a")[ 0 ];
	if ( !all || !a || !all.length ) {
		return {};
	}

	// First batch of tests
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];

	a.style.cssText = "top:1px;float:left;opacity:.5";
	support = {
		// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
		getSetAttribute: div.className !== "t",

		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: div.firstChild.nodeType === 3,

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,

		// Get the style information from getAttribute
		// (IE uses .cssText instead)
		style: /top/.test( a.getAttribute("style") ),

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: a.getAttribute("href") === "/a",

		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.5/.test( a.style.opacity ),

		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,

		// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
		checkOn: !!input.value,

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: opt.selected,

		// Tests for enctype support on a form (#6743)
		enctype: !!document.createElement("form").enctype,

		// Makes sure cloning an html5 element does not cause problems
		// Where outerHTML is undefined, this still works
		html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",

		// jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode
		boxModel: document.compatMode === "CSS1Compat",

		// Will be defined later
		deleteExpando: true,
		noCloneEvent: true,
		inlineBlockNeedsLayout: false,
		shrinkWrapBlocks: false,
		reliableMarginRight: true,
		boxSizingReliable: true,
		pixelPosition: false
	};

	// Make sure checked status is properly cloned
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE<9
	try {
		delete div.test;
	} catch( e ) {
		support.deleteExpando = false;
	}

	// Check if we can trust getAttribute("value")
	input = document.createElement("input");
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";

	// #11217 - WebKit loses check when the name is after the checked attribute
	input.setAttribute( "checked", "t" );
	input.setAttribute( "name", "t" );

	fragment = document.createDocumentFragment();
	fragment.appendChild( input );

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	support.appendChecked = input.checked;

	// WebKit doesn't clone checked state correctly in fragments
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Opera does not clone events (and typeof div.attachEvent === undefined).
	// IE9-10 clones events bound via attachEvent, but they don't trigger with .click()
	if ( div.attachEvent ) {
		div.attachEvent( "onclick", function() {
			support.noCloneEvent = false;
		});

		div.cloneNode( true ).click();
	}

	// Support: IE<9 (lack submit/change bubble), Firefox 17+ (lack focusin event)
	// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP), test/csp.php
	for ( i in { submit: true, change: true, focusin: true }) {
		div.setAttribute( eventName = "on" + i, "t" );

		support[ i + "Bubbles" ] = eventName in window || div.attributes[ eventName ].expando === false;
	}

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Run tests that need a body at doc ready
	jQuery(function() {
		var container, marginDiv, tds,
			divReset = "padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",
			body = document.getElementsByTagName("body")[0];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

		body.appendChild( container ).appendChild( div );

		// Support: IE8
		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
		tds = div.getElementsByTagName("td");
		tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
		isSupported = ( tds[ 0 ].offsetHeight === 0 );

		tds[ 0 ].style.display = "";
		tds[ 1 ].style.display = "none";

		// Support: IE8
		// Check if empty table cells still have offsetWidth/Height
		support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

		// Check box-sizing and margin behavior
		div.innerHTML = "";
		div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
		support.boxSizing = ( div.offsetWidth === 4 );
		support.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== 1 );

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. (#3333)
			// Fails in WebKit before Feb 2011 nightlies
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = div.appendChild( document.createElement("div") );
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		if ( typeof div.style.zoom !== core_strundefined ) {
			// Support: IE<8
			// Check if natively block-level elements act like inline-block
			// elements when setting their display to 'inline' and giving
			// them layout
			div.innerHTML = "";
			div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
			support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

			// Support: IE6
			// Check if elements with layout shrink-wrap their children
			div.style.display = "block";
			div.innerHTML = "<div></div>";
			div.firstChild.style.width = "5px";
			support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );

			if ( support.inlineBlockNeedsLayout ) {
				// Prevent IE 6 from affecting layout for positioned elements #11048
				// Prevent IE from shrinking the body in IE 7 mode #12869
				// Support: IE<8
				body.style.zoom = 1;
			}
		}

		body.removeChild( container );

		// Null elements to avoid leaks in IE
		container = div = tds = marginDiv = null;
	});

	// Null elements to avoid leaks in IE
	all = select = fragment = opt = a = input = null;

	return support;
})();

var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

function internalData( elem, name, data, pvt /* Internal Use Only */ ){
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var thisCache, ret,
		internalKey = jQuery.expando,
		getByName = typeof name === "string",

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined ) {
		return;
	}

	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		if ( isNode ) {
			elem[ internalKey ] = id = core_deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey;
		}
	}

	if ( !cache[ id ] ) {
		cache[ id ] = {};

		// Avoids exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		if ( !isNode ) {
			cache[ id ].toJSON = jQuery.noop;
		}
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	if ( getByName ) {

		// First Try to find as-is property data
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var i, l, thisCache,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split(" ");
					}
				}
			} else {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			for ( i = 0, l = name.length; i < l; i++ ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
		delete cache[ id ];

	// When all else fails, null
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	cache: {},

	// Unique for each copy of jQuery on the page
	// Non-digits removed to match rinlinejQuery
	expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
		"applet": true
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	},

	// A method for determining if a DOM node can handle the data expando
	acceptData: function( elem ) {
		// Do not set data on non-element because it will not be cleared (#8335).
		if ( elem.nodeType && elem.nodeType !== 1 && elem.nodeType !== 9 ) {
			return false;
		}

		var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];

		// nodes accept data unless otherwise specified; rejection can be conditional
		return !noData || noData !== true && elem.getAttribute("classid") === noData;
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var attrs, name,
			elem = this[0],
			i = 0,
			data = null;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					attrs = elem.attributes;
					for ( ; i < attrs.length; i++ ) {
						name = attrs[i].name;

						if ( !name.indexOf( "data-" ) ) {
							name = jQuery.camelCase( name.slice(5) );

							dataAttr( elem, name, data[ name ] );
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return jQuery.access( this, function( value ) {

			if ( value === undefined ) {
				// Try to fetch any internally stored data first
				return elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : null;
			}

			this.each(function() {
				jQuery.data( this, key, value );
			});
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}
jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray(data) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		hooks.cur = fn;
		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				jQuery._removeData( elem, type + "queue" );
				jQuery._removeData( elem, key );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var nodeHook, boolHook,
	rclass = /[\t\r\n]/g,
	rreturn = /\r/g,
	rfocusable = /^(?:input|select|textarea|button|object)$/i,
	rclickable = /^(?:a|area)$/i,
	rboolean = /^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,
	ruseDefault = /^(?:checked|selected)$/i,
	getSetAttribute = jQuery.support.getSetAttribute,
	getSetInput = jQuery.support.input;

jQuery.fn.extend({
	attr: function( name, value ) {
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	},

	addClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}
					elem.className = jQuery.trim( cur );

				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}
					elem.className = value ? jQuery.trim( cur ) : "";
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isBool = typeof stateVal === "boolean";

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					state = stateVal,
					classNames = value.match( core_rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					state = isBool ? state : !self.hasClass( className );
					self[ state ? "addClass" : "removeClass" ]( className );
				}

			// Toggle whole class name
			} else if ( type === core_strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		var ret, hooks, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val,
				self = jQuery(this);

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, self.val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// attributes.value is undefined in Blackberry 4.7 but
				// uses .value. See #6932
				var val = elem.attributes.value;
				return !val || val.specified ? elem.value : elem.text;
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var values = jQuery.makeArray( value );

				jQuery(elem).find("option").each(function() {
					this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
				});

				if ( !values.length ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	attr: function( elem, name, value ) {
		var hooks, notxml, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === core_strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( notxml ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] || ( rboolean.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && notxml && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && notxml && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {

			// In IE9+, Flash objects don't have .getAttribute (#12945)
			// Support: IE9+
			if ( typeof elem.getAttribute !== core_strundefined ) {
				ret =  elem.getAttribute( name );
			}

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( core_rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( rboolean.test( name ) ) {
					// Set corresponding property to false for boolean attributes
					// Also clear defaultChecked/defaultSelected (if appropriate) for IE<8
					if ( !getSetAttribute && ruseDefault.test( name ) ) {
						elem[ jQuery.camelCase( "default-" + name ) ] =
							elem[ propName ] = false;
					} else {
						elem[ propName ] = false;
					}

				// See #9699 for explanation of this approach (setting first, then removal)
				} else {
					jQuery.attr( elem, name, "" );
				}

				elem.removeAttribute( getSetAttribute ? name : propName );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	propFix: {
		tabindex: "tabIndex",
		readonly: "readOnly",
		"for": "htmlFor",
		"class": "className",
		maxlength: "maxLength",
		cellspacing: "cellSpacing",
		cellpadding: "cellPadding",
		rowspan: "rowSpan",
		colspan: "colSpan",
		usemap: "useMap",
		frameborder: "frameBorder",
		contenteditable: "contentEditable"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				return ( elem[ name ] = value );
			}

		} else {
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
				return ret;

			} else {
				return elem[ name ];
			}
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				var attributeNode = elem.getAttributeNode("tabindex");

				return attributeNode && attributeNode.specified ?
					parseInt( attributeNode.value, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						undefined;
			}
		}
	}
});

// Hook for boolean attributes
boolHook = {
	get: function( elem, name ) {
		var
			// Use .prop to determine if this attribute is understood as boolean
			prop = jQuery.prop( elem, name ),

			// Fetch it accordingly
			attr = typeof prop === "boolean" && elem.getAttribute( name ),
			detail = typeof prop === "boolean" ?

				getSetInput && getSetAttribute ?
					attr != null :
					// oldIE fabricates an empty string for missing boolean attributes
					// and conflates checked/selected into attroperties
					ruseDefault.test( name ) ?
						elem[ jQuery.camelCase( "default-" + name ) ] :
						!!attr :

				// fetch an attribute node for properties not recognized as boolean
				elem.getAttributeNode( name );

		return detail && detail.value !== false ?
			name.toLowerCase() :
			undefined;
	},
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
			// IE<8 needs the *property* name
			elem.setAttribute( !getSetAttribute && jQuery.propFix[ name ] || name, name );

		// Use defaultChecked and defaultSelected for oldIE
		} else {
			elem[ jQuery.camelCase( "default-" + name ) ] = elem[ name ] = true;
		}

		return name;
	}
};

// fix oldIE value attroperty
if ( !getSetInput || !getSetAttribute ) {
	jQuery.attrHooks.value = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			return jQuery.nodeName( elem, "input" ) ?

				// Ignore the value *property* by using defaultValue
				elem.defaultValue :

				ret && ret.specified ? ret.value : undefined;
		},
		set: function( elem, value, name ) {
			if ( jQuery.nodeName( elem, "input" ) ) {
				// Does not return so that setAttribute is also used
				elem.defaultValue = value;
			} else {
				// Use nodeHook if defined (#1954); otherwise setAttribute is fine
				return nodeHook && nodeHook.set( elem, value, name );
			}
		}
	};
}

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			return ret && ( name === "id" || name === "name" || name === "coords" ? ret.value !== "" : ret.specified ) ?
				ret.value :
				undefined;
		},
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				elem.setAttributeNode(
					(ret = elem.ownerDocument.createAttribute( name ))
				);
			}

			ret.value = value += "";

			// Break association with cloned elements by also using setAttribute (#9646)
			return name === "value" || value === elem.getAttribute( name ) ?
				value :
				undefined;
		}
	};

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		get: nodeHook.get,
		set: function( elem, value, name ) {
			nodeHook.set( elem, value === "" ? false : value, name );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		});
	});
}


// Some attributes require a special call on IE
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !jQuery.support.hrefNormalized ) {
	jQuery.each([ "href", "src", "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			get: function( elem ) {
				var ret = elem.getAttribute( name, 2 );
				return ret == null ? undefined : ret;
			}
		});
	});

	// href/src property should get the full normalized URL (#10299/#12915)
	jQuery.each([ "href", "src" ], function( i, name ) {
		jQuery.propHooks[ name ] = {
			get: function( elem ) {
				return elem.getAttribute( name, 4 );
			}
		};
	});
}

if ( !jQuery.support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Note: IE uppercases css property names, but if we were to .toLowerCase()
			// .cssText, that would destroy case senstitivity in URL's, like in "background"
			return elem.style.cssText || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}

// Safari mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = jQuery.extend( jQuery.propHooks.selected, {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	});
}

// IE6/7 call enctype encoding
if ( !jQuery.support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}

// Radios and checkboxes getter/setter
if ( !jQuery.support.checkOn ) {
	jQuery.each([ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			get: function( elem ) {
				// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
				return elem.getAttribute("value") === null ? "on" : elem.value;
			}
		};
	});
}
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = jQuery.extend( jQuery.valHooks[ this ], {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	});
});
var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = core_hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		event.isTrigger = true;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
				!(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {
						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, ret, handleObj, matched, j,
			handlerQueue = [],
			args = core_slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var sel, handleObj, matches, i,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			for ( ; cur != this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			}
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== document.activeElement && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {
						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === document.activeElement && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Even when returnValue equals to undefined Firefox will still show alert
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{ type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			if ( typeof elem[ name ] === core_strundefined ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;
		if ( !e ) {
			return;
		}
		// If stopPropagation exists, run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "submitBubbles" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "submitBubbles", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !jQuery.support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "changeBubbles" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "changeBubbles", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var type, origFn;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});
/*!
 * Sizzle CSS Selector Engine
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
(function( window, undefined ) {

var i,
	cachedruns,
	Expr,
	getText,
	isXML,
	compile,
	hasDuplicate,
	outermostContext,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsXML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,
	sortOrder,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	support = {},
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Array methods
	arr = [],
	pop = arr.pop,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},


	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	operators = "([*^$|!~]?=)",
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*" ),
	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rsibling = /[\x20\t\r\n\f]*[+~]/,

	rnative = /^[^{]+\{\s*\[native code/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rescape = /'|\\/g,
	rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = /\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,
	funescape = function( _, escaped ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		return high !== high ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Use a stripped-down slice if we can't use a native one
try {
	slice.call( preferredDoc.documentElement.childNodes, 0 )[0].nodeType;
} catch ( e ) {
	slice = function( i ) {
		var elem,
			results = [];
		while ( (elem = this[i++]) ) {
			results.push( elem );
		}
		return results;
	};
}

/**
 * For feature detection
 * @param {Function} fn The function to test for native support
 */
function isNative( fn ) {
	return rnative.test( fn + "" );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var cache,
		keys = [];

	return (cache = function( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key += " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key ] = value);
	});
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return fn( div );
	} catch (e) {
		return false;
	} finally {
		// release memory in IE
		div = null;
	}
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( !documentIsXML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, slice.call(context.getElementsByTagName( selector ), 0) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getByClassName && context.getElementsByClassName ) {
				push.apply( results, slice.call(context.getElementsByClassName( m ), 0) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && !rbuggyQSA.test(selector) ) {
			old = true;
			nid = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && context.parentNode || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results, slice.call( newContext.querySelectorAll(
						newSelector
					), 0 ) );
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsXML = isXML( doc );

	// Check if getElementsByTagName("*") returns only elements
	support.tagNameNoComments = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if attributes should be retrieved by attribute nodes
	support.attributes = assert(function( div ) {
		div.innerHTML = "<select></select>";
		var type = typeof div.lastChild.getAttribute("multiple");
		// IE8 returns a string for some attributes even when not present
		return type !== "boolean" && type !== "string";
	});

	// Check if getElementsByClassName can be trusted
	support.getByClassName = assert(function( div ) {
		// Opera can't find a second classname (in 9.6)
		div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
		if ( !div.getElementsByClassName || !div.getElementsByClassName("e").length ) {
			return false;
		}

		// Safari 3.2 caches class attributes and doesn't catch changes
		div.lastChild.className = "e";
		return div.getElementsByClassName("e").length === 2;
	});

	// Check if getElementById returns elements by name
	// Check if getElementsByName privileges form controls or returns elements by ID
	support.getByName = assert(function( div ) {
		// Inject content
		div.id = expando + 0;
		div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
		docElem.insertBefore( div, docElem.firstChild );

		// Test
		var pass = doc.getElementsByName &&
			// buggy browsers will return fewer than the correct 2
			doc.getElementsByName( expando ).length === 2 +
			// buggy browsers will return more than the correct 0
			doc.getElementsByName( expando + 0 ).length;
		support.getIdNotName = !doc.getElementById( expando );

		// Cleanup
		docElem.removeChild( div );

		return pass;
	});

	// IE6/7 return modified attributes
	Expr.attrHandle = assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild && typeof div.firstChild.getAttribute !== strundefined &&
			div.firstChild.getAttribute("href") === "#";
	}) ?
		{} :
		{
			"href": function( elem ) {
				return elem.getAttribute( "href", 2 );
			},
			"type": function( elem ) {
				return elem.getAttribute("type");
			}
		};

	// ID find and filter
	if ( support.getIdNotName ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && !documentIsXML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && !documentIsXML ) {
				var m = context.getElementById( id );

				return m ?
					m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ?
						[m] :
						undefined :
					[];
			}
		};
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.tagNameNoComments ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Name
	Expr.find["NAME"] = support.getByName && function( tag, context ) {
		if ( typeof context.getElementsByName !== strundefined ) {
			return context.getElementsByName( name );
		}
	};

	// Class
	Expr.find["CLASS"] = support.getByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && !documentIsXML ) {
			return context.getElementsByClassName( className );
		}
	};

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21),
	// no need to also add to buggyMatches since matches checks buggyQSA
	// A support test would require too much code (would include document ready)
	rbuggyQSA = [ ":focus" ];

	if ( (support.qsa = isNative(doc.querySelectorAll)) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explictly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select><option selected=''></option></select>";

			// IE8 - Some boolean attributes are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {

			// Opera 10-12/IE8 - ^= $= *= and empty values
			// Should not select anything
			div.innerHTML = "<input type='hidden' i=''/>";
			if ( div.querySelectorAll("[i^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:\"\"|'')" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = isNative( (matches = docElem.matchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.webkitMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = new RegExp( rbuggyMatches.join("|") );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = isNative(docElem.contains) || docElem.compareDocumentPosition ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	// Document order sorting
	sortOrder = docElem.compareDocumentPosition ?
	function( a, b ) {
		var compare;

		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		if ( (compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b )) ) {
			if ( compare & 1 || a.parentNode && a.parentNode.nodeType === 11 ) {
				if ( a === doc || contains( preferredDoc, a ) ) {
					return -1;
				}
				if ( b === doc || contains( preferredDoc, b ) ) {
					return 1;
				}
				return 0;
			}
			return compare & 4 ? -1 : 1;
		}

		return a.compareDocumentPosition ? -1 : 1;
	} :
	function( a, b ) {
		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Parentless nodes are either documents or disconnected
		} else if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	// Always assume the presence of duplicates if sort doesn't
	// pass them to our comparison function (as in Google Chrome).
	hasDuplicate = false;
	[0, 0].sort( sortOrder );
	support.detectDuplicates = hasDuplicate;

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	// rbuggyQSA always contains :focus, so no need for an existence check
	if ( support.matchesSelector && !documentIsXML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && !rbuggyQSA.test(expr) ) {
		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	var val;

	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	if ( !documentIsXML ) {
		name = name.toLowerCase();
	}
	if ( (val = Expr.attrHandle[ name ]) ) {
		return val( elem );
	}
	if ( documentIsXML || support.attributes ) {
		return elem.getAttribute( name );
	}
	return ( (val = elem.getAttributeNode( name )) || elem.getAttribute( name ) ) && elem[ name ] === true ?
		name :
		val && val.specified ? val.value : null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

// Document sorting and removing duplicates
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		i = 1,
		j = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		for ( ; (elem = results[i]); i++ ) {
			if ( elem === results[ i - 1 ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && ( ~b.sourceIndex || MAX_NEGATIVE ) - ( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

// Returns a function to use in pseudos for input types
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

// Returns a function to use in pseudos for buttons
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

// Returns a function to use in pseudos for positionals
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[4] ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeName ) {
			if ( nodeName === "*" ) {
				return function() { return true; };
			}

			nodeName = nodeName.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
			};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( elem.className || (typeof elem.getAttribute !== strundefined && elem.getAttribute("class")) || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifider
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsXML ?
						elem.getAttribute("xml:lang") || elem.getAttribute("lang") :
						elem.lang) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push( {
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			} );
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push( {
					value: matched,
					type: type,
					matches: match
				} );
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var data, cache, outerCache,
				dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
							if ( (data = cache[1]) === true || data === cachedruns ) {
								return data === true;
							}
						} else {
							cache = outerCache[ dir ] = [ dirkey ];
							cache[1] = matcher( elem, context, xml ) || cachedruns;
							if ( cache[1] === true ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector( tokens.slice( 0, i - 1 ) ).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	// A counter to specify which element is currently being matched
	var matcherCachedRuns = 0,
		bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					context.nodeType === 9 && !documentIsXML &&
					Expr.relative[ tokens[1].type ] ) {

				context = Expr.find["ID"]( token.matches[0].replace( runescape, funescape ), context )[0];
				if ( !context ) {
					return results;
				}

				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && context.parentNode || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, slice.call( seed, 0 ) );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		documentIsXML,
		results,
		rsibling.test( selector )
	);
	return results;
}

// Deprecated
Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Easy API for creating new setFilters
function setFilters() {}
Expr.filters = setFilters.prototype = Expr.pseudos;
Expr.setFilters = new setFilters();

// Initialize with the default document
setDocument();

// Override sizzle attribute retrieval
Sizzle.attr = jQuery.attr;
jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
var runtil = /Until$/,
	rparentsprev = /^(?:parents|prev(?:Until|All))/,
	isSimple = /^.[^:#\[\.,]*$/,
	rneedsContext = jQuery.expr.match.needsContext,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	find: function( selector ) {
		var i, ret, self,
			len = this.length;

		if ( typeof selector !== "string" ) {
			self = this;
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		ret = [];
		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, this[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = ( this.selector ? this.selector + " " : "" ) + selector;
		return ret;
	},

	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter(function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector, false) );
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector, true) );
	},

	is: function( selector ) {
		return !!selector && (
			typeof selector === "string" ?
				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				rneedsContext.test( selector ) ?
					jQuery( selector, this.context ).index( this[0] ) >= 0 :
					jQuery.filter( selector, this ).length > 0 :
				this.filter( selector ).length > 0 );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			ret = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			cur = this[i];

			while ( cur && cur.ownerDocument && cur !== context && cur.nodeType !== 11 ) {
				if ( pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors) ) {
					ret.push( cur );
					break;
				}
				cur = cur.parentNode;
			}
		}

		return this.pushStack( ret.length > 1 ? jQuery.unique( ret ) : ret );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( jQuery.unique(all) );
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

jQuery.fn.andSelf = jQuery.fn.addBack;

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( !runtil.test( name ) ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		ret = this.length > 1 && !guaranteedUnique[ name ] ? jQuery.unique( ret ) : ret;

		if ( this.length > 1 && rparentsprev.test( name ) ) {
			ret = ret.reverse();
		}

		return this.pushStack( ret );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 ?
			jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] :
			jQuery.find.matches(expr, elems);
	},

	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, keep ) {

	// Can't pass null or undefined to indexOf in Firefox 4
	// Set to 0 to skip string check
	qualifier = qualifier || 0;

	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep(elements, function( elem, i ) {
			var retVal = !!qualifier.call( elem, i, elem );
			return retVal === keep;
		});

	} else if ( qualifier.nodeType ) {
		return jQuery.grep(elements, function( elem ) {
			return ( elem === qualifier ) === keep;
		});

	} else if ( typeof qualifier === "string" ) {
		var filtered = jQuery.grep(elements, function( elem ) {
			return elem.nodeType === 1;
		});

		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter(qualifier, filtered, !keep);
		} else {
			qualifier = jQuery.filter( qualifier, filtered );
		}
	}

	return jQuery.grep(elements, function( elem ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) === keep;
	});
}
function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
		safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		area: [ 1, "<map>", "</map>" ],
		param: [ 1, "<object>", "</object>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
		// unless wrapped in a div with non-breaking characters in front of it.
		_default: jQuery.support.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>"  ]
	},
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

jQuery.fn.extend({
	text: function( value ) {
		return jQuery.access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	},

	append: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				this.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				this.insertBefore( elem, this.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, false, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, false, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( !selector || jQuery.filter( selector, [ elem ] ).length > 0 ) {
				if ( !keepData && elem.nodeType === 1 ) {
					jQuery.cleanData( getAll( elem ) );
				}

				if ( elem.parentNode ) {
					if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
						setGlobalEval( getAll( elem, "script" ) );
					}
					elem.parentNode.removeChild( elem );
				}
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem, false ) );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}

			// If this is a select, ensure that it displays empty (#12336)
			// Support: IE<9
			if ( elem.options && jQuery.nodeName( elem, "select" ) ) {
				elem.options.length = 0;
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return jQuery.access( this, function( value ) {
			var elem = this[0] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( jQuery.support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ ( rtagName.exec( value ) || ["", ""] )[1].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for (; i < l; i++ ) {
						// Remove element nodes and prevent memory leaks
						elem = this[i] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch(e) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function( value ) {
		var isFunc = jQuery.isFunction( value );

		// Make sure that the elements are removed from the DOM before they are inserted
		// this can help fix replacing a parent with child elements
		if ( !isFunc && typeof value !== "string" ) {
			value = jQuery( value ).not( this ).detach();
		}

		return this.domManip( [ value ], true, function( elem ) {
			var next = this.nextSibling,
				parent = this.parentNode;

			if ( parent ) {
				jQuery( this ).remove();
				parent.insertBefore( elem, next );
			}
		});
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, table, callback ) {

		// Flatten any nested arrays
		args = core_concat.apply( [], args );

		var first, node, hasScripts,
			scripts, doc, fragment,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[0],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction || !( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[0] = value.call( this, index, table ? self.html() : undefined );
				}
				self.domManip( args, table, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				table = table && jQuery.nodeName( first, "tr" );
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call(
						table && jQuery.nodeName( this[i], "table" ) ?
							findOrAppend( this[i], "tbody" ) :
							this[i],
						node,
						i
					);
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!jQuery._data( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Hope ajax is available...
								jQuery.ajax({
									url: node.src,
									type: "GET",
									dataType: "script",
									async: false,
									global: false,
									"throws": true
								});
							} else {
								jQuery.globalEval( ( node.text || node.textContent || node.innerHTML || "" ).replace( rcleanScript, "" ) );
							}
						}
					}
				}

				// Fix #11809: Avoid leaking memory
				fragment = first = null;
			}
		}

		return this;
	}
});

function findOrAppend( elem, tag ) {
	return elem.getElementsByTagName( tag )[0] || elem.appendChild( elem.ownerDocument.createElement( tag ) );
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	var attr = elem.getAttributeNode("type");
	elem.type = ( attr && attr.specified ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );
	if ( match ) {
		elem.type = match[1];
	} else {
		elem.removeAttribute("type");
	}
	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var elem,
		i = 0;
	for ( ; (elem = elems[i]) != null; i++ ) {
		jQuery._data( elem, "globalEval", !refElements || jQuery._data( refElements[i], "globalEval" ) );
	}
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function fixCloneNodeIssues( src, dest ) {
	var nodeName, e, data;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 copies events bound via attachEvent when using cloneNode.
	if ( !jQuery.support.noCloneEvent && dest[ jQuery.expando ] ) {
		data = jQuery._data( dest );

		for ( e in data.events ) {
			jQuery.removeEvent( dest, e, data.handle );
		}

		// Event data gets referenced instead of copied if the expando gets copied too
		dest.removeAttribute( jQuery.expando );
	}

	// IE blanks contents when cloning scripts, and tries to evaluate newly-set text
	if ( nodeName === "script" && dest.text !== src.text ) {
		disableScript( dest ).text = src.text;
		restoreScript( dest );

	// IE6-10 improperly clones children of object elements using classid.
	// IE10 throws NoModificationAllowedError if parent is null, #12132.
	} else if ( nodeName === "object" ) {
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( jQuery.support.html5Clone && ( src.innerHTML && !jQuery.trim(dest.innerHTML) ) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.defaultSelected = dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone(true);
			jQuery( insert[i] )[ original ]( elems );

			// Modern browsers can apply jQuery collections as arrays, but oldIE needs a .get()
			core_push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});

function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== core_strundefined ? context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== core_strundefined ? context.querySelectorAll( tag || "*" ) :
			undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context; (elem = elems[i]) != null; i++ ) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}

// Used in buildFragment, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( manipulation_rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var destElements, node, clone, i, srcElements,
			inPage = jQuery.contains( elem.ownerDocument, elem );

		if ( jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			// Fix all IE cloning issues
			for ( i = 0; (node = srcElements[i]) != null; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					fixCloneNodeIssues( node, destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0; (node = srcElements[i]) != null; i++ ) {
					cloneCopyEvent( node, destElements[i] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		destElements = srcElements = node = null;

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var j, elem, contains,
			tmp, tag, tbody, wrap,
			l = elems.length,

			// Ensure a safe fragment
			safe = createSafeFragment( context ),

			nodes = [],
			i = 0;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || safe.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;

					tmp.innerHTML = wrap[1] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[2];

					// Descend through wrappers to the right content
					j = wrap[0];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Manually add leading whitespace removed by IE
					if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						nodes.push( context.createTextNode( rleadingWhitespace.exec( elem )[0] ) );
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !jQuery.support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						elem = tag === "table" && !rtbody.test( elem ) ?
							tmp.firstChild :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !rtbody.test( elem ) ?
								tmp :
								0;

						j = elem && elem.childNodes.length;
						while ( j-- ) {
							if ( jQuery.nodeName( (tbody = elem.childNodes[j]), "tbody" ) && !tbody.childNodes.length ) {
								elem.removeChild( tbody );
							}
						}
					}

					jQuery.merge( nodes, tmp.childNodes );

					// Fix #12392 for WebKit and IE > 9
					tmp.textContent = "";

					// Fix #12392 for oldIE
					while ( tmp.firstChild ) {
						tmp.removeChild( tmp.firstChild );
					}

					// Remember the top-level container for proper cleanup
					tmp = safe.lastChild;
				}
			}
		}

		// Fix #11356: Clear elements from fragment
		if ( tmp ) {
			safe.removeChild( tmp );
		}

		// Reset defaultChecked for any radios and checkboxes
		// about to be appended to the DOM in IE 6/7 (#8060)
		if ( !jQuery.support.appendChecked ) {
			jQuery.grep( getAll( nodes, "input" ), fixDefaultChecked );
		}

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( safe.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		tmp = null;

		return safe;
	},

	cleanData: function( elems, /* internal */ acceptData ) {
		var elem, type, id, data,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			deleteExpando = jQuery.support.deleteExpando,
			special = jQuery.event.special;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( acceptData || jQuery.acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// IE does not allow us to delete expando properties from nodes,
						// nor does it have a removeAttribute function on Document nodes;
						// we must handle all of these cases
						if ( deleteExpando ) {
							delete elem[ internalKey ];

						} else if ( typeof elem.removeAttribute !== core_strundefined ) {
							elem.removeAttribute( internalKey );

						} else {
							elem[ internalKey ] = null;
						}

						core_deletedIds.push( id );
					}
				}
			}
		}
	}
});
var iframe, getStyles, curCSS,
	ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity\s*=\s*([^)]*)/,
	rposition = /^(top|right|bottom|left)$/,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" ),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function isHidden( elem, el ) {
	// isHidden might be called from jQuery#filter function;
	// in that case, element will be second argument
	elem = el || elem;
	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = jQuery._data( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = jQuery._data( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					jQuery._data( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			var len, styles,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		var bool = typeof state === "boolean";

		return this.each(function() {
			if ( bool ? state : isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Exclude the following css properties to add px
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifing setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {

				// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
				// Fixes bug #5509
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var num, val, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.apply( elem, args || [] );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
if ( window.getComputedStyle ) {
	getStyles = function( elem ) {
		return window.getComputedStyle( elem, null );
	};

	curCSS = function( elem, name, _computed ) {
		var width, minWidth, maxWidth,
			computed = _computed || getStyles( elem ),

			// getPropertyValue is only needed for .css('filter') in IE9, see #12537
			ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
			style = elem.style;

		if ( computed ) {

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret;
	};
} else if ( document.documentElement.currentStyle ) {
	getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, _computed ) {
		var left, rs, rsLeft,
			computed = _computed || getStyles( elem ),
			ret = computed ? computed[ name ] : undefined,
			style = elem.style;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		return ret === "" ? "auto" : ret;
	};
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {
			// Use the already-created iframe if possible
			iframe = ( iframe ||
				jQuery("<iframe frameborder='0' width='0' height='0'/>")
				.css( "cssText", "display:block !important" )
			).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[0].contentWindow || iframe[0].contentDocument ).document;
			doc.write("<!doctype html><html><body>");
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}

// Called ONLY from within css_defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
		display = jQuery.css( elem[0], "display" );
	elem.remove();
	return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

if ( !jQuery.support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			// if value === "", then remove inline opacity #12685
			if ( ( value >= 1 || value === "" ) &&
					jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
					style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there is no filter style applied in a css rule or unset inline opacity, we are done
				if ( value === "" || currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				if ( computed ) {
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					return jQuery.swap( elem, { "display": "inline-block" },
						curCSS, [ elem, "marginRight" ] );
				}
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
		jQuery.each( [ "top", "left" ], function( i, prop ) {
			jQuery.cssHooks[ prop ] = {
				get: function( elem, computed ) {
					if ( computed ) {
						computed = curCSS( elem, prop );
						// if curCSS returns percentage, fallback to offset
						return rnumnonpx.test( computed ) ?
							jQuery( elem ).position()[ prop ] + "px" :
							computed;
					}
				}
			};
		});
	}

});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		return elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
			(!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});
var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function(){
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function(){
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !manipulation_rcheckableType.test( type ) );
		})
		.map(function( i, elem ){
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ){
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}
jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.hover = function( fnOver, fnOut ) {
	return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
};
var
	// Document location
	ajaxLocParts,
	ajaxLocation,
	ajax_nonce = jQuery.now(),

	ajax_rquery = /\?/,
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var deep, key,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, response, type,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off, url.length );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
	jQuery.fn[ type ] = function( fn ){
		return this.on( type, fn );
	};
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": window.String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // Cross-domain detection vars
			parts,
			// Loop variable
			i,
			// URL without anti-cache param
			cacheURL,
			// Response headers as string
			responseHeadersString,
			// timeout handle
			timeoutTimer,

			// To know if global events are to be dispatched
			fireGlobals,

			transport,
			// Response headers
			responseHeaders,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? 80 : 443 ) ) !=
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? 80 : 443 ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// If successful, handle type chaining
			if ( status >= 200 && status < 300 || status === 304 ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 ) {
					isSuccess = true;
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					isSuccess = true;
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					isSuccess = ajaxConvert( s, response );
					statusText = isSuccess.state;
					success = isSuccess.data;
					error = isSuccess.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	}
});

/* Handles responses to an ajax request:
 * - sets all responseXXX fields accordingly
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {
	var firstDataType, ct, finalDataType, type,
		contents = s.contents,
		dataTypes = s.dataTypes,
		responseFields = s.responseFields;

	// Fill responseXXX fields
	for ( type in responseFields ) {
		if ( type in responses ) {
			jqXHR[ responseFields[type] ] = responses[ type ];
		}
	}

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

// Chain conversions given the request and the original response
function ajaxConvert( s, response ) {
	var conv2, current, conv, tmp,
		converters = {},
		i = 0,
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice(),
		prev = dataTypes[ 0 ];

	// Apply the dataFilter if provided
	if ( s.dataFilter ) {
		response = s.dataFilter( response, s.dataType );
	}

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	// Convert to each sequential dataType, tolerating list modification
	for ( ; (current = dataTypes[++i]); ) {

		// There's only work to do if current dataType is non-auto
		if ( current !== "*" ) {

			// Convert response if prev dataType is non-auto and differs from current
			if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split(" ");
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.splice( i--, 0, current );
								}

								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s["throws"] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}

			// Update prev for next iteration
			prev = current;
		}
	}

	return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || jQuery("head")[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement("script");

				script.async = true;

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = null;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};

				// Circumvent IE6 bugs with base elements (#2709 and #4378) by prepending
				// Use native DOM manipulation to avoid our domManip AJAX trickery
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( undefined, true );
				}
			}
		};
	}
});
var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});
var xhrCallbacks, xhrSupported,
	xhrId = 0,
	// #5280: Internet Explorer will keep connections alive if we don't abort on unload
	xhrOnUnloadAbort = window.ActiveXObject && function() {
		// Abort all pending requests
		var key;
		for ( key in xhrCallbacks ) {
			xhrCallbacks[ key ]( undefined, true );
		}
	};

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject("Microsoft.XMLHTTP");
	} catch( e ) {}
}

// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject ?
	/* Microsoft failed to properly
	 * implement the XMLHttpRequest in IE7 (can't request local files),
	 * so we use the ActiveXObject when it is available
	 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
	 * we need a fallback.
	 */
	function() {
		return !this.isLocal && createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

// Determine support properties
xhrSupported = jQuery.ajaxSettings.xhr();
jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
xhrSupported = jQuery.support.ajax = !!xhrSupported;

// Create transport if the browser can provide an xhr
if ( xhrSupported ) {

	jQuery.ajaxTransport(function( s ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !s.crossDomain || jQuery.support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {

					// Get a new xhr
					var handle, i,
						xhr = s.xhr();

					// Open the socket
					// Passing null username, generates a login popup on Opera (#2865)
					if ( s.username ) {
						xhr.open( s.type, s.url, s.async, s.username, s.password );
					} else {
						xhr.open( s.type, s.url, s.async );
					}

					// Apply custom fields if provided
					if ( s.xhrFields ) {
						for ( i in s.xhrFields ) {
							xhr[ i ] = s.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( s.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( s.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !s.crossDomain && !headers["X-Requested-With"] ) {
						headers["X-Requested-With"] = "XMLHttpRequest";
					}

					// Need an extra try/catch for cross domain requests in Firefox 3
					try {
						for ( i in headers ) {
							xhr.setRequestHeader( i, headers[ i ] );
						}
					} catch( err ) {}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( s.hasContent && s.data ) || null );

					// Listener
					callback = function( _, isAbort ) {
						var status, responseHeaders, statusText, responses;

						// Firefox throws exceptions when accessing properties
						// of an xhr when a network error occurred
						// http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
						try {

							// Was never called and is aborted or complete
							if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

								// Only called once
								callback = undefined;

								// Do not keep as active anymore
								if ( handle ) {
									xhr.onreadystatechange = jQuery.noop;
									if ( xhrOnUnloadAbort ) {
										delete xhrCallbacks[ handle ];
									}
								}

								// If it's an abort
								if ( isAbort ) {
									// Abort it manually if needed
									if ( xhr.readyState !== 4 ) {
										xhr.abort();
									}
								} else {
									responses = {};
									status = xhr.status;
									responseHeaders = xhr.getAllResponseHeaders();

									// When requesting binary data, IE6-9 will throw an exception
									// on any attempt to access responseText (#11426)
									if ( typeof xhr.responseText === "string" ) {
										responses.text = xhr.responseText;
									}

									// Firefox throws an exception when accessing
									// statusText for faulty cross-domain requests
									try {
										statusText = xhr.statusText;
									} catch( e ) {
										// We normalize with Webkit giving an empty statusText
										statusText = "";
									}

									// Filter status for non standard behaviors

									// If the request is local and we have data: assume a success
									// (success with no data won't get notified, that's the best we
									// can do given current implementations)
									if ( !status && s.isLocal && !s.crossDomain ) {
										status = responses.text ? 200 : 404;
									// IE - #1450: sometimes returns 1223 when it should be 204
									} else if ( status === 1223 ) {
										status = 204;
									}
								}
							}
						} catch( firefoxAccessException ) {
							if ( !isAbort ) {
								complete( -1, firefoxAccessException );
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, responseHeaders );
						}
					};

					if ( !s.async ) {
						// if we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {
						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						setTimeout( callback );
					} else {
						handle = ++xhrId;
						if ( xhrOnUnloadAbort ) {
							// Create the active xhrs callbacks list if needed
							// and attach the unload handler
							if ( !xhrCallbacks ) {
								xhrCallbacks = {};
								jQuery( window ).unload( xhrOnUnloadAbort );
							}
							// Add to list of active xhrs callbacks
							xhrCallbacks[ handle ] = callback;
						}
						xhr.onreadystatechange = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback( undefined, true );
					}
				}
			};
		}
	});
}
var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [function( prop, value ) {
			var end, unit,
				tween = this.createTween( prop, value ),
				parts = rfxnum.exec( value ),
				target = tween.cur(),
				start = +target || 0,
				scale = 1,
				maxIterations = 20;

			if ( parts ) {
				end = +parts[2];
				unit = parts[3] || ( jQuery.cssNumber[ prop ] ? "" : "px" );

				// We need to compute starting value
				if ( unit !== "px" && start ) {
					// Iteratively approximate from a nonzero starting point
					// Prefer the current property, because this process will be trivial if it uses the same units
					// Fallback to end or a simple constant
					start = jQuery.css( tween.elem, prop, true ) || end || 1;

					do {
						// If previous iteration zeroed out, double until we get *something*
						// Use a string for doubling factor so we don't accidentally see scale as unchanged below
						scale = scale || ".5";

						// Adjust and apply
						start = start / scale;
						jQuery.style( tween.elem, prop, start + unit );

					// Update scale, tolerating zero or NaN from tween.cur()
					// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
					} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
				}

				tween.unit = unit;
				tween.start = start;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[1] ? start + ( parts[1] + 1 ) * end : end;
			}
			return tween;
		}]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

function createTweens( animation, props ) {
	jQuery.each( props, function( prop, value ) {
		var collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( collection[ index ].call( animation, prop, value ) ) {

				// we're done with this property
				return;
			}
		}
	});
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	createTweens( animation, props );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
	var value, name, index, easing, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

function defaultPrefilter( elem, props, opts ) {
	/*jshint validthis:true */
	var prop, index, length,
		value, dataShow, toggle,
		tween, hooks, oldfire,
		anim = this,
		style = elem.style,
		orig = {},
		handled = [],
		hidden = elem.nodeType && isHidden( elem );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if ( jQuery.css( elem, "display" ) === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay( elem.nodeName ) === "inline" ) {
				style.display = "inline-block";

			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !jQuery.support.shrinkWrapBlocks ) {
			anim.always(function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			});
		}
	}


	// show/hide pass
	for ( index in props ) {
		value = props[ index ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ index ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {
				continue;
			}
			handled.push( index );
		}
	}

	length = handled.length;
	if ( length ) {
		dataShow = jQuery._data( elem, "fxshow" ) || jQuery._data( elem, "fxshow", {} );
		if ( "hidden" in dataShow ) {
			hidden = dataShow.hidden;
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;
			jQuery._removeData( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( index = 0 ; index < length ; index++ ) {
			prop = handled[ index ];
			tween = anim.createTween( prop, hidden ? dataShow[ prop ] : 0 );
			orig[ prop ] = dataShow[ prop ] || jQuery.style( elem, prop );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Remove in 2.0 - this supports IE8's panic based approach
// to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );
				doAnimation.finish = function() {
					anim.stop( true );
				};
				// Empty animations, or finishing resolves immediately
				if ( empty || jQuery._data( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = jQuery._data( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.cur && hooks.cur.finish ) {
				hooks.cur.finish.call( this );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth? 1 : 0;
	for( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p*Math.PI ) / 2;
	}
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	if ( timer() && jQuery.timers.push( timer ) ) {
		jQuery.fx.start();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
jQuery.fn.offset = function( options ) {
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	var docElem, win,
		box = { top: 0, left: 0 },
		elem = this[ 0 ],
		doc = elem && elem.ownerDocument;

	if ( !doc ) {
		return;
	}

	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	return {
		top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
		left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
	};
};

jQuery.offset = {

	setOffset: function( elem, options, i ) {
		var position = jQuery.css( elem, "position" );

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		var curElem = jQuery( elem ),
			curOffset = curElem.offset(),
			curCSSTop = jQuery.css( elem, "top" ),
			curCSSLeft = jQuery.css( elem, "left" ),
			calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
			props = {}, curPosition = {}, curTop, curLeft;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true)
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || document.documentElement;
			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || document.documentElement;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
// Limit scope pollution from any deprecated API
// (function() {

// })();
// Expose jQuery to the global object
window.jQuery = window.$ = jQuery;

// Expose jQuery as an AMD module, but only for AMD loaders that
// understand the issues with loading multiple versions of jQuery
// in a page that all might call define(). The loader will indicate
// they have special allowances for multiple jQuery versions by
// specifying define.amd.jQuery = true. Register as a named module,
// since jQuery can be concatenated with other files that may use define,
// but not use a proper concatenation script that understands anonymous
// AMD modules. A named AMD is safest and most robust way to register.
// Lowercase jquery is used because AMD module names are derived from
// file names, and jQuery is normally delivered in a lowercase file name.
// Do this after creating the global so that if an AMD module wants to call
// noConflict to hide this version of jQuery, it will work.
if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
	define( "jquery", [], function () { return jQuery; } );
}

})( window );

//     Backbone.js 1.0.0

//     (c) 2010-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {
  // Set up Backbone appropriately for the environment.
  if (typeof exports !== 'undefined') {
    // Node/CommonJS, no need for jQuery in that case.
    factory(root, exports, require('underscore'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('backbone',['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });
  } else {
    // Browser globals
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }
}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.0.0';

  // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    _.extend(this, _.pick(options, modelOptions));
    if (options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // A list of options to be attached directly to the model, if provided.
  var modelOptions = ['url', 'urlRoot', 'collection'];

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options || {}, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.url) this.url = options.url;
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, merge: false, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.defaults(options || {}, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults(options || {}, setOptions);
      if (options.parse) models = this.parse(models, options);
      if (!_.isArray(models)) models = models ? [models] : [];
      var i, l, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(models[i], options))) continue;

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.remove) modelMap[existing.cid] = true;
          if (options.merge) {
            existing.set(model.attributes, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }

          // This is a new model, push it to the `toAdd` list.
        } else if (options.add) {
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
      }

      // Remove nonexistent models if appropriate.
      if (options.remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          push.apply(this.models, toAdd);
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = toAdd.length; i < l; i++) {
        (model = toAdd[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (sort) this.trigger('sort', this, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Figure out the smallest index at which a model should be inserted so as
    // to maintain order.
    sortedIndex: function(model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(e.g. model, collection, id, className)* are
    // attached directly to the view.  See `viewOptions` for an exhaustive
    // list.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && window.ActiveXObject &&
        !(window.external && window.external.msActiveXFilteringEnabled)) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
          .replace(optionalParam, '(?:$1)?')
          .replace(namedParam, function(match, optional){
            return optional ? match : '([^\/]+)';
          })
          .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

        // If hash changes haven't been explicitly disabled, update the hash
        // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

        // If you've told us that you explicitly don't want fallback hashchange-
        // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;
}));

// MarionetteJS (Backbone.Marionette)
// ----------------------------------
// v1.0.2
//
// Copyright (c)2013 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://marionettejs.com

define('marionette',['underscore', 'backbone'], function (_, Backbone) {




  /*!
   * Includes BabySitter
   * https://github.com/marionettejs/backbone.babysitter/
   *
   * Includes Wreqr
   * https://github.com/marionettejs/backbone.wreqr/
   */

  // Backbone.BabySitter
  // -------------------
  // v0.0.5
  //
  // Copyright (c)2013 Derick Bailey, Muted Solutions, LLC.
  // Distributed under MIT license
  //
  // http://github.com/babysitterjs/backbone.babysitter

  // Backbone.ChildViewContainer
  // ---------------------------
  //
  // Provide a container to store, retrieve and
  // shut down child views.

  Backbone.ChildViewContainer = (function (Backbone, _) {

    // Container Constructor
    // ---------------------

    var Container = function (initialViews) {
      this._views = {};
      this._indexByModel = {};
      this._indexByCollection = {};
      this._indexByCustom = {};
      this._updateLength();

      this._addInitialViews(initialViews);
    };

    // Container Methods
    // -----------------

    _.extend(Container.prototype, {

      // Add a view to this container. Stores the view
      // by `cid` and makes it searchable by the model
      // and/or collection of the view. Optionally specify
      // a custom key to store an retrieve the view.
      add: function (view, customIndex) {
        var viewCid = view.cid;

        // store the view
        this._views[viewCid] = view;

        // index it by model
        if (view.model) {
          this._indexByModel[view.model.cid] = viewCid;
        }

        // index it by collection
        if (view.collection) {
          this._indexByCollection[view.collection.cid] = viewCid;
        }

        // index by custom
        if (customIndex) {
          this._indexByCustom[customIndex] = viewCid;
        }

        this._updateLength();
      },

      // Find a view by the model that was attached to
      // it. Uses the model's `cid` to find it, and
      // retrieves the view by it's `cid` from the result
      findByModel: function (model) {
        var viewCid = this._indexByModel[model.cid];
        return this.findByCid(viewCid);
      },

      // Find a view by the collection that was attached to
      // it. Uses the collection's `cid` to find it, and
      // retrieves the view by it's `cid` from the result
      findByCollection: function (col) {
        var viewCid = this._indexByCollection[col.cid];
        return this.findByCid(viewCid);
      },

      // Find a view by a custom indexer.
      findByCustom: function (index) {
        var viewCid = this._indexByCustom[index];
        return this.findByCid(viewCid);
      },

      // Find by index. This is not guaranteed to be a
      // stable index.
      findByIndex: function (index) {
        return _.values(this._views)[index];
      },

      // retrieve a view by it's `cid` directly
      findByCid: function (cid) {
        return this._views[cid];
      },

      // Remove a view
      remove: function (view) {
        var viewCid = view.cid;

        // delete model index
        if (view.model) {
          delete this._indexByModel[view.model.cid];
        }

        // delete collection index
        if (view.collection) {
          delete this._indexByCollection[view.collection.cid];
        }

        // delete custom index
        var cust;

        for (var key in this._indexByCustom) {
          if (this._indexByCustom.hasOwnProperty(key)) {
            if (this._indexByCustom[key] === viewCid) {
              cust = key;
              break;
            }
          }
        }

        if (cust) {
          delete this._indexByCustom[cust];
        }

        // remove the view from the container
        delete this._views[viewCid];

        // update the length
        this._updateLength();
      },

      // Call a method on every view in the container,
      // passing parameters to the call method one at a
      // time, like `function.call`.
      call: function (method, args) {
        args = Array.prototype.slice.call(arguments, 1);
        this.apply(method, args);
      },

      // Apply a method on every view in the container,
      // passing parameters to the call method one at a
      // time, like `function.apply`.
      apply: function (method, args) {
        var view;

        // fix for IE < 9
        args = args || [];

        _.each(this._views, function (view, key) {
          if (_.isFunction(view[method])) {
            view[method].apply(view, args);
          }
        });

      },

      // Update the `.length` attribute on this container
      _updateLength: function () {
        this.length = _.size(this._views);
      },

      // set up an initial list of views
      _addInitialViews: function (views) {
        if (!views) {
          return;
        }

        var view, i,
            length = views.length;

        for (i = 0; i < length; i++) {
          view = views[i];
          this.add(view);
        }
      }
    });

    // Borrowing this code from Backbone.Collection:
    // http://backbonejs.org/docs/backbone.html#section-106
    //
    // Mix in methods from Underscore, for iteration, and other
    // collection related features.
    var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter',
      'select', 'reject', 'every', 'all', 'some', 'any', 'include',
      'contains', 'invoke', 'toArray', 'first', 'initial', 'rest',
      'last', 'without', 'isEmpty', 'pluck'];

    _.each(methods, function (method) {
      Container.prototype[method] = function () {
        var views = _.values(this._views);
        var args = [views].concat(_.toArray(arguments));
        return _[method].apply(_, args);
      };
    });

    // return the public API
    return Container;
  })(Backbone, _);

  // Backbone.Wreqr (Backbone.Marionette)
  // ----------------------------------
  // v0.2.0
  //
  // Copyright (c)2013 Derick Bailey, Muted Solutions, LLC.
  // Distributed under MIT license
  //
  // http://github.com/marionettejs/backbone.wreqr


  Backbone.Wreqr = (function (Backbone, Marionette, _) {
    
    var Wreqr = {};

    // Handlers
// --------
// A registry of functions to call, given a name

    Wreqr.Handlers = (function (Backbone, _) {
      

      // Constructor
      // -----------

      var Handlers = function (options) {
        this.options = options;
        this._wreqrHandlers = {};

        if (_.isFunction(this.initialize)) {
          this.initialize(options);
        }
      };

      Handlers.extend = Backbone.Model.extend;

      // Instance Members
      // ----------------

      _.extend(Handlers.prototype, Backbone.Events, {

        // Add multiple handlers using an object literal configuration
        setHandlers: function (handlers) {
          _.each(handlers, function (handler, name) {
            var context = null;

            if (_.isObject(handler) && !_.isFunction(handler)) {
              context = handler.context;
              handler = handler.callback;
            }

            this.setHandler(name, handler, context);
          }, this);
        },

        // Add a handler for the given name, with an
        // optional context to run the handler within
        setHandler: function (name, handler, context) {
          var config = {
            callback: handler,
            context: context
          };

          this._wreqrHandlers[name] = config;

          this.trigger("handler:add", name, handler, context);
        },

        // Determine whether or not a handler is registered
        hasHandler: function (name) {
          return !!this._wreqrHandlers[name];
        },

        // Get the currently registered handler for
        // the specified name. Throws an exception if
        // no handler is found.
        getHandler: function (name) {
          var config = this._wreqrHandlers[name];

          if (!config) {
            throw new Error("Handler not found for '" + name + "'");
          }

          return function () {
            var args = Array.prototype.slice.apply(arguments);
            return config.callback.apply(config.context, args);
          };
        },

        // Remove a handler for the specified name
        removeHandler: function (name) {
          delete this._wreqrHandlers[name];
        },

        // Remove all handlers from this registry
        removeAllHandlers: function () {
          this._wreqrHandlers = {};
        }
      });

      return Handlers;
    })(Backbone, _);

    // Wreqr.CommandStorage
// --------------------
//
// Store and retrieve commands for execution.
    Wreqr.CommandStorage = (function () {
      

      // Constructor function
      var CommandStorage = function (options) {
        this.options = options;
        this._commands = {};

        if (_.isFunction(this.initialize)) {
          this.initialize(options);
        }
      };

      // Instance methods
      _.extend(CommandStorage.prototype, Backbone.Events, {

        // Get an object literal by command name, that contains
        // the `commandName` and the `instances` of all commands
        // represented as an array of arguments to process
        getCommands: function (commandName) {
          var commands = this._commands[commandName];

          // we don't have it, so add it
          if (!commands) {

            // build the configuration
            commands = {
              command: commandName,
              instances: []
            };

            // store it
            this._commands[commandName] = commands;
          }

          return commands;
        },

        // Add a command by name, to the storage and store the
        // args for the command
        addCommand: function (commandName, args) {
          var command = this.getCommands(commandName);
          command.instances.push(args);
        },

        // Clear all commands for the given `commandName`
        clearCommands: function (commandName) {
          var command = this.getCommands(commandName);
          command.instances = [];
        }
      });

      return CommandStorage;
    })();

    // Wreqr.Commands
// --------------
//
// A simple command pattern implementation. Register a command
// handler and execute it.
    Wreqr.Commands = (function (Wreqr) {
      

      return Wreqr.Handlers.extend({
        // default storage type
        storageType: Wreqr.CommandStorage,

        constructor: function (options) {
          this.options = options || {};

          this._initializeStorage(this.options);
          this.on("handler:add", this._executeCommands, this);

          var args = Array.prototype.slice.call(arguments);
          Wreqr.Handlers.prototype.constructor.apply(this, args);
        },

        // Execute a named command with the supplied args
        execute: function (name, args) {
          name = arguments[0];
          args = Array.prototype.slice.call(arguments, 1);

          if (this.hasHandler(name)) {
            this.getHandler(name).apply(this, args);
          } else {
            this.storage.addCommand(name, args);
          }

        },

        // Internal method to handle bulk execution of stored commands
        _executeCommands: function (name, handler, context) {
          var command = this.storage.getCommands(name);

          // loop through and execute all the stored command instances
          _.each(command.instances, function (args) {
            handler.apply(context, args);
          });

          this.storage.clearCommands(name);
        },

        // Internal method to initialize storage either from the type's
        // `storageType` or the instance `options.storageType`.
        _initializeStorage: function (options) {
          var storage;

          var StorageType = options.storageType || this.storageType;
          if (_.isFunction(StorageType)) {
            storage = new StorageType();
          } else {
            storage = StorageType;
          }

          this.storage = storage;
        }
      });

    })(Wreqr);

    // Wreqr.RequestResponse
// ---------------------
//
// A simple request/response implementation. Register a
// request handler, and return a response from it
    Wreqr.RequestResponse = (function (Wreqr) {
      

      return Wreqr.Handlers.extend({
        request: function () {
          var name = arguments[0];
          var args = Array.prototype.slice.call(arguments, 1);

          return this.getHandler(name).apply(this, args);
        }
      });

    })(Wreqr);

    // Event Aggregator
// ----------------
// A pub-sub object that can be used to decouple various parts
// of an application through event-driven architecture.

    Wreqr.EventAggregator = (function (Backbone, _) {
      
      var EA = function () {
      };

      // Copy the `extend` function used by Backbone's classes
      EA.extend = Backbone.Model.extend;

      // Copy the basic Backbone.Events on to the event aggregator
      _.extend(EA.prototype, Backbone.Events);

      return EA;
    })(Backbone, _);


    return Wreqr;
  })(Backbone, Backbone.Marionette, _);

  var Marionette = (function (global, Backbone, _) {
    

    // Define and export the Marionette namespace
    var Marionette = {};
    Backbone.Marionette = Marionette;

    // Get the DOM manipulator for later use
    Marionette.$ = Backbone.$;

// Helpers
// -------

// For slicing `arguments` in functions
    var protoSlice = Array.prototype.slice;

    function slice(args) {
      return protoSlice.call(args);
    }

    function throwError(message, name) {
      var error = new Error(message);
      error.name = name || 'Error';
      throw error;
    }

// Marionette.extend
// -----------------

// Borrow the Backbone `extend` method so we can use it as needed
    Marionette.extend = Backbone.Model.extend;

// Marionette.getOption
// --------------------

// Retrieve an object, function or other value from a target
// object or it's `options`, with `options` taking precedence.
    Marionette.getOption = function (target, optionName) {
      if (!target || !optionName) {
        return;
      }
      var value;

      if (target.options && (optionName in target.options) && (target.options[optionName] !== undefined)) {
        value = target.options[optionName];
      } else {
        value = target[optionName];
      }

      return value;
    };

// Trigger an event and a corresponding method name. Examples:
//
// `this.triggerMethod("foo")` will trigger the "foo" event and
// call the "onFoo" method.
//
// `this.triggerMethod("foo:bar") will trigger the "foo:bar" event and
// call the "onFooBar" method.
    Marionette.triggerMethod = (function () {

      // split the event name on the :
      var splitter = /(^|:)(\w)/gi;

      // take the event section ("section1:section2:section3")
      // and turn it in to uppercase name
      function getEventName(match, prefix, eventName) {
        return eventName.toUpperCase();
      }

      // actual triggerMethod name
      var triggerMethod = function (event) {
        // get the method name from the event name
        var methodName = 'on' + event.replace(splitter, getEventName);
        var method = this[methodName];

        // trigger the event
        this.trigger.apply(this, arguments);

        // call the onMethodName if it exists
        if (_.isFunction(method)) {
          // pass all arguments, except the event name
          return method.apply(this, _.tail(arguments));
        }
      };

      return triggerMethod;
    })();

// DOMRefresh
// ----------
//
// Monitor a view's state, and after it has been rendered and shown
// in the DOM, trigger a "dom:refresh" event every time it is
// re-rendered.

    Marionette.MonitorDOMRefresh = (function () {
      // track when the view has been rendered
      function handleShow(view) {
        view._isShown = true;
        triggerDOMRefresh(view);
      }

      // track when the view has been shown in the DOM,
      // using a Marionette.Region (or by other means of triggering "show")
      function handleRender(view) {
        view._isRendered = true;
        triggerDOMRefresh(view);
      }

      // Trigger the "dom:refresh" event and corresponding "onDomRefresh" method
      function triggerDOMRefresh(view) {
        if (view._isShown && view._isRendered) {
          if (_.isFunction(view.triggerMethod)) {
            view.triggerMethod("dom:refresh");
          }
        }
      }

      // Export public API
      return function (view) {
        view.listenTo(view, "show", function () {
          handleShow(view);
        });

        view.listenTo(view, "render", function () {
          handleRender(view);
        });
      };
    })();


// Marionette.bindEntityEvents & unbindEntityEvents
// ---------------------------
//
// These methods are used to bind/unbind a backbone "entity" (collection/model)
// to methods on a target object.
//
// The first parameter, `target`, must have a `listenTo` method from the
// EventBinder object.
//
// The second parameter is the entity (Backbone.Model or Backbone.Collection)
// to bind the events from.
//
// The third parameter is a hash of { "event:name": "eventHandler" }
// configuration. Multiple handlers can be separated by a space. A
// function can be supplied instead of a string handler name.

    (function (Marionette) {
      

      // Bind the event to handlers specified as a string of
      // handler names on the target object
      function bindFromStrings(target, entity, evt, methods) {
        var methodNames = methods.split(/\s+/);

        _.each(methodNames, function (methodName) {

          var method = target[methodName];
          if (!method) {
            throwError("Method '" + methodName + "' was configured as an event handler, but does not exist.");
          }

          target.listenTo(entity, evt, method, target);
        });
      }

      // Bind the event to a supplied callback function
      function bindToFunction(target, entity, evt, method) {
        target.listenTo(entity, evt, method, target);
      }

      // Bind the event to handlers specified as a string of
      // handler names on the target object
      function unbindFromStrings(target, entity, evt, methods) {
        var methodNames = methods.split(/\s+/);

        _.each(methodNames, function (methodName) {
          var method = target[method];
          target.stopListening(entity, evt, method, target);
        });
      }

      // Bind the event to a supplied callback function
      function unbindToFunction(target, entity, evt, method) {
        target.stopListening(entity, evt, method, target);
      }


      // generic looping function
      function iterateEvents(target, entity, bindings, functionCallback, stringCallback) {
        if (!entity || !bindings) {
          return;
        }

        // allow the bindings to be a function
        if (_.isFunction(bindings)) {
          bindings = bindings.call(target);
        }

        // iterate the bindings and bind them
        _.each(bindings, function (methods, evt) {

          // allow for a function as the handler,
          // or a list of event names as a string
          if (_.isFunction(methods)) {
            functionCallback(target, entity, evt, methods);
          } else {
            stringCallback(target, entity, evt, methods);
          }

        });
      }

      // Export Public API
      Marionette.bindEntityEvents = function (target, entity, bindings) {
        iterateEvents(target, entity, bindings, bindToFunction, bindFromStrings);
      };

      Marionette.unbindEntityEvents = function (target, entity, bindings) {
        iterateEvents(target, entity, bindings, unbindToFunction, unbindFromStrings);
      };

    })(Marionette);


// Callbacks
// ---------

// A simple way of managing a collection of callbacks
// and executing them at a later point in time, using jQuery's
// `Deferred` object.
    Marionette.Callbacks = function () {
      this._deferred = Marionette.$.Deferred();
      this._callbacks = [];
    };

    _.extend(Marionette.Callbacks.prototype, {

      // Add a callback to be executed. Callbacks added here are
      // guaranteed to execute, even if they are added after the
      // `run` method is called.
      add: function (callback, contextOverride) {
        this._callbacks.push({cb: callback, ctx: contextOverride});

        this._deferred.done(function (context, options) {
          if (contextOverride) {
            context = contextOverride;
          }
          callback.call(context, options);
        });
      },

      // Run all registered callbacks with the context specified.
      // Additional callbacks can be added after this has been run
      // and they will still be executed.
      run: function (options, context) {
        this._deferred.resolve(context, options);
      },

      // Resets the list of callbacks to be run, allowing the same list
      // to be run multiple times - whenever the `run` method is called.
      reset: function () {
        var callbacks = this._callbacks;
        this._deferred = Marionette.$.Deferred();
        this._callbacks = [];

        _.each(callbacks, function (cb) {
          this.add(cb.cb, cb.ctx);
        }, this);
      }
    });


// Marionette Controller
// ---------------------
//
// A multi-purpose object to use as a controller for
// modules and routers, and as a mediator for workflow
// and coordination of other objects, views, and more.
    Marionette.Controller = function (options) {
      this.triggerMethod = Marionette.triggerMethod;
      this.options = options || {};

      if (_.isFunction(this.initialize)) {
        this.initialize(this.options);
      }
    };

    Marionette.Controller.extend = Marionette.extend;

// Controller Methods
// --------------

// Ensure it can trigger events with Backbone.Events
    _.extend(Marionette.Controller.prototype, Backbone.Events, {
      close: function () {
        this.stopListening();
        this.triggerMethod("close");
        this.unbind();
      }
    });

// Region
// ------
//
// Manage the visual regions of your composite application. See
// http://lostechies.com/derickbailey/2011/12/12/composite-js-apps-regions-and-region-managers/

    Marionette.Region = function (options) {
      this.options = options || {};

      this.el = Marionette.getOption(this, "el");

      if (!this.el) {
        var err = new Error("An 'el' must be specified for a region.");
        err.name = "NoElError";
        throw err;
      }

      if (this.initialize) {
        var args = Array.prototype.slice.apply(arguments);
        this.initialize.apply(this, args);
      }
    };


// Region Type methods
// -------------------

    _.extend(Marionette.Region, {

      // Build an instance of a region by passing in a configuration object
      // and a default region type to use if none is specified in the config.
      //
      // The config object should either be a string as a jQuery DOM selector,
      // a Region type directly, or an object literal that specifies both
      // a selector and regionType:
      //
      // ```js
      // {
      //   selector: "#foo",
      //   regionType: MyCustomRegion
      // }
      // ```
      //
      buildRegion: function (regionConfig, defaultRegionType) {
        var regionIsString = (typeof regionConfig === "string");
        var regionSelectorIsString = (typeof regionConfig.selector === "string");
        var regionTypeIsUndefined = (typeof regionConfig.regionType === "undefined");
        var regionIsType = (typeof regionConfig === "function");

        if (!regionIsType && !regionIsString && !regionSelectorIsString) {
          throw new Error("Region must be specified as a Region type, a selector string or an object with selector property");
        }

        var selector, RegionType;

        // get the selector for the region

        if (regionIsString) {
          selector = regionConfig;
        }

        if (regionConfig.selector) {
          selector = regionConfig.selector;
        }

        // get the type for the region

        if (regionIsType) {
          RegionType = regionConfig;
        }

        if (!regionIsType && regionTypeIsUndefined) {
          RegionType = defaultRegionType;
        }

        if (regionConfig.regionType) {
          RegionType = regionConfig.regionType;
        }

        // build the region instance
        var region = new RegionType({
          el: selector
        });

        // override the `getEl` function if we have a parentEl
        // this must be overridden to ensure the selector is found
        // on the first use of the region. if we try to assign the
        // region's `el` to `parentEl.find(selector)` in the object
        // literal to build the region, the element will not be
        // guaranteed to be in the DOM already, and will cause problems
        if (regionConfig.parentEl) {

          region.getEl = function (selector) {
            var parentEl = regionConfig.parentEl;
            if (_.isFunction(parentEl)) {
              parentEl = parentEl();
            }
            return parentEl.find(selector);
          };
        }

        return region;
      }

    });

// Region Instance Methods
// -----------------------

    _.extend(Marionette.Region.prototype, Backbone.Events, {

      // Displays a backbone view instance inside of the region.
      // Handles calling the `render` method for you. Reads content
      // directly from the `el` attribute. Also calls an optional
      // `onShow` and `close` method on your view, just after showing
      // or just before closing the view, respectively.
      show: function (view) {

        this.ensureEl();

        if (view !== this.currentView) {
          this.close();
          view.render();
          this.open(view);
        } else {
          view.render();
        }

        Marionette.triggerMethod.call(view, "show");
        Marionette.triggerMethod.call(this, "show", view);

        this.currentView = view;
      },

      ensureEl: function () {
        if (!this.$el || this.$el.length === 0) {
          this.$el = this.getEl(this.el);
        }
      },

      // Override this method to change how the region finds the
      // DOM element that it manages. Return a jQuery selector object.
      getEl: function (selector) {
        return Marionette.$(selector);
      },

      // Override this method to change how the new view is
      // appended to the `$el` that the region is managing
      open: function (view) {
        this.$el.empty().append(view.el);
      },

      // Close the current view, if there is one. If there is no
      // current view, it does nothing and returns immediately.
      close: function () {
        var view = this.currentView;
        if (!view || view.isClosed) {
          return;
        }

        // call 'close' or 'remove', depending on which is found
        if (view.close) {
          view.close();
        }
        else if (view.remove) {
          view.remove();
        }

        Marionette.triggerMethod.call(this, "close");

        delete this.currentView;
      },

      // Attach an existing view to the region. This
      // will not call `render` or `onShow` for the new view,
      // and will not replace the current HTML for the `el`
      // of the region.
      attachView: function (view) {
        this.currentView = view;
      },

      // Reset the region by closing any existing view and
      // clearing out the cached `$el`. The next time a view
      // is shown via this region, the region will re-query the
      // DOM for the region's `el`.
      reset: function () {
        this.close();
        delete this.$el;
      }
    });

// Copy the `extend` function used by Backbone's classes
    Marionette.Region.extend = Marionette.extend;

// Marionette.RegionManager
// ------------------------
//
// Manage one or more related `Marionette.Region` objects.
    Marionette.RegionManager = (function (Marionette) {

      var RegionManager = Marionette.Controller.extend({
        constructor: function (options) {
          this._regions = {};
          Marionette.Controller.prototype.constructor.call(this, options);
        },

        // Add multiple regions using an object literal, where
        // each key becomes the region name, and each value is
        // the region definition.
        addRegions: function (regionDefinitions, defaults) {
          var regions = {};

          _.each(regionDefinitions, function (definition, name) {
            if (typeof definition === "string") {
              definition = { selector: definition };
            }

            if (definition.selector) {
              definition = _.defaults({}, definition, defaults);
            }

            var region = this.addRegion(name, definition);
            regions[name] = region;
          }, this);

          return regions;
        },

        // Add an individual region to the region manager,
        // and return the region instance
        addRegion: function (name, definition) {
          var region;

          var isObject = _.isObject(definition);
          var isString = _.isString(definition);
          var hasSelector = !!definition.selector;

          if (isString || (isObject && hasSelector)) {
            region = Marionette.Region.buildRegion(definition, Marionette.Region);
          } else if (_.isFunction(definition)) {
            region = Marionette.Region.buildRegion(definition, Marionette.Region);
          } else {
            region = definition;
          }

          this._store(name, region);
          this.triggerMethod("region:add", name, region);
          return region;
        },

        // Get a region by name
        get: function (name) {
          return this._regions[name];
        },

        // Remove a region by name
        removeRegion: function (name) {
          var region = this._regions[name];
          this._remove(name, region);
        },

        // Close all regions in the region manager, and
        // remove them
        removeRegions: function () {
          _.each(this._regions, function (region, name) {
            this._remove(name, region);
          }, this);
        },

        // Close all regions in the region manager, but
        // leave them attached
        closeRegions: function () {
          _.each(this._regions, function (region, name) {
            region.close();
          }, this);
        },

        // Close all regions and shut down the region
        // manager entirely
        close: function () {
          this.removeRegions();
          var args = Array.prototype.slice.call(arguments);
          Marionette.Controller.prototype.close.apply(this, args);
        },

        // internal method to store regions
        _store: function (name, region) {
          this._regions[name] = region;
          this.length = _.size(this._regions);
        },

        // internal method to remove a region
        _remove: function (name, region) {
          region.close();
          delete this._regions[name];
          this.triggerMethod("region:remove", name, region);
        }

      });

      // Borrowing this code from Backbone.Collection:
      // http://backbonejs.org/docs/backbone.html#section-106
      //
      // Mix in methods from Underscore, for iteration, and other
      // collection related features.
      var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter',
        'select', 'reject', 'every', 'all', 'some', 'any', 'include',
        'contains', 'invoke', 'toArray', 'first', 'initial', 'rest',
        'last', 'without', 'isEmpty', 'pluck'];

      _.each(methods, function (method) {
        RegionManager.prototype[method] = function () {
          var regions = _.values(this._regions);
          var args = [regions].concat(_.toArray(arguments));
          return _[method].apply(_, args);
        };
      });

      return RegionManager;
    })(Marionette);


// Template Cache
// --------------

// Manage templates stored in `<script>` blocks,
// caching them for faster access.
    Marionette.TemplateCache = function (templateId) {
      this.templateId = templateId;
    };

// TemplateCache object-level methods. Manage the template
// caches from these method calls instead of creating
// your own TemplateCache instances
    _.extend(Marionette.TemplateCache, {
      templateCaches: {},

      // Get the specified template by id. Either
      // retrieves the cached version, or loads it
      // from the DOM.
      get: function (templateId) {
        var cachedTemplate = this.templateCaches[templateId];

        if (!cachedTemplate) {
          cachedTemplate = new Marionette.TemplateCache(templateId);
          this.templateCaches[templateId] = cachedTemplate;
        }

        return cachedTemplate.load();
      },

      // Clear templates from the cache. If no arguments
      // are specified, clears all templates:
      // `clear()`
      //
      // If arguments are specified, clears each of the
      // specified templates from the cache:
      // `clear("#t1", "#t2", "...")`
      clear: function () {
        var i;
        var args = slice(arguments);
        var length = args.length;

        if (length > 0) {
          for (i = 0; i < length; i++) {
            delete this.templateCaches[args[i]];
          }
        } else {
          this.templateCaches = {};
        }
      }
    });

// TemplateCache instance methods, allowing each
// template cache object to manage it's own state
// and know whether or not it has been loaded
    _.extend(Marionette.TemplateCache.prototype, {

      // Internal method to load the template
      load: function () {
        // Guard clause to prevent loading this template more than once
        if (this.compiledTemplate) {
          return this.compiledTemplate;
        }

        // Load the template and compile it
        var template = this.loadTemplate(this.templateId);
        this.compiledTemplate = this.compileTemplate(template);

        return this.compiledTemplate;
      },

      // Load a template from the DOM, by default. Override
      // this method to provide your own template retrieval
      // For asynchronous loading with AMD/RequireJS, consider
      // using a template-loader plugin as described here:
      // https://github.com/marionettejs/backbone.marionette/wiki/Using-marionette-with-requirejs
      loadTemplate: function (templateId) {
        var template = Marionette.$(templateId).html();

        if (!template || template.length === 0) {
          throwError("Could not find template: '" + templateId + "'", "NoTemplateError");
        }

        return template;
      },

      // Pre-compile the template before caching it. Override
      // this method if you do not need to pre-compile a template
      // (JST / RequireJS for example) or if you want to change
      // the template engine used (Handebars, etc).
      compileTemplate: function (rawTemplate) {
        return _.template(rawTemplate);
      }
    });


// Renderer
// --------

// Render a template with data by passing in the template
// selector and the data to render.
    Marionette.Renderer = {

      // Render a template with data. The `template` parameter is
      // passed to the `TemplateCache` object to retrieve the
      // template function. Override this method to provide your own
      // custom rendering and template handling for all of Marionette.
      render: function (template, data) {
        var templateFunc = typeof template === 'function' ? template : Marionette.TemplateCache.get(template);
        return templateFunc(data);
      }
    };


// Marionette.View
// ---------------

// The core view type that other Marionette views extend from.
    Marionette.View = Backbone.View.extend({

      constructor: function () {
        _.bindAll(this, "render");

        var args = Array.prototype.slice.apply(arguments);
        Backbone.View.prototype.constructor.apply(this, args);

        Marionette.MonitorDOMRefresh(this);
        this.listenTo(this, "show", this.onShowCalled, this);
      },

      // import the "triggerMethod" to trigger events with corresponding
      // methods if the method exists
      triggerMethod: Marionette.triggerMethod,

      // Get the template for this view
      // instance. You can set a `template` attribute in the view
      // definition or pass a `template: "whatever"` parameter in
      // to the constructor options.
      getTemplate: function () {
        return Marionette.getOption(this, "template");
      },

      // Mix in template helper methods. Looks for a
      // `templateHelpers` attribute, which can either be an
      // object literal, or a function that returns an object
      // literal. All methods and attributes from this object
      // are copies to the object passed in.
      mixinTemplateHelpers: function (target) {
        target = target || {};
        var templateHelpers = this.templateHelpers;
        if (_.isFunction(templateHelpers)) {
          templateHelpers = templateHelpers.call(this);
        }
        return _.extend(target, templateHelpers);
      },

      // Configure `triggers` to forward DOM events to view
      // events. `triggers: {"click .foo": "do:foo"}`
      configureTriggers: function () {
        if (!this.triggers) {
          return;
        }

        var triggerEvents = {};

        // Allow `triggers` to be configured as a function
        var triggers = _.result(this, "triggers");

        // Configure the triggers, prevent default
        // action and stop propagation of DOM events
        _.each(triggers, function (value, key) {

          // build the event handler function for the DOM event
          triggerEvents[key] = function (e) {

            // stop the event in it's tracks
            if (e && e.preventDefault) {
              e.preventDefault();
            }
            if (e && e.stopPropagation) {
              e.stopPropagation();
            }

            // build the args for the event
            var args = {
              view: this,
              model: this.model,
              collection: this.collection
            };

            // trigger the event
            this.triggerMethod(value, args);
          };

        }, this);

        return triggerEvents;
      },

      // Overriding Backbone.View's delegateEvents to handle
      // the `triggers`, `modelEvents`, and `collectionEvents` configuration
      delegateEvents: function (events) {
        this._delegateDOMEvents(events);
        Marionette.bindEntityEvents(this, this.model, Marionette.getOption(this, "modelEvents"));
        Marionette.bindEntityEvents(this, this.collection, Marionette.getOption(this, "collectionEvents"));
      },

      // internal method to delegate DOM events and triggers
      _delegateDOMEvents: function (events) {
        events = events || this.events;
        if (_.isFunction(events)) {
          events = events.call(this);
        }

        var combinedEvents = {};
        var triggers = this.configureTriggers();
        _.extend(combinedEvents, events, triggers);

        Backbone.View.prototype.delegateEvents.call(this, combinedEvents);
      },

      // Overriding Backbone.View's undelegateEvents to handle unbinding
      // the `triggers`, `modelEvents`, and `collectionEvents` config
      undelegateEvents: function () {
        var args = Array.prototype.slice.call(arguments);
        Backbone.View.prototype.undelegateEvents.apply(this, args);

        Marionette.unbindEntityEvents(this, this.model, Marionette.getOption(this, "modelEvents"));
        Marionette.unbindEntityEvents(this, this.collection, Marionette.getOption(this, "collectionEvents"));
      },

      // Internal method, handles the `show` event.
      onShowCalled: function () {
      },

      // Default `close` implementation, for removing a view from the
      // DOM and unbinding it. Regions will call this method
      // for you. You can specify an `onClose` method in your view to
      // add custom code that is called after the view is closed.
      close: function () {
        if (this.isClosed) {
          return;
        }

        // allow the close to be stopped by returning `false`
        // from the `onBeforeClose` method
        var shouldClose = this.triggerMethod("before:close");
        if (shouldClose === false) {
          return;
        }

        // mark as closed before doing the actual close, to
        // prevent infinite loops within "close" event handlers
        // that are trying to close other views
        this.isClosed = true;
        this.triggerMethod("close");

        // unbind UI elements
        this.unbindUIElements();

        // remove the view from the DOM
        this.remove();
      },

      // This method binds the elements specified in the "ui" hash inside the view's code with
      // the associated jQuery selectors.
      bindUIElements: function () {
        if (!this.ui) {
          return;
        }

        // store the ui hash in _uiBindings so they can be reset later
        // and so re-rendering the view will be able to find the bindings
        if (!this._uiBindings) {
          this._uiBindings = this.ui;
        }

        // get the bindings result, as a function or otherwise
        var bindings = _.result(this, "_uiBindings");

        // empty the ui so we don't have anything to start with
        this.ui = {};

        // bind each of the selectors
        _.each(_.keys(bindings), function (key) {
          var selector = bindings[key];
          this.ui[key] = this.$(selector);
        }, this);
      },

      // This method unbinds the elements specified in the "ui" hash
      unbindUIElements: function () {
        if (!this.ui) {
          return;
        }

        // delete all of the existing ui bindings
        _.each(this.ui, function ($el, name) {
          delete this.ui[name];
        }, this);

        // reset the ui element to the original bindings configuration
        this.ui = this._uiBindings;
        delete this._uiBindings;
      }
    });

// Item View
// ---------

// A single item view implementation that contains code for rendering
// with underscore.js templates, serializing the view's model or collection,
// and calling several methods on extended views, such as `onRender`.
    Marionette.ItemView = Marionette.View.extend({
      constructor: function () {
        Marionette.View.prototype.constructor.apply(this, slice(arguments));
      },

      // Serialize the model or collection for the view. If a model is
      // found, `.toJSON()` is called. If a collection is found, `.toJSON()`
      // is also called, but is used to populate an `items` array in the
      // resulting data. If both are found, defaults to the model.
      // You can override the `serializeData` method in your own view
      // definition, to provide custom serialization for your view's data.
      serializeData: function () {
        var data = {};

        if (this.model) {
          data = this.model.toJSON();
        }
        else if (this.collection) {
          data = { items: this.collection.toJSON() };
        }

        return data;
      },

      // Render the view, defaulting to underscore.js templates.
      // You can override this in your view definition to provide
      // a very specific rendering for your view. In general, though,
      // you should override the `Marionette.Renderer` object to
      // change how Marionette renders views.
      render: function () {
        this.isClosed = false;

        this.triggerMethod("before:render", this);
        this.triggerMethod("item:before:render", this);

        var data = this.serializeData();
        data = this.mixinTemplateHelpers(data);

        var template = this.getTemplate();
        var html = Marionette.Renderer.render(template, data);
        this.$el.html(html);
        this.bindUIElements();

        this.triggerMethod("render", this);
        this.triggerMethod("item:rendered", this);

        return this;
      },

      // Override the default close event to add a few
      // more events that are triggered.
      close: function () {
        if (this.isClosed) {
          return;
        }

        this.triggerMethod('item:before:close');

        Marionette.View.prototype.close.apply(this, slice(arguments));

        this.triggerMethod('item:closed');
      }
    });

// Collection View
// ---------------

// A view that iterates over a Backbone.Collection
// and renders an individual ItemView for each model.
    Marionette.CollectionView = Marionette.View.extend({
      // used as the prefix for item view events
      // that are forwarded through the collectionview
      itemViewEventPrefix: "itemview",

      // constructor
      constructor: function (options) {
        this._initChildViewStorage();

        Marionette.View.prototype.constructor.apply(this, slice(arguments));

        this._initialEvents();
      },

      // Configured the initial events that the collection view
      // binds to. Override this method to prevent the initial
      // events, or to add your own initial events.
      _initialEvents: function () {
        if (this.collection) {
          this.listenTo(this.collection, "add", this.addChildView, this);
          this.listenTo(this.collection, "remove", this.removeItemView, this);
          this.listenTo(this.collection, "reset", this.render, this);
        }
      },

      // Handle a child item added to the collection
      addChildView: function (item, collection, options) {
        this.closeEmptyView();
        var ItemView = this.getItemView(item);
        var index = this.collection.indexOf(item);
        this.addItemView(item, ItemView, index);
      },

      // Override from `Marionette.View` to guarantee the `onShow` method
      // of child views is called.
      onShowCalled: function () {
        this.children.each(function (child) {
          Marionette.triggerMethod.call(child, "show");
        });
      },

      // Internal method to trigger the before render callbacks
      // and events
      triggerBeforeRender: function () {
        this.triggerMethod("before:render", this);
        this.triggerMethod("collection:before:render", this);
      },

      // Internal method to trigger the rendered callbacks and
      // events
      triggerRendered: function () {
        this.triggerMethod("render", this);
        this.triggerMethod("collection:rendered", this);
      },

      // Render the collection of items. Override this method to
      // provide your own implementation of a render function for
      // the collection view.
      render: function () {
        this.isClosed = false;
        this.triggerBeforeRender();
        this._renderChildren();
        this.triggerRendered();
        return this;
      },

      // Internal method. Separated so that CompositeView can have
      // more control over events being triggered, around the rendering
      // process
      _renderChildren: function () {
        this.closeEmptyView();
        this.closeChildren();

        if (this.collection && this.collection.length > 0) {
          this.showCollection();
        } else {
          this.showEmptyView();
        }
      },

      // Internal method to loop through each item in the
      // collection view and show it
      showCollection: function () {
        var ItemView;
        this.collection.each(function (item, index) {
          ItemView = this.getItemView(item);
          this.addItemView(item, ItemView, index);
        }, this);
      },

      // Internal method to show an empty view in place of
      // a collection of item views, when the collection is
      // empty
      showEmptyView: function () {
        var EmptyView = Marionette.getOption(this, "emptyView");

        if (EmptyView && !this._showingEmptyView) {
          this._showingEmptyView = true;
          var model = new Backbone.Model();
          this.addItemView(model, EmptyView, 0);
        }
      },

      // Internal method to close an existing emptyView instance
      // if one exists. Called when a collection view has been
      // rendered empty, and then an item is added to the collection.
      closeEmptyView: function () {
        if (this._showingEmptyView) {
          this.closeChildren();
          delete this._showingEmptyView;
        }
      },

      // Retrieve the itemView type, either from `this.options.itemView`
      // or from the `itemView` in the object definition. The "options"
      // takes precedence.
      getItemView: function (item) {
        var itemView = Marionette.getOption(this, "itemView");

        if (!itemView) {
          throwError("An `itemView` must be specified", "NoItemViewError");
        }

        return itemView;
      },

      // Render the child item's view and add it to the
      // HTML for the collection view.
      addItemView: function (item, ItemView, index) {
        // get the itemViewOptions if any were specified
        var itemViewOptions = Marionette.getOption(this, "itemViewOptions");
        if (_.isFunction(itemViewOptions)) {
          itemViewOptions = itemViewOptions.call(this, item, index);
        }

        // build the view
        var view = this.buildItemView(item, ItemView, itemViewOptions);

        // set up the child view event forwarding
        this.addChildViewEventForwarding(view);

        // this view is about to be added
        this.triggerMethod("before:item:added", view);

        // Store the child view itself so we can properly
        // remove and/or close it later
        this.children.add(view);

        // Render it and show it
        this.renderItemView(view, index);

        // call the "show" method if the collection view
        // has already been shown
        if (this._isShown) {
          Marionette.triggerMethod.call(view, "show");
        }

        // this view was added
        this.triggerMethod("after:item:added", view);
      },

      // Set up the child view event forwarding. Uses an "itemview:"
      // prefix in front of all forwarded events.
      addChildViewEventForwarding: function (view) {
        var prefix = Marionette.getOption(this, "itemViewEventPrefix");

        // Forward all child item view events through the parent,
        // prepending "itemview:" to the event name
        this.listenTo(view, "all", function () {
          var args = slice(arguments);
          args[0] = prefix + ":" + args[0];
          args.splice(1, 0, view);

          Marionette.triggerMethod.apply(this, args);
        }, this);
      },

      // render the item view
      renderItemView: function (view, index) {
        view.render();
        this.appendHtml(this, view, index);
      },

      // Build an `itemView` for every model in the collection.
      buildItemView: function (item, ItemViewType, itemViewOptions) {
        var options = _.extend({model: item}, itemViewOptions);
        return new ItemViewType(options);
      },

      // get the child view by item it holds, and remove it
      removeItemView: function (item) {
        var view = this.children.findByModel(item);
        this.removeChildView(view);
        this.checkEmpty();
      },

      // Remove the child view and close it
      removeChildView: function (view) {

        // shut down the child view properly,
        // including events that the collection has from it
        if (view) {
          this.stopListening(view);

          // call 'close' or 'remove', depending on which is found
          if (view.close) {
            view.close();
          }
          else if (view.remove) {
            view.remove();
          }

          this.children.remove(view);
        }

        this.triggerMethod("item:removed", view);
      },

      // helper to show the empty view if the collection is empty
      checkEmpty: function () {
        // check if we're empty now, and if we are, show the
        // empty view
        if (!this.collection || this.collection.length === 0) {
          this.showEmptyView();
        }
      },

      // Append the HTML to the collection's `el`.
      // Override this method to do something other
      // then `.append`.
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$el.append(itemView.el);
      },

      // Internal method to set up the `children` object for
      // storing all of the child views
      _initChildViewStorage: function () {
        this.children = new Backbone.ChildViewContainer();
      },

      // Handle cleanup and other closing needs for
      // the collection of views.
      close: function () {
        if (this.isClosed) {
          return;
        }

        this.triggerMethod("collection:before:close");
        this.closeChildren();
        this.triggerMethod("collection:closed");

        Marionette.View.prototype.close.apply(this, slice(arguments));
      },

      // Close the child views that this collection view
      // is holding on to, if any
      closeChildren: function () {
        this.children.each(function (child) {
          this.removeChildView(child);
        }, this);
        this.checkEmpty();
      }
    });


// Composite View
// --------------

// Used for rendering a branch-leaf, hierarchical structure.
// Extends directly from CollectionView and also renders an
// an item view as `modelView`, for the top leaf
    Marionette.CompositeView = Marionette.CollectionView.extend({
      constructor: function (options) {
        Marionette.CollectionView.apply(this, slice(arguments));

        this.itemView = this.getItemView();
      },

      // Configured the initial events that the composite view
      // binds to. Override this method to prevent the initial
      // events, or to add your own initial events.
      _initialEvents: function () {
        if (this.collection) {
          this.listenTo(this.collection, "add", this.addChildView, this);
          this.listenTo(this.collection, "remove", this.removeItemView, this);
          this.listenTo(this.collection, "reset", this._renderChildren, this);
        }
      },

      // Retrieve the `itemView` to be used when rendering each of
      // the items in the collection. The default is to return
      // `this.itemView` or Marionette.CompositeView if no `itemView`
      // has been defined
      getItemView: function (item) {
        var itemView = Marionette.getOption(this, "itemView") || this.constructor;

        if (!itemView) {
          throwError("An `itemView` must be specified", "NoItemViewError");
        }

        return itemView;
      },

      // Serialize the collection for the view.
      // You can override the `serializeData` method in your own view
      // definition, to provide custom serialization for your view's data.
      serializeData: function () {
        var data = {};

        if (this.model) {
          data = this.model.toJSON();
        }

        return data;
      },

      // Renders the model once, and the collection once. Calling
      // this again will tell the model's view to re-render itself
      // but the collection will not re-render.
      render: function () {
        this.isRendered = true;
        this.isClosed = false;
        this.resetItemViewContainer();

        this.triggerBeforeRender();
        var html = this.renderModel();
        this.$el.html(html);
        // the ui bindings is done here and not at the end of render since they
        // will not be available until after the model is rendered, but should be
        // available before the collection is rendered.
        this.bindUIElements();
        this.triggerMethod("composite:model:rendered");

        this._renderChildren();

        this.triggerMethod("composite:rendered");
        this.triggerRendered();
        return this;
      },

      _renderChildren: function () {
        if (this.isRendered) {
          Marionette.CollectionView.prototype._renderChildren.call(this);
          this.triggerMethod("composite:collection:rendered");
        }
      },

      // Render an individual model, if we have one, as
      // part of a composite view (branch / leaf). For example:
      // a treeview.
      renderModel: function () {
        var data = {};
        data = this.serializeData();
        data = this.mixinTemplateHelpers(data);

        var template = this.getTemplate();
        return Marionette.Renderer.render(template, data);
      },

      // Appends the `el` of itemView instances to the specified
      // `itemViewContainer` (a jQuery selector). Override this method to
      // provide custom logic of how the child item view instances have their
      // HTML appended to the composite view instance.
      appendHtml: function (cv, iv) {
        var $container = this.getItemViewContainer(cv);
        $container.append(iv.el);
      },

      // Internal method to ensure an `$itemViewContainer` exists, for the
      // `appendHtml` method to use.
      getItemViewContainer: function (containerView) {
        if ("$itemViewContainer" in containerView) {
          return containerView.$itemViewContainer;
        }

        var container;
        if (containerView.itemViewContainer) {

          var selector = _.result(containerView, "itemViewContainer");
          container = containerView.$(selector);
          if (container.length <= 0) {
            throwError("The specified `itemViewContainer` was not found: " + containerView.itemViewContainer, "ItemViewContainerMissingError");
          }

        } else {
          container = containerView.$el;
        }

        containerView.$itemViewContainer = container;
        return container;
      },

      // Internal method to reset the `$itemViewContainer` on render
      resetItemViewContainer: function () {
        if (this.$itemViewContainer) {
          delete this.$itemViewContainer;
        }
      }
    });


// Layout
// ------

// Used for managing application layouts, nested layouts and
// multiple regions within an application or sub-application.
//
// A specialized view type that renders an area of HTML and then
// attaches `Region` instances to the specified `regions`.
// Used for composite view management and sub-application areas.
    Marionette.Layout = Marionette.ItemView.extend({
      regionType: Marionette.Region,

      // Ensure the regions are available when the `initialize` method
      // is called.
      constructor: function (options) {
        options = options || {};

        this._firstRender = true;
        this._initializeRegions(options);

        Marionette.ItemView.call(this, options);
      },

      // Layout's render will use the existing region objects the
      // first time it is called. Subsequent calls will close the
      // views that the regions are showing and then reset the `el`
      // for the regions to the newly rendered DOM elements.
      render: function () {

        if (this._firstRender) {
          // if this is the first render, don't do anything to
          // reset the regions
          this._firstRender = false;
        } else if (this.isClosed) {
          // a previously closed layout means we need to
          // completely re-initialize the regions
          this._initializeRegions();
        } else {
          // If this is not the first render call, then we need to
          // re-initializing the `el` for each region
          this._reInitializeRegions();
        }

        var args = Array.prototype.slice.apply(arguments);
        var result = Marionette.ItemView.prototype.render.apply(this, args);

        return result;
      },

      // Handle closing regions, and then close the view itself.
      close: function () {
        if (this.isClosed) {
          return;
        }
        this.regionManager.close();
        var args = Array.prototype.slice.apply(arguments);
        Marionette.ItemView.prototype.close.apply(this, args);
      },

      // Add a single region, by name, to the layout
      addRegion: function (name, definition) {
        var regions = {};
        regions[name] = definition;
        return this.addRegions(regions)[name];
      },

      // Add multiple regions as a {name: definition, name2: def2} object literal
      addRegions: function (regions) {
        this.regions = _.extend(this.regions || {}, regions);
        return this._buildRegions(regions);
      },

      // Remove a single region from the Layout, by name
      removeRegion: function (name) {
        return this.regionManager.removeRegion(name);
      },

      // internal method to build regions
      _buildRegions: function (regions) {
        var that = this;

        var defaults = {
          parentEl: function () {
            return that.$el;
          }
        };

        return this.regionManager.addRegions(regions, defaults);
      },

      // Internal method to initialize the regions that have been defined in a
      // `regions` attribute on this layout.
      _initializeRegions: function (options) {
        var regions;
        this._initRegionManager();

        if (_.isFunction(this.regions)) {
          regions = this.regions(options);
        } else {
          regions = this.regions || {};
        }

        this.addRegions(regions);
      },

      // Internal method to re-initialize all of the regions by updating the `el` that
      // they point to
      _reInitializeRegions: function () {
        this.regionManager.closeRegions();
        this.regionManager.each(function (region) {
          region.reset();
        });
      },

      // Internal method to initialize the region manager
      // and all regions in it
      _initRegionManager: function () {
        this.regionManager = new Marionette.RegionManager();

        this.listenTo(this.regionManager, "region:add", function (name, region) {
          this[name] = region;
          this.trigger("region:add", name, region);
        });

        this.listenTo(this.regionManager, "region:remove", function (name, region) {
          delete this[name];
          this.trigger("region:remove", name, region);
        });
      }
    });


// AppRouter
// ---------

// Reduce the boilerplate code of handling route events
// and then calling a single method on another object.
// Have your routers configured to call the method on
// your object, directly.
//
// Configure an AppRouter with `appRoutes`.
//
// App routers can only take one `controller` object.
// It is recommended that you divide your controller
// objects in to smaller pieces of related functionality
// and have multiple routers / controllers, instead of
// just one giant router and controller.
//
// You can also add standard routes to an AppRouter.

    Marionette.AppRouter = Backbone.Router.extend({

      constructor: function (options) {
        Backbone.Router.prototype.constructor.apply(this, slice(arguments));

        this.options = options;

        if (this.appRoutes) {
          var controller = Marionette.getOption(this, "controller");
          this.processAppRoutes(controller, this.appRoutes);
        }
      },

      // Internal method to process the `appRoutes` for the
      // router, and turn them in to routes that trigger the
      // specified method on the specified `controller`.
      processAppRoutes: function (controller, appRoutes) {
        var routeNames = _.keys(appRoutes).reverse(); // Backbone requires reverted order of routes

        _.each(routeNames, function (route) {
          var methodName = appRoutes[route];
          var method = controller[methodName];

          if (!method) {
            throw new Error("Method '" + methodName + "' was not found on the controller");
          }

          this.route(route, methodName, _.bind(method, controller));
        }, this);
      }
    });


// Application
// -----------

// Contain and manage the composite application as a whole.
// Stores and starts up `Region` objects, includes an
// event aggregator as `app.vent`
    Marionette.Application = function (options) {
      this._initRegionManager();
      this._initCallbacks = new Marionette.Callbacks();
      this.vent = new Backbone.Wreqr.EventAggregator();
      this.commands = new Backbone.Wreqr.Commands();
      this.reqres = new Backbone.Wreqr.RequestResponse();
      this.submodules = {};

      _.extend(this, options);

      this.triggerMethod = Marionette.triggerMethod;
    };

    _.extend(Marionette.Application.prototype, Backbone.Events, {
      // Command execution, facilitated by Backbone.Wreqr.Commands
      execute: function () {
        var args = Array.prototype.slice.apply(arguments);
        this.commands.execute.apply(this.commands, args);
      },

      // Request/response, facilitated by Backbone.Wreqr.RequestResponse
      request: function () {
        var args = Array.prototype.slice.apply(arguments);
        return this.reqres.request.apply(this.reqres, args);
      },

      // Add an initializer that is either run at when the `start`
      // method is called, or run immediately if added after `start`
      // has already been called.
      addInitializer: function (initializer) {
        this._initCallbacks.add(initializer);
      },

      // kick off all of the application's processes.
      // initializes all of the regions that have been added
      // to the app, and runs all of the initializer functions
      start: function (options) {
        this.triggerMethod("initialize:before", options);
        this._initCallbacks.run(options, this);
        this.triggerMethod("initialize:after", options);

        this.triggerMethod("start", options);
      },

      // Add regions to your app.
      // Accepts a hash of named strings or Region objects
      // addRegions({something: "#someRegion"})
      // addRegions({something: Region.extend({el: "#someRegion"}) });
      addRegions: function (regions) {
        return this._regionManager.addRegions(regions);
      },

      // Removes a region from your app.
      // Accepts the regions name
      // removeRegion('myRegion')
      removeRegion: function (region) {
        this._regionManager.removeRegion(region);
      },

      // Create a module, attached to the application
      module: function (moduleNames, moduleDefinition) {
        // slice the args, and add this application object as the
        // first argument of the array
        var args = slice(arguments);
        args.unshift(this);

        // see the Marionette.Module object for more information
        return Marionette.Module.create.apply(Marionette.Module, args);
      },

      // Internal method to set up the region manager
      _initRegionManager: function () {
        this._regionManager = new Marionette.RegionManager();

        this.listenTo(this._regionManager, "region:add", function (name, region) {
          this[name] = region;
        });

        this.listenTo(this._regionManager, "region:remove", function (name, region) {
          delete this[name];
        });
      }
    });

// Copy the `extend` function used by Backbone's classes
    Marionette.Application.extend = Marionette.extend;

// Module
// ------

// A simple module system, used to create privacy and encapsulation in
// Marionette applications
    Marionette.Module = function (moduleName, app) {
      this.moduleName = moduleName;

      // store sub-modules
      this.submodules = {};

      this._setupInitializersAndFinalizers();

      // store the configuration for this module
      this.app = app;
      this.startWithParent = true;

      this.triggerMethod = Marionette.triggerMethod;
    };

// Extend the Module prototype with events / listenTo, so that the module
// can be used as an event aggregator or pub/sub.
    _.extend(Marionette.Module.prototype, Backbone.Events, {

      // Initializer for a specific module. Initializers are run when the
      // module's `start` method is called.
      addInitializer: function (callback) {
        this._initializerCallbacks.add(callback);
      },

      // Finalizers are run when a module is stopped. They are used to teardown
      // and finalize any variables, references, events and other code that the
      // module had set up.
      addFinalizer: function (callback) {
        this._finalizerCallbacks.add(callback);
      },

      // Start the module, and run all of its initializers
      start: function (options) {
        // Prevent re-starting a module that is already started
        if (this._isInitialized) {
          return;
        }

        // start the sub-modules (depth-first hierarchy)
        _.each(this.submodules, function (mod) {
          // check to see if we should start the sub-module with this parent
          if (mod.startWithParent) {
            mod.start(options);
          }
        });

        // run the callbacks to "start" the current module
        this.triggerMethod("before:start", options);

        this._initializerCallbacks.run(options, this);
        this._isInitialized = true;

        this.triggerMethod("start", options);
      },

      // Stop this module by running its finalizers and then stop all of
      // the sub-modules for this module
      stop: function () {
        // if we are not initialized, don't bother finalizing
        if (!this._isInitialized) {
          return;
        }
        this._isInitialized = false;

        Marionette.triggerMethod.call(this, "before:stop");

        // stop the sub-modules; depth-first, to make sure the
        // sub-modules are stopped / finalized before parents
        _.each(this.submodules, function (mod) {
          mod.stop();
        });

        // run the finalizers
        this._finalizerCallbacks.run(undefined, this);

        // reset the initializers and finalizers
        this._initializerCallbacks.reset();
        this._finalizerCallbacks.reset();

        Marionette.triggerMethod.call(this, "stop");
      },

      // Configure the module with a definition function and any custom args
      // that are to be passed in to the definition function
      addDefinition: function (moduleDefinition, customArgs) {
        this._runModuleDefinition(moduleDefinition, customArgs);
      },

      // Internal method: run the module definition function with the correct
      // arguments
      _runModuleDefinition: function (definition, customArgs) {
        if (!definition) {
          return;
        }

        // build the correct list of arguments for the module definition
        var args = _.flatten([
          this,
          this.app,
          Backbone,
          Marionette,
          Marionette.$, _,
          customArgs
        ]);

        definition.apply(this, args);
      },

      // Internal method: set up new copies of initializers and finalizers.
      // Calling this method will wipe out all existing initializers and
      // finalizers.
      _setupInitializersAndFinalizers: function () {
        this._initializerCallbacks = new Marionette.Callbacks();
        this._finalizerCallbacks = new Marionette.Callbacks();
      }
    });

// Type methods to create modules
    _.extend(Marionette.Module, {

      // Create a module, hanging off the app parameter as the parent object.
      create: function (app, moduleNames, moduleDefinition) {
        var module = app;

        // get the custom args passed in after the module definition and
        // get rid of the module name and definition function
        var customArgs = slice(arguments);
        customArgs.splice(0, 3);

        // split the module names and get the length
        moduleNames = moduleNames.split(".");
        var length = moduleNames.length;

        // store the module definition for the last module in the chain
        var moduleDefinitions = [];
        moduleDefinitions[length - 1] = moduleDefinition;

        // Loop through all the parts of the module definition
        _.each(moduleNames, function (moduleName, i) {
          var parentModule = module;
          module = this._getModule(parentModule, moduleName, app);
          this._addModuleDefinition(parentModule, module, moduleDefinitions[i], customArgs);
        }, this);

        // Return the last module in the definition chain
        return module;
      },

      _getModule: function (parentModule, moduleName, app, def, args) {
        // Get an existing module of this name if we have one
        var module = parentModule[moduleName];

        if (!module) {
          // Create a new module if we don't have one
          module = new Marionette.Module(moduleName, app);
          parentModule[moduleName] = module;
          // store the module on the parent
          parentModule.submodules[moduleName] = module;
        }

        return module;
      },

      _addModuleDefinition: function (parentModule, module, def, args) {
        var fn;
        var startWithParent;

        if (_.isFunction(def)) {
          // if a function is supplied for the module definition
          fn = def;
          startWithParent = true;

        } else if (_.isObject(def)) {
          // if an object is supplied
          fn = def.define;
          startWithParent = def.startWithParent;

        } else {
          // if nothing is supplied
          startWithParent = true;
        }

        // add module definition if needed
        if (fn) {
          module.addDefinition(fn, args);
        }

        // `and` the two together, ensuring a single `false` will prevent it
        // from starting with the parent
        module.startWithParent = module.startWithParent && startWithParent;

        // setup auto-start if needed
        if (module.startWithParent && !module.startWithParentIsConfigured) {

          // only configure this once
          module.startWithParentIsConfigured = true;

          // add the module initializer config
          parentModule.addInitializer(function (options) {
            if (module.startWithParent) {
              module.start(options);
            }
          });

        }

      }
    });


    return Marionette;
  })(this, Backbone, _);

  return Marionette;
});
/* mapbox.js 0.6.7 */
!function() {
	var define;  // Undefine define (require.js)
	/*!
	 * bean.js - copyright Jacob Thornton 2011
	 * https://github.com/fat/bean
	 * MIT License
	 * special thanks to:
	 * dean edwards: http://dean.edwards.name/
	 * dperini: https://github.com/dperini/nwevents
	 * the entire mootools team: github.com/mootools/mootools-core
	 */
	!function (name, context, definition) {
		if (typeof module !== 'undefined') module.exports = definition(name, context);
		else if (typeof define === 'function' && typeof define.amd  === 'object') define(definition);
		else context[name] = definition(name, context);
	}('bean', this, function (name, context) {
		var win = window
			, old = context[name]
			, overOut = /over|out/
			, namespaceRegex = /[^\.]*(?=\..*)\.|.*/
			, nameRegex = /\..*/
			, addEvent = 'addEventListener'
			, attachEvent = 'attachEvent'
			, removeEvent = 'removeEventListener'
			, detachEvent = 'detachEvent'
			, ownerDocument = 'ownerDocument'
			, targetS = 'target'
			, qSA = 'querySelectorAll'
			, doc = document || {}
			, root = doc.documentElement || {}
			, W3C_MODEL = root[addEvent]
			, eventSupport = W3C_MODEL ? addEvent : attachEvent
			, slice = Array.prototype.slice
			, mouseTypeRegex = /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
			, mouseWheelTypeRegex = /mouse.*(wheel|scroll)/i
			, textTypeRegex = /^text/i
			, touchTypeRegex = /^touch|^gesture/i
			, ONE = {} // singleton for quick matching making add() do one()

			, nativeEvents = (function (hash, events, i) {
				for (i = 0; i < events.length; i++)
					hash[events[i]] = 1
				return hash
			}({}, (
				'click dblclick mouseup mousedown contextmenu ' +                  // mouse buttons
					'mousewheel mousemultiwheel DOMMouseScroll ' +                     // mouse wheel
					'mouseover mouseout mousemove selectstart selectend ' +            // mouse movement
					'keydown keypress keyup ' +                                        // keyboard
					'orientationchange ' +                                             // mobile
					'focus blur change reset select submit ' +                         // form elements
					'load unload beforeunload resize move DOMContentLoaded '+          // window
					'readystatechange message ' +                                      // window
					'error abort scroll ' +                                            // misc
					(W3C_MODEL ? // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
						// that doesn't actually exist, so make sure we only do these on newer browsers
						'show ' +                                                          // mouse buttons
							'input invalid ' +                                                 // form elements
							'touchstart touchmove touchend touchcancel ' +                     // touch
							'gesturestart gesturechange gestureend ' +                         // gesture
							'readystatechange pageshow pagehide popstate ' +                   // window
							'hashchange offline online ' +                                     // window
							'afterprint beforeprint ' +                                        // printing
							'dragstart dragenter dragover dragleave drag drop dragend ' +      // dnd
							'loadstart progress suspend emptied stalled loadmetadata ' +       // media
							'loadeddata canplay canplaythrough playing waiting seeking ' +     // media
							'seeked ended durationchange timeupdate play pause ratechange ' +  // media
							'volumechange cuechange ' +                                        // media
							'checking noupdate downloading cached updateready obsolete ' +     // appcache
							'' : '')
				).split(' ')
			))

			, customEvents = (function () {
				var cdp = 'compareDocumentPosition'
					, isAncestor = cdp in root
						? function (element, container) {
						return container[cdp] && (container[cdp](element) & 16) === 16
					}
						: 'contains' in root
						? function (element, container) {
						container = container.nodeType === 9 || container === window ? root : container
						return container !== element && container.contains(element)
					}
						: function (element, container) {
						while (element = element.parentNode) if (element === container) return 1
						return 0
					}

				function check(event) {
					var related = event.relatedTarget
					return !related
						? related === null
						: (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString()) && !isAncestor(related, this))
				}

				return {
					mouseenter: { base: 'mouseover', condition: check }
					, mouseleave: { base: 'mouseout', condition: check }
					, mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
				}
			}())

			, fixEvent = (function () {
				var commonProps = 'altKey attrChange attrName bubbles cancelable ctrlKey currentTarget detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey srcElement target timeStamp type view which'.split(' ')
					, mouseProps = commonProps.concat('button buttons clientX clientY dataTransfer fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(' '))
					, mouseWheelProps = mouseProps.concat('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ axis'.split(' ')) // 'axis' is FF specific
					, keyProps = commonProps.concat('char charCode key keyCode keyIdentifier keyLocation'.split(' '))
					, textProps = commonProps.concat(['data'])
					, touchProps = commonProps.concat('touches targetTouches changedTouches scale rotation'.split(' '))
					, messageProps = commonProps.concat(['data', 'origin', 'source'])
					, preventDefault = 'preventDefault'
					, createPreventDefault = function (event) {
						return function () {
							if (event[preventDefault])
								event[preventDefault]()
							else
								event.returnValue = false
						}
					}
					, stopPropagation = 'stopPropagation'
					, createStopPropagation = function (event) {
						return function () {
							if (event[stopPropagation])
								event[stopPropagation]()
							else
								event.cancelBubble = true
						}
					}
					, createStop = function (synEvent) {
						return function () {
							synEvent[preventDefault]()
							synEvent[stopPropagation]()
							synEvent.stopped = true
						}
					}
					, copyProps = function (event, result, props) {
						var i, p
						for (i = props.length; i--;) {
							p = props[i]
							if (!(p in result) && p in event) result[p] = event[p]
						}
					}

				return function (event, isNative) {
					var result = { originalEvent: event, isNative: isNative }
					if (!event)
						return result

					var props
						, type = event.type
						, target = event[targetS] || event.srcElement

					result[preventDefault] = createPreventDefault(event)
					result[stopPropagation] = createStopPropagation(event)
					result.stop = createStop(result)
					result[targetS] = target && target.nodeType === 3 ? target.parentNode : target

					if (isNative) { // we only need basic augmentation on custom events, the rest is too expensive
						if (type.indexOf('key') !== -1) {
							props = keyProps
							result.keyCode = event.keyCode || event.which
						} else if (mouseTypeRegex.test(type)) {
							props = mouseProps
							result.rightClick = event.which === 3 || event.button === 2
							result.pos = { x: 0, y: 0 }
							if (event.pageX || event.pageY) {
								result.clientX = event.pageX
								result.clientY = event.pageY
							} else if (event.clientX || event.clientY) {
								result.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
								result.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
							}
							if (overOut.test(type))
								result.relatedTarget = event.relatedTarget || event[(type === 'mouseover' ? 'from' : 'to') + 'Element']
						} else if (touchTypeRegex.test(type)) {
							props = touchProps
						} else if (mouseWheelTypeRegex.test(type)) {
							props = mouseWheelProps
						} else if (textTypeRegex.test(type)) {
							props = textProps
						} else if (type === 'message') {
							props = messageProps
						}
						copyProps(event, result, props || commonProps)
					}
					return result
				}
			}())

		// if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
			, targetElement = function (element, isNative) {
				return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
			}

		// we use one of these per listener, of any type
			, RegEntry = (function () {
				function entry(element, type, handler, original, namespaces) {
					var isNative = this.isNative = nativeEvents[type] && element[eventSupport]
					this.element = element
					this.type = type
					this.handler = handler
					this.original = original
					this.namespaces = namespaces
					this.custom = customEvents[type]
					this.eventType = W3C_MODEL || isNative ? type : 'propertychange'
					this.customType = !W3C_MODEL && !isNative && type
					this[targetS] = targetElement(element, isNative)
					this[eventSupport] = this[targetS][eventSupport]
				}

				entry.prototype = {
					// given a list of namespaces, is our entry in any of them?
					inNamespaces: function (checkNamespaces) {
						var i, j
						if (!checkNamespaces)
							return true
						if (!this.namespaces)
							return false
						for (i = checkNamespaces.length; i--;) {
							for (j = this.namespaces.length; j--;) {
								if (checkNamespaces[i] === this.namespaces[j])
									return true
							}
						}
						return false
					}

					// match by element, original fn (opt), handler fn (opt)
					, matches: function (checkElement, checkOriginal, checkHandler) {
						return this.element === checkElement &&
							(!checkOriginal || this.original === checkOriginal) &&
							(!checkHandler || this.handler === checkHandler)
					}
				}

				return entry
			}())

			, registry = (function () {
				// our map stores arrays by event type, just because it's better than storing
				// everything in a single array. uses '$' as a prefix for the keys for safety
				var map = {}

				// generic functional search of our registry for matching listeners,
				// `fn` returns false to break out of the loop
					, forAll = function (element, type, original, handler, fn) {
						if (!type || type === '*') {
							// search the whole registry
							for (var t in map) {
								if (t.charAt(0) === '$')
									forAll(element, t.substr(1), original, handler, fn)
							}
						} else {
							var i = 0, l, list = map['$' + type], all = element === '*'
							if (!list)
								return
							for (l = list.length; i < l; i++) {
								if (all || list[i].matches(element, original, handler))
									if (!fn(list[i], list, i, type))
										return
							}
						}
					}

					, has = function (element, type, original) {
						// we're not using forAll here simply because it's a bit slower and this
						// needs to be fast
						var i, list = map['$' + type]
						if (list) {
							for (i = list.length; i--;) {
								if (list[i].matches(element, original, null))
									return true
							}
						}
						return false
					}

					, get = function (element, type, original) {
						var entries = []
						forAll(element, type, original, null, function (entry) { return entries.push(entry) })
						return entries
					}

					, put = function (entry) {
						(map['$' + entry.type] || (map['$' + entry.type] = [])).push(entry)
						return entry
					}

					, del = function (entry) {
						forAll(entry.element, entry.type, null, entry.handler, function (entry, list, i) {
							list.splice(i, 1)
							if (list.length === 0)
								delete map['$' + entry.type]
							return false
						})
					}

				// dump all entries, used for onunload
					, entries = function () {
						var t, entries = []
						for (t in map) {
							if (t.charAt(0) === '$')
								entries = entries.concat(map[t])
						}
						return entries
					}

				return { has: has, get: get, put: put, del: del, entries: entries }
			}())

			, selectorEngine = doc[qSA]
				? function (s, r) {
				return r[qSA](s)
			}
				: function () {
				throw new Error('Bean: No selector engine installed') // eeek
			}

			, setSelectorEngine = function (e) {
				selectorEngine = e
			}

		// add and remove listeners to DOM elements
			, listener = W3C_MODEL ? function (element, type, fn, add) {
				element[add ? addEvent : removeEvent](type, fn, false)
			} : function (element, type, fn, add, custom) {
				if (custom && add && element['_on' + custom] === null)
					element['_on' + custom] = 0
				element[add ? attachEvent : detachEvent]('on' + type, fn)
			}

			, nativeHandler = function (element, fn, args) {
				var beanDel = fn.__beanDel
					, handler = function (event) {
						event = fixEvent(event || ((this[ownerDocument] || this.document || this).parentWindow || win).event, true)
						if (beanDel) // delegated event, fix the fix
							event.currentTarget = beanDel.ft(event[targetS], element)
						return fn.apply(element, [event].concat(args))
					}
				handler.__beanDel = beanDel
				return handler
			}

			, customHandler = function (element, fn, type, condition, args, isNative) {
				var beanDel = fn.__beanDel
					, handler = function (event) {
						var target = beanDel ? beanDel.ft(event[targetS], element) : this // deleated event
						if (condition ? condition.apply(target, arguments) : W3C_MODEL ? true : event && event.propertyName === '_on' + type || !event) {
							if (event) {
								event = fixEvent(event || ((this[ownerDocument] || this.document || this).parentWindow || win).event, isNative)
								event.currentTarget = target
							}
							fn.apply(element, event && (!args || args.length === 0) ? arguments : slice.call(arguments, event ? 0 : 1).concat(args))
						}
					}
				handler.__beanDel = beanDel
				return handler
			}

			, once = function (rm, element, type, fn, originalFn) {
				// wrap the handler in a handler that does a remove as well
				return function () {
					rm(element, type, originalFn)
					fn.apply(this, arguments)
				}
			}

			, removeListener = function (element, orgType, handler, namespaces) {
				var i, l, entry
					, type = (orgType && orgType.replace(nameRegex, ''))
					, handlers = registry.get(element, type, handler)

				for (i = 0, l = handlers.length; i < l; i++) {
					if (handlers[i].inNamespaces(namespaces)) {
						if ((entry = handlers[i])[eventSupport])
							listener(entry[targetS], entry.eventType, entry.handler, false, entry.type)
						// TODO: this is problematic, we have a registry.get() and registry.del() that
						// both do registry searches so we waste cycles doing this. Needs to be rolled into
						// a single registry.forAll(fn) that removes while finding, but the catch is that
						// we'll be splicing the arrays that we're iterating over. Needs extra tests to
						// make sure we don't screw it up. @rvagg
						registry.del(entry)
					}
				}
			}

			, addListener = function (element, orgType, fn, originalFn, args) {
				var entry
					, type = orgType.replace(nameRegex, '')
					, namespaces = orgType.replace(namespaceRegex, '').split('.')

				if (registry.has(element, type, fn))
					return element // no dupe
				if (type === 'unload')
					fn = once(removeListener, element, type, fn, originalFn) // self clean-up
				if (customEvents[type]) {
					if (customEvents[type].condition)
						fn = customHandler(element, fn, type, customEvents[type].condition, args, true)
					type = customEvents[type].base || type
				}
				entry = registry.put(new RegEntry(element, type, fn, originalFn, namespaces[0] && namespaces))
				entry.handler = entry.isNative ?
					nativeHandler(element, entry.handler, args) :
					customHandler(element, entry.handler, type, false, args, false)
				if (entry[eventSupport])
					listener(entry[targetS], entry.eventType, entry.handler, true, entry.customType)
			}

			, del = function (selector, fn, $) {
				//TODO: findTarget (therefore $) is called twice, once for match and once for
				// setting e.currentTarget, fix this so it's only needed once
				var findTarget = function (target, root) {
						var i, array = typeof selector === 'string' ? $(selector, root) : selector
						for (; target && target !== root; target = target.parentNode) {
							for (i = array.length; i--;) {
								if (array[i] === target)
									return target
							}
						}
					}
					, handler = function (e) {
						var match = findTarget(e[targetS], this)
						match && fn.apply(match, arguments)
					}

				handler.__beanDel = {
					ft: findTarget // attach it here for customEvents to use too
					, selector: selector
					, $: $
				}
				return handler
			}

			, remove = function (element, typeSpec, fn) {
				var k, type, namespaces, i
					, rm = removeListener
					, isString = typeSpec && typeof typeSpec === 'string'

				if (isString && typeSpec.indexOf(' ') > 0) {
					// remove(el, 't1 t2 t3', fn) or remove(el, 't1 t2 t3')
					typeSpec = typeSpec.split(' ')
					for (i = typeSpec.length; i--;)
						remove(element, typeSpec[i], fn)
					return element
				}
				type = isString && typeSpec.replace(nameRegex, '')
				if (type && customEvents[type])
					type = customEvents[type].type
				if (!typeSpec || isString) {
					// remove(el) or remove(el, t1.ns) or remove(el, .ns) or remove(el, .ns1.ns2.ns3)
					if (namespaces = isString && typeSpec.replace(namespaceRegex, ''))
						namespaces = namespaces.split('.')
					rm(element, type, fn, namespaces)
				} else if (typeof typeSpec === 'function') {
					// remove(el, fn)
					rm(element, null, typeSpec)
				} else {
					// remove(el, { t1: fn1, t2, fn2 })
					for (k in typeSpec) {
						if (typeSpec.hasOwnProperty(k))
							remove(element, k, typeSpec[k])
					}
				}
				return element
			}

		// 5th argument, $=selector engine, is deprecated and will be removed
			, add = function (element, events, fn, delfn, $) {
				var type, types, i, args
					, originalFn = fn
					, isDel = fn && typeof fn === 'string'

				if (events && !fn && typeof events === 'object') {
					for (type in events) {
						if (events.hasOwnProperty(type))
							add.apply(this, [ element, type, events[type] ])
					}
				} else {
					args = arguments.length > 3 ? slice.call(arguments, 3) : []
					types = (isDel ? fn : events).split(' ')
					isDel && (fn = del(events, (originalFn = delfn), $ || selectorEngine)) && (args = slice.call(args, 1))
					// special case for one()
					this === ONE && (fn = once(remove, element, events, fn, originalFn))
					for (i = types.length; i--;) addListener(element, types[i], fn, originalFn, args)
				}
				return element
			}

			, one = function () {
				return add.apply(ONE, arguments)
			}

			, fireListener = W3C_MODEL ? function (isNative, type, element) {
				var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
				evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
				element.dispatchEvent(evt)
			} : function (isNative, type, element) {
				element = targetElement(element, isNative)
				// if not-native then we're using onpropertychange so we just increment a custom property
				isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
			}

			, fire = function (element, type, args) {
				var i, j, l, names, handlers
					, types = type.split(' ')

				for (i = types.length; i--;) {
					type = types[i].replace(nameRegex, '')
					if (names = types[i].replace(namespaceRegex, ''))
						names = names.split('.')
					if (!names && !args && element[eventSupport]) {
						fireListener(nativeEvents[type], type, element)
					} else {
						// non-native event, either because of a namespace, arguments or a non DOM element
						// iterate over all listeners and manually 'fire'
						handlers = registry.get(element, type)
						args = [false].concat(args)
						for (j = 0, l = handlers.length; j < l; j++) {
							if (handlers[j].inNamespaces(names))
								handlers[j].handler.apply(element, args)
						}
					}
				}
				return element
			}

			, clone = function (element, from, type) {
				var i = 0
					, handlers = registry.get(from, type)
					, l = handlers.length
					, args, beanDel

				for (;i < l; i++) {
					if (handlers[i].original) {
						beanDel = handlers[i].handler.__beanDel
						if (beanDel) {
							args = [ element, beanDel.selector, handlers[i].type, handlers[i].original, beanDel.$]
						} else
							args = [ element, handlers[i].type, handlers[i].original ]
						add.apply(null, args)
					}
				}
				return element
			}

			, bean = {
				add: add
				, one: one
				, remove: remove
				, clone: clone
				, fire: fire
				, setSelectorEngine: setSelectorEngine
				, noConflict: function () {
					context[name] = old
					return this
				}
			}

		if (win[attachEvent]) {
			// for IE, clean up on unload to avoid leaks
			var cleanup = function () {
				var i, entries = registry.entries()
				for (i in entries) {
					if (entries[i].type && entries[i].type !== 'unload')
						remove(entries[i].element, entries[i].type)
				}
				win[detachEvent]('onunload', cleanup)
				win.CollectGarbage && win.CollectGarbage()
			}
			win[attachEvent]('onunload', cleanup)
		}

		return bean
	})
	/*!
	 * Reqwest! A general purpose XHR connection manager
	 * (c) Dustin Diaz 2012
	 * https://github.com/ded/reqwest
	 * license MIT
	 */
	!function (name, definition) {
		if (typeof module != 'undefined') module.exports = definition()
		else if (typeof define == 'function' && define.amd) define(definition)
		else this[name] = definition()
	}('reqwest', function () {

		var win = window
			, doc = document
			, twoHundo = /^20\d$/
			, byTag = 'getElementsByTagName'
			, readyState = 'readyState'
			, contentType = 'Content-Type'
			, requestedWith = 'X-Requested-With'
			, head = doc[byTag]('head')[0]
			, uniqid = 0
			, callbackPrefix = 'reqwest_' + (+new Date())
			, lastValue // data stored by the most recent JSONP callback
			, xmlHttpRequest = 'XMLHttpRequest'

		var isArray = typeof Array.isArray == 'function' ? Array.isArray : function (a) {
			return a instanceof Array
		}
		var defaultHeaders = {
			contentType: 'application/x-www-form-urlencoded'
			, requestedWith: xmlHttpRequest
			, accept: {
				'*':  'text/javascript, text/html, application/xml, text/xml, */*'
				, xml:  'application/xml, text/xml'
				, html: 'text/html'
				, text: 'text/plain'
				, json: 'application/json, text/javascript'
				, js:   'application/javascript, text/javascript'
			}
		}
		var xhr = win[xmlHttpRequest] ?
			function () {
				return new XMLHttpRequest()
			} :
			function () {
				return new ActiveXObject('Microsoft.XMLHTTP')
			}

		function handleReadyState(o, success, error) {
			return function () {
				if (o && o[readyState] == 4) {
					if (twoHundo.test(o.status)) {
						success(o)
					} else {
						error(o)
					}
				}
			}
		}

		function setHeaders(http, o) {
			var headers = o.headers || {}, h
			headers.Accept = headers.Accept || defaultHeaders.accept[o.type] || defaultHeaders.accept['*']
			// breaks cross-origin requests with legacy browsers
			if (!o.crossOrigin && !headers[requestedWith]) headers[requestedWith] = defaultHeaders.requestedWith
			if (!headers[contentType]) headers[contentType] = o.contentType || defaultHeaders.contentType
			for (h in headers) {
				headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h])
			}
		}

		function setCredentials(http, o) {
			if (typeof o.withCredentials !== "undefined" && typeof http.withCredentials !== "undefined") {
				http.withCredentials = !!o.withCredentials
			}
		}

		function generalCallback(data) {
			lastValue = data
		}

		function urlappend(url, s) {
			return url + (/\?/.test(url) ? '&' : '?') + s
		}

		function handleJsonp(o, fn, err, url) {
			var reqId = uniqid++
				, cbkey = o.jsonpCallback || 'callback' // the 'callback' key
				, cbval = o.jsonpCallbackName || reqwest.getcallbackPrefix(reqId)
			// , cbval = o.jsonpCallbackName || ('reqwest_' + reqId) // the 'callback' value
				, cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
				, match = url.match(cbreg)
				, script = doc.createElement('script')
				, loaded = 0
				, isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1

			if (match) {
				if (match[3] === '?') {
					url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
				} else {
					cbval = match[3] // provided callback func name
				}
			} else {
				url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
			}

			win[cbval] = generalCallback

			script.type = 'text/javascript'
			script.src = url
			script.async = true
			if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
				// need this for IE due to out-of-order onreadystatechange(), binding script
				// execution to an event listener gives us control over when the script
				// is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
				//
				// if this hack is used in IE10 jsonp callback are never called
				script.event = 'onclick'
				script.htmlFor = script.id = '_reqwest_' + reqId
			}

			script.onload = script.onreadystatechange = function () {
				if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
					return false;
				}
				script.onload = script.onreadystatechange = null
				script.onclick && script.onclick()
				// Call the user callback with the last value stored and clean up values and scripts.
				o.success && o.success(lastValue)
				lastValue = undefined
				head.removeChild(script)
				loaded = 1
			}

			// Add the script to the DOM head
			head.appendChild(script)
		}

		function getRequest(o, fn, err) {
			var method = (o.method || 'GET').toUpperCase()
				, url = typeof o === 'string' ? o : o.url
			// convert non-string objects to query-string form unless o.processData is false
				, data = (o.processData !== false && o.data && typeof o.data !== 'string')
					? reqwest.toQueryString(o.data)
					: (o.data || null)
				, http

			// if we're working on a GET request and we have data then we should append
			// query string to end of URL and not post data
			if ((o.type == 'jsonp' || method == 'GET') && data) {
				url = urlappend(url, data)
				data = null
			}

			if (o.type == 'jsonp') return handleJsonp(o, fn, err, url)

			http = xhr()
			http.open(method, url, true)
			setHeaders(http, o)
			setCredentials(http, o)
			http.onreadystatechange = handleReadyState(http, fn, err)
			o.before && o.before(http)
			http.send(data)
			return http
		}

		function Reqwest(o, fn) {
			this.o = o
			this.fn = fn

			init.apply(this, arguments)
		}

		function setType(url) {
			var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
			return m ? m[1] : 'js'
		}

		function init(o, fn) {

			this.url = typeof o == 'string' ? o : o.url
			this.timeout = null

			// whether request has been fulfilled for purpose
			// of tracking the Promises
			this._fulfilled = false
			// success handlers
			this._fulfillmentHandlers = []
			// error handlers
			this._errorHandlers = []
			// complete (both success and fail) handlers
			this._completeHandlers = []
			this._erred = false
			this._responseArgs = {}

			var self = this
				, type = o.type || setType(this.url)

			fn = fn || function () {}

			if (o.timeout) {
				this.timeout = setTimeout(function () {
					self.abort()
				}, o.timeout)
			}

			if (o.success) {
				this._fulfillmentHandlers.push(function () {
					o.success.apply(o, arguments)
				})
			}

			if (o.error) {
				this._errorHandlers.push(function () {
					o.error.apply(o, arguments)
				})
			}

			if (o.complete) {
				this._completeHandlers.push(function () {
					o.complete.apply(o, arguments)
				})
			}

			function complete(resp) {
				o.timeout && clearTimeout(self.timeout)
				self.timeout = null
				while (self._completeHandlers.length > 0) {
					self._completeHandlers.shift()(resp)
				}
			}

			function success(resp) {
				var r = resp.responseText
				if (r) {
					switch (type) {
						case 'json':
							try {
								resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
							} catch (err) {
								return error(resp, 'Could not parse JSON in response', err)
							}
							break;
						case 'js':
							resp = eval(r)
							break;
						case 'html':
							resp = r
							break;
						case 'xml':
							resp = resp.responseXML;
							break;
					}
				}

				self._responseArgs.resp = resp
				self._fulfilled = true
				fn(resp)
				while (self._fulfillmentHandlers.length > 0) {
					self._fulfillmentHandlers.shift()(resp)
				}

				complete(resp)
			}

			function error(resp, msg, t) {
				self._responseArgs.resp = resp
				self._responseArgs.msg = msg
				self._responseArgs.t = t
				self._erred = true
				while (self._errorHandlers.length > 0) {
					self._errorHandlers.shift()(resp, msg, t)
				}
				complete(resp)
			}

			this.request = getRequest(o, success, error)
		}

		Reqwest.prototype = {
			abort: function () {
				this.request.abort()
			}

			, retry: function () {
				init.call(this, this.o, this.fn)
			}

			/**
			 * Small deviation from the Promises A CommonJs specification
			 * http://wiki.commonjs.org/wiki/Promises/A
			 */

			/**
			 * `then` will execute upon successful requests
			 */
			, then: function (success, fail) {
				if (this._fulfilled) {
					success(this._responseArgs.resp)
				} else if (this._erred) {
					fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
				} else {
					this._fulfillmentHandlers.push(success)
					this._errorHandlers.push(fail)
				}
				return this
			}

			/**
			 * `always` will execute whether the request succeeds or fails
			 */
			, always: function (fn) {
				if (this._fulfilled || this._erred) {
					fn(this._responseArgs.resp)
				} else {
					this._completeHandlers.push(fn)
				}
				return this
			}

			/**
			 * `fail` will execute when the request fails
			 */
			, fail: function (fn) {
				if (this._erred) {
					fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
				} else {
					this._errorHandlers.push(fn)
				}
				return this
			}
		}

		function reqwest(o, fn) {
			return new Reqwest(o, fn)
		}

		// normalize newline variants according to spec -> CRLF
		function normalize(s) {
			return s ? s.replace(/\r?\n/g, '\r\n') : ''
		}

		function serial(el, cb) {
			var n = el.name
				, t = el.tagName.toLowerCase()
				, optCb = function (o) {
					// IE gives value="" even where there is no value attribute
					// 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
					if (o && !o.disabled)
						cb(n, normalize(o.attributes.value && o.attributes.value.specified ? o.value : o.text))
				}

			// don't serialize elements that are disabled or without a name
			if (el.disabled || !n) return;

			switch (t) {
				case 'input':
					if (!/reset|button|image|file/i.test(el.type)) {
						var ch = /checkbox/i.test(el.type)
							, ra = /radio/i.test(el.type)
							, val = el.value;
						// WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
						(!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
					}
					break;
				case 'textarea':
					cb(n, normalize(el.value))
					break;
				case 'select':
					if (el.type.toLowerCase() === 'select-one') {
						optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
					} else {
						for (var i = 0; el.length && i < el.length; i++) {
							el.options[i].selected && optCb(el.options[i])
						}
					}
					break;
			}
		}

		// collect up all form elements found from the passed argument elements all
		// the way down to child elements; pass a '<form>' or form fields.
		// called with 'this'=callback to use for serial() on each element
		function eachFormElement() {
			var cb = this
				, e, i, j
				, serializeSubtags = function (e, tags) {
					for (var i = 0; i < tags.length; i++) {
						var fa = e[byTag](tags[i])
						for (j = 0; j < fa.length; j++) serial(fa[j], cb)
					}
				}

			for (i = 0; i < arguments.length; i++) {
				e = arguments[i]
				if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
				serializeSubtags(e, [ 'input', 'select', 'textarea' ])
			}
		}

		// standard query string style serialization
		function serializeQueryString() {
			return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
		}

		// { 'name': 'value', ... } style serialization
		function serializeHash() {
			var hash = {}
			eachFormElement.apply(function (name, value) {
				if (name in hash) {
					hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
					hash[name].push(value)
				} else hash[name] = value
			}, arguments)
			return hash
		}

		// [ { name: 'name', value: 'value' }, ... ] style serialization
		reqwest.serializeArray = function () {
			var arr = []
			eachFormElement.apply(function (name, value) {
				arr.push({name: name, value: value})
			}, arguments)
			return arr
		}

		reqwest.serialize = function () {
			if (arguments.length === 0) return ''
			var opt, fn
				, args = Array.prototype.slice.call(arguments, 0)

			opt = args.pop()
			opt && opt.nodeType && args.push(opt) && (opt = null)
			opt && (opt = opt.type)

			if (opt == 'map') fn = serializeHash
			else if (opt == 'array') fn = reqwest.serializeArray
			else fn = serializeQueryString

			return fn.apply(null, args)
		}

		reqwest.toQueryString = function (o) {
			var qs = '', i
				, enc = encodeURIComponent
				, push = function (k, v) {
					qs += enc(k) + '=' + enc(v) + '&'
				}

			if (isArray(o)) {
				for (i = 0; o && i < o.length; i++) push(o[i].name, o[i].value)
			} else {
				for (var k in o) {
					if (!Object.hasOwnProperty.call(o, k)) continue;
					var v = o[k]
					if (isArray(v)) {
						for (i = 0; i < v.length; i++) push(k, v[i])
					} else push(k, o[k])
				}
			}

			// spaces should be + according to spec
			return qs.replace(/&$/, '').replace(/%20/g, '+')
		}

		reqwest.getcallbackPrefix = function (reqId) {
			return callbackPrefix
		}

		// jQuery and Zepto compatibility, differences can be remapped here so you can call
		// .ajax.compat(options, callback)
		reqwest.compat = function (o, fn) {
			if (o) {
				o.type && (o.method = o.type) && delete o.type
				o.dataType && (o.type = o.dataType)
				o.jsonpCallback && (o.jsonpCallbackName = o.jsonpCallback) && delete o.jsonpCallback
				o.jsonp && (o.jsonpCallback = o.jsonp)
			}
			return new Reqwest(o, fn)
		}

		return reqwest
	});
}()
/*
 * CommonJS-compatible mustache.js module
 *
 * See http://github.com/janl/mustache.js for more info.
 */

/*
 mustache.js — Logic-less templates in JavaScript

 See http://mustache.github.com/ for more info.
 */

var Mustache = function () {
	var _toString = Object.prototype.toString;

	Array.isArray = Array.isArray || function (obj) {
		return _toString.call(obj) == "[object Array]";
	}

	var _trim = String.prototype.trim, trim;

	if (_trim) {
		trim = function (text) {
			return text == null ? "" : _trim.call(text);
		}
	} else {
		var trimLeft, trimRight;

		// IE doesn't match non-breaking spaces with \s.
		if ((/\S/).test("\xA0")) {
			trimLeft = /^[\s\xA0]+/;
			trimRight = /[\s\xA0]+$/;
		} else {
			trimLeft = /^\s+/;
			trimRight = /\s+$/;
		}

		trim = function (text) {
			return text == null ? "" :
				text.toString().replace(trimLeft, "").replace(trimRight, "");
		}
	}

	var escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;'
	};

	function escapeHTML(string) {
		return String(string).replace(/&(?!\w+;)|[<>"']/g, function (s) {
			return escapeMap[s] || s;
		});
	}

	var regexCache = {};
	var Renderer = function () {};

	Renderer.prototype = {
		otag: "{{",
		ctag: "}}",
		pragmas: {},
		buffer: [],
		pragmas_implemented: {
			"IMPLICIT-ITERATOR": true
		},
		context: {},

		render: function (template, context, partials, in_recursion) {
			// reset buffer & set context
			if (!in_recursion) {
				this.context = context;
				this.buffer = []; // TODO: make this non-lazy
			}

			// fail fast
			if (!this.includes("", template)) {
				if (in_recursion) {
					return template;
				} else {
					this.send(template);
					return;
				}
			}

			// get the pragmas together
			template = this.render_pragmas(template);

			// render the template
			var html = this.render_section(template, context, partials);

			// render_section did not find any sections, we still need to render the tags
			if (html === false) {
				html = this.render_tags(template, context, partials, in_recursion);
			}

			if (in_recursion) {
				return html;
			} else {
				this.sendLines(html);
			}
		},

		/*
		 Sends parsed lines
		 */
		send: function (line) {
			if (line !== "") {
				this.buffer.push(line);
			}
		},

		sendLines: function (text) {
			if (text) {
				var lines = text.split("\n");
				for (var i = 0; i < lines.length; i++) {
					this.send(lines[i]);
				}
			}
		},

		/*
		 Looks for %PRAGMAS
		 */
		render_pragmas: function (template) {
			// no pragmas
			if (!this.includes("%", template)) {
				return template;
			}

			var that = this;
			var regex = this.getCachedRegex("render_pragmas", function (otag, ctag) {
				return new RegExp(otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" + ctag, "g");
			});

			return template.replace(regex, function (match, pragma, options) {
				if (!that.pragmas_implemented[pragma]) {
					throw({message:
						"This implementation of mustache doesn't understand the '" +
							pragma + "' pragma"});
				}
				that.pragmas[pragma] = {};
				if (options) {
					var opts = options.split("=");
					that.pragmas[pragma][opts[0]] = opts[1];
				}
				return "";
				// ignore unknown pragmas silently
			});
		},

		/*
		 Tries to find a partial in the curent scope and render it
		 */
		render_partial: function (name, context, partials) {
			name = trim(name);
			if (!partials || partials[name] === undefined) {
				throw({message: "unknown_partial '" + name + "'"});
			}
			if (!context || typeof context[name] != "object") {
				return this.render(partials[name], context, partials, true);
			}
			return this.render(partials[name], context[name], partials, true);
		},

		/*
		 Renders inverted (^) and normal (#) sections
		 */
		render_section: function (template, context, partials) {
			if (!this.includes("#", template) && !this.includes("^", template)) {
				// did not render anything, there were no sections
				return false;
			}

			var that = this;

			var regex = this.getCachedRegex("render_section", function (otag, ctag) {
				// This regex matches _the first_ section ({{#foo}}{{/foo}}), and captures the remainder
				return new RegExp(
					"^([\\s\\S]*?)" +         // all the crap at the beginning that is not {{*}} ($1)

						otag +                    // {{
						"(\\^|\\#)\\s*(.+)\\s*" + //  #foo (# == $2, foo == $3)
						ctag +                    // }}

						"\n*([\\s\\S]*?)" +       // between the tag ($2). leading newlines are dropped

						otag +                    // {{
						"\\/\\s*\\3\\s*" +        //  /foo (backreference to the opening tag).
						ctag +                    // }}

						"\\s*([\\s\\S]*)$",       // everything else in the string ($4). leading whitespace is dropped.

					"g");
			});


			// for each {{#foo}}{{/foo}} section do...
			return template.replace(regex, function (match, before, type, name, content, after) {
				// before contains only tags, no sections
				var renderedBefore = before ? that.render_tags(before, context, partials, true) : "",

				// after may contain both sections and tags, so use full rendering function
					renderedAfter = after ? that.render(after, context, partials, true) : "",

				// will be computed below
					renderedContent,

					value = that.find(name, context);

				if (type === "^") { // inverted section
					if (!value || Array.isArray(value) && value.length === 0) {
						// false or empty list, render it
						renderedContent = that.render(content, context, partials, true);
					} else {
						renderedContent = "";
					}
				} else if (type === "#") { // normal section
					if (Array.isArray(value)) { // Enumerable, Let's loop!
						renderedContent = that.map(value, function (row) {
							return that.render(content, that.create_context(row), partials, true);
						}).join("");
					} else if (that.is_object(value)) { // Object, Use it as subcontext!
						renderedContent = that.render(content, that.create_context(value),
							partials, true);
					} else if (typeof value == "function") {
						// higher order section
						renderedContent = value.call(context, content, function (text) {
							return that.render(text, context, partials, true);
						});
					} else if (value) { // boolean section
						renderedContent = that.render(content, context, partials, true);
					} else {
						renderedContent = "";
					}
				}

				return renderedBefore + renderedContent + renderedAfter;
			});
		},

		/*
		 Replace {{foo}} and friends with values from our view
		 */
		render_tags: function (template, context, partials, in_recursion) {
			// tit for tat
			var that = this;

			var new_regex = function () {
				return that.getCachedRegex("render_tags", function (otag, ctag) {
					return new RegExp(otag + "(=|!|>|&|\\{|%)?([^#\\^]+?)\\1?" + ctag + "+", "g");
				});
			};

			var regex = new_regex();
			var tag_replace_callback = function (match, operator, name) {
				switch(operator) {
					case "!": // ignore comments
						return "";
					case "=": // set new delimiters, rebuild the replace regexp
						that.set_delimiters(name);
						regex = new_regex();
						return "";
					case ">": // render partial
						return that.render_partial(name, context, partials);
					case "{": // the triple mustache is unescaped
					case "&": // & operator is an alternative unescape method
						return that.find(name, context);
					default: // escape the value
						return escapeHTML(that.find(name, context));
				}
			};
			var lines = template.split("\n");
			for(var i = 0; i < lines.length; i++) {
				lines[i] = lines[i].replace(regex, tag_replace_callback, this);
				if (!in_recursion) {
					this.send(lines[i]);
				}
			}

			if (in_recursion) {
				return lines.join("\n");
			}
		},

		set_delimiters: function (delimiters) {
			var dels = delimiters.split(" ");
			this.otag = this.escape_regex(dels[0]);
			this.ctag = this.escape_regex(dels[1]);
		},

		escape_regex: function (text) {
			// thank you Simon Willison
			if (!arguments.callee.sRE) {
				var specials = [
					'/', '.', '*', '+', '?', '|',
					'(', ')', '[', ']', '{', '}', '\\'
				];
				arguments.callee.sRE = new RegExp(
					'(\\' + specials.join('|\\') + ')', 'g'
				);
			}
			return text.replace(arguments.callee.sRE, '\\$1');
		},

		/*
		 find `name` in current `context`. That is find me a value
		 from the view object
		 */
		find: function (name, context) {
			name = trim(name);

			// Checks whether a value is thruthy or false or 0
			function is_kinda_truthy(bool) {
				return bool === false || bool === 0 || bool;
			}

			var value;

			// check for dot notation eg. foo.bar
			if (name.match(/([a-z_]+)\./ig)) {
				var childValue = this.walk_context(name, context);
				if (is_kinda_truthy(childValue)) {
					value = childValue;
				}
			} else {
				if (is_kinda_truthy(context[name])) {
					value = context[name];
				} else if (is_kinda_truthy(this.context[name])) {
					value = this.context[name];
				}
			}

			if (typeof value == "function") {
				return value.apply(context);
			}
			if (value !== undefined) {
				return value;
			}
			// silently ignore unkown variables
			return "";
		},

		walk_context: function (name, context) {
			var path = name.split('.');
			// if the var doesn't exist in current context, check the top level context
			var value_context = (context[path[0]] != undefined) ? context : this.context;
			var value = value_context[path.shift()];
			while (value != undefined && path.length > 0) {
				value_context = value;
				value = value[path.shift()];
			}
			// if the value is a function, call it, binding the correct context
			if (typeof value == "function") {
				return value.apply(value_context);
			}
			return value;
		},

		// Utility methods

		/* includes tag */
		includes: function (needle, haystack) {
			return haystack.indexOf(this.otag + needle) != -1;
		},

		// by @langalex, support for arrays of strings
		create_context: function (_context) {
			if (this.is_object(_context)) {
				return _context;
			} else {
				var iterator = ".";
				if (this.pragmas["IMPLICIT-ITERATOR"]) {
					iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
				}
				var ctx = {};
				ctx[iterator] = _context;
				return ctx;
			}
		},

		is_object: function (a) {
			return a && typeof a == "object";
		},

		/*
		 Why, why, why? Because IE. Cry, cry cry.
		 */
		map: function (array, fn) {
			if (typeof array.map == "function") {
				return array.map(fn);
			} else {
				var r = [];
				var l = array.length;
				for(var i = 0; i < l; i++) {
					r.push(fn(array[i]));
				}
				return r;
			}
		},

		getCachedRegex: function (name, generator) {
			var byOtag = regexCache[this.otag];
			if (!byOtag) {
				byOtag = regexCache[this.otag] = {};
			}

			var byCtag = byOtag[this.ctag];
			if (!byCtag) {
				byCtag = byOtag[this.ctag] = {};
			}

			var regex = byCtag[name];
			if (!regex) {
				regex = byCtag[name] = generator(this.otag, this.ctag);
			}

			return regex;
		}
	};

	return({
		name: "mustache.js",
		version: "0.4.0",

		/*
		 Turns a template and view into HTML
		 */
		to_html: function (template, view, partials, send_fun) {
			var renderer = new Renderer();
			if (send_fun) {
				renderer.send = send_fun;
			}
			renderer.render(template, view || {}, partials);
			if (!send_fun) {
				return renderer.buffer.join("\n");
			}
		}
	});
}();
if (typeof module !== 'undefined' && module.exports) {
	exports.name = Mustache.name;
	exports.version = Mustache.version;

	exports.to_html = function() {
		return Mustache.to_html.apply(this, arguments);
	};
}
/*!
 * Modest Maps JS v3.3.5
 * http://modestmaps.com/
 *
 * Copyright (c) 2011 Stamen Design, All Rights Reserved.
 *
 * Open source under the BSD License.
 * http://creativecommons.org/licenses/BSD/
 *
 * Versioned using Semantic Versioning (v.major.minor.patch)
 * See CHANGELOG and http://semver.org/ for more details.
 *
 */

var previousMM = MM;

// namespacing for backwards-compatibility
if (!com) {
	var com = {};
	if (!com.modestmaps) com.modestmaps = {};
}

var MM = com.modestmaps = {
	noConflict: function() {
		MM = previousMM;
		return this;
	}
};

(function(MM) {
	// Make inheritance bearable: clone one level of properties
	MM.extend = function(child, parent) {
		for (var property in parent.prototype) {
			if (typeof child.prototype[property] == "undefined") {
				child.prototype[property] = parent.prototype[property];
			}
		}
		return child;
	};

	MM.getFrame = function () {
		// native animation frames
		// http://webstuff.nfshost.com/anim-timing/Overview.html
		// http://dev.chromium.org/developers/design-documents/requestanimationframe-implementation
		// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
		// can't apply these directly to MM because Chrome needs window
		// to own webkitRequestAnimationFrame (for example)
		// perhaps we should namespace an alias onto window instead? 
		// e.g. window.mmRequestAnimationFrame?
		return function(callback) {
			(window.requestAnimationFrame  ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame    ||
				window.oRequestAnimationFrame      ||
				window.msRequestAnimationFrame     ||
				function (callback) {
					window.setTimeout(function () {
						callback(+new Date());
					}, 10);
				})(callback);
		};
	}();

	// Inspired by LeafletJS
	MM.transformProperty = (function(props) {
		if (!this.document) return; // node.js safety
		var style = document.documentElement.style;
		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	})(['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

	MM.matrixString = function(point) {
		// Make the result of point.scale * point.width a whole number.
		if (point.scale * point.width % 1) {
			point.scale += (1 - point.scale * point.width % 1) / point.width;
		}

		var scale = point.scale || 1;
		if (MM._browser.webkit3d) {
			return  'translate3d(' +
				point.x.toFixed(0) + 'px,' + point.y.toFixed(0) + 'px, 0px)' +
				'scale3d(' + scale + ',' + scale + ', 1)';
		} else {
			return  'translate(' +
				point.x.toFixed(6) + 'px,' + point.y.toFixed(6) + 'px)' +
				'scale(' + scale + ',' + scale + ')';
		}
	};

	MM._browser = (function(window) {
		return {
			webkit: ('WebKitCSSMatrix' in window),
			webkit3d: ('WebKitCSSMatrix' in window) && ('m11' in new WebKitCSSMatrix())
		};
	})(this); // use this for node.js global

	MM.moveElement = function(el, point) {
		if (MM.transformProperty) {
			// Optimize for identity transforms, where you don't actually
			// need to change this element's string. Browsers can optimize for
			// the .style.left case but not for this CSS case.
			if (!point.scale) point.scale = 1;
			if (!point.width) point.width = 0;
			if (!point.height) point.height = 0;
			var ms = MM.matrixString(point);
			if (el[MM.transformProperty] !== ms) {
				el.style[MM.transformProperty] =
					el[MM.transformProperty] = ms;
			}
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
			// Don't set width unless asked to: this is performance-intensive
			// and not always necessary
			if (point.width && point.height && point.scale) {
				el.style.width =  Math.ceil(point.width  * point.scale) + 'px';
				el.style.height = Math.ceil(point.height * point.scale) + 'px';
			}
		}
	};

	// Events
	// Cancel an event: prevent it from bubbling
	MM.cancelEvent = function(e) {
		// there's more than one way to skin this cat
		e.cancelBubble = true;
		e.cancel = true;
		e.returnValue = false;
		if (e.stopPropagation) { e.stopPropagation(); }
		if (e.preventDefault) { e.preventDefault(); }
		return false;
	};

	MM.coerceLayer = function(layerish) {
		if (typeof layerish == 'string') {
			// Probably a template string
			return new MM.Layer(new MM.TemplatedLayer(layerish));
		} else if ('draw' in layerish && typeof layerish.draw == 'function') {
			// good enough, though we should probably enforce .parent and .destroy() too
			return layerish;
		} else {
			// probably a MapProvider
			return new MM.Layer(layerish);
		}
	};

	// see http://ejohn.org/apps/jselect/event.html for the originals
	MM.addEvent = function(obj, type, fn) {
		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
			if (type == 'mousewheel') {
				obj.addEventListener('DOMMouseScroll', fn, false);
			}
		} else if (obj.attachEvent) {
			obj['e'+type+fn] = fn;
			obj[type+fn] = function(){ obj['e'+type+fn](window.event); };
			obj.attachEvent('on'+type, obj[type+fn]);
		}
	};

	MM.removeEvent = function( obj, type, fn ) {
		if (obj.removeEventListener) {
			obj.removeEventListener(type, fn, false);
			if (type == 'mousewheel') {
				obj.removeEventListener('DOMMouseScroll', fn, false);
			}
		} else if (obj.detachEvent) {
			obj.detachEvent('on'+type, obj[type+fn]);
			obj[type+fn] = null;
		}
	};

	// Cross-browser function to get current element style property
	MM.getStyle = function(el,styleProp) {
		if (el.currentStyle)
			return el.currentStyle[styleProp];
		else if (window.getComputedStyle)
			return document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
	};
	// Point
	MM.Point = function(x, y) {
		this.x = parseFloat(x);
		this.y = parseFloat(y);
	};

	MM.Point.prototype = {
		x: 0,
		y: 0,
		toString: function() {
			return "(" + this.x.toFixed(3) + ", " + this.y.toFixed(3) + ")";
		},
		copy: function() {
			return new MM.Point(this.x, this.y);
		}
	};

	// Get the euclidean distance between two points
	MM.Point.distance = function(p1, p2) {
		return Math.sqrt(
			Math.pow(p2.x - p1.x, 2) +
				Math.pow(p2.y - p1.y, 2));
	};

	// Get a point between two other points, biased by `t`.
	MM.Point.interpolate = function(p1, p2, t) {
		return new MM.Point(
			p1.x + (p2.x - p1.x) * t,
			p1.y + (p2.y - p1.y) * t);
	};
	// Coordinate
	// ----------
	// An object representing a tile position, at as specified zoom level.
	// This is not necessarily a precise tile - `row`, `column`, and
	// `zoom` can be floating-point numbers, and the `container()` function
	// can be used to find the actual tile that contains the point.
	MM.Coordinate = function(row, column, zoom) {
		this.row = row;
		this.column = column;
		this.zoom = zoom;
	};

	MM.Coordinate.prototype = {

		row: 0,
		column: 0,
		zoom: 0,

		toString: function() {
			return "("  + this.row.toFixed(3) +
				", " + this.column.toFixed(3) +
				" @" + this.zoom.toFixed(3) + ")";
		},
		// Quickly generate a string representation of this coordinate to
		// index it in hashes. 
		toKey: function() {
			// We've tried to use efficient hash functions here before but we took
			// them out. Contributions welcome but watch out for collisions when the
			// row or column are negative and check thoroughly (exhaustively) before
			// committing.
			return this.zoom + ',' + this.row + ',' + this.column;
		},
		// Clone this object.
		copy: function() {
			return new MM.Coordinate(this.row, this.column, this.zoom);
		},
		// Get the actual, rounded-number tile that contains this point.
		container: function() {
			// using floor here (not parseInt, ~~) because we want -0.56 --> -1
			return new MM.Coordinate(Math.floor(this.row),
				Math.floor(this.column),
				Math.floor(this.zoom));
		},
		// Recalculate this Coordinate at a different zoom level and return the
		// new object.
		zoomTo: function(destination) {
			var power = Math.pow(2, destination - this.zoom);
			return new MM.Coordinate(this.row * power,
				this.column * power,
				destination);
		},
		// Recalculate this Coordinate at a different relative zoom level and return the
		// new object.
		zoomBy: function(distance) {
			var power = Math.pow(2, distance);
			return new MM.Coordinate(this.row * power,
				this.column * power,
				this.zoom + distance);
		},
		// Move this coordinate up by `dist` coordinates
		up: function(dist) {
			if (dist === undefined) dist = 1;
			return new MM.Coordinate(this.row - dist, this.column, this.zoom);
		},
		// Move this coordinate right by `dist` coordinates
		right: function(dist) {
			if (dist === undefined) dist = 1;
			return new MM.Coordinate(this.row, this.column + dist, this.zoom);
		},
		// Move this coordinate down by `dist` coordinates
		down: function(dist) {
			if (dist === undefined) dist = 1;
			return new MM.Coordinate(this.row + dist, this.column, this.zoom);
		},
		// Move this coordinate left by `dist` coordinates
		left: function(dist) {
			if (dist === undefined) dist = 1;
			return new MM.Coordinate(this.row, this.column - dist, this.zoom);
		}
	};
	// Location
	// --------
	MM.Location = function(lat, lon) {
		this.lat = parseFloat(lat);
		this.lon = parseFloat(lon);
	};

	MM.Location.prototype = {
		lat: 0,
		lon: 0,
		toString: function() {
			return "(" + this.lat.toFixed(3) + ", " + this.lon.toFixed(3) + ")";
		},
		copy: function() {
			return new MM.Location(this.lat, this.lon);
		}
	};

	// returns approximate distance between start and end locations
	//
	// default unit is meters
	//
	// you can specify different units by optionally providing the
	// earth's radius in the units you desire
	//
	// Default is 6,378,000 metres, suggested values are:
	//
	// * 3963.1 statute miles
	// * 3443.9 nautical miles
	// * 6378 km
	//
	// see [Formula and code for calculating distance based on two lat/lon locations](http://jan.ucc.nau.edu/~cvm/latlon_formula.html)
	MM.Location.distance = function(l1, l2, r) {
		if (!r) {
			// default to meters
			r = 6378000;
		}
		var deg2rad = Math.PI / 180.0,
			a1 = l1.lat * deg2rad,
			b1 = l1.lon * deg2rad,
			a2 = l2.lat * deg2rad,
			b2 = l2.lon * deg2rad,
			c = Math.cos(a1) * Math.cos(b1) * Math.cos(a2) * Math.cos(b2),
			d = Math.cos(a1) * Math.sin(b1) * Math.cos(a2) * Math.sin(b2),
			e = Math.sin(a1) * Math.sin(a2);
		return Math.acos(c + d + e) * r;
	};

	// Interpolates along a great circle, f between 0 and 1
	//
	// * FIXME: could be heavily optimized (lots of trig calls to cache)
	// * FIXME: could be inmproved for calculating a full path
	MM.Location.interpolate = function(l1, l2, f) {
		if (l1.lat === l2.lat && l1.lon === l2.lon) {
			return new MM.Location(l1.lat, l1.lon);
		}
		var deg2rad = Math.PI / 180.0,
			lat1 = l1.lat * deg2rad,
			lon1 = l1.lon * deg2rad,
			lat2 = l2.lat * deg2rad,
			lon2 = l2.lon * deg2rad;

		var d = 2 * Math.asin(
			Math.sqrt(
				Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
					Math.cos(lat1) * Math.cos(lat2) *
						Math.pow(Math.sin((lon1 - lon2) / 2), 2)));

		var A = Math.sin((1-f)*d)/Math.sin(d);
		var B = Math.sin(f*d)/Math.sin(d);
		var x = A * Math.cos(lat1) * Math.cos(lon1) +
			B * Math.cos(lat2) * Math.cos(lon2);
		var y = A * Math.cos(lat1) * Math.sin(lon1) +
			B * Math.cos(lat2) * Math.sin(lon2);
		var z = A * Math.sin(lat1) + B * Math.sin(lat2);

		var latN = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
		var lonN = Math.atan2(y,x);

		return new MM.Location(latN / deg2rad, lonN / deg2rad);
	};

	// Returns bearing from one point to another
	//
	// * FIXME: bearing is not constant along significant great circle arcs.
	MM.Location.bearing = function(l1, l2) {
		var deg2rad = Math.PI / 180.0,
			lat1 = l1.lat * deg2rad,
			lon1 = l1.lon * deg2rad,
			lat2 = l2.lat * deg2rad,
			lon2 = l2.lon * deg2rad;
		var result = Math.atan2(
			Math.sin(lon1 - lon2) *
				Math.cos(lat2),
			Math.cos(lat1) *
				Math.sin(lat2) -
				Math.sin(lat1) *
					Math.cos(lat2) *
					Math.cos(lon1 - lon2)
		)  / -(Math.PI / 180);

		// map it into 0-360 range
		return (result < 0) ? result + 360 : result;
	};
	// Extent
	// ----------
	// An object representing a map's rectangular extent, defined by its north,
	// south, east and west bounds.

	MM.Extent = function(north, west, south, east) {
		if (north instanceof MM.Location &&
			west instanceof MM.Location) {
			var northwest = north,
				southeast = west;

			north = northwest.lat;
			west = northwest.lon;
			south = southeast.lat;
			east = southeast.lon;
		}
		if (isNaN(south)) south = north;
		if (isNaN(east)) east = west;
		this.north = Math.max(north, south);
		this.south = Math.min(north, south);
		this.east = Math.max(east, west);
		this.west = Math.min(east, west);
	};

	MM.Extent.prototype = {
		// boundary attributes
		north: 0,
		south: 0,
		east: 0,
		west: 0,

		copy: function() {
			return new MM.Extent(this.north, this.west, this.south, this.east);
		},

		toString: function(precision) {
			if (isNaN(precision)) precision = 3;
			return [
				this.north.toFixed(precision),
				this.west.toFixed(precision),
				this.south.toFixed(precision),
				this.east.toFixed(precision)
			].join(", ");
		},

		// getters for the corner locations
		northWest: function() {
			return new MM.Location(this.north, this.west);
		},
		southEast: function() {
			return new MM.Location(this.south, this.east);
		},
		northEast: function() {
			return new MM.Location(this.north, this.east);
		},
		southWest: function() {
			return new MM.Location(this.south, this.west);
		},
		// getter for the center location
		center: function() {
			return new MM.Location(
				this.south + (this.north - this.south) / 2,
				this.east + (this.west - this.east) / 2
			);
		},

		// extend the bounds to include a location's latitude and longitude
		encloseLocation: function(loc) {
			if (loc.lat > this.north) this.north = loc.lat;
			if (loc.lat < this.south) this.south = loc.lat;
			if (loc.lon > this.east) this.east = loc.lon;
			if (loc.lon < this.west) this.west = loc.lon;
		},

		// extend the bounds to include multiple locations
		encloseLocations: function(locations) {
			var len = locations.length;
			for (var i = 0; i < len; i++) {
				this.encloseLocation(locations[i]);
			}
		},

		// reset bounds from a list of locations
		setFromLocations: function(locations) {
			var len = locations.length,
				first = locations[0];
			this.north = this.south = first.lat;
			this.east = this.west = first.lon;
			for (var i = 1; i < len; i++) {
				this.encloseLocation(locations[i]);
			}
		},

		// extend the bounds to include another extent
		encloseExtent: function(extent) {
			if (extent.north > this.north) this.north = extent.north;
			if (extent.south < this.south) this.south = extent.south;
			if (extent.east > this.east) this.east = extent.east;
			if (extent.west < this.west) this.west = extent.west;
		},

		// determine if a location is within this extent
		containsLocation: function(loc) {
			return loc.lat >= this.south &&
				loc.lat <= this.north &&
				loc.lon >= this.west &&
				loc.lon <= this.east;
		},

		// turn an extent into an array of locations containing its northwest
		// and southeast corners (used in MM.Map.setExtent())
		toArray: function() {
			return [this.northWest(), this.southEast()];
		}
	};

	MM.Extent.fromString = function(str) {
		var parts = str.split(/\s*,\s*/);
		if (parts.length != 4) {
			throw "Invalid extent string (expecting 4 comma-separated numbers)";
		}
		return new MM.Extent(
			parseFloat(parts[0]),
			parseFloat(parts[1]),
			parseFloat(parts[2]),
			parseFloat(parts[3])
		);
	};

	MM.Extent.fromArray = function(locations) {
		var extent = new MM.Extent();
		extent.setFromLocations(locations);
		return extent;
	};

	// Transformation
	// --------------
	MM.Transformation = function(ax, bx, cx, ay, by, cy) {
		this.ax = ax;
		this.bx = bx;
		this.cx = cx;
		this.ay = ay;
		this.by = by;
		this.cy = cy;
	};

	MM.Transformation.prototype = {

		ax: 0,
		bx: 0,
		cx: 0,
		ay: 0,
		by: 0,
		cy: 0,

		transform: function(point) {
			return new MM.Point(this.ax * point.x + this.bx * point.y + this.cx,
				this.ay * point.x + this.by * point.y + this.cy);
		},

		untransform: function(point) {
			return new MM.Point((point.x * this.by - point.y * this.bx -
				this.cx * this.by + this.cy * this.bx) /
				(this.ax * this.by - this.ay * this.bx),
				(point.x * this.ay - point.y * this.ax -
					this.cx * this.ay + this.cy * this.ax) /
					(this.bx * this.ay - this.by * this.ax));
		}

	};


	// Generates a transform based on three pairs of points,
	// a1 -> a2, b1 -> b2, c1 -> c2.
	MM.deriveTransformation = function(a1x, a1y, a2x, a2y,
									   b1x, b1y, b2x, b2y,
									   c1x, c1y, c2x, c2y) {
		var x = MM.linearSolution(a1x, a1y, a2x,
			b1x, b1y, b2x,
			c1x, c1y, c2x);
		var y = MM.linearSolution(a1x, a1y, a2y,
			b1x, b1y, b2y,
			c1x, c1y, c2y);
		return new MM.Transformation(x[0], x[1], x[2], y[0], y[1], y[2]);
	};

	// Solves a system of linear equations.
	//
	//     t1 = (a * r1) + (b + s1) + c
	//     t2 = (a * r2) + (b + s2) + c
	//     t3 = (a * r3) + (b + s3) + c
	//
	// r1 - t3 are the known values.
	// a, b, c are the unknowns to be solved.
	// returns the a, b, c coefficients.
	MM.linearSolution = function(r1, s1, t1, r2, s2, t2, r3, s3, t3) {
		// make them all floats
		r1 = parseFloat(r1);
		s1 = parseFloat(s1);
		t1 = parseFloat(t1);
		r2 = parseFloat(r2);
		s2 = parseFloat(s2);
		t2 = parseFloat(t2);
		r3 = parseFloat(r3);
		s3 = parseFloat(s3);
		t3 = parseFloat(t3);

		var a = (((t2 - t3) * (s1 - s2)) - ((t1 - t2) * (s2 - s3))) /
			(((r2 - r3) * (s1 - s2)) - ((r1 - r2) * (s2 - s3)));

		var b = (((t2 - t3) * (r1 - r2)) - ((t1 - t2) * (r2 - r3))) /
			(((s2 - s3) * (r1 - r2)) - ((s1 - s2) * (r2 - r3)));

		var c = t1 - (r1 * a) - (s1 * b);
		return [ a, b, c ];
	};
	// Projection
	// ----------

	// An abstract class / interface for projections
	MM.Projection = function(zoom, transformation) {
		if (!transformation) {
			transformation = new MM.Transformation(1, 0, 0, 0, 1, 0);
		}
		this.zoom = zoom;
		this.transformation = transformation;
	};

	MM.Projection.prototype = {

		zoom: 0,
		transformation: null,

		rawProject: function(point) {
			throw "Abstract method not implemented by subclass.";
		},

		rawUnproject: function(point) {
			throw "Abstract method not implemented by subclass.";
		},

		project: function(point) {
			point = this.rawProject(point);
			if(this.transformation) {
				point = this.transformation.transform(point);
			}
			return point;
		},

		unproject: function(point) {
			if(this.transformation) {
				point = this.transformation.untransform(point);
			}
			point = this.rawUnproject(point);
			return point;
		},

		locationCoordinate: function(location) {
			var point = new MM.Point(Math.PI * location.lon / 180.0,
				Math.PI * location.lat / 180.0);
			point = this.project(point);
			return new MM.Coordinate(point.y, point.x, this.zoom);
		},

		coordinateLocation: function(coordinate) {
			coordinate = coordinate.zoomTo(this.zoom);
			var point = new MM.Point(coordinate.column, coordinate.row);
			point = this.unproject(point);
			return new MM.Location(180.0 * point.y / Math.PI,
				180.0 * point.x / Math.PI);
		}
	};

	// A projection for equilateral maps, based on longitude and latitude
	MM.LinearProjection = function(zoom, transformation) {
		MM.Projection.call(this, zoom, transformation);
	};

	// The Linear projection doesn't reproject points
	MM.LinearProjection.prototype = {
		rawProject: function(point) {
			return new MM.Point(point.x, point.y);
		},
		rawUnproject: function(point) {
			return new MM.Point(point.x, point.y);
		}
	};

	MM.extend(MM.LinearProjection, MM.Projection);

	MM.MercatorProjection = function(zoom, transformation) {
		// super!
		MM.Projection.call(this, zoom, transformation);
	};

	// Project lon/lat points into meters required for Mercator
	MM.MercatorProjection.prototype = {
		rawProject: function(point) {
			return new MM.Point(point.x,
				Math.log(Math.tan(0.25 * Math.PI + 0.5 * point.y)));
		},

		rawUnproject: function(point) {
			return new MM.Point(point.x,
				2 * Math.atan(Math.pow(Math.E, point.y)) - 0.5 * Math.PI);
		}
	};

	MM.extend(MM.MercatorProjection, MM.Projection);
	// Providers
	// ---------
	// Providers provide tile URLs and possibly elements for layers.
	//
	// MapProvider ->
	//   Template
	//
	MM.MapProvider = function(getTile) {
		if (getTile) {
			this.getTile = getTile;
		}
	};

	MM.MapProvider.prototype = {

		// these are limits for available *tiles*
		// panning limits will be different (since you can wrap around columns)
		// but if you put Infinity in here it will screw up sourceCoordinate
		tileLimits: [
			new MM.Coordinate(0,0,0),             // top left outer
			new MM.Coordinate(1,1,0).zoomTo(18)   // bottom right inner
		],

		getTileUrl: function(coordinate) {
			throw "Abstract method not implemented by subclass.";
		},

		getTile: function(coordinate) {
			throw "Abstract method not implemented by subclass.";
		},

		// releaseTile is not required
		releaseTile: function(element) { },

		// use this to tell MapProvider that tiles only exist between certain zoom levels.
		// should be set separately on Map to restrict interactive zoom/pan ranges
		setZoomRange: function(minZoom, maxZoom) {
			this.tileLimits[0] = this.tileLimits[0].zoomTo(minZoom);
			this.tileLimits[1] = this.tileLimits[1].zoomTo(maxZoom);
		},

		// wrap column around the world if necessary
		// return null if wrapped coordinate is outside of the tile limits
		sourceCoordinate: function(coord) {
			var TL = this.tileLimits[0].zoomTo(coord.zoom).container(),
				BR = this.tileLimits[1].zoomTo(coord.zoom),
				columnSize = Math.pow(2, coord.zoom),
				wrappedColumn;

			BR = new MM.Coordinate(Math.ceil(BR.row), Math.ceil(BR.column), Math.floor(BR.zoom));

			if (coord.column < 0) {
				wrappedColumn = ((coord.column % columnSize) + columnSize) % columnSize;
			} else {
				wrappedColumn = coord.column % columnSize;
			}

			if (coord.row < TL.row || coord.row >= BR.row) {
				return null;
			} else if (wrappedColumn < TL.column || wrappedColumn >= BR.column) {
				return null;
			} else {
				return new MM.Coordinate(coord.row, wrappedColumn, coord.zoom);
			}
		}
	};

	/**
	 * FIXME: need a better explanation here! This is a pretty crucial part of
	 * understanding how to use ModestMaps.
	 *
	 * TemplatedMapProvider is a tile provider that generates tile URLs from a
	 * template string by replacing the following bits for each tile
	 * coordinate:
	 *
	 * {Z}: the tile's zoom level (from 1 to ~20)
	 * {X}: the tile's X, or column (from 0 to a very large number at higher
	 * zooms)
	 * {Y}: the tile's Y, or row (from 0 to a very large number at higher
	 * zooms)
	 *
	 * E.g.:
	 *
	 * var osm = new MM.TemplatedMapProvider("http://tile.openstreetmap.org/{Z}/{X}/{Y}.png");
	 *
	 * Or:
	 *
	 * var placeholder = new MM.TemplatedMapProvider("http://placehold.it/256/f0f/fff.png&text={Z}/{X}/{Y}");
	 *
	 */
	MM.Template = function(template, subdomains) {
		var isQuadKey = template.match(/{(Q|quadkey)}/);
		// replace Microsoft style substitution strings
		if (isQuadKey) template = template
			.replace('{subdomains}', '{S}')
			.replace('{zoom}', '{Z}')
			.replace('{quadkey}', '{Q}');

		var hasSubdomains = (subdomains &&
			subdomains.length && template.indexOf("{S}") >= 0);

		function quadKey (row, column, zoom) {
			var key = '';
			for (var i = 1; i <= zoom; i++) {
				key += (((row >> zoom - i) & 1) << 1) | ((column >> zoom - i) & 1);
			}
			return key || '0';
		}

		var getTileUrl = function(coordinate) {
			var coord = this.sourceCoordinate(coordinate);
			if (!coord) {
				return null;
			}
			var base = template;
			if (hasSubdomains) {
				var index = parseInt(coord.zoom + coord.row + coord.column, 10) %
					subdomains.length;
				base = base.replace('{S}', subdomains[index]);
			}
			if (isQuadKey) {
				return base
					.replace('{Z}', coord.zoom.toFixed(0))
					.replace('{Q}', quadKey(coord.row,
						coord.column,
						coord.zoom));
			} else {
				return base
					.replace('{Z}', coord.zoom.toFixed(0))
					.replace('{X}', coord.column.toFixed(0))
					.replace('{Y}', coord.row.toFixed(0));
			}
		};

		MM.MapProvider.call(this, getTileUrl);
	};

	MM.Template.prototype = {
		// quadKey generator
		getTile: function(coord) {
			return this.getTileUrl(coord);
		}
	};

	MM.extend(MM.Template, MM.MapProvider);

	MM.TemplatedLayer = function(template, subdomains, name) {
		return new MM.Layer(new MM.Template(template, subdomains), null, name);
	};
	// Event Handlers
	// --------------

	// A utility function for finding the offset of the
	// mouse from the top-left of the page
	MM.getMousePoint = function(e, map) {
		// start with just the mouse (x, y)
		var point = new MM.Point(e.clientX, e.clientY);

		// correct for scrolled document
		point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
		point.y += document.body.scrollTop + document.documentElement.scrollTop;

		// correct for nested offsets in DOM
		for (var node = map.parent; node; node = node.offsetParent) {
			point.x -= node.offsetLeft;
			point.y -= node.offsetTop;
		}
		return point;
	};

	MM.MouseWheelHandler = function() {
		var handler = {},
			map,
			_zoomDiv,
			prevTime,
			precise = false;

		function mouseWheel(e) {
			var delta = 0;
			prevTime = prevTime || new Date().getTime();

			try {
				_zoomDiv.scrollTop = 1000;
				_zoomDiv.dispatchEvent(e);
				delta = 1000 - _zoomDiv.scrollTop;
			} catch (error) {
				delta = e.wheelDelta || (-e.detail * 5);
			}

			// limit mousewheeling to once every 200ms
			var timeSince = new Date().getTime() - prevTime;
			var point = MM.getMousePoint(e, map);

			if (Math.abs(delta) > 0 && (timeSince > 200) && !precise) {
				map.zoomByAbout(delta > 0 ? 1 : -1, point);
				prevTime = new Date().getTime();
			} else if (precise) {
				map.zoomByAbout(delta * 0.001, point);
			}

			// Cancel the event so that the page doesn't scroll
			return MM.cancelEvent(e);
		}

		handler.init = function(x) {
			map = x;
			_zoomDiv = document.body.appendChild(document.createElement('div'));
			_zoomDiv.style.cssText = 'visibility:hidden;top:0;height:0;width:0;overflow-y:scroll';
			var innerDiv = _zoomDiv.appendChild(document.createElement('div'));
			innerDiv.style.height = '2000px';
			MM.addEvent(map.parent, 'mousewheel', mouseWheel);
			return handler;
		};

		handler.precise = function(x) {
			if (!arguments.length) return precise;
			precise = x;
			return handler;
		};

		handler.remove = function() {
			MM.removeEvent(map.parent, 'mousewheel', mouseWheel);
			_zoomDiv.parentNode.removeChild(_zoomDiv);
		};

		return handler;
	};

	MM.DoubleClickHandler = function() {
		var handler = {},
			map;

		function doubleClick(e) {
			// Ensure that this handler is attached once.
			// Get the point on the map that was double-clicked
			var point = MM.getMousePoint(e, map);
			// use shift-double-click to zoom out
			map.zoomByAbout(e.shiftKey ? -1 : 1, point);
			return MM.cancelEvent(e);
		}

		handler.init = function(x) {
			map = x;
			MM.addEvent(map.parent, 'dblclick', doubleClick);
			return handler;
		};

		handler.remove = function() {
			MM.removeEvent(map.parent, 'dblclick', doubleClick);
		};

		return handler;
	};

	// Handle the use of mouse dragging to pan the map.
	MM.DragHandler = function() {
		var handler = {},
			prevMouse,
			map;

		function mouseDown(e) {
			if (e.shiftKey || e.button == 2) return;
			MM.addEvent(document, 'mouseup', mouseUp);
			MM.addEvent(document, 'mousemove', mouseMove);

			prevMouse = new MM.Point(e.clientX, e.clientY);
			map.parent.style.cursor = 'move';

			return MM.cancelEvent(e);
		}

		function mouseUp(e) {
			MM.removeEvent(document, 'mouseup', mouseUp);
			MM.removeEvent(document, 'mousemove', mouseMove);

			prevMouse = null;
			map.parent.style.cursor = '';

			return MM.cancelEvent(e);
		}

		function mouseMove(e) {
			if (prevMouse) {
				map.panBy(
					e.clientX - prevMouse.x,
					e.clientY - prevMouse.y);
				prevMouse.x = e.clientX;
				prevMouse.y = e.clientY;
				prevMouse.t = +new Date();
			}

			return MM.cancelEvent(e);
		}

		handler.init = function(x) {
			map = x;
			MM.addEvent(map.parent, 'mousedown', mouseDown);
			return handler;
		};

		handler.remove = function() {
			MM.removeEvent(map.parent, 'mousedown', mouseDown);
		};

		return handler;
	};

	MM.MouseHandler = function() {
		var handler = {},
			map,
			handlers;

		handler.init = function(x) {
			map = x;
			handlers = [
				MM.DragHandler().init(map),
				MM.DoubleClickHandler().init(map),
				MM.MouseWheelHandler().init(map)
			];
			return handler;
		};

		handler.remove = function() {
			for (var i = 0; i < handlers.length; i++) {
				handlers[i].remove();
			}
			return handler;
		};

		return handler;
	};
	MM.TouchHandler = function() {
		var handler = {},
			map,
			maxTapTime = 250,
			maxTapDistance = 30,
			maxDoubleTapDelay = 350,
			locations = {},
			taps = [],
			snapToZoom = true,
			wasPinching = false,
			lastPinchCenter = null;

		function isTouchable () {
			var el = document.createElement('div');
			el.setAttribute('ongesturestart', 'return;');
			return (typeof el.ongesturestart === 'function');
		}

		function updateTouches(e) {
			for (var i = 0; i < e.touches.length; i += 1) {
				var t = e.touches[i];
				if (t.identifier in locations) {
					var l = locations[t.identifier];
					l.x = t.clientX;
					l.y = t.clientY;
					l.scale = e.scale;
				}
				else {
					locations[t.identifier] = {
						scale: e.scale,
						startPos: { x: t.clientX, y: t.clientY },
						x: t.clientX,
						y: t.clientY,
						time: new Date().getTime()
					};
				}
			}
		}

		// Test whether touches are from the same source -
		// whether this is the same touchmove event.
		function sameTouch (event, touch) {
			return (event && event.touch) &&
				(touch.identifier == event.touch.identifier);
		}

		function touchStart(e) {
			updateTouches(e);
		}

		function touchMove(e) {
			switch (e.touches.length) {
				case 1:
					onPanning(e.touches[0]);
					break;
				case 2:
					onPinching(e);
					break;
			}
			updateTouches(e);
			return MM.cancelEvent(e);
		}

		function touchEnd(e) {
			var now = new Date().getTime();
			// round zoom if we're done pinching
			if (e.touches.length === 0 && wasPinching) {
				onPinched(lastPinchCenter);
			}

			// Look at each changed touch in turn.
			for (var i = 0; i < e.changedTouches.length; i += 1) {
				var t = e.changedTouches[i],
					loc = locations[t.identifier];
				// if we didn't see this one (bug?)
				// or if it was consumed by pinching already
				// just skip to the next one
				if (!loc || loc.wasPinch) {
					continue;
				}

				// we now know we have an event object and a
				// matching touch that's just ended. Let's see
				// what kind of event it is based on how long it
				// lasted and how far it moved.
				var pos = { x: t.clientX, y: t.clientY },
					time = now - loc.time,
					travel = MM.Point.distance(pos, loc.startPos);
				if (travel > maxTapDistance) {
					// we will to assume that the drag has been handled separately
				} else if (time > maxTapTime) {
					// close in space, but not in time: a hold
					pos.end = now;
					pos.duration = time;
					onHold(pos);
				} else {
					// close in both time and space: a tap
					pos.time = now;
					onTap(pos);
				}
			}

			// Weird, sometimes an end event doesn't get thrown
			// for a touch that nevertheless has disappeared.
			// Still, this will eventually catch those ids:

			var validTouchIds = {};
			for (var j = 0; j < e.touches.length; j++) {
				validTouchIds[e.touches[j].identifier] = true;
			}
			for (var id in locations) {
				if (!(id in validTouchIds)) {
					delete validTouchIds[id];
				}
			}

			return MM.cancelEvent(e);
		}

		function onHold (hold) {
			// TODO
		}

		// Handle a tap event - mainly watch for a doubleTap
		function onTap(tap) {
			if (taps.length &&
				(tap.time - taps[0].time) < maxDoubleTapDelay) {
				onDoubleTap(tap);
				taps = [];
				return;
			}
			taps = [tap];
		}

		// Handle a double tap by zooming in a single zoom level to a
		// round zoom.
		function onDoubleTap(tap) {
			var z = map.getZoom(), // current zoom
				tz = Math.round(z) + 1, // target zoom
				dz = tz - z;            // desired delate

			// zoom in to a round number
			var p = new MM.Point(tap.x, tap.y);
			map.zoomByAbout(dz, p);
		}

		// Re-transform the actual map parent's CSS transformation
		function onPanning (touch) {
			var pos = { x: touch.clientX, y: touch.clientY },
				prev = locations[touch.identifier];
			map.panBy(pos.x - prev.x, pos.y - prev.y);
		}

		function onPinching(e) {
			// use the first two touches and their previous positions
			var t0 = e.touches[0],
				t1 = e.touches[1],
				p0 = new MM.Point(t0.clientX, t0.clientY),
				p1 = new MM.Point(t1.clientX, t1.clientY),
				l0 = locations[t0.identifier],
				l1 = locations[t1.identifier];

			// mark these touches so they aren't used as taps/holds
			l0.wasPinch = true;
			l1.wasPinch = true;

			// scale about the center of these touches
			var center = MM.Point.interpolate(p0, p1, 0.5);

			map.zoomByAbout(
				Math.log(e.scale) / Math.LN2 -
					Math.log(l0.scale) / Math.LN2,
				center );

			// pan from the previous center of these touches
			var prevCenter = MM.Point.interpolate(l0, l1, 0.5);

			map.panBy(center.x - prevCenter.x,
				center.y - prevCenter.y);
			wasPinching = true;
			lastPinchCenter = center;
		}

		// When a pinch event ends, round the zoom of the map.
		function onPinched(p) {
			// TODO: easing
			if (snapToZoom) {
				var z = map.getZoom(), // current zoom
					tz =Math.round(z);     // target zoom
				map.zoomByAbout(tz - z, p);
			}
			wasPinching = false;
		}

		handler.init = function(x) {
			map = x;

			// Fail early if this isn't a touch device.
			if (!isTouchable()) return handler;

			MM.addEvent(map.parent, 'touchstart', touchStart);
			MM.addEvent(map.parent, 'touchmove', touchMove);
			MM.addEvent(map.parent, 'touchend', touchEnd);
			return handler;
		};

		handler.remove = function() {
			// Fail early if this isn't a touch device.
			if (!isTouchable()) return handler;

			MM.removeEvent(map.parent, 'touchstart', touchStart);
			MM.removeEvent(map.parent, 'touchmove', touchMove);
			MM.removeEvent(map.parent, 'touchend', touchEnd);
			return handler;
		};

		return handler;
	};
	// CallbackManager
	// ---------------
	// A general-purpose event binding manager used by `Map`
	// and `RequestManager`

	// Construct a new CallbackManager, with an list of
	// supported events.
	MM.CallbackManager = function(owner, events) {
		this.owner = owner;
		this.callbacks = {};
		for (var i = 0; i < events.length; i++) {
			this.callbacks[events[i]] = [];
		}
	};

	// CallbackManager does simple event management for modestmaps
	MM.CallbackManager.prototype = {
		// The element on which callbacks will be triggered.
		owner: null,

		// An object of callbacks in the form
		//
		//     { event: function }
		callbacks: null,

		// Add a callback to this object - where the `event` is a string of
		// the event name and `callback` is a function.
		addCallback: function(event, callback) {
			if (typeof(callback) == 'function' && this.callbacks[event]) {
				this.callbacks[event].push(callback);
			}
		},

		// Remove a callback. The given function needs to be equal (`===`) to
		// the callback added in `addCallback`, so named functions should be
		// used as callbacks.
		removeCallback: function(event, callback) {
			if (typeof(callback) == 'function' && this.callbacks[event]) {
				var cbs = this.callbacks[event],
					len = cbs.length;
				for (var i = 0; i < len; i++) {
					if (cbs[i] === callback) {
						cbs.splice(i,1);
						break;
					}
				}
			}
		},

		// Trigger a callback, passing it an object or string from the second
		// argument.
		dispatchCallback: function(event, message) {
			if(this.callbacks[event]) {
				for (var i = 0; i < this.callbacks[event].length; i += 1) {
					try {
						this.callbacks[event][i](this.owner, message);
					} catch(e) {
						//console.log(e);
						// meh
					}
				}
			}
		}
	};
	// RequestManager
	// --------------
	// an image loading queue
	MM.RequestManager = function() {

		// The loading bay is a document fragment to optimize appending, since
		// the elements within are invisible. See
		//  [this blog post](http://ejohn.org/blog/dom-documentfragments/).
		this.loadingBay = document.createDocumentFragment();

		this.requestsById = {};
		this.openRequestCount = 0;

		this.maxOpenRequests = 4;
		this.requestQueue = [];

		this.callbackManager = new MM.CallbackManager(this, [
			'requestcomplete', 'requesterror']);
	};

	MM.RequestManager.prototype = {

		// DOM element, hidden, for making sure images dispatch complete events
		loadingBay: null,

		// all known requests, by ID
		requestsById: null,

		// current pending requests
		requestQueue: null,

		// current open requests (children of loadingBay)
		openRequestCount: null,

		// the number of open requests permitted at one time, clamped down
		// because of domain-connection limits.
		maxOpenRequests: null,

		// for dispatching 'requestcomplete'
		callbackManager: null,

		addCallback: function(event, callback) {
			this.callbackManager.addCallback(event,callback);
		},

		removeCallback: function(event, callback) {
			this.callbackManager.removeCallback(event,callback);
		},

		dispatchCallback: function(event, message) {
			this.callbackManager.dispatchCallback(event,message);
		},

		// Clear everything in the queue by excluding nothing
		clear: function() {
			this.clearExcept({});
		},

		clearRequest: function(id) {
			if(id in this.requestsById) {
				delete this.requestsById[id];
			}

			for(var i = 0; i < this.requestQueue.length; i++) {
				var request = this.requestQueue[i];
				if(request && request.id == id) {
					this.requestQueue[i] = null;
				}
			}
		},

		// Clear everything in the queue except for certain keys, specified
		// by an object of the form
		//
		//     { key: throwawayvalue }
		clearExcept: function(validIds) {

			// clear things from the queue first...
			for (var i = 0; i < this.requestQueue.length; i++) {
				var request = this.requestQueue[i];
				if (request && !(request.id in validIds)) {
					this.requestQueue[i] = null;
				}
			}

			// then check the loadingBay...
			var openRequests = this.loadingBay.childNodes;
			for (var j = openRequests.length-1; j >= 0; j--) {
				var img = openRequests[j];
				if (!(img.id in validIds)) {
					this.loadingBay.removeChild(img);
					this.openRequestCount--;
					/* console.log(this.openRequestCount + " open requests"); */
					img.src = img.coord = img.onload = img.onerror = null;
				}
			}

			// hasOwnProperty protects against prototype additions
			// > "The standard describes an augmentable Object.prototype.
			//  Ignore standards at your own peril."
			// -- http://www.yuiblog.com/blog/2006/09/26/for-in-intrigue/
			for (var id in this.requestsById) {
				if (!(id in validIds)) {
					if (this.requestsById.hasOwnProperty(id)) {
						var requestToRemove = this.requestsById[id];
						// whether we've done the request or not...
						delete this.requestsById[id];
						if (requestToRemove !== null) {
							requestToRemove =
								requestToRemove.id =
									requestToRemove.coord =
										requestToRemove.url = null;
						}
					}
				}
			}
		},

		// Given a tile id, check whether the RequestManager is currently
		// requesting it and waiting for the result.
		hasRequest: function(id) {
			return (id in this.requestsById);
		},

		// * TODO: remove dependency on coord (it's for sorting, maybe call it data?)
		// * TODO: rename to requestImage once it's not tile specific
		requestTile: function(id, coord, url) {
			if (!(id in this.requestsById)) {
				var request = { id: id, coord: coord.copy(), url: url };
				// if there's no url just make sure we don't request this image again
				this.requestsById[id] = request;
				if (url) {
					this.requestQueue.push(request);
					/* console.log(this.requestQueue.length + ' pending requests'); */
				}
			}
		},

		getProcessQueue: function() {
			// let's only create this closure once...
			if (!this._processQueue) {
				var theManager = this;
				this._processQueue = function() {
					theManager.processQueue();
				};
			}
			return this._processQueue;
		},

		// Select images from the `requestQueue` and create image elements for
		// them, attaching their load events to the function returned by
		// `this.getLoadComplete()` so that they can be added to the map.
		processQueue: function(sortFunc) {
			// When the request queue fills up beyond 8, start sorting the
			// requests so that spiral-loading or another pattern can be used.
			if (sortFunc && this.requestQueue.length > 8) {
				this.requestQueue.sort(sortFunc);
			}
			while (this.openRequestCount < this.maxOpenRequests && this.requestQueue.length > 0) {
				var request = this.requestQueue.pop();
				if (request) {
					this.openRequestCount++;
					/* console.log(this.openRequestCount + ' open requests'); */

					// JSLitmus benchmark shows createElement is a little faster than
					// new Image() in Firefox and roughly the same in Safari:
					// http://tinyurl.com/y9wz2jj http://tinyurl.com/yes6rrt
					var img = document.createElement('img');

					// FIXME: id is technically not unique in document if there
					// are two Maps but toKey is supposed to be fast so we're trying
					// to avoid a prefix ... hence we can't use any calls to
					// `document.getElementById()` to retrieve images
					img.id = request.id;
					img.style.position = 'absolute';
					// * FIXME: store this elsewhere to avoid scary memory leaks?
					// * FIXME: call this 'data' not 'coord' so that RequestManager is less Tile-centric?
					img.coord = request.coord;
					// add it to the DOM in a hidden layer, this is a bit of a hack, but it's
					// so that the event we get in image.onload has srcElement assigned in IE6
					this.loadingBay.appendChild(img);
					// set these before img.src to avoid missing an img that's already cached
					img.onload = img.onerror = this.getLoadComplete();
					img.src = request.url;

					// keep things tidy
					request = request.id = request.coord = request.url = null;
				}
			}
		},

		_loadComplete: null,

		// Get the singleton `_loadComplete` function that is called on image
		// load events, either removing them from the queue and dispatching an
		// event to add them to the map, or deleting them if the image failed
		// to load.
		getLoadComplete: function() {
			// let's only create this closure once...
			if (!this._loadComplete) {
				var theManager = this;
				this._loadComplete = function(e) {
					// this is needed because we don't use MM.addEvent for images
					e = e || window.event;

					// srcElement for IE, target for FF, Safari etc.
					var img = e.srcElement || e.target;

					// unset these straight away so we don't call this twice
					img.onload = img.onerror = null;

					// pull it back out of the (hidden) DOM
					// so that draw will add it correctly later
					theManager.loadingBay.removeChild(img);
					theManager.openRequestCount--;
					delete theManager.requestsById[img.id];

					/* console.log(theManager.openRequestCount + ' open requests'); */

					// NB:- complete is also true onerror if we got a 404
					if (e.type === 'load' && (img.complete ||
						(img.readyState && img.readyState == 'complete'))) {
						theManager.dispatchCallback('requestcomplete', img);
					} else {
						// if it didn't finish clear its src to make sure it
						// really stops loading
						// FIXME: we'll never retry because this id is still
						// in requestsById - is that right?
						theManager.dispatchCallback('requesterror', {
							element: img,
							url: ('' + img.src)
						});
						img.src = null;
					}

					// keep going in the same order
					// use `setTimeout()` to avoid the IE recursion limit, see
					// http://cappuccino.org/discuss/2010/03/01/internet-explorer-global-variables-and-stack-overflows/
					// and https://github.com/stamen/modestmaps-js/issues/12
					setTimeout(theManager.getProcessQueue(), 0);

				};
			}
			return this._loadComplete;
		}

	};

	// Layer
	MM.Layer = function(provider, parent, name) {
		this.parent = parent || document.createElement('div');
		this.parent.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0';
		this.name = name;
		this.levels = {};
		this.requestManager = new MM.RequestManager();
		this.requestManager.addCallback('requestcomplete', this.getTileComplete());
		this.requestManager.addCallback('requesterror', this.getTileError());
		if (provider) this.setProvider(provider);
	};

	MM.Layer.prototype = {

		map: null, // TODO: remove
		parent: null,
		name: null,
		enabled: true,
		tiles: null,
		levels: null,
		requestManager: null,
		provider: null,
		_tileComplete: null,

		getTileComplete: function() {
			if (!this._tileComplete) {
				var theLayer = this;
				this._tileComplete = function(manager, tile) {
					theLayer.tiles[tile.id] = tile;
					theLayer.positionTile(tile);
				};
			}
			return this._tileComplete;
		},

		getTileError: function() {
			if (!this._tileError) {
				var theLayer = this;
				this._tileError = function(manager, tile) {
					tile.element.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
					theLayer.tiles[tile.element.id] = tile.element;
					theLayer.positionTile(tile.element);
				};
			}
			return this._tileError;
		},

		draw: function() {
			if (!this.enabled || !this.map) return;
			// compares manhattan distance from center of
			// requested tiles to current map center
			// NB:- requested tiles are *popped* from queue, so we do a descending sort
			var theCoord = this.map.coordinate.zoomTo(Math.round(this.map.coordinate.zoom));

			function centerDistanceCompare(r1, r2) {
				if (r1 && r2) {
					var c1 = r1.coord;
					var c2 = r2.coord;
					if (c1.zoom == c2.zoom) {
						var ds1 = Math.abs(theCoord.row - c1.row - 0.5) +
							Math.abs(theCoord.column - c1.column - 0.5);
						var ds2 = Math.abs(theCoord.row - c2.row - 0.5) +
							Math.abs(theCoord.column - c2.column - 0.5);
						return ds1 < ds2 ? 1 : ds1 > ds2 ? -1 : 0;
					} else {
						return c1.zoom < c2.zoom ? 1 : c1.zoom > c2.zoom ? -1 : 0;
					}
				}
				return r1 ? 1 : r2 ? -1 : 0;
			}

			// if we're in between zoom levels, we need to choose the nearest:
			var baseZoom = Math.round(this.map.coordinate.zoom);

			// these are the top left and bottom right tile coordinates
			// we'll be loading everything in between:
			var startCoord = this.map.pointCoordinate(new MM.Point(0,0))
				.zoomTo(baseZoom).container();
			var endCoord = this.map.pointCoordinate(this.map.dimensions)
				.zoomTo(baseZoom).container().right().down();

			// tiles with invalid keys will be removed from visible levels
			// requests for tiles with invalid keys will be canceled
			// (this object maps from a tile key to a boolean)
			var validTileKeys = { };

			// make sure we have a container for tiles in the current level
			var levelElement = this.createOrGetLevel(startCoord.zoom);

			// use this coordinate for generating keys, parents and children:
			var tileCoord = startCoord.copy();

			for (tileCoord.column = startCoord.column;
				 tileCoord.column <= endCoord.column; tileCoord.column++) {
				for (tileCoord.row = startCoord.row;
					 tileCoord.row <= endCoord.row; tileCoord.row++) {
					var validKeys = this.inventoryVisibleTile(levelElement, tileCoord);

					while (validKeys.length) {
						validTileKeys[validKeys.pop()] = true;
					}
				}
			}

			// i from i to zoom-5 are levels that would be scaled too big,
			// i from zoom + 2 to levels. length are levels that would be
			// scaled too small (and tiles would be too numerous)
			for (var name in this.levels) {
				if (this.levels.hasOwnProperty(name)) {
					var zoom = parseInt(name,10);

					if (zoom >= startCoord.zoom - 5 && zoom < startCoord.zoom + 2) {
						continue;
					}

					var level = this.levels[name];
					level.style.display = 'none';
					var visibleTiles = this.tileElementsInLevel(level);

					while (visibleTiles.length) {
						this.provider.releaseTile(visibleTiles[0].coord);
						this.requestManager.clearRequest(visibleTiles[0].coord.toKey());
						level.removeChild(visibleTiles[0]);
						visibleTiles.shift();
					}
				}
			}

			// levels we want to see, if they have tiles in validTileKeys
			var minLevel = startCoord.zoom - 5;
			var maxLevel = startCoord.zoom + 2;

			for (var z = minLevel; z < maxLevel; z++) {
				this.adjustVisibleLevel(this.levels[z], z, validTileKeys);
			}

			// cancel requests that aren't visible:
			this.requestManager.clearExcept(validTileKeys);

			// get newly requested tiles, sort according to current view:
			this.requestManager.processQueue(centerDistanceCompare);
		},

		// For a given tile coordinate in a given level element, ensure that it's
		// correctly represented in the DOM including potentially-overlapping
		// parent and child tiles for pyramid loading.
		//
		// Return a list of valid (i.e. loadable?) tile keys.
		inventoryVisibleTile: function(layer_element, tile_coord) {
			var tile_key = tile_coord.toKey(),
				valid_tile_keys = [tile_key];

			// Check that the needed tile already exists someplace - add it to the DOM if it does.
			if (tile_key in this.tiles) {
				var tile = this.tiles[tile_key];

				// ensure it's in the DOM:
				if (tile.parentNode != layer_element) {
					layer_element.appendChild(tile);
					// if the provider implements reAddTile(), call it
					if ("reAddTile" in this.provider) {
						this.provider.reAddTile(tile_key, tile_coord, tile);
					}
				}

				return valid_tile_keys;
			}

			// Check that the needed tile has even been requested at all.
			if (!this.requestManager.hasRequest(tile_key)) {
				var tileToRequest = this.provider.getTile(tile_coord);
				if (typeof tileToRequest == 'string') {
					this.addTileImage(tile_key, tile_coord, tileToRequest);
					// tile must be truish
				} else if (tileToRequest) {
					this.addTileElement(tile_key, tile_coord, tileToRequest);
				}
			}

			// look for a parent tile in our image cache
			var tileCovered = false;
			var maxStepsOut = tile_coord.zoom;

			for (var pz = 1; pz <= maxStepsOut; pz++) {
				var parent_coord = tile_coord.zoomBy(-pz).container();
				var parent_key = parent_coord.toKey();

				// only mark it valid if we have it already
				if (parent_key in this.tiles) {
					valid_tile_keys.push(parent_key);
					tileCovered = true;
					break;
				}
			}

			// if we didn't find a parent, look at the children:
			if (!tileCovered) {
				var child_coord = tile_coord.zoomBy(1);

				// mark everything valid whether or not we have it:
				valid_tile_keys.push(child_coord.toKey());
				child_coord.column += 1;
				valid_tile_keys.push(child_coord.toKey());
				child_coord.row += 1;
				valid_tile_keys.push(child_coord.toKey());
				child_coord.column -= 1;
				valid_tile_keys.push(child_coord.toKey());
			}

			return valid_tile_keys;
		},

		tileElementsInLevel: function(level) {
			// this is somewhat future proof, we're looking for DOM elements
			// not necessarily <img> elements
			var tiles = [];
			for (var tile = level.firstChild; tile; tile = tile.nextSibling) {
				if (tile.nodeType == 1) {
					tiles.push(tile);
				}
			}
			return tiles;
		},

		/**
		 * For a given level, adjust visibility as a whole and discard individual
		 * tiles based on values in valid_tile_keys from inventoryVisibleTile().
		 */
		adjustVisibleLevel: function(level, zoom, valid_tile_keys) {
			// no tiles for this level yet
			if (!level) return;

			var scale = 1;
			var theCoord = this.map.coordinate.copy();

			if (level.childNodes.length > 0) {
				level.style.display = 'block';
				scale = Math.pow(2, this.map.coordinate.zoom - zoom);
				theCoord = theCoord.zoomTo(zoom);
			} else {
				level.style.display = 'none';
				return false;
			}

			var tileWidth = this.map.tileSize.x * scale;
			var tileHeight = this.map.tileSize.y * scale;
			var center = new MM.Point(this.map.dimensions.x/2, this.map.dimensions.y/2);
			var tiles = this.tileElementsInLevel(level);

			while (tiles.length) {
				var tile = tiles.pop();

				if (!valid_tile_keys[tile.id]) {
					this.provider.releaseTile(tile.coord);
					this.requestManager.clearRequest(tile.coord.toKey());
					level.removeChild(tile);
				} else {
					// position tiles
					MM.moveElement(tile, {
						x: Math.round(center.x +
							(tile.coord.column - theCoord.column) * tileWidth),
						y: Math.round(center.y +
							(tile.coord.row - theCoord.row) * tileHeight),
						scale: scale,
						// TODO: pass only scale or only w/h
						width: this.map.tileSize.x,
						height: this.map.tileSize.y
					});
				}
			}
		},

		createOrGetLevel: function(zoom) {
			if (zoom in this.levels) {
				return this.levels[zoom];
			}

			var level = document.createElement('div');
			level.id = this.parent.id + '-zoom-' + zoom;
			level.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0;';
			level.style.zIndex = zoom;

			this.parent.appendChild(level);
			this.levels[zoom] = level;

			return level;
		},

		addTileImage: function(key, coord, url) {
			this.requestManager.requestTile(key, coord, url);
		},

		addTileElement: function(key, coordinate, element) {
			// Expected in draw()
			element.id = key;
			element.coord = coordinate.copy();
			this.positionTile(element);
		},

		positionTile: function(tile) {
			// position this tile (avoids a full draw() call):
			var theCoord = this.map.coordinate.zoomTo(tile.coord.zoom);

			// Start tile positioning and prevent drag for modern browsers
			tile.style.cssText = 'position:absolute;-webkit-user-select:none;' +
				'-webkit-user-drag:none;-moz-user-drag:none;-webkit-transform-origin:0 0;' +
				'-moz-transform-origin:0 0;-o-transform-origin:0 0;-ms-transform-origin:0 0;' +
				'width:' + this.map.tileSize.x + 'px; height: ' + this.map.tileSize.y + 'px;';

			// Prevent drag for IE
			tile.ondragstart = function() { return false; };

			var scale = Math.pow(2, this.map.coordinate.zoom - tile.coord.zoom);

			MM.moveElement(tile, {
				x: Math.round((this.map.dimensions.x/2) +
					(tile.coord.column - theCoord.column) * this.map.tileSize.x),
				y: Math.round((this.map.dimensions.y/2) +
					(tile.coord.row - theCoord.row) * this.map.tileSize.y),
				scale: scale,
				// TODO: pass only scale or only w/h
				width: this.map.tileSize.x,
				height: this.map.tileSize.y
			});

			// add tile to its level
			var theLevel = this.levels[tile.coord.zoom];
			theLevel.appendChild(tile);

			// Support style transition if available.
			tile.className = 'map-tile-loaded';

			// ensure the level is visible if it's still the current level
			if (Math.round(this.map.coordinate.zoom) == tile.coord.zoom) {
				theLevel.style.display = 'block';
			}

			// request a lazy redraw of all levels
			// this will remove tiles that were only visible
			// to cover this tile while it loaded:
			this.requestRedraw();
		},

		_redrawTimer: undefined,

		requestRedraw: function() {
			// we'll always draw within 1 second of this request,
			// sometimes faster if there's already a pending redraw
			// this is used when a new tile arrives so that we clear
			// any parent/child tiles that were only being displayed
			// until the tile loads at the right zoom level
			if (!this._redrawTimer) {
				this._redrawTimer = setTimeout(this.getRedraw(), 1000);
			}
		},

		_redraw: null,

		getRedraw: function() {
			// let's only create this closure once...
			if (!this._redraw) {
				var theLayer = this;
				this._redraw = function() {
					theLayer.draw();
					theLayer._redrawTimer = 0;
				};
			}
			return this._redraw;
		},

		setProvider: function(newProvider) {
			var firstProvider = (this.provider === null);

			// if we already have a provider the we'll need to
			// clear the DOM, cancel requests and redraw
			if (!firstProvider) {
				this.requestManager.clear();

				for (var name in this.levels) {
					if (this.levels.hasOwnProperty(name)) {
						var level = this.levels[name];

						while (level.firstChild) {
							this.provider.releaseTile(level.firstChild.coord);
							level.removeChild(level.firstChild);
						}
					}
				}
			}

			// first provider or not we'll init/reset some values...
			this.tiles = {};

			// for later: check geometry of old provider and set a new coordinate center
			// if needed (now? or when?)
			this.provider = newProvider;

			if (!firstProvider) {
				this.draw();
			}
		},

		// Enable a layer and show its dom element
		enable: function() {
			this.enabled = true;
			this.parent.style.display = '';
			this.draw();
		},

		// Disable a layer, don't display in DOM, clear all requests
		disable: function() {
			this.enabled = false;
			this.requestManager.clear();
			this.parent.style.display = 'none';
		},

		// Remove this layer from the DOM, cancel all of its requests
		// and unbind any callbacks that are bound to it.
		destroy: function() {
			this.requestManager.clear();
			this.requestManager.removeCallback('requestcomplete', this.getTileComplete());
			this.requestManager.removeCallback('requesterror', this.getTileError());
			// TODO: does requestManager need a destroy function too?
			this.provider = null;
			// If this layer was ever attached to the DOM, detach it.
			if (this.parent.parentNode) {
				this.parent.parentNode.removeChild(this.parent);
			}
			this.map = null;
		}
	};

	// Map

	// Instance of a map intended for drawing to a div.
	//
	//  * `parent` (required DOM element)
	//      Can also be an ID of a DOM element
	//  * `layerOrLayers` (required MM.Layer or Array of MM.Layers)
	//      each one must implement draw(), destroy(), have a .parent DOM element and a .map property
	//      (an array of URL templates or MM.MapProviders is also acceptable)
	//  * `dimensions` (optional Point)
	//      Size of map to create
	//  * `eventHandlers` (optional Array)
	//      If empty or null MouseHandler will be used
	//      Otherwise, each handler will be called with init(map)
	MM.Map = function(parent, layerOrLayers, dimensions, eventHandlers) {

		if (typeof parent == 'string') {
			parent = document.getElementById(parent);
			if (!parent) {
				throw 'The ID provided to modest maps could not be found.';
			}
		}
		this.parent = parent;

		// we're no longer adding width and height to parent.style but we still
		// need to enforce padding, overflow and position otherwise everything screws up
		// TODO: maybe console.warn if the current values are bad?
		this.parent.style.padding = '0';
		this.parent.style.overflow = 'hidden';

		var position = MM.getStyle(this.parent, 'position');
		if (position != 'relative' && position != 'absolute') {
			this.parent.style.position = 'relative';
		}

		this.layers = [];

		if (!layerOrLayers) {
			layerOrLayers = [];
		}

		if (!(layerOrLayers instanceof Array)) {
			layerOrLayers = [ layerOrLayers ];
		}

		for (var i = 0; i < layerOrLayers.length; i++) {
			this.addLayer(layerOrLayers[i]);
		}

		// default to Google-y Mercator style maps
		this.projection = new MM.MercatorProjection(0,
			MM.deriveTransformation(-Math.PI,  Math.PI, 0, 0,
				Math.PI,  Math.PI, 1, 0,
				-Math.PI, -Math.PI, 0, 1));
		this.tileSize = new MM.Point(256, 256);

		// default 0-18 zoom level
		// with infinite horizontal pan and clamped vertical pan
		this.coordLimits = [
			new MM.Coordinate(0,-Infinity,0),           // top left outer
			new MM.Coordinate(1,Infinity,0).zoomTo(18) // bottom right inner
		];

		// eyes towards null island
		this.coordinate = new MM.Coordinate(0.5, 0.5, 0);

		// if you don't specify dimensions we assume you want to fill the parent
		// unless the parent has no w/h, in which case we'll still use a default
		if (!dimensions) {
			dimensions = new MM.Point(this.parent.offsetWidth,
				this.parent.offsetHeight);
			this.autoSize = true;
			// use destroy to get rid of this handler from the DOM
			MM.addEvent(window, 'resize', this.windowResize());
		} else {
			this.autoSize = false;
			// don't call setSize here because it calls draw()
			this.parent.style.width = Math.round(dimensions.x) + 'px';
			this.parent.style.height = Math.round(dimensions.y) + 'px';
		}
		this.dimensions = dimensions;

		this.callbackManager = new MM.CallbackManager(this, [
			'zoomed',
			'panned',
			'centered',
			'extentset',
			'resized',
			'drawn'
		]);

		// set up handlers last so that all required attributes/functions are in place if needed
		if (eventHandlers === undefined) {
			this.eventHandlers = [
				MM.MouseHandler().init(this),
				MM.TouchHandler().init(this)
			];
		} else {
			this.eventHandlers = eventHandlers;
			if (eventHandlers instanceof Array) {
				for (var j = 0; j < eventHandlers.length; j++) {
					eventHandlers[j].init(this);
				}
			}
		}

	};

	MM.Map.prototype = {

		parent: null,          // DOM Element
		dimensions: null,      // MM.Point with x/y size of parent element

		projection: null,      // MM.Projection of first known layer
		coordinate: null,      // Center of map MM.Coordinate with row/column/zoom
		tileSize: null,        // MM.Point with x/y size of tiles

		coordLimits: null,     // Array of [ topLeftOuter, bottomLeftInner ] MM.Coordinates

		layers: null,          // Array of MM.Layer (interface = .draw(), .destroy(), .parent and .map)

		callbackManager: null, // MM.CallbackManager, handles map events

		eventHandlers: null,   // Array of interaction handlers, just a MM.MouseHandler by default

		autoSize: null,        // Boolean, true if we have a window resize listener

		toString: function() {
			return 'Map(#' + this.parent.id + ')';
		},

		// callbacks...

		addCallback: function(event, callback) {
			this.callbackManager.addCallback(event, callback);
			return this;
		},

		removeCallback: function(event, callback) {
			this.callbackManager.removeCallback(event, callback);
			return this;
		},

		dispatchCallback: function(event, message) {
			this.callbackManager.dispatchCallback(event, message);
			return this;
		},

		windowResize: function() {
			if (!this._windowResize) {
				var theMap = this;
				this._windowResize = function(event) {
					// don't call setSize here because it sets parent.style.width/height
					// and setting the height breaks percentages and default styles
					theMap.dimensions = new MM.Point(theMap.parent.offsetWidth, theMap.parent.offsetHeight);
					theMap.draw();
					theMap.dispatchCallback('resized', [theMap.dimensions]);
				};
			}
			return this._windowResize;
		},

		// A convenience function to restrict interactive zoom ranges.
		// (you should also adjust map provider to restrict which tiles get loaded,
		// or modify map.coordLimits and provider.tileLimits for finer control)
		setZoomRange: function(minZoom, maxZoom) {
			this.coordLimits[0] = this.coordLimits[0].zoomTo(minZoom);
			this.coordLimits[1] = this.coordLimits[1].zoomTo(maxZoom);
			return this;
		},

		// zooming
		zoomBy: function(zoomOffset) {
			this.coordinate = this.enforceLimits(this.coordinate.zoomBy(zoomOffset));
			MM.getFrame(this.getRedraw());
			this.dispatchCallback('zoomed', zoomOffset);
			return this;
		},

		zoomIn: function()  { return this.zoomBy(1); },
		zoomOut: function()  { return this.zoomBy(-1); },
		setZoom: function(z) { return this.zoomBy(z - this.coordinate.zoom); },

		zoomByAbout: function(zoomOffset, point) {
			var location = this.pointLocation(point);

			this.coordinate = this.enforceLimits(this.coordinate.zoomBy(zoomOffset));
			var newPoint = this.locationPoint(location);

			this.dispatchCallback('zoomed', zoomOffset);
			return this.panBy(point.x - newPoint.x, point.y - newPoint.y);
		},

		// panning
		panBy: function(dx, dy) {
			this.coordinate.column -= dx / this.tileSize.x;
			this.coordinate.row -= dy / this.tileSize.y;

			this.coordinate = this.enforceLimits(this.coordinate);

			// Defer until the browser is ready to draw.
			MM.getFrame(this.getRedraw());
			this.dispatchCallback('panned', [dx, dy]);
			return this;
		},

		panLeft: function() { return this.panBy(100, 0); },
		panRight: function() { return this.panBy(-100, 0); },
		panDown: function() { return this.panBy(0, -100); },
		panUp: function() { return this.panBy(0, 100); },

		// positioning
		setCenter: function(location) {
			return this.setCenterZoom(location, this.coordinate.zoom);
		},

		setCenterZoom: function(location, zoom) {
			this.coordinate = this.projection.locationCoordinate(location).zoomTo(parseFloat(zoom) || 0);
			MM.getFrame(this.getRedraw());
			this.dispatchCallback('centered', [location, zoom]);
			return this;
		},

		extentCoordinate: function(locations, precise) {
			// coerce locations to an array if it's a Extent instance
			if (locations instanceof MM.Extent) {
				locations = locations.toArray();
			}

			var TL, BR;
			for (var i = 0; i < locations.length; i++) {
				var coordinate = this.projection.locationCoordinate(locations[i]);
				if (TL) {
					TL.row = Math.min(TL.row, coordinate.row);
					TL.column = Math.min(TL.column, coordinate.column);
					TL.zoom = Math.min(TL.zoom, coordinate.zoom);
					BR.row = Math.max(BR.row, coordinate.row);
					BR.column = Math.max(BR.column, coordinate.column);
					BR.zoom = Math.max(BR.zoom, coordinate.zoom);
				}
				else {
					TL = coordinate.copy();
					BR = coordinate.copy();
				}
			}

			var width = this.dimensions.x + 1;
			var height = this.dimensions.y + 1;

			// multiplication factor between horizontal span and map width
			var hFactor = (BR.column - TL.column) / (width / this.tileSize.x);

			// multiplication factor expressed as base-2 logarithm, for zoom difference
			var hZoomDiff = Math.log(hFactor) / Math.log(2);

			// possible horizontal zoom to fit geographical extent in map width
			var hPossibleZoom = TL.zoom - (precise ? hZoomDiff : Math.ceil(hZoomDiff));

			// multiplication factor between vertical span and map height
			var vFactor = (BR.row - TL.row) / (height / this.tileSize.y);

			// multiplication factor expressed as base-2 logarithm, for zoom difference
			var vZoomDiff = Math.log(vFactor) / Math.log(2);

			// possible vertical zoom to fit geographical extent in map height
			var vPossibleZoom = TL.zoom - (precise ? vZoomDiff : Math.ceil(vZoomDiff));

			// initial zoom to fit extent vertically and horizontally
			var initZoom = Math.min(hPossibleZoom, vPossibleZoom);

			// additionally, make sure it's not outside the boundaries set by map limits
			initZoom = Math.min(initZoom, this.coordLimits[1].zoom);
			initZoom = Math.max(initZoom, this.coordLimits[0].zoom);

			// coordinate of extent center
			var centerRow = (TL.row + BR.row) / 2;
			var centerColumn = (TL.column + BR.column) / 2;
			var centerZoom = TL.zoom;
			return new MM.Coordinate(centerRow, centerColumn, centerZoom).zoomTo(initZoom);
		},

		setExtent: function(locations, precise) {
			this.coordinate = this.extentCoordinate(locations, precise);
			this.draw(); // draw calls enforceLimits
			// (if you switch to getFrame, call enforceLimits first)

			this.dispatchCallback('extentset', locations);
			return this;
		},

		// Resize the map's container `<div>`, redrawing the map and triggering
		// `resized` to make sure that the map's presentation is still correct.
		setSize: function(dimensions) {
			// Ensure that, whether a raw object or a Point object is passed,
			// this.dimensions will be a Point.
			this.dimensions = new MM.Point(dimensions.x, dimensions.y);
			this.parent.style.width = Math.round(this.dimensions.x) + 'px';
			this.parent.style.height = Math.round(this.dimensions.y) + 'px';
			if (this.autoSize) {
				MM.removeEvent(window, 'resize', this.windowResize());
				this.autoSize = false;
			}
			this.draw(); // draw calls enforceLimits
			// (if you switch to getFrame, call enforceLimits first)
			this.dispatchCallback('resized', this.dimensions);
			return this;
		},

		// projecting points on and off screen
		coordinatePoint: function(coord) {
			// Return an x, y point on the map image for a given coordinate.
			if (coord.zoom != this.coordinate.zoom) {
				coord = coord.zoomTo(this.coordinate.zoom);
			}

			// distance from the center of the map
			var point = new MM.Point(this.dimensions.x / 2, this.dimensions.y / 2);
			point.x += this.tileSize.x * (coord.column - this.coordinate.column);
			point.y += this.tileSize.y * (coord.row - this.coordinate.row);

			return point;
		},

		// Get a `MM.Coordinate` from an `MM.Point` - returns a new tile-like object
		// from a screen point.
		pointCoordinate: function(point) {
			// new point coordinate reflecting distance from map center, in tile widths
			var coord = this.coordinate.copy();
			coord.column += (point.x - this.dimensions.x / 2) / this.tileSize.x;
			coord.row += (point.y - this.dimensions.y / 2) / this.tileSize.y;

			return coord;
		},

		// Return an MM.Coordinate (row,col,zoom) for an MM.Location (lat,lon).
		locationCoordinate: function(location) {
			return this.projection.locationCoordinate(location);
		},

		// Return an MM.Location (lat,lon) for an MM.Coordinate (row,col,zoom).
		coordinateLocation: function(coordinate) {
			return this.projection.coordinateLocation(coordinate);
		},

		// Return an x, y point on the map image for a given geographical location.
		locationPoint: function(location) {
			return this.coordinatePoint(this.locationCoordinate(location));
		},

		// Return a geographical location on the map image for a given x, y point.
		pointLocation: function(point) {
			return this.coordinateLocation(this.pointCoordinate(point));
		},

		// inspecting
		getExtent: function() {
			return new MM.Extent(
				this.pointLocation(new MM.Point(0, 0)),
				this.pointLocation(this.dimensions)
			);
		},

		extent: function(locations, precise) {
			if (locations) {
				return this.setExtent(locations, precise);
			} else {
				return this.getExtent();
			}
		},

		// Get the current centerpoint of the map, returning a `Location`
		getCenter: function() {
			return this.projection.coordinateLocation(this.coordinate);
		},

		center: function(location) {
			if (location) {
				return this.setCenter(location);
			} else {
				return this.getCenter();
			}
		},

		// Get the current zoom level of the map, returning a number
		getZoom: function() {
			return this.coordinate.zoom;
		},

		zoom: function(zoom) {
			if (zoom !== undefined) {
				return this.setZoom(zoom);
			} else {
				return this.getZoom();
			}
		},

		// return a copy of the layers array
		getLayers: function() {
			return this.layers.slice();
		},

		// return the first layer with given name
		getLayer: function(name) {
			for (var i = 0; i < this.layers.length; i++) {
				if (name == this.layers[i].name)
					return this.layers[i];
			}
		},

		// return the layer at the given index
		getLayerAt: function(index) {
			return this.layers[index];
		},

		// put the given layer on top of all the others
		// Since this is called for the first layer, which is by definition
		// added before the map has a valid `coordinate`, we request
		// a redraw only if the map has a center coordinate.
		addLayer: function(layer) {
			this.layers.push(layer);
			this.parent.appendChild(layer.parent);
			layer.map = this; // TODO: remove map property from MM.Layer?
			if (this.coordinate) {
				MM.getFrame(this.getRedraw());
			}
			return this;
		},

		// find the given layer and remove it
		removeLayer: function(layer) {
			for (var i = 0; i < this.layers.length; i++) {
				if (layer == this.layers[i] || layer == this.layers[i].name) {
					this.removeLayerAt(i);
					break;
				}
			}
			return this;
		},

		// replace the current layer at the given index with the given layer
		setLayerAt: function(index, layer) {

			if (index < 0 || index >= this.layers.length) {
				throw new Error('invalid index in setLayerAt(): ' + index);
			}

			if (this.layers[index] != layer) {

				// clear existing layer at this index
				if (index < this.layers.length) {
					var other = this.layers[index];
					this.parent.insertBefore(layer.parent, other.parent);
					other.destroy();
				} else {
					// Or if this will be the last layer, it can be simply appended
					this.parent.appendChild(layer.parent);
				}

				this.layers[index] = layer;
				layer.map = this; // TODO: remove map property from MM.Layer

				MM.getFrame(this.getRedraw());
			}

			return this;
		},

		// put the given layer at the given index, moving others if necessary
		insertLayerAt: function(index, layer) {

			if (index < 0 || index > this.layers.length) {
				throw new Error('invalid index in insertLayerAt(): ' + index);
			}

			if (index == this.layers.length) {
				// it just gets tacked on to the end
				this.layers.push(layer);
				this.parent.appendChild(layer.parent);
			} else {
				// it needs to get slipped in amongst the others
				var other = this.layers[index];
				this.parent.insertBefore(layer.parent, other.parent);
				this.layers.splice(index, 0, layer);
			}

			layer.map = this; // TODO: remove map property from MM.Layer

			MM.getFrame(this.getRedraw());

			return this;
		},

		// remove the layer at the given index, call .destroy() on the layer
		removeLayerAt: function(index) {
			if (index < 0 || index >= this.layers.length) {
				throw new Error('invalid index in removeLayer(): ' + index);
			}

			// gone baby gone.
			var old = this.layers[index];
			this.layers.splice(index, 1);
			old.destroy();

			return this;
		},

		// switch the stacking order of two layers, by index
		swapLayersAt: function(i, j) {

			if (i < 0 || i >= this.layers.length || j < 0 || j >= this.layers.length) {
				throw new Error('invalid index in swapLayersAt(): ' + index);
			}

			var layer1 = this.layers[i],
				layer2 = this.layers[j],
				dummy = document.createElement('div');

			// kick layer2 out, replace it with the dummy.
			this.parent.replaceChild(dummy, layer2.parent);

			// put layer2 back in and kick layer1 out
			this.parent.replaceChild(layer2.parent, layer1.parent);

			// put layer1 back in and ditch the dummy
			this.parent.replaceChild(layer1.parent, dummy);

			// now do it to the layers array
			this.layers[i] = layer2;
			this.layers[j] = layer1;

			return this;
		},

		// Enable and disable layers.
		// Disabled layers are not displayed, are not drawn, and do not request
		// tiles. They do maintain their layer index on the map.
		enableLayer: function(name) {
			var l = this.getLayer(name);
			if (l) l.enable();
			return this;
		},

		enableLayerAt: function(index) {
			var l = this.getLayerAt(index);
			if (l) l.enable();
			return this;
		},

		disableLayer: function(name) {
			var l = this.getLayer(name);
			if (l) l.disable();
			return this;
		},

		disableLayerAt: function(index) {
			var l = this.getLayerAt(index);
			if (l) l.disable();
			return this;
		},


		// limits

		enforceZoomLimits: function(coord) {
			var limits = this.coordLimits;
			if (limits) {
				// clamp zoom level:
				var minZoom = limits[0].zoom;
				var maxZoom = limits[1].zoom;
				if (coord.zoom < minZoom) {
					coord = coord.zoomTo(minZoom);
				}
				else if (coord.zoom > maxZoom) {
					coord = coord.zoomTo(maxZoom);
				}
			}
			return coord;
		},

		enforcePanLimits: function(coord) {

			if (this.coordLimits) {

				coord = coord.copy();

				// clamp pan:
				var topLeftLimit = this.coordLimits[0].zoomTo(coord.zoom);
				var bottomRightLimit = this.coordLimits[1].zoomTo(coord.zoom);
				var currentTopLeft = this.pointCoordinate(new MM.Point(0, 0))
					.zoomTo(coord.zoom);
				var currentBottomRight = this.pointCoordinate(this.dimensions)
					.zoomTo(coord.zoom);

				// this handles infinite limits:
				// (Infinity - Infinity) is Nan
				// NaN is never less than anything
				if (bottomRightLimit.row - topLeftLimit.row <
					currentBottomRight.row - currentTopLeft.row) {
					// if the limit is smaller than the current view center it
					coord.row = (bottomRightLimit.row + topLeftLimit.row) / 2;
				} else {
					if (currentTopLeft.row < topLeftLimit.row) {
						coord.row += topLeftLimit.row - currentTopLeft.row;
					} else if (currentBottomRight.row > bottomRightLimit.row) {
						coord.row -= currentBottomRight.row - bottomRightLimit.row;
					}
				}
				if (bottomRightLimit.column - topLeftLimit.column <
					currentBottomRight.column - currentTopLeft.column) {
					// if the limit is smaller than the current view, center it
					coord.column = (bottomRightLimit.column + topLeftLimit.column) / 2;
				} else {
					if (currentTopLeft.column < topLeftLimit.column) {
						coord.column += topLeftLimit.column - currentTopLeft.column;
					} else if (currentBottomRight.column > bottomRightLimit.column) {
						coord.column -= currentBottomRight.column - bottomRightLimit.column;
					}
				}
			}

			return coord;
		},

		// Prevent accidentally navigating outside the `coordLimits` of the map.
		enforceLimits: function(coord) {
			return this.enforcePanLimits(this.enforceZoomLimits(coord));
		},

		// rendering

		// Redraw the tiles on the map, reusing existing tiles.
		draw: function() {
			// make sure we're not too far in or out:
			this.coordinate = this.enforceLimits(this.coordinate);

			// if we don't have dimensions, check the parent size
			if (this.dimensions.x <= 0 || this.dimensions.y <= 0) {
				if (this.autoSize) {
					// maybe the parent size has changed?
					var w = this.parent.offsetWidth,
						h = this.parent.offsetHeight;
					this.dimensions = new MM.Point(w,h);
					if (w <= 0 || h <= 0) {
						return;
					}
				} else {
					// the issue can only be corrected with setSize
					return;
				}
			}

			// draw layers one by one
			for(var i = 0; i < this.layers.length; i++) {
				this.layers[i].draw();
			}

			this.dispatchCallback('drawn');
		},

		_redrawTimer: undefined,

		requestRedraw: function() {
			// we'll always draw within 1 second of this request,
			// sometimes faster if there's already a pending redraw
			// this is used when a new tile arrives so that we clear
			// any parent/child tiles that were only being displayed
			// until the tile loads at the right zoom level
			if (!this._redrawTimer) {
				this._redrawTimer = setTimeout(this.getRedraw(), 1000);
			}
		},

		_redraw: null,

		getRedraw: function() {
			// let's only create this closure once...
			if (!this._redraw) {
				var theMap = this;
				this._redraw = function() {
					theMap.draw();
					theMap._redrawTimer = 0;
				};
			}
			return this._redraw;
		},

		// Attempts to destroy all attachment a map has to a page
		// and clear its memory usage.
		destroy: function() {
			for (var j = 0; j < this.layers.length; j++) {
				this.layers[j].destroy();
			}
			this.layers = [];
			this.projection = null;
			for (var i = 0; i < this.eventHandlers.length; i++) {
				this.eventHandlers[i].remove();
			}
			if (this.autoSize) {
				MM.removeEvent(window, 'resize', this.windowResize());
			}
		}
	};
	// Instance of a map intended for drawing to a div.
	//
	//  * `parent` (required DOM element)
	//      Can also be an ID of a DOM element
	//  * `provider` (required MM.MapProvider or URL template)
	//  * `location` (required MM.Location)
	//      Location for map to show
	//  * `zoom` (required number)
	MM.mapByCenterZoom = function(parent, layerish, location, zoom) {
		var layer = MM.coerceLayer(layerish),
			map = new MM.Map(parent, layer, false);
		map.setCenterZoom(location, zoom).draw();
		return map;
	};

	// Instance of a map intended for drawing to a div.
	//
	//  * `parent` (required DOM element)
	//      Can also be an ID of a DOM element
	//  * `provider` (required MM.MapProvider or URL template)
	//  * `locationA` (required MM.Location)
	//      Location of one map corner
	//  * `locationB` (required MM.Location)
	//      Location of other map corner
	MM.mapByExtent = function(parent, layerish, locationA, locationB) {
		var layer = MM.coerceLayer(layerish),
			map = new MM.Map(parent, layer, false);
		map.setExtent([locationA, locationB]).draw();
		return map;
	};
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = {
			Point: MM.Point,
			Projection: MM.Projection,
			MercatorProjection: MM.MercatorProjection,
			LinearProjection: MM.LinearProjection,
			Transformation: MM.Transformation,
			Location: MM.Location,
			MapProvider: MM.MapProvider,
			Template: MM.Template,
			Coordinate: MM.Coordinate,
			deriveTransformation: MM.deriveTransformation
		};
	}
})(MM);
// Copyright Google Inc.
// Licensed under the Apache Licence Version 2.0
// Autogenerated at Tue Oct 11 13:36:46 EDT 2011
// @provides html4
var html4 = {};
html4.atype = {
	NONE: 0,
	URI: 1,
	URI_FRAGMENT: 11,
	SCRIPT: 2,
	STYLE: 3,
	ID: 4,
	IDREF: 5,
	IDREFS: 6,
	GLOBAL_NAME: 7,
	LOCAL_NAME: 8,
	CLASSES: 9,
	FRAME_TARGET: 10
};
html4.ATTRIBS = {
	'*::class': 9,
	'*::dir': 0,
	'*::id': 4,
	'*::lang': 0,
	'*::onclick': 2,
	'*::ondblclick': 2,
	'*::onkeydown': 2,
	'*::onkeypress': 2,
	'*::onkeyup': 2,
	'*::onload': 2,
	'*::onmousedown': 2,
	'*::onmousemove': 2,
	'*::onmouseout': 2,
	'*::onmouseover': 2,
	'*::onmouseup': 2,
	'*::style': 3,
	'*::title': 0,
	'a::accesskey': 0,
	'a::coords': 0,
	'a::href': 1,
	'a::hreflang': 0,
	'a::name': 7,
	'a::onblur': 2,
	'a::onfocus': 2,
	'a::rel': 0,
	'a::rev': 0,
	'a::shape': 0,
	'a::tabindex': 0,
	'a::target': 10,
	'a::type': 0,
	'area::accesskey': 0,
	'area::alt': 0,
	'area::coords': 0,
	'area::href': 1,
	'area::nohref': 0,
	'area::onblur': 2,
	'area::onfocus': 2,
	'area::shape': 0,
	'area::tabindex': 0,
	'area::target': 10,
	'bdo::dir': 0,
	'blockquote::cite': 1,
	'br::clear': 0,
	'button::accesskey': 0,
	'button::disabled': 0,
	'button::name': 8,
	'button::onblur': 2,
	'button::onfocus': 2,
	'button::tabindex': 0,
	'button::type': 0,
	'button::value': 0,
	'canvas::height': 0,
	'canvas::width': 0,
	'caption::align': 0,
	'col::align': 0,
	'col::char': 0,
	'col::charoff': 0,
	'col::span': 0,
	'col::valign': 0,
	'col::width': 0,
	'colgroup::align': 0,
	'colgroup::char': 0,
	'colgroup::charoff': 0,
	'colgroup::span': 0,
	'colgroup::valign': 0,
	'colgroup::width': 0,
	'del::cite': 1,
	'del::datetime': 0,
	'dir::compact': 0,
	'div::align': 0,
	'dl::compact': 0,
	'font::color': 0,
	'font::face': 0,
	'font::size': 0,
	'form::accept': 0,
	'form::action': 1,
	'form::autocomplete': 0,
	'form::enctype': 0,
	'form::method': 0,
	'form::name': 7,
	'form::onreset': 2,
	'form::onsubmit': 2,
	'form::target': 10,
	'h1::align': 0,
	'h2::align': 0,
	'h3::align': 0,
	'h4::align': 0,
	'h5::align': 0,
	'h6::align': 0,
	'hr::align': 0,
	'hr::noshade': 0,
	'hr::size': 0,
	'hr::width': 0,
	'iframe::align': 0,
	'iframe::frameborder': 0,
	'iframe::height': 0,
	'iframe::marginheight': 0,
	'iframe::marginwidth': 0,
	'iframe::width': 0,
	'img::align': 0,
	'img::alt': 0,
	'img::border': 0,
	'img::height': 0,
	'img::hspace': 0,
	'img::ismap': 0,
	'img::name': 7,
	'img::src': 1,
	'img::usemap': 11,
	'img::vspace': 0,
	'img::width': 0,
	'input::accept': 0,
	'input::accesskey': 0,
	'input::align': 0,
	'input::alt': 0,
	'input::autocomplete': 0,
	'input::checked': 0,
	'input::disabled': 0,
	'input::ismap': 0,
	'input::maxlength': 0,
	'input::name': 8,
	'input::onblur': 2,
	'input::onchange': 2,
	'input::onfocus': 2,
	'input::onselect': 2,
	'input::readonly': 0,
	'input::size': 0,
	'input::src': 1,
	'input::tabindex': 0,
	'input::type': 0,
	'input::usemap': 11,
	'input::value': 0,
	'ins::cite': 1,
	'ins::datetime': 0,
	'label::accesskey': 0,
	'label::for': 5,
	'label::onblur': 2,
	'label::onfocus': 2,
	'legend::accesskey': 0,
	'legend::align': 0,
	'li::type': 0,
	'li::value': 0,
	'map::name': 7,
	'menu::compact': 0,
	'ol::compact': 0,
	'ol::start': 0,
	'ol::type': 0,
	'optgroup::disabled': 0,
	'optgroup::label': 0,
	'option::disabled': 0,
	'option::label': 0,
	'option::selected': 0,
	'option::value': 0,
	'p::align': 0,
	'pre::width': 0,
	'q::cite': 1,
	'select::disabled': 0,
	'select::multiple': 0,
	'select::name': 8,
	'select::onblur': 2,
	'select::onchange': 2,
	'select::onfocus': 2,
	'select::size': 0,
	'select::tabindex': 0,
	'table::align': 0,
	'table::bgcolor': 0,
	'table::border': 0,
	'table::cellpadding': 0,
	'table::cellspacing': 0,
	'table::frame': 0,
	'table::rules': 0,
	'table::summary': 0,
	'table::width': 0,
	'tbody::align': 0,
	'tbody::char': 0,
	'tbody::charoff': 0,
	'tbody::valign': 0,
	'td::abbr': 0,
	'td::align': 0,
	'td::axis': 0,
	'td::bgcolor': 0,
	'td::char': 0,
	'td::charoff': 0,
	'td::colspan': 0,
	'td::headers': 6,
	'td::height': 0,
	'td::nowrap': 0,
	'td::rowspan': 0,
	'td::scope': 0,
	'td::valign': 0,
	'td::width': 0,
	'textarea::accesskey': 0,
	'textarea::cols': 0,
	'textarea::disabled': 0,
	'textarea::name': 8,
	'textarea::onblur': 2,
	'textarea::onchange': 2,
	'textarea::onfocus': 2,
	'textarea::onselect': 2,
	'textarea::readonly': 0,
	'textarea::rows': 0,
	'textarea::tabindex': 0,
	'tfoot::align': 0,
	'tfoot::char': 0,
	'tfoot::charoff': 0,
	'tfoot::valign': 0,
	'th::abbr': 0,
	'th::align': 0,
	'th::axis': 0,
	'th::bgcolor': 0,
	'th::char': 0,
	'th::charoff': 0,
	'th::colspan': 0,
	'th::headers': 6,
	'th::height': 0,
	'th::nowrap': 0,
	'th::rowspan': 0,
	'th::scope': 0,
	'th::valign': 0,
	'th::width': 0,
	'thead::align': 0,
	'thead::char': 0,
	'thead::charoff': 0,
	'thead::valign': 0,
	'tr::align': 0,
	'tr::bgcolor': 0,
	'tr::char': 0,
	'tr::charoff': 0,
	'tr::valign': 0,
	'ul::compact': 0,
	'ul::type': 0
};
html4.eflags = {
	OPTIONAL_ENDTAG: 1,
	EMPTY: 2,
	CDATA: 4,
	RCDATA: 8,
	UNSAFE: 16,
	FOLDABLE: 32,
	SCRIPT: 64,
	STYLE: 128
};
html4.ELEMENTS = {
	'a': 0,
	'abbr': 0,
	'acronym': 0,
	'address': 0,
	'applet': 16,
	'area': 2,
	'b': 0,
	'base': 18,
	'basefont': 18,
	'bdo': 0,
	'big': 0,
	'blockquote': 0,
	'body': 49,
	'br': 2,
	'button': 0,
	'canvas': 0,
	'caption': 0,
	'center': 0,
	'cite': 0,
	'code': 0,
	'col': 2,
	'colgroup': 1,
	'dd': 1,
	'del': 0,
	'dfn': 0,
	'dir': 0,
	'div': 0,
	'dl': 0,
	'dt': 1,
	'em': 0,
	'fieldset': 0,
	'font': 0,
	'form': 0,
	'frame': 18,
	'frameset': 16,
	'h1': 0,
	'h2': 0,
	'h3': 0,
	'h4': 0,
	'h5': 0,
	'h6': 0,
	'head': 49,
	'hr': 2,
	'html': 49,
	'i': 0,
	'iframe': 4,
	'img': 2,
	'input': 2,
	'ins': 0,
	'isindex': 18,
	'kbd': 0,
	'label': 0,
	'legend': 0,
	'li': 1,
	'link': 18,
	'map': 0,
	'menu': 0,
	'meta': 18,
	'nobr': 0,
	'noembed': 4,
	'noframes': 20,
	'noscript': 20,
	'object': 16,
	'ol': 0,
	'optgroup': 0,
	'option': 1,
	'p': 1,
	'param': 18,
	'pre': 0,
	'q': 0,
	's': 0,
	'samp': 0,
	'script': 84,
	'select': 0,
	'small': 0,
	'span': 0,
	'strike': 0,
	'strong': 0,
	'style': 148,
	'sub': 0,
	'sup': 0,
	'table': 0,
	'tbody': 1,
	'td': 1,
	'textarea': 8,
	'tfoot': 1,
	'th': 1,
	'thead': 1,
	'title': 24,
	'tr': 1,
	'tt': 0,
	'u': 0,
	'ul': 0,
	'var': 0
};
html4.ueffects = {
	NOT_LOADED: 0,
	SAME_DOCUMENT: 1,
	NEW_DOCUMENT: 2
};
html4.URIEFFECTS = {
	'a::href': 2,
	'area::href': 2,
	'blockquote::cite': 0,
	'body::background': 1,
	'del::cite': 0,
	'form::action': 2,
	'img::src': 1,
	'input::src': 1,
	'ins::cite': 0,
	'q::cite': 0
};
html4.ltypes = {
	UNSANDBOXED: 2,
	SANDBOXED: 1,
	DATA: 0
};
html4.LOADERTYPES = {
	'a::href': 2,
	'area::href': 2,
	'blockquote::cite': 2,
	'body::background': 1,
	'del::cite': 2,
	'form::action': 2,
	'img::src': 1,
	'input::src': 1,
	'ins::cite': 2,
	'q::cite': 2
};;
// Copyright (C) 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview
 * An HTML sanitizer that can satisfy a variety of security policies.
 *
 * <p>
 * The HTML sanitizer is built around a SAX parser and HTML element and
 * attributes schemas.
 *
 * @author mikesamuel@gmail.com
 * @requires html4
 * @overrides window
 * @provides html, html_sanitize
 */

/**
 * @namespace
 */
var html = (function (html4) {
	var lcase;
	// The below may not be true on browsers in the Turkish locale.
	if ('script' === 'SCRIPT'.toLowerCase()) {
		lcase = function (s) { return s.toLowerCase(); };
	} else {
		/**
		 * {@updoc
		 * $ lcase('SCRIPT')
		 * # 'script'
		 * $ lcase('script')
		 * # 'script'
		 * }
		 */
		lcase = function (s) {
			return s.replace(
				/[A-Z]/g,
				function (ch) {
					return String.fromCharCode(ch.charCodeAt(0) | 32);
				});
		};
	}

	var ENTITIES = {
		lt   : '<',
		gt   : '>',
		amp  : '&',
		nbsp : '\240',
		quot : '"',
		apos : '\''
	};

	// Schemes on which to defer to uripolicy. Urls with other schemes are denied
	var WHITELISTED_SCHEMES = /^(?:https?|mailto|data)$/i;

	var decimalEscapeRe = /^#(\d+)$/;
	var hexEscapeRe = /^#x([0-9A-Fa-f]+)$/;
	/**
	 * Decodes an HTML entity.
	 *
	 * {@updoc
	 * $ lookupEntity('lt')
	 * # '<'
	 * $ lookupEntity('GT')
	 * # '>'
	 * $ lookupEntity('amp')
	 * # '&'
	 * $ lookupEntity('nbsp')
	 * # '\xA0'
	 * $ lookupEntity('apos')
	 * # "'"
	 * $ lookupEntity('quot')
	 * # '"'
	 * $ lookupEntity('#xa')
	 * # '\n'
	 * $ lookupEntity('#10')
	 * # '\n'
	 * $ lookupEntity('#x0a')
	 * # '\n'
	 * $ lookupEntity('#010')
	 * # '\n'
	 * $ lookupEntity('#x00A')
	 * # '\n'
	 * $ lookupEntity('Pi')      // Known failure
	 * # '\u03A0'
	 * $ lookupEntity('pi')      // Known failure
	 * # '\u03C0'
	 * }
	 *
	 * @param name the content between the '&' and the ';'.
	 * @return a single unicode code-point as a string.
	 */
	function lookupEntity(name) {
		name = lcase(name);  // TODO: &pi; is different from &Pi;
		if (ENTITIES.hasOwnProperty(name)) { return ENTITIES[name]; }
		var m = name.match(decimalEscapeRe);
		if (m) {
			return String.fromCharCode(parseInt(m[1], 10));
		} else if (!!(m = name.match(hexEscapeRe))) {
			return String.fromCharCode(parseInt(m[1], 16));
		}
		return '';
	}

	function decodeOneEntity(_, name) {
		return lookupEntity(name);
	}

	var nulRe = /\0/g;
	function stripNULs(s) {
		return s.replace(nulRe, '');
	}

	var entityRe = /&(#\d+|#x[0-9A-Fa-f]+|\w+);/g;
	/**
	 * The plain text of a chunk of HTML CDATA which possibly containing.
	 *
	 * {@updoc
	 * $ unescapeEntities('')
	 * # ''
	 * $ unescapeEntities('hello World!')
	 * # 'hello World!'
	 * $ unescapeEntities('1 &lt; 2 &amp;&AMP; 4 &gt; 3&#10;')
	 * # '1 < 2 && 4 > 3\n'
	 * $ unescapeEntities('&lt;&lt <- unfinished entity&gt;')
	 * # '<&lt <- unfinished entity>'
	 * $ unescapeEntities('/foo?bar=baz&copy=true')  // & often unescaped in URLS
	 * # '/foo?bar=baz&copy=true'
	 * $ unescapeEntities('pi=&pi;&#x3c0;, Pi=&Pi;\u03A0') // FIXME: known failure
	 * # 'pi=\u03C0\u03c0, Pi=\u03A0\u03A0'
	 * }
	 *
	 * @param s a chunk of HTML CDATA.  It must not start or end inside an HTML
	 *   entity.
	 */
	function unescapeEntities(s) {
		return s.replace(entityRe, decodeOneEntity);
	}

	var ampRe = /&/g;
	var looseAmpRe = /&([^a-z#]|#(?:[^0-9x]|x(?:[^0-9a-f]|$)|$)|$)/gi;
	var ltRe = /</g;
	var gtRe = />/g;
	var quotRe = /\"/g;
	var eqRe = /\=/g;  // Backslash required on JScript.net

	/**
	 * Escapes HTML special characters in attribute values as HTML entities.
	 *
	 * {@updoc
	 * $ escapeAttrib('')
	 * # ''
	 * $ escapeAttrib('"<<&==&>>"')  // Do not just escape the first occurrence.
	 * # '&#34;&lt;&lt;&amp;&#61;&#61;&amp;&gt;&gt;&#34;'
	 * $ escapeAttrib('Hello <World>!')
	 * # 'Hello &lt;World&gt;!'
	 * }
	 */
	function escapeAttrib(s) {
		// Escaping '=' defangs many UTF-7 and SGML short-tag attacks.
		return s.replace(ampRe, '&amp;').replace(ltRe, '&lt;').replace(gtRe, '&gt;')
			.replace(quotRe, '&#34;').replace(eqRe, '&#61;');
	}

	/**
	 * Escape entities in RCDATA that can be escaped without changing the meaning.
	 * {@updoc
	 * $ normalizeRCData('1 < 2 &&amp; 3 > 4 &amp;& 5 &lt; 7&8')
	 * # '1 &lt; 2 &amp;&amp; 3 &gt; 4 &amp;&amp; 5 &lt; 7&amp;8'
	 * }
	 */
	function normalizeRCData(rcdata) {
		return rcdata
			.replace(looseAmpRe, '&amp;$1')
			.replace(ltRe, '&lt;')
			.replace(gtRe, '&gt;');
	}


	// TODO(mikesamuel): validate sanitizer regexs against the HTML5 grammar at
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/parsing.html
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/tokenization.html
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/tree-construction.html

	/** token definitions. */
	var INSIDE_TAG_TOKEN = new RegExp(
		// Don't capture space.
		'^\\s*(?:'
			// Capture an attribute name in group 1, and value in group 3.
			// We capture the fact that there was an attribute in group 2, since
			// interpreters are inconsistent in whether a group that matches nothing
			// is null, undefined, or the empty string.
			+ ('(?:'
			+ '([a-z][a-z-]*)'                    // attribute name
			+ ('('                                // optionally followed
			+ '\\s*=\\s*'
			+ ('('
			// A double quoted string.
			+ '\"[^\"]*\"'
			// A single quoted string.
			+ '|\'[^\']*\''
			// The positive lookahead is used to make sure that in
			// <foo bar= baz=boo>, the value for bar is blank, not "baz=boo".
			+ '|(?=[a-z][a-z-]*\\s*=)'
			// An unquoted value that is not an attribute name.
			// We know it is not an attribute name because the previous
			// zero-width match would've eliminated that possibility.
			+ '|[^>\"\'\\s]*'
			+ ')'
			)
			+ ')'
			) + '?'
			+ ')'
			)
			// End of tag captured in group 3.
			+ '|(\/?>)'
			// Don't capture cruft
			+ '|[\\s\\S][^a-z\\s>]*)',
		'i');

	var OUTSIDE_TAG_TOKEN = new RegExp(
		'^(?:'
			// Entity captured in group 1.
			+ '&(\\#[0-9]+|\\#[x][0-9a-f]+|\\w+);'
			// Comment, doctypes, and processing instructions not captured.
			+ '|<\!--[\\s\\S]*?--\>|<!\\w[^>]*>|<\\?[^>*]*>'
			// '/' captured in group 2 for close tags, and name captured in group 3.
			+ '|<(\/)?([a-z][a-z0-9]*)'
			// Text captured in group 4.
			+ '|([^<&>]+)'
			// Cruft captured in group 5.
			+ '|([<&>]))',
		'i');

	/**
	 * Given a SAX-like event handler, produce a function that feeds those
	 * events and a parameter to the event handler.
	 *
	 * The event handler has the form:{@code
	 * {
   *   // Name is an upper-case HTML tag name.  Attribs is an array of
   *   // alternating upper-case attribute names, and attribute values.  The
   *   // attribs array is reused by the parser.  Param is the value passed to
   *   // the saxParser.
   *   startTag: function (name, attribs, param) { ... },
   *   endTag:   function (name, param) { ... },
   *   pcdata:   function (text, param) { ... },
   *   rcdata:   function (text, param) { ... },
   *   cdata:    function (text, param) { ... },
   *   startDoc: function (param) { ... },
   *   endDoc:   function (param) { ... }
   * }}
	 *
	 * @param {Object} handler a record containing event handlers.
	 * @return {Function} that takes a chunk of html and a parameter.
	 *   The parameter is passed on to the handler methods.
	 */
	function makeSaxParser(handler) {
		return function parse(htmlText, param) {
			htmlText = String(htmlText);
			var htmlLower = null;

			var inTag = false;  // True iff we're currently processing a tag.
			var attribs = [];  // Accumulates attribute names and values.
			var tagName = void 0;  // The name of the tag currently being processed.
			var eflags = void 0;  // The element flags for the current tag.
			var openTag = void 0;  // True if the current tag is an open tag.

			if (handler.startDoc) { handler.startDoc(param); }

			while (htmlText) {
				var m = htmlText.match(inTag ? INSIDE_TAG_TOKEN : OUTSIDE_TAG_TOKEN);
				htmlText = htmlText.substring(m[0].length);

				if (inTag) {
					if (m[1]) { // attribute
						// setAttribute with uppercase names doesn't work on IE6.
						var attribName = lcase(m[1]);
						var decodedValue;
						if (m[2]) {
							var encodedValue = m[3];
							switch (encodedValue.charCodeAt(0)) {  // Strip quotes
								case 34: case 39:
								encodedValue = encodedValue.substring(
									1, encodedValue.length - 1);
								break;
							}
							decodedValue = unescapeEntities(stripNULs(encodedValue));
						} else {
							// Use name as value for valueless attribs, so
							//   <input type=checkbox checked>
							// gets attributes ['type', 'checkbox', 'checked', 'checked']
							decodedValue = attribName;
						}
						attribs.push(attribName, decodedValue);
					} else if (m[4]) {
						if (eflags !== void 0) {  // False if not in whitelist.
							if (openTag) {
								if (handler.startTag) {
									handler.startTag(tagName, attribs, param);
								}
							} else {
								if (handler.endTag) {
									handler.endTag(tagName, param);
								}
							}
						}

						if (openTag
							&& (eflags & (html4.eflags.CDATA | html4.eflags.RCDATA))) {
							if (htmlLower === null) {
								htmlLower = lcase(htmlText);
							} else {
								htmlLower = htmlLower.substring(
									htmlLower.length - htmlText.length);
							}
							var dataEnd = htmlLower.indexOf('</' + tagName);
							if (dataEnd < 0) { dataEnd = htmlText.length; }
							if (dataEnd) {
								if (eflags & html4.eflags.CDATA) {
									if (handler.cdata) {
										handler.cdata(htmlText.substring(0, dataEnd), param);
									}
								} else if (handler.rcdata) {
									handler.rcdata(
										normalizeRCData(htmlText.substring(0, dataEnd)), param);
								}
								htmlText = htmlText.substring(dataEnd);
							}
						}

						tagName = eflags = openTag = void 0;
						attribs.length = 0;
						inTag = false;
					}
				} else {
					if (m[1]) {  // Entity
						if (handler.pcdata) { handler.pcdata(m[0], param); }
					} else if (m[3]) {  // Tag
						openTag = !m[2];
						inTag = true;
						tagName = lcase(m[3]);
						eflags = html4.ELEMENTS.hasOwnProperty(tagName)
							? html4.ELEMENTS[tagName] : void 0;
					} else if (m[4]) {  // Text
						if (handler.pcdata) { handler.pcdata(m[4], param); }
					} else if (m[5]) {  // Cruft
						if (handler.pcdata) {
							var ch = m[5];
							handler.pcdata(
								ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&amp;',
								param);
						}
					}
				}
			}

			if (handler.endDoc) { handler.endDoc(param); }
		};
	}

	/**
	 * Returns a function that strips unsafe tags and attributes from html.
	 * @param {Function} sanitizeAttributes
	 *     maps from (tagName, attribs[]) to null or a sanitized attribute array.
	 *     The attribs array can be arbitrarily modified, but the same array
	 *     instance is reused, so should not be held.
	 * @return {Function} from html to sanitized html
	 */
	function makeHtmlSanitizer(sanitizeAttributes) {
		var stack;
		var ignoring;
		return makeSaxParser({
			startDoc: function (_) {
				stack = [];
				ignoring = false;
			},
			startTag: function (tagName, attribs, out) {
				if (ignoring) { return; }
				if (!html4.ELEMENTS.hasOwnProperty(tagName)) { return; }
				var eflags = html4.ELEMENTS[tagName];
				if (eflags & html4.eflags.FOLDABLE) {
					return;
				} else if (eflags & html4.eflags.UNSAFE) {
					ignoring = !(eflags & html4.eflags.EMPTY);
					return;
				}
				attribs = sanitizeAttributes(tagName, attribs);
				// TODO(mikesamuel): relying on sanitizeAttributes not to
				// insert unsafe attribute names.
				if (attribs) {
					if (!(eflags & html4.eflags.EMPTY)) {
						stack.push(tagName);
					}

					out.push('<', tagName);
					for (var i = 0, n = attribs.length; i < n; i += 2) {
						var attribName = attribs[i],
							value = attribs[i + 1];
						if (value !== null && value !== void 0) {
							out.push(' ', attribName, '="', escapeAttrib(value), '"');
						}
					}
					out.push('>');
				}
			},
			endTag: function (tagName, out) {
				if (ignoring) {
					ignoring = false;
					return;
				}
				if (!html4.ELEMENTS.hasOwnProperty(tagName)) { return; }
				var eflags = html4.ELEMENTS[tagName];
				if (!(eflags & (html4.eflags.UNSAFE | html4.eflags.EMPTY
					| html4.eflags.FOLDABLE))) {
					var index;
					if (eflags & html4.eflags.OPTIONAL_ENDTAG) {
						for (index = stack.length; --index >= 0;) {
							var stackEl = stack[index];
							if (stackEl === tagName) { break; }
							if (!(html4.ELEMENTS[stackEl]
								& html4.eflags.OPTIONAL_ENDTAG)) {
								// Don't pop non optional end tags looking for a match.
								return;
							}
						}
					} else {
						for (index = stack.length; --index >= 0;) {
							if (stack[index] === tagName) { break; }
						}
					}
					if (index < 0) { return; }  // Not opened.
					for (var i = stack.length; --i > index;) {
						var stackEl = stack[i];
						if (!(html4.ELEMENTS[stackEl]
							& html4.eflags.OPTIONAL_ENDTAG)) {
							out.push('</', stackEl, '>');
						}
					}
					stack.length = index;
					out.push('</', tagName, '>');
				}
			},
			pcdata: function (text, out) {
				if (!ignoring) { out.push(text); }
			},
			rcdata: function (text, out) {
				if (!ignoring) { out.push(text); }
			},
			cdata: function (text, out) {
				if (!ignoring) { out.push(text); }
			},
			endDoc: function (out) {
				for (var i = stack.length; --i >= 0;) {
					out.push('</', stack[i], '>');
				}
				stack.length = 0;
			}
		});
	}

	// From RFC3986
	var URI_SCHEME_RE = new RegExp(
		"^" +
			"(?:" +
			"([^:\/?#]+)" +         // scheme
			":)?"
	);

	/**
	 * Strips unsafe tags and attributes from html.
	 * @param {string} htmlText to sanitize
	 * @param {Function} opt_uriPolicy -- a transform to apply to uri/url
	 *     attribute values.  If no opt_uriPolicy is provided, no uris
	 *     are allowed ie. the default uriPolicy rewrites all uris to null
	 * @param {Function} opt_nmTokenPolicy : string -> string? -- a transform to
	 *     apply to names, ids, and classes. If no opt_nmTokenPolicy is provided,
	 *     all names, ids and classes are passed through ie. the default
	 *     nmTokenPolicy is an identity transform
	 * @return {string} html
	 */
	function sanitize(htmlText, opt_uriPolicy, opt_nmTokenPolicy) {
		var out = [];
		makeHtmlSanitizer(
			function sanitizeAttribs(tagName, attribs) {
				for (var i = 0; i < attribs.length; i += 2) {
					var attribName = attribs[i];
					var value = attribs[i + 1];
					var atype = null, attribKey;
					if ((attribKey = tagName + '::' + attribName,
						html4.ATTRIBS.hasOwnProperty(attribKey))
						|| (attribKey = '*::' + attribName,
						html4.ATTRIBS.hasOwnProperty(attribKey))) {
						atype = html4.ATTRIBS[attribKey];
					}
					if (atype !== null) {
						switch (atype) {
							case html4.atype.NONE: break;
							case html4.atype.SCRIPT:
							case html4.atype.STYLE:
								value = null;
								break;
							case html4.atype.ID:
							case html4.atype.IDREF:
							case html4.atype.IDREFS:
							case html4.atype.GLOBAL_NAME:
							case html4.atype.LOCAL_NAME:
							case html4.atype.CLASSES:
								value = opt_nmTokenPolicy ? opt_nmTokenPolicy(value) : value;
								break;
							case html4.atype.URI:
								var parsedUri = ('' + value).match(URI_SCHEME_RE);
								if (!parsedUri) {
									value = null;
								} else if (!parsedUri[1] ||
									WHITELISTED_SCHEMES.test(parsedUri[1])) {
									value = opt_uriPolicy && opt_uriPolicy(value);
								} else {
									value = null;
								}
								break;
							case html4.atype.URI_FRAGMENT:
								if (value && '#' === value.charAt(0)) {
									value = opt_nmTokenPolicy ? opt_nmTokenPolicy(value) : value;
									if (value) { value = '#' + value; }
								} else {
									value = null;
								}
								break;
							default:
								value = null;
								break;
						}
					} else {
						value = null;
					}
					attribs[i + 1] = value;
				}
				return attribs;
			})(htmlText, out);
		return out.join('');
	}

	return {
		escapeAttrib: escapeAttrib,
		makeHtmlSanitizer: makeHtmlSanitizer,
		makeSaxParser: makeSaxParser,
		normalizeRCData: normalizeRCData,
		sanitize: sanitize,
		unescapeEntities: unescapeEntities
	};
})(html4);

var html_sanitize = html.sanitize;

// Exports for closure compiler.  Note this file is also cajoled
// for domado and run in an environment without 'window'
if (typeof window !== 'undefined') {
	window['html'] = html;
	window['html_sanitize'] = html_sanitize;
}
// Loosen restrictions of Caja's
// html-sanitizer to allow for styling
html4.ATTRIBS['*::style'] = 0;
html4.ELEMENTS['style'] = 0;

html4.ATTRIBS['a::target'] = 0;

html4.ELEMENTS['video'] = 0;
html4.ATTRIBS['video::src'] = 0;
html4.ATTRIBS['video::poster'] = 0;
html4.ATTRIBS['video::controls'] = 0;

html4.ELEMENTS['audio'] = 0;
html4.ATTRIBS['audio::src'] = 0;
html4.ATTRIBS['video::autoplay'] = 0;
html4.ATTRIBS['video::controls'] = 0;
;wax = wax || {};

// Attribution
// -----------
wax.attribution = function() {
	var a = {};

	var container = document.createElement('div');
	container.className = 'map-attribution';

	a.content = function(x) {
		if (typeof x === 'undefined') return container.innerHTML;
		container.innerHTML = wax.u.sanitize(x);
		return this;
	};

	a.element = function() {
		return container;
	};

	a.init = function() {
		return this;
	};

	return a;
};
wax = wax || {};

// Attribution
// -----------
wax.bwdetect = function(options, callback) {
	var detector = {},
		threshold = options.threshold || 400,
	// test image: 30.29KB
		testImage = 'http://a.tiles.mapbox.com/mapbox/1.0.0/blue-marble-topo-bathy-jul/0/0/0.png?preventcache=' + (+new Date()),
	// High-bandwidth assumed
	// 1: high bandwidth (.png, .jpg)
	// 0: low bandwidth (.png128, .jpg70)
		bw = 1,
	// Alternative versions
		auto = options.auto === undefined ? true : options.auto;

	function bwTest() {
		wax.bw = -1;
		var im = new Image();
		im.src = testImage;
		var first = true;
		var timeout = setTimeout(function() {
			if (first && wax.bw == -1) {
				detector.bw(0);
				first = false;
			}
		}, threshold);
		im.onload = function() {
			if (first && wax.bw == -1) {
				clearTimeout(timeout);
				detector.bw(1);
				first = false;
			}
		};
	}

	detector.bw = function(x) {
		if (!arguments.length) return bw;
		var oldBw = bw;
		if (wax.bwlisteners && wax.bwlisteners.length) (function () {
			listeners = wax.bwlisteners;
			wax.bwlisteners = [];
			for (i = 0; i < listeners; i++) {
				listeners[i](x);
			}
		})();
		wax.bw = x;

		if (bw != (bw = x)) callback(x);
	};

	detector.add = function() {
		if (auto) bwTest();
		return this;
	};

	if (wax.bw == -1) {
		wax.bwlisteners = wax.bwlisteners || [];
		wax.bwlisteners.push(detector.bw);
	} else if (wax.bw !== undefined) {
		detector.bw(wax.bw);
	} else {
		detector.add();
	}
	return detector;
};
// Formatter
// ---------
//
// This code is no longer the recommended code path for Wax -
// see `template.js`, a safe implementation of Mustache templates.
wax.formatter = function(x) {
	var formatter = {},
		f;

	// Prevent against just any input being used.
	if (x && typeof x === 'string') {
		try {
			// Ugly, dangerous use of eval.
			eval('f = ' + x);
		} catch (e) {
			if (console) console.log(e);
		}
	} else if (x && typeof x === 'function') {
		f = x;
	} else {
		f = function() {};
	}

	// Wrap the given formatter function in order to
	// catch exceptions that it may throw.
	formatter.format = function(options, data) {
		try {
			return wax.u.sanitize(f(options, data));
		} catch (e) {
			if (console) console.log(e);
		}
	};

	return formatter;
};
// GridInstance
// ------------
// GridInstances are queryable, fully-formed
// objects for acquiring features from events.
//
// This code ignores format of 1.1-1.2
wax.gi = function(grid_tile, options) {
	options = options || {};
	// resolution is the grid-elements-per-pixel ratio of gridded data.
	// The size of a tile element. For now we expect tiles to be squares.
	var instance = {},
		resolution = options.resolution || 4,
		tileSize = options.tileSize || 256;

	// Resolve the UTF-8 encoding stored in grids to simple
	// number values.
	// See the [utfgrid spec](https://github.com/mapbox/utfgrid-spec)
	// for details.
	function resolveCode(key) {
		if (key >= 93) key--;
		if (key >= 35) key--;
		key -= 32;
		return key;
	}

	instance.grid_tile = function() {
		return grid_tile;
	};

	instance.getKey = function(x, y) {
		if (!(grid_tile && grid_tile.grid)) return;
		if ((y < 0) || (x < 0)) return;
		if ((Math.floor(y) >= tileSize) ||
			(Math.floor(x) >= tileSize)) return;
		// Find the key in the grid. The above calls should ensure that
		// the grid's array is large enough to make this work.
		return resolveCode(grid_tile.grid[
			Math.floor((y) / resolution)
			].charCodeAt(
				Math.floor((x) / resolution)
			));
	};

	// Lower-level than tileFeature - has nothing to do
	// with the DOM. Takes a px offset from 0, 0 of a grid.
	instance.gridFeature = function(x, y) {
		// Find the key in the grid. The above calls should ensure that
		// the grid's array is large enough to make this work.
		var key = this.getKey(x, y),
			keys = grid_tile.keys;

		if (keys &&
			keys[key] &&
			grid_tile.data[keys[key]]) {
			return grid_tile.data[keys[key]];
		}
	};

	// Get a feature:
	// * `x` and `y`: the screen coordinates of an event
	// * `tile_element`: a DOM element of a tile, from which we can get an offset.
	instance.tileFeature = function(x, y, tile_element) {
		if (!grid_tile) return;
		// IE problem here - though recoverable, for whatever reason
		var offset = wax.u.offset(tile_element);
		feature = this.gridFeature(x - offset.left, y - offset.top);
		return feature;
	};

	return instance;
};
// GridManager
// -----------
// Generally one GridManager will be used per map.
//
// It takes one options object, which current accepts a single option:
// `resolution` determines the number of pixels per grid element in the grid.
// The default is 4.
wax.gm = function() {

	var resolution = 4,
		grid_tiles = {},
		manager = {},
		tilejson,
		formatter;

	var gridUrl = function(url) {
		if (url) {
			return url.replace(/(\.png|\.jpg|\.jpeg)(\d*)/, '.grid.json');
		}
	};

	function templatedGridUrl(template) {
		if (typeof template === 'string') template = [template];
		return function templatedGridFinder(url) {
			if (!url) return;
			var rx = new RegExp('/(\\d+)\\/(\\d+)\\/(\\d+)\\.[\\w\\._]+');
			var xyz = rx.exec(url);
			if (!xyz) return;
			return template[parseInt(xyz[2], 10) % template.length]
				.replace(/\{z\}/g, xyz[1])
				.replace(/\{x\}/g, xyz[2])
				.replace(/\{y\}/g, xyz[3]);
		};
	}

	manager.formatter = function(x) {
		if (!arguments.length) return formatter;
		formatter =  wax.formatter(x);
		return manager;
	};

	manager.template = function(x) {
		if (!arguments.length) return formatter;
		formatter = wax.template(x);
		return manager;
	};

	manager.gridUrl = function(x) {
		// Getter-setter
		if (!arguments.length) return gridUrl;

		// Handle tilesets that don't support grids
		if (!x) {
			gridUrl = function() { return null; };
		} else {
			gridUrl = typeof x === 'function' ?
				x : templatedGridUrl(x);
		}
		return manager;
	};

	manager.getGrid = function(url, callback) {
		var gurl = gridUrl(url);
		if (!formatter || !gurl) return callback(null, null);

		wax.request.get(gurl, function(err, t) {
			if (err) return callback(err, null);
			callback(null, wax.gi(t, {
				formatter: formatter,
				resolution: resolution
			}));
		});
		return manager;
	};

	manager.tilejson = function(x) {
		if (!arguments.length) return tilejson;
		// prefer templates over formatters
		if (x.template) {
			manager.template(x.template);
		} else if (x.formatter) {
			manager.formatter(x.formatter);
		} else {
			// In this case, we cannot support grids
			formatter = undefined;
		}
		manager.gridUrl(x.grids);
		if (x.resolution) resolution = x.resolution;
		tilejson = x;
		return manager;
	};

	return manager;
};
wax = wax || {};

// Hash
// ----
wax.hash = function(options) {
	options = options || {};

	var s0, // old hash
		hash = {},
		lat = 90 - 1e-8;  // allowable latitude range

	function getState() {
		return location.hash.substring(1);
	}

	function pushState(state) {
		var l = window.location;
		l.replace(l.toString().replace((l.hash || /$/), '#' + state));
	}

	function parseHash(s) {
		var args = s.split('/');
		for (var i = 0; i < args.length; i++) {
			args[i] = Number(args[i]);
			if (isNaN(args[i])) return true;
		}
		if (args.length < 3) {
			// replace bogus hash
			return true;
		} else if (args.length == 3) {
			options.setCenterZoom(args);
		}
	}

	function move() {
		var s1 = options.getCenterZoom();
		if (s0 !== s1) {
			s0 = s1;
			// don't recenter the map!
			pushState(s0);
		}
	}

	function stateChange(state) {
		// ignore spurious hashchange events
		if (state === s0) return;
		if (parseHash(s0 = state)) {
			// replace bogus hash
			move();
		}
	}

	var _move = wax.u.throttle(move, 500);

	hash.add = function() {
		stateChange(getState());
		options.bindChange(_move);
		return hash;
	};

	hash.remove = function() {
		options.unbindChange(_move);
		return hash;
	};

	return hash;
};
wax = wax || {};

wax.interaction = function() {
	var gm = wax.gm(),
		interaction = {},
		_downLock = false,
		_clickTimeout = null,
	// Active feature
	// Down event
		_d,
	// Touch tolerance
		tol = 4,
		grid,
		attach,
		detach,
		parent,
		map,
		tileGrid;

	var defaultEvents = {
		mousemove: onMove,
		touchstart: onDown,
		mousedown: onDown
	};

	var touchEnds = {
		touchend: onUp,
		touchmove: onUp,
		touchcancel: touchCancel
	};

	// Abstract getTile method. Depends on a tilegrid with
	// grid[ [x, y, tile] ] structure.
	function getTile(e) {
		var g = grid();
		for (var i = 0; i < g.length; i++) {
			if ((g[i][0] < e.y) &&
				((g[i][0] + 256) > e.y) &&
				(g[i][1] < e.x) &&
				((g[i][1] + 256) > e.x)) return g[i][2];
		}
		return false;
	}

	// Clear the double-click timeout to prevent double-clicks from
	// triggering popups.
	function killTimeout() {
		if (_clickTimeout) {
			window.clearTimeout(_clickTimeout);
			_clickTimeout = null;
			return true;
		} else {
			return false;
		}
	}

	function onMove(e) {
		// If the user is actually dragging the map, exit early
		// to avoid performance hits.
		if (_downLock) return;

		var pos = wax.u.eventoffset(e);

		interaction.screen_feature(pos, function(feature) {
			if (feature) {
				bean.fire(interaction, 'on', {
					parent: parent(),
					data: feature,
					formatter: gm.formatter().format,
					e: e
				});
			} else {
				bean.fire(interaction, 'off');
			}
		});
	}

	function dragEnd() {
		_downLock = false;
	}

	// A handler for 'down' events - which means `mousedown` and `touchstart`
	function onDown(e) {

		// Prevent interaction offset calculations happening while
		// the user is dragging the map.
		//
		// Store this event so that we can compare it to the
		// up event
		_downLock = true;
		_d = wax.u.eventoffset(e);
		if (e.type === 'mousedown') {
			bean.add(document.body, 'click', onUp);
			// track mouse up to remove lockDown when the drags end
			bean.add(document.body, 'mouseup', dragEnd);

			// Only track single-touches. Double-touches will not affect this
			// control
		} else if (e.type === 'touchstart' && e.touches.length === 1) {
			// Don't make the user click close if they hit another tooltip
			bean.fire(interaction, 'off');
			// Touch moves invalidate touches
			bean.add(e.srcElement, touchEnds);
		}
	}

	function touchCancel(e) {
		bean.remove(e.srcElement, touchEnds);
		_downLock = false;
	}

	function onUp(e) {
		var evt = {},
			pos = wax.u.eventoffset(e);
		_downLock = false;

		// TODO: refine
		for (var key in e) {
			evt[key] = e[key];
		}

		bean.remove(document.body, 'mouseup', onUp);
		bean.remove(e.srcElement, touchEnds);

		if (e.type === 'touchend') {
			// If this was a touch and it survived, there's no need to avoid a double-tap
			// but also wax.u.eventoffset will have failed, since this touch
			// event doesn't have coordinates
			interaction.click(e, _d);
		} else if (Math.round(pos.y / tol) === Math.round(_d.y / tol) &&
			Math.round(pos.x / tol) === Math.round(_d.x / tol)) {
			// Contain the event data in a closure.
			// Ignore double-clicks by ignoring clicks within 300ms of
			// each other.
			if(!_clickTimeout) {
				_clickTimeout = window.setTimeout(function() {
					_clickTimeout = null;
					interaction.click(evt, pos);
				}, 300);
			} else {
				killTimeout();
			}
		}
		return onUp;
	}

	// Handle a click event. Takes a second
	interaction.click = function(e, pos) {
		interaction.screen_feature(pos, function(feature) {
			if (feature) bean.fire(interaction, 'on', {
				parent: parent(),
				data: feature,
				formatter: gm.formatter().format,
				e: e
			});
		});
	};

	interaction.screen_feature = function(pos, callback) {
		var tile = getTile(pos);
		if (!tile) callback(null);
		gm.getGrid(tile.src, function(err, g) {
			if (err || !g) return callback(null);
			var feature = g.tileFeature(pos.x, pos.y, tile);
			callback(feature);
		});
	};

	// set an attach function that should be
	// called when maps are set
	interaction.attach = function(x) {
		if (!arguments.length) return attach;
		attach = x;
		return interaction;
	};

	interaction.detach = function(x) {
		if (!arguments.length) return detach;
		detach = x;
		return interaction;
	};

	// Attach listeners to the map
	interaction.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		if (attach) attach(map);
		bean.add(parent(), defaultEvents);
		bean.add(parent(), 'touchstart', onDown);
		return interaction;
	};

	// set a grid getter for this control
	interaction.grid = function(x) {
		if (!arguments.length) return grid;
		grid = x;
		return interaction;
	};

	// detach this and its events from the map cleanly
	interaction.remove = function(x) {
		if (detach) detach(map);
		bean.remove(parent(), defaultEvents);
		bean.fire(interaction, 'remove');
		return interaction;
	};

	// get or set a tilejson chunk of json
	interaction.tilejson = function(x) {
		if (!arguments.length) return gm.tilejson();
		gm.tilejson(x);
		return interaction;
	};

	// return the formatter, which has an exposed .format
	// function
	interaction.formatter = function() {
		return gm.formatter();
	};

	// ev can be 'on', 'off', fn is the handler
	interaction.on = function(ev, fn) {
		bean.add(interaction, ev, fn);
		return interaction;
	};

	// ev can be 'on', 'off', fn is the handler
	interaction.off = function(ev, fn) {
		bean.remove(interaction, ev, fn);
		return interaction;
	};

	// Return or set the gridmanager implementation
	interaction.gridmanager = function(x) {
		if (!arguments.length) return gm;
		gm = x;
		return interaction;
	};

	// parent should be a function that returns
	// the parent element of the map
	interaction.parent  = function(x) {
		parent = x;
		return interaction;
	};

	return interaction;
};
// Wax Legend
// ----------

// Wax header
var wax = wax || {};

wax.legend = function() {
	var element,
		legend = {},
		container;

	legend.element = function() {
		return container;
	};

	legend.content = function(content) {
		if (!arguments.length) return element.innerHTML;

		element.innerHTML = wax.u.sanitize(content);
		element.style.display = 'block';
		if (element.innerHTML === '') {
			element.style.display = 'none';
		}

		return legend;
	};

	legend.add = function() {
		container = document.createElement('div');
		container.className = 'map-legends wax-legends';

		element = container.appendChild(document.createElement('div'));
		element.className = 'map-legend wax-legend';
		element.style.display = 'none';
		return legend;
	};

	return legend.add();
};
var wax = wax || {};

wax.location = function() {

	var t = {};

	function on(o) {
		if ((o.e.type === 'mousemove' || !o.e.type)) {
			return;
		} else {
			var loc = o.formatter({ format: 'location' }, o.data);
			if (loc) {
				window.top.location.href = loc;
			}
		}
	}

	t.events = function() {
		return {
			on: on
		};
	};

	return t;

};
var wax = wax || {};
wax.movetip = {};

wax.movetip = function() {
	var popped = false,
		t = {},
		_tooltipOffset,
		_contextOffset,
		tooltip,
		parent;

	function moveTooltip(e) {
		var eo = wax.u.eventoffset(e);
		// faux-positioning
		if ((_tooltipOffset.height + eo.y) >
			(_contextOffset.top + _contextOffset.height) &&
			(_contextOffset.height > _tooltipOffset.height)) {
			eo.y -= _tooltipOffset.height;
			tooltip.className += ' flip-y';
		}

		// faux-positioning
		if ((_tooltipOffset.width + eo.x) >
			(_contextOffset.left + _contextOffset.width)) {
			eo.x -= _tooltipOffset.width;
			tooltip.className += ' flip-x';
		}

		tooltip.style.left = eo.x + 'px';
		tooltip.style.top = eo.y + 'px';
	}

	// Get the active tooltip for a layer or create a new one if no tooltip exists.
	// Hide any tooltips on layers underneath this one.
	function getTooltip(feature) {
		var tooltip = document.createElement('div');
		tooltip.className = 'map-tooltip map-tooltip-0';
		tooltip.innerHTML = feature;
		return tooltip;
	}

	// Hide a given tooltip.
	function hide() {
		if (tooltip) {
			tooltip.parentNode.removeChild(tooltip);
			tooltip = null;
		}
	}

	function on(o) {
		var content;
		if (popped) return;
		if ((o.e.type === 'mousemove' || !o.e.type)) {
			content = o.formatter({ format: 'teaser' }, o.data);
			if (!content) return;
			hide();
			parent.style.cursor = 'pointer';
			tooltip = document.body.appendChild(getTooltip(content));
		} else {
			content = o.formatter({ format: 'teaser' }, o.data);
			if (!content) return;
			hide();
			var tt = document.body.appendChild(getTooltip(content));
			tt.className += ' map-popup';

			var close = tt.appendChild(document.createElement('a'));
			close.href = '#close';
			close.className = 'close';
			close.innerHTML = 'Close';

			popped = true;

			tooltip = tt;

			_tooltipOffset = wax.u.offset(tooltip);
			_contextOffset = wax.u.offset(parent);
			moveTooltip(o.e);

			bean.add(close, 'click touchend', function closeClick(e) {
				e.stop();
				hide();
				popped = false;
			});
		}
		if (tooltip) {
			_tooltipOffset = wax.u.offset(tooltip);
			_contextOffset = wax.u.offset(parent);
			moveTooltip(o.e);
		}

	}

	function off() {
		parent.style.cursor = 'default';
		if (!popped) hide();
	}

	t.parent = function(x) {
		if (!arguments.length) return parent;
		parent = x;
		return t;
	};

	t.events = function() {
		return {
			on: on,
			off: off
		};
	};

	return t;
};

// Wax GridUtil
// ------------

// Wax header
var wax = wax || {};

// Request
// -------
// Request data cache. `callback(data)` where `data` is the response data.
wax.request = {
	cache: {},
	locks: {},
	promises: {},
	get: function(url, callback) {
		// Cache hit.
		if (this.cache[url]) {
			return callback(this.cache[url][0], this.cache[url][1]);
			// Cache miss.
		} else {
			this.promises[url] = this.promises[url] || [];
			this.promises[url].push(callback);
			// Lock hit.
			if (this.locks[url]) return;
			// Request.
			var that = this;
			this.locks[url] = true;
			reqwest({
				url: url + (~url.indexOf('?') ? '&' : '?') + 'callback=?',
				type: 'jsonp',
				success: function(data) {
					that.locks[url] = false;
					that.cache[url] = [null, data];
					for (var i = 0; i < that.promises[url].length; i++) {
						that.promises[url][i](that.cache[url][0], that.cache[url][1]);
					}
				},
				error: function(err) {
					that.locks[url] = false;
					that.cache[url] = [err, null];
					for (var i = 0; i < that.promises[url].length; i++) {
						that.promises[url][i](that.cache[url][0], that.cache[url][1]);
					}
				}
			});
		}
	}
};
// Templating
// ---------
wax.template = function(x) {
	var template = {};

	// Clone the data object such that the '__[format]__' key is only
	// set for this instance of templating.
	template.format = function(options, data) {
		var clone = {};
		for (var key in data) {
			clone[key] = data[key];
		}
		if (options.format) {
			clone['__' + options.format + '__'] = true;
		}
		return wax.u.sanitize(Mustache.to_html(x, clone));
	};

	return template;
};
if (!wax) var wax = {};

// A wrapper for reqwest jsonp to easily load TileJSON from a URL.
wax.tilejson = function(url, callback) {
	reqwest({
		url: url + (~url.indexOf('?') ? '&' : '?') + 'callback=?',
		type: 'jsonp',
		success: callback,
		error: callback
	});
};
var wax = wax || {};
wax.tooltip = {};

wax.tooltip = function() {
	var popped = false,
		animate = false,
		t = {},
		tooltips = [],
		_currentContent,
		transitionEvent,
		parent;

	if (document.body.style['-webkit-transition'] !== undefined) {
		transitionEvent = 'webkitTransitionEnd';
	} else if (document.body.style.MozTransition !== undefined) {
		transitionEvent = 'transitionend';
	}

	// Get the active tooltip for a layer or create a new one if no tooltip exists.
	// Hide any tooltips on layers underneath this one.
	function getTooltip(feature) {
		var tooltip = document.createElement('div');
		tooltip.className = 'map-tooltip map-tooltip-0 wax-tooltip';
		tooltip.innerHTML = feature;
		return tooltip;
	}

	function remove() {
		if (this.parentNode) this.parentNode.removeChild(this);
	}

	// Hide a given tooltip.
	function hide() {
		var _ct;
		while (_ct = tooltips.pop()) {
			if (animate && transitionEvent) {
				// This code assumes that transform-supporting browsers
				// also support proper events. IE9 does both.
				bean.add(_ct, transitionEvent, remove);
				_ct.className += ' map-fade';
			} else {
				if (_ct.parentNode) _ct.parentNode.removeChild(_ct);
			}
		}
	}

	function on(o) {
		var content;
		if (o.e.type === 'mousemove' || !o.e.type) {
			if (!popped) {
				content = o.content || o.formatter({ format: 'teaser' }, o.data);
				if (!content || content == _currentContent) return;
				hide();
				parent.style.cursor = 'pointer';
				tooltips.push(parent.appendChild(getTooltip(content)));
				_currentContent = content;
			}
		} else {
			content = o.content || o.formatter({ format: 'full' }, o.data);
			if (!content) {
				if (o.e.type && o.e.type.match(/touch/)) {
					// fallback possible
					content = o.content || o.formatter({ format: 'teaser' }, o.data);
				}
				// but if that fails, return just the same.
				if (!content) return;
			}
			hide();
			parent.style.cursor = 'pointer';
			var tt = parent.appendChild(getTooltip(content));
			tt.className += ' map-popup wax-popup';

			var close = tt.appendChild(document.createElement('a'));
			close.href = '#close';
			close.className = 'close';
			close.innerHTML = 'Close';
			popped = true;

			tooltips.push(tt);

			bean.add(close, 'touchstart mousedown', function(e) {
				e.stop();
			});

			bean.add(close, 'click touchend', function closeClick(e) {
				e.stop();
				hide();
				popped = false;
			});
		}
	}

	function off() {
		parent.style.cursor = 'default';
		_currentContent = null;
		if (!popped) hide();
	}

	t.parent = function(x) {
		if (!arguments.length) return parent;
		parent = x;
		return t;
	};

	t.animate = function(x) {
		if (!arguments.length) return animate;
		animate = x;
		return t;
	};

	t.events = function() {
		return {
			on: on,
			off: off
		};
	};

	return t;
};
var wax = wax || {};

// Utils are extracted from other libraries or
// written from scratch to plug holes in browser compatibility.
wax.u = {
	// From Bonzo
	offset: function(el) {
		// TODO: window margins
		//
		// Okay, so fall back to styles if offsetWidth and height are botched
		// by Firefox.
		var width = el.offsetWidth || parseInt(el.style.width, 10),
			height = el.offsetHeight || parseInt(el.style.height, 10),
			doc_body = document.body,
			top = 0,
			left = 0;

		var calculateOffset = function(el) {
			if (el === doc_body || el === document.documentElement) return;
			top += el.offsetTop;
			left += el.offsetLeft;

			var style = el.style.transform ||
				el.style.WebkitTransform ||
				el.style.OTransform ||
				el.style.MozTransform ||
				el.style.msTransform;

			if (style) {
				var match;
				if (match = style.match(/translate\((.+)[px]?, (.+)[px]?\)/)) {
					top += parseInt(match[2], 10);
					left += parseInt(match[1], 10);
				} else if (match = style.match(/translate3d\((.+)[px]?, (.+)[px]?, (.+)[px]?\)/)) {
					top += parseInt(match[2], 10);
					left += parseInt(match[1], 10);
				} else if (match = style.match(/matrix3d\(([\-\d,\s]+)\)/)) {
					var pts = match[1].split(',');
					top += parseInt(pts[13], 10);
					left += parseInt(pts[12], 10);
				} else if (match = style.match(/matrix\(.+, .+, .+, .+, (.+), (.+)\)/)) {
					top += parseInt(match[2], 10);
					left += parseInt(match[1], 10);
				}
			}
		};

		// from jquery, offset.js
		if ( typeof el.getBoundingClientRect !== "undefined" ) {
			var body = document.body;
			var doc = el.ownerDocument.documentElement;
			var clientTop  = document.clientTop  || body.clientTop  || 0;
			var clientLeft = document.clientLeft || body.clientLeft || 0;
			var scrollTop  = window.pageYOffset || doc.scrollTop;
			var scrollLeft = window.pageXOffset || doc.scrollLeft;

			var box = el.getBoundingClientRect();
			top = box.top + scrollTop  - clientTop;
			left = box.left + scrollLeft - clientLeft;

		} else {
			calculateOffset(el);
			try {
				while (el = el.offsetParent) { calculateOffset(el); }
			} catch(e) {
				// Hello, internet explorer.
			}
		}

		// Offsets from the body
		top += doc_body.offsetTop;
		left += doc_body.offsetLeft;
		// Offsets from the HTML element
		top += doc_body.parentNode.offsetTop;
		left += doc_body.parentNode.offsetLeft;

		// Firefox and other weirdos. Similar technique to jQuery's
		// `doesNotIncludeMarginInBodyOffset`.
		var htmlComputed = document.defaultView ?
			window.getComputedStyle(doc_body.parentNode, null) :
			doc_body.parentNode.currentStyle;
		if (doc_body.parentNode.offsetTop !==
			parseInt(htmlComputed.marginTop, 10) &&
			!isNaN(parseInt(htmlComputed.marginTop, 10))) {
			top += parseInt(htmlComputed.marginTop, 10);
			left += parseInt(htmlComputed.marginLeft, 10);
		}

		return {
			top: top,
			left: left,
			height: height,
			width: width
		};
	},

	'$': function(x) {
		return (typeof x === 'string') ?
			document.getElementById(x) :
			x;
	},

	// From quirksmode: normalize the offset of an event from the top-left
	// of the page.
	eventoffset: function(e) {
		var posx = 0;
		var posy = 0;
		if (!e) { e = window.event; }
		if (e.pageX || e.pageY) {
			// Good browsers
			return {
				x: e.pageX,
				y: e.pageY
			};
		} else if (e.clientX || e.clientY) {
			// Internet Explorer
			return {
				x: e.clientX,
				y: e.clientY
			};
		} else if (e.touches && e.touches.length === 1) {
			// Touch browsers
			return {
				x: e.touches[0].pageX,
				y: e.touches[0].pageY
			};
		}
	},

	// Ripped from underscore.js
	// Internal function used to implement `_.throttle` and `_.debounce`.
	limit: function(func, wait, debounce) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var throttler = function() {
				timeout = null;
				func.apply(context, args);
			};
			if (debounce) clearTimeout(timeout);
			if (debounce || !timeout) timeout = setTimeout(throttler, wait);
		};
	},

	// Returns a function, that, when invoked, will only be triggered at most once
	// during a given window of time.
	throttle: function(func, wait) {
		return this.limit(func, wait, false);
	},

	sanitize: function(content) {
		if (!content) return '';

		function urlX(url) {
			// Data URIs are subject to a bug in Firefox
			// https://bugzilla.mozilla.org/show_bug.cgi?id=255107
			// which let them be a vector. But WebKit does 'the right thing'
			// or at least 'something' about this situation, so we'll tolerate
			// them.
			if (/^(https?:\/\/|data:image)/.test(url)) {
				return url;
			}
		}

		function idX(id) { return id; }

		return html_sanitize(content, urlX, idX);
	}
};
wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.attribution = function() {
	var map,
		a = {},
		container = document.createElement('div');

	container.className = 'map-attribution map-mm';

	a.content = function(x) {
		if (typeof x === 'undefined') return container.innerHTML;
		container.innerHTML = wax.u.sanitize(x);
		return a;
	};

	a.element = function() {
		return container;
	};

	a.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return a;
	};

	a.add = function() {
		if (!map) return false;
		map.parent.appendChild(container);
		return a;
	};

	a.remove = function() {
		if (!map) return false;
		if (container.parentNode) container.parentNode.removeChild(container);
		return a;
	};

	a.appendTo = function(elem) {
		wax.u.$(elem).appendChild(container);
		return a;
	};

	return a;
};
wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.boxselector = function() {
	var corner,
		nearCorner,
		boxDiv,
		style,
		borderWidth = 0,
		horizontal = false,  // Whether the resize is horizontal
		vertical = false,
		edge = 5,  // Distance from border sensitive to resizing
		addEvent = MM.addEvent,
		removeEvent = MM.removeEvent,
		box,
		boxselector = {},
		map,
		callbackManager = new MM.CallbackManager(boxselector, ['change']);

	function getMousePoint(e) {
		// start with just the mouse (x, y)
		var point = new MM.Point(e.clientX, e.clientY);
		// correct for scrolled document
		point.x += document.body.scrollLeft +
			document.documentElement.scrollLeft;
		point.y += document.body.scrollTop +
			document.documentElement.scrollTop;

		// correct for nested offsets in DOM
		for (var node = map.parent; node; node = node.offsetParent) {
			point.x -= node.offsetLeft;
			point.y -= node.offsetTop;
		}
		return point;
	}

	function mouseDown(e) {
		if (!e.shiftKey) return;

		corner = nearCorner = getMousePoint(e);
		horizontal = vertical = true;

		style.left = corner.x + 'px';
		style.top = corner.y + 'px';
		style.width = style.height = 0;

		addEvent(document, 'mousemove', mouseMove);
		addEvent(document, 'mouseup', mouseUp);

		map.parent.style.cursor = 'crosshair';
		return MM.cancelEvent(e);
	}

	// Resize existing box
	function mouseDownResize(e) {
		var point = getMousePoint(e),
			TL = {
				x: parseInt(boxDiv.offsetLeft, 10),
				y: parseInt(boxDiv.offsetTop, 10)
			},
			BR = {
				x: TL.x + parseInt(boxDiv.offsetWidth, 10),
				y: TL.y + parseInt(boxDiv.offsetHeight, 10)
			};

		// Determine whether resize is horizontal, vertical or both
		horizontal = point.x - TL.x <= edge || BR.x - point.x <= edge;
		vertical = point.y - TL.y <= edge || BR.y - point.y <= edge;

		if (vertical || horizontal) {
			corner = {
				x: (point.x - TL.x < BR.x - point.x) ? BR.x : TL.x,
				y: (point.y - TL.y < BR.y - point.y) ? BR.y : TL.y
			};
			nearCorner = {
				x: (point.x - TL.x < BR.x - point.x) ? TL.x : BR.x,
				y: (point.y - TL.y < BR.y - point.y) ? TL.y : BR.y
			};
			addEvent(document, 'mousemove', mouseMove);
			addEvent(document, 'mouseup', mouseUp);
			return MM.cancelEvent(e);
		}
	}

	function mouseMove(e) {
		var point = getMousePoint(e);
		style.display = 'block';
		if (horizontal) {
			style.left = (point.x < corner.x ? point.x : corner.x) + 'px';
			style.width = Math.abs(point.x - corner.x) - 2 * borderWidth + 'px';
		}
		if (vertical) {
			style.top = (point.y < corner.y ? point.y : corner.y) + 'px';
			style.height = Math.abs(point.y - corner.y) - 2 * borderWidth + 'px';
		}
		changeCursor(point, map.parent);
		return MM.cancelEvent(e);
	}

	function mouseUp(e) {
		var point = getMousePoint(e),
			l1 = map.pointLocation( new MM.Point(
				horizontal ? point.x : nearCorner.x,
				vertical? point.y : nearCorner.y
			));
		l2 = map.pointLocation(corner);

		// Format coordinates like mm.map.getExtent().
		boxselector.extent([
			new MM.Location(
				Math.max(l1.lat, l2.lat),
				Math.min(l1.lon, l2.lon)),
			new MM.Location(
				Math.min(l1.lat, l2.lat),
				Math.max(l1.lon, l2.lon))
		]);

		removeEvent(document, 'mousemove', mouseMove);
		removeEvent(document, 'mouseup', mouseUp);

		map.parent.style.cursor = 'auto';
	}

	function mouseMoveCursor(e) {
		changeCursor(getMousePoint(e), boxDiv);
	}

	// Set resize cursor if mouse is on edge
	function changeCursor(point, elem) {
		var TL = {
				x: parseInt(boxDiv.offsetLeft, 10),
				y: parseInt(boxDiv.offsetTop, 10)
			},
			BR = {
				x: TL.x + parseInt(boxDiv.offsetWidth, 10),
				y: TL.y + parseInt(boxDiv.offsetHeight, 10)
			};
		// Build cursor style string
		var prefix = '';
		if (point.y - TL.y <= edge) prefix = 'n';
		else if (BR.y - point.y <= edge) prefix = 's';
		if (point.x - TL.x <= edge) prefix += 'w';
		else if (BR.x - point.x <= edge) prefix += 'e';
		if (prefix !== '') prefix += '-resize';
		elem.style.cursor = prefix;
	}

	function drawbox(map, e) {
		if (!boxDiv || !box) return;
		var br = map.locationPoint(box[1]),
			tl = map.locationPoint(box[0]),
			style = boxDiv.style;

		style.display = 'block';
		style.height = 'auto';
		style.width = 'auto';
		style.left = Math.max(0, tl.x) + 'px';
		style.top = Math.max(0, tl.y) + 'px';
		style.right = Math.max(0, map.dimensions.x - br.x) + 'px';
		style.bottom = Math.max(0, map.dimensions.y - br.y) + 'px';
	}

	boxselector.addCallback = function(event, callback) {
		callbackManager.addCallback(event, callback);
		return boxselector;
	};

	boxselector.removeCallback = function(event, callback) {
		callbackManager.removeCallback(event, callback);
		return boxselector;
	};

	boxselector.extent = function(x, silent) {
		if (!x) return box;

		box = [
			new MM.Location(
				Math.max(x[0].lat, x[1].lat),
				Math.min(x[0].lon, x[1].lon)),
			new MM.Location(
				Math.min(x[0].lat, x[1].lat),
				Math.max(x[0].lon, x[1].lon))
		];

		drawbox(map);

		if (!silent) callbackManager.dispatchCallback('change', box);
	};
	boxDiv = document.createElement('div');
	boxDiv.className = 'boxselector-box';
	style = boxDiv.style;

	boxselector.add = function() {
		boxDiv.id = map.parent.id + '-boxselector-box';
		map.parent.appendChild(boxDiv);
		borderWidth = parseInt(window.getComputedStyle(boxDiv).borderWidth, 10);

		addEvent(map.parent, 'mousedown', mouseDown);
		addEvent(boxDiv, 'mousedown', mouseDownResize);
		addEvent(map.parent, 'mousemove', mouseMoveCursor);
		map.addCallback('drawn', drawbox);
		return boxselector;
	};

	boxselector.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return boxselector;
	};

	boxselector.remove = function() {
		map.parent.removeChild(boxDiv);

		removeEvent(map.parent, 'mousedown', mouseDown);
		removeEvent(boxDiv, 'mousedown', mouseDownResize);
		removeEvent(map.parent, 'mousemove', mouseMoveCursor);

		map.removeCallback('drawn', drawbox);
		return boxselector;
	};

	return boxselector;
};
wax = wax || {};
wax.mm = wax.mm || {};
wax._ = {};

wax.mm.bwdetect = function(map, options) {
	options = options || {};
	var lowpng = options.png || '.png128',
		lowjpg = options.jpg || '.jpg70',
		bw = false;

	wax._.bw_png = lowpng;
	wax._.bw_jpg = lowjpg;

	return wax.bwdetect(options, function(x) {
		wax._.bw = !x;
		for (var i = 0; i < map.layers.length; i++) {
			if (map.getLayerAt(i).provider instanceof wax.mm.connector) {
				map.getLayerAt(i).setProvider(map.getLayerAt(i).provider);
			}
		}
	});
};
wax = wax || {};
wax.mm = wax.mm || {};

// Add zoom links, which can be styled as buttons, to a `modestmaps.Map`
// control. This function can be used chaining-style with other
// chaining-style controls.
wax.mm.fullscreen = function() {
	// true: fullscreen
	// false: minimized
	var fullscreened = false,
		fullscreen = {},
		a = document.createElement('a'),
		map,
		body = document.body,
		dimensions;

	a.className = 'map-fullscreen';
	a.href = '#fullscreen';
	// a.innerHTML = 'fullscreen';

	function click(e) {
		if (e) e.stop();
		if (fullscreened) {
			fullscreen.original();
		} else {
			fullscreen.full();
		}
	}

	fullscreen.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return fullscreen;
	};

	// Modest Maps demands an absolute height & width, and doesn't auto-correct
	// for changes, so here we save the original size of the element and
	// restore to that size on exit from fullscreen.
	fullscreen.add = function() {
		bean.add(a, 'click', click);
		map.parent.appendChild(a);
		return fullscreen;
	};

	fullscreen.remove = function() {
		bean.remove(a, 'click', click);
		if (a.parentNode) a.parentNode.removeChild(a);
		return fullscreen;
	};

	fullscreen.full = function() {
		if (fullscreened) { return; } else { fullscreened = true; }
		dimensions = map.dimensions;
		map.parent.className += ' map-fullscreen-map';
		body.className += ' map-fullscreen-view';
		map.dimensions = { x: map.parent.offsetWidth, y: map.parent.offsetHeight };
		map.draw();
		return fullscreen;
	};

	fullscreen.original = function() {
		if (!fullscreened) { return; } else { fullscreened = false; }
		map.parent.className = map.parent.className.replace(' map-fullscreen-map', '');
		body.className = body.className.replace(' map-fullscreen-view', '');
		map.dimensions = dimensions;
		map.draw();
		return fullscreen;
	};

	fullscreen.fullscreen = function(x) {
		if (!arguments.length) {
			return fullscreened;
		} else {
			if (x && !fullscreened) {
				fullscreen.full();
			} else if (!x && fullscreened) {
				fullscreen.original();
			}
			return fullscreen;
		}
	};

	fullscreen.element = function() {
		return a;
	};

	fullscreen.appendTo = function(elem) {
		wax.u.$(elem).appendChild(a);
		return fullscreen;
	};

	return fullscreen;
};
wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.hash = function() {
	var map;
	var hash = wax.hash({
		getCenterZoom: function() {
			var center = map.getCenter(),
				zoom = map.getZoom(),
				precision = Math.max(
					0,
					Math.ceil(Math.log(zoom) / Math.LN2));

			return [zoom.toFixed(2),
				center.lat.toFixed(precision),
				center.lon.toFixed(precision)
			].join('/');
		},
		setCenterZoom: function setCenterZoom(args) {
			map.setCenterZoom(
				new MM.Location(args[1], args[2]),
				args[0]);
		},
		bindChange: function(fn) {
			map.addCallback('drawn', fn);
		},
		unbindChange: function(fn) {
			map.removeCallback('drawn', fn);
		}
	});

	hash.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return hash;
	};

	return hash;
};
wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.interaction = function() {
	var dirty = false,
		_grid,
		map,
		clearingEvents = ['zoomed', 'panned', 'centered',
			'extentset', 'resized', 'drawn'];

	function grid() {
		if (!dirty && _grid !== undefined && _grid.length) {
			return _grid;
		} else {
			var tiles;
			for (var i = 0; i < map.getLayers().length; i++) {
				var levels = map.getLayerAt(i).levels;
				var zoomLayer = levels && levels[Math.round(map.zoom())];
				if (zoomLayer !== undefined) {
					tiles = map.getLayerAt(i).tileElementsInLevel(zoomLayer);
					if (tiles.length) break;
				}
			}
			_grid = (function(t) {
				var o = [];
				for (var key in t) {
					if (t[key].parentNode === zoomLayer) {
						var offset = wax.u.offset(t[key]);
						o.push([
							offset.top,
							offset.left,
							t[key]
						]);
					}
				}
				return o;
			})(tiles);
			return _grid;
		}
	}

	function setdirty() { dirty = true; }

	function attach(x) {
		if (!arguments.length) return map;
		map = x;
		for (var i = 0; i < clearingEvents.length; i++) {
			map.addCallback(clearingEvents[i], setdirty);
		}
	}

	function detach(x) {
		for (var i = 0; i < clearingEvents.length; i++) {
			map.removeCallback(clearingEvents[i], setdirty);
		}
	}

	return wax.interaction()
		.attach(attach)
		.detach(detach)
		.parent(function() {
			return map.parent;
		})
		.grid(grid);
};
wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.legend = function() {
	var map,
		l = {};

	var container = document.createElement('div');
	container.className = 'wax-legends map-legends';

	var element = container.appendChild(document.createElement('div'));
	element.className = 'wax-legend map-legend';
	element.style.display = 'none';

	l.content = function(x) {
		if (!arguments.length) return element.innerHTML;

		element.innerHTML = wax.u.sanitize(x);
		element.style.display = 'block';
		if (element.innerHTML === '') {
			element.style.display = 'none';
		}
		return l;
	};

	l.element = function() {
		return container;
	};

	l.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return l;
	};

	l.add = function() {
		if (!map) return false;
		l.appendTo(map.parent);
		return l;
	};

	l.remove = function() {
		if (container.parentNode) {
			container.parentNode.removeChild(container);
		}
		return l;
	};

	l.appendTo = function(elem) {
		wax.u.$(elem).appendChild(container);
		return l;
	};

	return l;
};
wax = wax || {};
wax.mm = wax.mm || {};

// This takes an object of options:
//
// * `callback`: a function called with an array of `com.modestmaps.Location`
//   objects when the map is edited
//
// It also exposes a public API function: `addLocation`, which adds a point
// to the map as if added by the user.
wax.mm.pointselector = function() {
	var map,
		mouseDownPoint = null,
		mouseUpPoint = null,
		callback = null,
		tolerance = 5,
		overlayDiv,
		pointselector = {},
		callbackManager = new MM.CallbackManager(pointselector, ['change']),
		locations = [];

	// Create a `MM.Point` from a screen event, like a click.
	function makePoint(e) {
		var coords = wax.u.eventoffset(e);
		var point = new MM.Point(coords.x, coords.y);
		// correct for scrolled document

		// and for the document
		var body = {
			x: parseFloat(MM.getStyle(document.documentElement, 'margin-left')),
			y: parseFloat(MM.getStyle(document.documentElement, 'margin-top'))
		};

		if (!isNaN(body.x)) point.x -= body.x;
		if (!isNaN(body.y)) point.y -= body.y;

		// TODO: use wax.util.offset
		// correct for nested offsets in DOM
		for (var node = map.parent; node; node = node.offsetParent) {
			point.x -= node.offsetLeft;
			point.y -= node.offsetTop;
		}
		return point;
	}

	// Currently locations in this control contain circular references to elements.
	// These can't be JSON encoded, so here's a utility to clean the data that's
	// spit back.
	function cleanLocations(locations) {
		var o = [];
		for (var i = 0; i < locations.length; i++) {
			o.push(new MM.Location(locations[i].lat, locations[i].lon));
		}
		return o;
	}

	// Attach this control to a map by registering callbacks
	// and adding the overlay

	// Redraw the points when the map is moved, so that they stay in the
	// correct geographic locations.
	function drawPoints() {
		var offset = new MM.Point(0, 0);
		for (var i = 0; i < locations.length; i++) {
			var point = map.locationPoint(locations[i]);
			if (!locations[i].pointDiv) {
				locations[i].pointDiv = document.createElement('div');
				locations[i].pointDiv.className = 'map-point-div';
				locations[i].pointDiv.style.position = 'absolute';
				locations[i].pointDiv.style.display = 'block';
				// TODO: avoid circular reference
				locations[i].pointDiv.location = locations[i];
				// Create this closure once per point
				bean.add(locations[i].pointDiv, 'mouseup',
					(function selectPointWrap(e) {
						var l = locations[i];
						return function(e) {
							MM.removeEvent(map.parent, 'mouseup', mouseUp);
							pointselector.deleteLocation(l, e);
						};
					})());
				map.parent.appendChild(locations[i].pointDiv);
			}
			locations[i].pointDiv.style.left = point.x + 'px';
			locations[i].pointDiv.style.top = point.y + 'px';
		}
	}

	function mouseDown(e) {
		mouseDownPoint = makePoint(e);
		bean.add(map.parent, 'mouseup', mouseUp);
	}

	// Remove the awful circular reference from locations.
	// TODO: This function should be made unnecessary by not having it.
	function mouseUp(e) {
		if (!mouseDownPoint) return;
		mouseUpPoint = makePoint(e);
		if (MM.Point.distance(mouseDownPoint, mouseUpPoint) < tolerance) {
			pointselector.addLocation(map.pointLocation(mouseDownPoint));
			callbackManager.dispatchCallback('change', cleanLocations(locations));
		}
		mouseDownPoint = null;
	}

	// API for programmatically adding points to the map - this
	// calls the callback for ever point added, so it can be symmetrical.
	// Useful for initializing the map when it's a part of a form.
	pointselector.addLocation = function(location) {
		locations.push(location);
		drawPoints();
		callbackManager.dispatchCallback('change', cleanLocations(locations));
		return pointselector;
	};

	// TODO set locations
	pointselector.locations = function() {
		if (!arguments.length) return locations;
	};

	pointselector.addCallback = function(event, callback) {
		callbackManager.addCallback(event, callback);
		return pointselector;
	};

	pointselector.removeCallback = function(event, callback) {
		callbackManager.removeCallback(event, callback);
		return pointselector;
	};

	pointselector.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return pointselector;
	};

	pointselector.add = function() {
		bean.add(map.parent, 'mousedown', mouseDown);
		map.addCallback('drawn', drawPoints);
		return pointselector;
	};

	pointselector.remove = function() {
		bean.remove(map.parent, 'mousedown', mouseDown);
		map.removeCallback('drawn', drawPoints);
		for (var i = locations.length - 1; i > -1; i--) {
			pointselector.deleteLocation(locations[i]);
		}
		return pointselector;
	};

	pointselector.deleteLocation = function(location, e) {
		if (!e || confirm('Delete this point?')) {
			location.pointDiv.parentNode.removeChild(location.pointDiv);
			for (var i = 0; i < locations.length; i++) {
				if (locations[i] === location) {
					locations.splice(i, 1);
					break;
				}
			}
			callbackManager.dispatchCallback('change', cleanLocations(locations));
		}
	};

	return pointselector;
};
wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.zoombox = function() {
	// TODO: respond to resize
	var zoombox = {},
		map,
		drawing = false,
		box = document.createElement('div'),
		mouseDownPoint = null;

	function getMousePoint(e) {
		// start with just the mouse (x, y)
		var point = new MM.Point(e.clientX, e.clientY);
		// correct for scrolled document
		point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
		point.y += document.body.scrollTop + document.documentElement.scrollTop;

		// correct for nested offsets in DOM
		for (var node = map.parent; node; node = node.offsetParent) {
			point.x -= node.offsetLeft;
			point.y -= node.offsetTop;
		}
		return point;
	}

	function mouseUp(e) {
		if (!drawing) return;

		drawing = false;
		var point = getMousePoint(e);

		var l1 = map.pointLocation(point),
			l2 = map.pointLocation(mouseDownPoint);

		map.setExtent([l1, l2]);

		box.style.display = 'none';
		MM.removeEvent(map.parent, 'mousemove', mouseMove);
		MM.removeEvent(map.parent, 'mouseup', mouseUp);

		map.parent.style.cursor = 'auto';
	}

	function mouseDown(e) {
		if (!(e.shiftKey && !this.drawing)) return;

		drawing = true;
		mouseDownPoint = getMousePoint(e);

		box.style.left = mouseDownPoint.x + 'px';
		box.style.top = mouseDownPoint.y + 'px';

		MM.addEvent(map.parent, 'mousemove', mouseMove);
		MM.addEvent(map.parent, 'mouseup', mouseUp);

		map.parent.style.cursor = 'crosshair';
		return MM.cancelEvent(e);
	}

	function mouseMove(e) {
		if (!drawing) return;

		var point = getMousePoint(e);
		box.style.display = 'block';
		if (point.x < mouseDownPoint.x) {
			box.style.left = point.x + 'px';
		} else {
			box.style.left = mouseDownPoint.x + 'px';
		}
		box.style.width = Math.abs(point.x - mouseDownPoint.x) + 'px';
		if (point.y < mouseDownPoint.y) {
			box.style.top = point.y + 'px';
		} else {
			box.style.top = mouseDownPoint.y + 'px';
		}
		box.style.height = Math.abs(point.y - mouseDownPoint.y) + 'px';
		return MM.cancelEvent(e);
	}

	zoombox.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return zoombox;
	};

	zoombox.add = function() {
		if (!map) return false;
		// Use a flag to determine whether the zoombox is currently being
		// drawn. Necessary only for IE because `mousedown` is triggered
		// twice.
		box.id = map.parent.id + '-zoombox-box';
		box.className = 'zoombox-box';
		map.parent.appendChild(box);
		MM.addEvent(map.parent, 'mousedown', mouseDown);
		return this;
	};

	zoombox.remove = function() {
		if (!map) return false;
		if (box.parentNode) box.parentNode.removeChild(box);
		MM.removeEvent(map.parent, 'mousedown', mouseDown);
		return zoombox;
	};

	return zoombox;
};
wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.zoomer = function() {
	var zoomer = {},
		smooth = true,
		map;

	var zoomin = document.createElement('a'),
		zoomout = document.createElement('a');

	function stopEvents(e) {
		e.stop();
	}

	function zIn(e) {
		e.stop();
		if (smooth && map.ease) {
			map.ease.zoom(map.zoom() + 1).run(50);
		} else {
			map.zoomIn();
		}
	}

	function zOut(e) {
		e.stop();
		if (smooth && map.ease) {
			map.ease.zoom(map.zoom() - 1).run(50);
		} else {
			map.zoomOut();
		}
	}

	zoomin.innerHTML = '+';
	zoomin.href = '#';
	zoomin.className = 'zoomer zoomin';
	zoomout.innerHTML = '-';
	zoomout.href = '#';
	zoomout.className = 'zoomer zoomout';

	function updateButtons(map, e) {
		if (map.coordinate.zoom === map.coordLimits[0].zoom) {
			zoomout.className = 'zoomer zoomout zoomdisabled';
		} else if (map.coordinate.zoom === map.coordLimits[1].zoom) {
			zoomin.className = 'zoomer zoomin zoomdisabled';
		} else {
			zoomin.className = 'zoomer zoomin';
			zoomout.className = 'zoomer zoomout';
		}
	}

	zoomer.map = function(x) {
		if (!arguments.length) return map;
		map = x;
		return zoomer;
	};

	zoomer.add = function() {
		if (!map) return false;
		map.addCallback('drawn', updateButtons);
		zoomer.appendTo(map.parent);
		bean.add(zoomin, 'mousedown dblclick', stopEvents);
		bean.add(zoomout, 'mousedown dblclick', stopEvents);
		bean.add(zoomout, 'touchstart click', zOut);
		bean.add(zoomin, 'touchstart click', zIn);
		return zoomer;
	};

	zoomer.remove = function() {
		if (!map) return false;
		map.removeCallback('drawn', updateButtons);
		if (zoomin.parentNode) zoomin.parentNode.removeChild(zoomin);
		if (zoomout.parentNode) zoomout.parentNode.removeChild(zoomout);
		bean.remove(zoomin, 'mousedown dblclick', stopEvents);
		bean.remove(zoomout, 'mousedown dblclick', stopEvents);
		bean.remove(zoomout, 'touchstart click', zOut);
		bean.remove(zoomin, 'touchstart click', zIn);
		return zoomer;
	};

	zoomer.appendTo = function(elem) {
		wax.u.$(elem).appendChild(zoomin);
		wax.u.$(elem).appendChild(zoomout);
		return zoomer;
	};

	zoomer.smooth = function(x) {
		if (!arguments.length) return smooth;
		smooth = x;
		return zoomer;
	};

	return zoomer;
};
var wax = wax || {};
wax.mm = wax.mm || {};

// A layer connector for Modest Maps conformant to TileJSON
// https://github.com/mapbox/tilejson
wax.mm._provider = function(options) {
	this.options = {
		tiles: options.tiles,
		scheme: options.scheme || 'xyz',
		minzoom: options.minzoom || 0,
		maxzoom: options.maxzoom || 22,
		bounds: options.bounds || [-180, -90, 180, 90]
	};
};

wax.mm._provider.prototype = {
	outerLimits: function() {
		return [
			this.locationCoordinate(
				new MM.Location(
					this.options.bounds[0],
					this.options.bounds[1])).zoomTo(this.options.minzoom),
			this.locationCoordinate(
				new MM.Location(
					this.options.bounds[2],
					this.options.bounds[3])).zoomTo(this.options.maxzoom)
		];
	},
	getTile: function(c) {
		var coord;
		if (!(coord = this.sourceCoordinate(c))) return null;
		if (coord.zoom < this.options.minzoom || coord.zoom > this.options.maxzoom) return null;

		coord.row = (this.options.scheme === 'tms') ?
			Math.pow(2, coord.zoom) - coord.row - 1 :
			coord.row;

		var u = this.options.tiles[parseInt(Math.pow(2, coord.zoom) * coord.row + coord.column, 10) %
			this.options.tiles.length]
			.replace('{z}', coord.zoom.toFixed(0))
			.replace('{x}', coord.column.toFixed(0))
			.replace('{y}', coord.row.toFixed(0));

		if (wax._ && wax._.bw) {
			u = u.replace('.png', wax._.bw_png)
				.replace('.jpg', wax._.bw_jpg);
		}

		return u;
	}
};

if (MM) {
	MM.extend(wax.mm._provider, MM.MapProvider);
}

wax.mm.connector = function(options) {
	var x = new wax.mm._provider(options);
	return new MM.Layer(x);
};
;(function(context, MM) {
	var easey = function() {
		var easey = {},
			running = false,
			abort = false, // killswitch for transitions
			abortCallback; // callback called when aborted

		var easings = {
			easeIn: function(t) { return t * t; },
			easeOut: function(t) { return Math.sin(t * Math.PI / 2); },
			easeInOut: function(t) { return (1 - Math.cos(Math.PI * t)) / 2; },
			linear: function(t) { return t; }
		};
		var easing = easings.easeOut;

		// to is the singular coordinate that any transition is based off
		// three dimensions:
		//
		// * to
		// * time
		// * path
		var from, to, map;

		easey.stop = function(callback) {
			abort = true;
			from = undefined;
			abortCallback = callback;
		};

		easey.running = function() {
			return running;
		};

		easey.point = function(x) {
			to = map.pointCoordinate(x);
			return easey;
		};

		easey.zoom = function(x) {
			if (!to) to = map.coordinate.copy();
			to = map.enforceZoomLimits(to.zoomTo(x));
			return easey;
		};

		easey.location = function(x) {
			to = map.locationCoordinate(x);
			return easey;
		};

		easey.from = function(x) {
			if (!arguments.length) return from ? from.copy() : from;
			from = x.copy();
			return easey;
		};

		easey.to = function(x) {
			if (!arguments.length) return to.copy();
			to = map.enforceZoomLimits(x.copy());
			return easey;
		};

		easey.path = function(x) {
			path = paths[x];
			return easey;
		};

		easey.easing = function(x) {
			easing = easings[x];
			return easey;
		};

		easey.map = function(x) {
			if (!arguments.length) return map;
			map = x;
			return easey;
		};

		function interp(a, b, p) {
			if (p === 0) return a;
			if (p === 1) return b;
			return a + ((b - a) * p);
		}

		var paths = {},
			static_coord = new MM.Coordinate(0, 0, 0);

		// The screen path simply moves between
		// coordinates in a non-geographical way
		paths.screen = function(a, b, t, static_coord) {
			var zoom_lerp = interp(a.zoom, b.zoom, t);
			if (static_coord) {
				static_coord.row = interp(
					a.row,
					b.row * Math.pow(2, a.zoom - b.zoom),
					t) * Math.pow(2, zoom_lerp - a.zoom);
				static_coord.column = interp(
					a.column,
					b.column * Math.pow(2, a.zoom - b.zoom),
					t) * Math.pow(2, zoom_lerp - a.zoom);
				static_coord.zoom = zoom_lerp;
			} else {
				return new MM.Coordinate(
					interp(a.row,
						b.row * Math.pow(2, a.zoom - b.zoom),
						t) * Math.pow(2, zoom_lerp - a.zoom),
					interp(a.column,
						b.column * Math.pow(2, a.zoom - b.zoom),
						t) * Math.pow(2, zoom_lerp - a.zoom),
					zoom_lerp);
			}
		};

		// The screen path means that the b
		// coordinate should maintain its point on screen
		// throughout the transition, but the map
		// should move to its zoom level
		paths.about = function(a, b, t, static_coord) {
			var zoom_lerp = interp(a.zoom, b.zoom, t);

			// center x, center y
			var cx = map.dimensions.x / 2,
				cy = map.dimensions.y / 2,
			// tilesize
				tx = map.tileSize.x,
				ty = map.tileSize.y;

			var startx = cx + tx * ((b.column * Math.pow(2, a.zoom - b.zoom)) - a.column);
			var starty = cy + ty * ((b.row  * Math.pow(2, a.zoom - b.zoom)) - a.row);

			var endx = cx + tx * ((b.column * Math.pow(2, zoom_lerp - b.zoom)) -
				(a.column * Math.pow(2, zoom_lerp - a.zoom)));
			var endy = cy + ty * ((b.row * Math.pow(2, zoom_lerp - b.zoom)) - (a.row *
				Math.pow(2, zoom_lerp - a.zoom)));

			if (static_coord) {
				static_coord.column = (a.column * Math.pow(2, zoom_lerp - a.zoom)) - ((startx - endx) / tx);
				static_coord.row = (a.row * Math.pow(2, zoom_lerp - a.zoom)) - ((starty - endy) / ty);
				static_coord.zoom = zoom_lerp;
			} else {
				return new MM.Coordinate(
					(a.column * Math.pow(2, zoom_lerp - a.zoom)) - ((startx - endx) / tx),
					(a.row * Math.pow(2, zoom_lerp - a.zoom)) - ((starty - endy) / ty),
					zoom_lerp);
			}
		};

		var path = paths.screen;

		easey.t = function(t) {
			path(from, to, easing(t), static_coord);
			map.coordinate = static_coord;
			map.draw();
			return easey;
		};

		easey.future = function(parts) {
			var futures = [];
			for (var t = 0; t < parts; t++) {
				futures.push(path(from, to, t / (parts - 1)));
			}
			return futures;
		};

		var start;
		easey.resetRun = function () {
			start = (+ new Date());
			return easey;
		};

		easey.run = function(time, callback) {

			if (running) return easey.stop(function() {
				easey.run(time, callback);
			});

			if (!from) from = map.coordinate.copy();
			if (!to) to = map.coordinate.copy();
			time = time || 1000;
			start = (+new Date());
			running = true;

			function tick() {
				var delta = (+new Date()) - start;
				if (abort) {
					abort = running = false;
					abortCallback();
					return (abortCallback = undefined);
				} else if (delta > time) {
					if (to.zoom != from.zoom) map.dispatchCallback('zoomed', to.zoom - from.zoom);
					running = false;
					path(from, to, 1, static_coord);
					map.coordinate = static_coord;
					to = from = undefined;
					map.draw();
					if (callback) return callback(map);
				} else {
					path(from, to, easing(delta / time), static_coord);
					map.coordinate = static_coord;
					map.draw();
					MM.getFrame(tick);
				}
			}

			MM.getFrame(tick);
		};

		// Optimally smooth (constant perceived velocity) and
		// efficient (minimal path distance) zooming and panning.
		//
		// Based on "Smooth and efficient zooming and panning"
		// by Jarke J. van Wijk and Wim A.A. Nuij
		//
		// Model described in section 3, equations 1 through 5
		// Derived equation (9) of optimal path implemented below
		easey.optimal = function(V, rho, callback) {

			if (running) return easey.stop(function() {
				easey.optimal(V, rho, callback);
			});

			// Section 6 describes user testing of these tunable values
			V = V || 0.9;
			rho = rho || 1.42;

			function sqr(n) { return n*n; }
			function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
			function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
			function tanh(n) { return sinh(n) / cosh(n); }

			if (from) map.coordinate = from; // For when `from` not current coordinate
			else from = map.coordinate.copy();

			// Width is measured in coordinate units at zoom 0
			var TL = map.pointCoordinate(new MM.Point(0, 0)).zoomTo(0),
				BR = map.pointCoordinate(map.dimensions).zoomTo(0),
				w0 = Math.max(BR.column - TL.column, BR.row - TL.row),
				w1 = w0 * Math.pow(2, from.zoom - to.zoom),
				start = from.zoomTo(0),
				end = to.zoomTo(0),
				c0 = {x: start.column, y: start.row},
				c1 = {x: end.column, y: end.row},
				u0 = 0,
				u1 = Math.sqrt(sqr(c1.x - c0.x) + sqr(c1.y - c0.y));

			function b(i) {
				var n = sqr(w1) - sqr(w0) + (i ? -1: 1) * Math.pow(rho, 4) * sqr(u1 - u0),
					d = 2 * (i ? w1 : w0) * sqr(rho) * (u1 - u0);
				return n/d;
			}

			function r(i) {
				return Math.log(-b(i) + Math.sqrt(sqr(b(i)) + 1));
			}

			var r0 = r(0),
				r1 = r(1),
				S = (r1 - r0) / rho;

			// Width
			var w = function(s) {
				return w0 * cosh(r0) / cosh (rho * s + r0);
			};

			// Zoom
			var u = function(s) {
				return (w0 / sqr(rho)) * cosh(r0) * tanh(rho * s + r0) - (w0 / sqr(rho)) * sinh(r0) + u0;
			};

			// Special case, when no panning necessary
			if (Math.abs(u1) < 0.000001) {
				if (Math.abs(w0 - w1) < 0.000001) return;

				// Based on section 4
				var k = w1 < w0 ? -1 : 1;
				S = Math.abs(Math.log(w1/w0)) / rho;
				u = function(s) {
					return u0;
				};
				w = function(s) {
					return w0 * Math.exp(k * rho * s);
				};
			}

			var oldpath = path;
			path = function (a, b, t, static_coord) {
				if (t == 1) {
					if (static_coord) {
						static_coord.row = to.row;
						static_coord.column = to.column;
						static_coord.zoom = to.zoom;
					}
					return to;
				}
				var s = t * S,
					us = u(s),
					z = a.zoom + (Math.log(w0/w(s)) / Math.LN2),
					x = interp(c0.x, c1.x, us/u1 || 1),
					y = interp(c0.y, c1.y, us/u1 || 1);

				var power = Math.pow(2, z);
				if (static_coord) {
					static_coord.row = y * power;
					static_coord.column = x * power;
					static_coord.zoom = z;
				} else {
					return new MM.Coordinate(y * power, x * power, z);
				}
			};

			easey.run(S / V * 1000, function(m) {
				path = oldpath;
				if (callback) callback(m);
			});
		};

		return easey;
	};

	this.easey = easey;
	if (typeof this.mapbox == 'undefined') this.mapbox = {};
	this.mapbox.ease = easey;
})(this, MM);
;(function(context, MM) {

	var easey_handlers = {};

	easey_handlers.TouchHandler = function() {
		var handler = {},
			map,
			panner,
			maxTapTime = 250,
			maxTapDistance = 30,
			maxDoubleTapDelay = 350,
			locations = {},
			taps = [],
			wasPinching = false,
			lastPinchCenter = null,
			p0 = new MM.Point(0, 0),
			p1 = new MM.Point(0, 0);

		function focusMap(e) {
			map.parent.focus();
		}

		function clearLocations() {
			for (var loc in locations) {
				if (locations.hasOwnProperty(loc)) {
					delete locations[loc];
				}
			}
		}

		function updateTouches (e) {
			for (var i = 0; i < e.touches.length; i += 1) {
				var t = e.touches[i];
				if (t.identifier in locations) {
					var l = locations[t.identifier];
					l.x = t.clientX;
					l.y = t.clientY;
					l.scale = e.scale;
				} else {
					locations[t.identifier] = {
						scale: e.scale,
						startPos: { x: t.clientX, y: t.screenY },
						startZoom: map.zoom(),
						x: t.clientX,
						y: t.clientY,
						time: new Date().getTime()
					};
				}
			}
		}

		function touchStartMachine(e) {
			if (!panner) panner = panning(map, 0.10);
			MM.addEvent(e.touches[0].target, 'touchmove',
				touchMoveMachine);
			MM.addEvent(e.touches[0].target, 'touchend',
				touchEndMachine);
			if (e.touches[1]) {
				MM.addEvent(e.touches[1].target, 'touchmove',
					touchMoveMachine);
				MM.addEvent(e.touches[1].target, 'touchend',
					touchEndMachine);
			}
			updateTouches(e);
			panner.down(e.touches[0]);
			return MM.cancelEvent(e);
		}

		function touchMoveMachine(e) {
			switch (e.touches.length) {
				case 1:
					panner.move(e.touches[0]);
					break;
				case 2:
					onPinching(e);
					break;
			}
			updateTouches(e);
			return MM.cancelEvent(e);
		}

		// Handle a tap event - mainly watch for a doubleTap
		function onTap(tap) {
			if (taps.length &&
				(tap.time - taps[0].time) < maxDoubleTapDelay) {
				onDoubleTap(tap);
				taps = [];
				return;
			}
			taps = [tap];
		}

		// Handle a double tap by zooming in a single zoom level to a
		// round zoom.
		function onDoubleTap(tap) {
			// zoom in to a round number
			easey().map(map)
				.to(map.pointCoordinate(tap).zoomTo(map.getZoom() + 1))
				.path('about').run(200, function() {
					map.dispatchCallback('zoomed');
					clearLocations();
				});
		}

		function onPinching(e) {
			// use the first two touches and their previous positions
			var t0 = e.touches[0],
				t1 = e.touches[1];
			p0.x = t0.clientX;
			p0.y = t0.clientY;
			p1.x = t1.clientX;
			p1.y = t1.clientY;
			l0 = locations[t0.identifier],
				l1 = locations[t1.identifier];

			// mark these touches so they aren't used as taps/holds
			l0.wasPinch = true;
			l1.wasPinch = true;

			// scale about the center of these touches
			var center = MM.Point.interpolate(p0, p1, 0.5);

			map.zoomByAbout(
				Math.log(e.scale) / Math.LN2 - Math.log(l0.scale) / Math.LN2,
				center);

			// pan from the previous center of these touches
			prevX = l0.x + (l1.x - l0.x) * 0.5;
			prevY = l0.y + (l1.y - l0.y) * 0.5;
			map.panBy(center.x - prevX,
				center.y - prevY);
			wasPinching = true;
			lastPinchCenter = center;
		}

		// When a pinch event ends, round the zoom of the map.
		function onPinched(touch) {
			var z = map.getZoom(), // current zoom
				tz = locations[touch.identifier].startZoom > z ? Math.floor(z) : Math.ceil(z);
			easey().map(map).point(lastPinchCenter).zoom(tz)
				.path('about').run(300);
			clearLocations();
			wasPinching = false;
		}

		function touchEndMachine(e) {
			MM.removeEvent(e.target, 'touchmove',
				touchMoveMachine);
			MM.removeEvent(e.target, 'touchend',
				touchEndMachine);
			var now = new Date().getTime();

			// round zoom if we're done pinching
			if (e.touches.length === 0 && wasPinching) {
				onPinched(e.changedTouches[0]);
			}

			panner.up();

			// Look at each changed touch in turn.
			for (var i = 0; i < e.changedTouches.length; i += 1) {
				var t = e.changedTouches[i],
					loc = locations[t.identifier];
				// if we didn't see this one (bug?)
				// or if it was consumed by pinching already
				// just skip to the next one
				if (!loc || loc.wasPinch) {
					continue;
				}

				// we now know we have an event object and a
				// matching touch that's just ended. Let's see
				// what kind of event it is based on how long it
				// lasted and how far it moved.
				var pos = { x: t.clientX, y: t.clientY },
					time = now - loc.time,
					travel = MM.Point.distance(pos, loc.startPos);
				if (travel > maxTapDistance) {
					// we will to assume that the drag has been handled separately
				} else if (time > maxTapTime) {
					// close in space, but not in time: a hold
					pos.end = now;
					pos.duration = time;
				} else {
					// close in both time and space: a tap
					pos.time = now;
					onTap(pos);
				}
			}

			// Weird, sometimes an end event doesn't get thrown
			// for a touch that nevertheless has disappeared.
			// Still, this will eventually catch those ids:

			var validTouchIds = {};
			for (var j = 0; j < e.touches.length; j++) {
				validTouchIds[e.touches[j].identifier] = true;
			}
			for (var id in locations) {
				if (!(id in validTouchIds)) {
					delete validTouchIds[id];
				}
			}

			return MM.cancelEvent(e);
		}

		handler.init = function(x) {
			map = x;

			MM.addEvent(map.parent, 'touchstart',
				touchStartMachine);
		};

		handler.remove = function() {
			if (!panner) return;
			MM.removeEvent(map.parent, 'touchstart',
				touchStartMachine);
			panner.remove();
		};

		return handler;
	};

	easey_handlers.DoubleClickHandler = function() {
		var handler = {},
			map;

		function doubleClick(e) {
			// Ensure that this handler is attached once.
			// Get the point on the map that was double-clicked
			var point = MM.getMousePoint(e, map);
			z = map.getZoom() + (e.shiftKey ? -1 : 1);
			// use shift-double-click to zoom out
			easey().map(map)
				.to(map.pointCoordinate(MM.getMousePoint(e, map)).zoomTo(z))
				.path('about').run(100, function() {
					map.dispatchCallback('zoomed');
				});
			return MM.cancelEvent(e);
		}

		handler.init = function(x) {
			map = x;
			MM.addEvent(map.parent, 'dblclick', doubleClick);
			return handler;
		};

		handler.remove = function() {
			MM.removeEvent(map.parent, 'dblclick', doubleClick);
		};

		return handler;
	};

	easey_handlers.MouseWheelHandler = function() {
		var handler = {},
			map,
			_zoomDiv,
			ea = easey(),
			prevTime,
			precise = false;

		function mouseWheel(e) {
			var delta = 0;
			prevTime = prevTime || new Date().getTime();

			try {
				_zoomDiv.scrollTop = 1000;
				_zoomDiv.dispatchEvent(e);
				delta = 1000 - _zoomDiv.scrollTop;
			} catch (error) {
				delta = e.wheelDelta || (-e.detail * 5);
			}

			// limit mousewheeling to once every 200ms
			var timeSince = new Date().getTime() - prevTime;

			function dispatchZoomed() {
				map.dispatchCallback('zoomed');
			}

			if (!ea.running()) {
				var point = MM.getMousePoint(e, map),
					z = map.getZoom();
				ea.map(map)
					.easing('easeOut')
					.to(map.pointCoordinate(MM.getMousePoint(e, map)).zoomTo(z + (delta > 0 ? 1 : -1)))
					.path('about').run(100, dispatchZoomed);
				prevTime = new Date().getTime();
			} else if (timeSince > 150){
				ea.zoom(ea.to().zoom + (delta > 0 ? 1 : -1)).from(map.coordinate).resetRun();
				prevTime = new Date().getTime();
			}

			// Cancel the event so that the page doesn't scroll
			return MM.cancelEvent(e);
		}

		handler.init = function(x) {
			map = x;
			_zoomDiv = document.body.appendChild(document.createElement('div'));
			_zoomDiv.style.cssText = 'visibility:hidden;top:0;height:0;width:0;overflow-y:scroll';
			var innerDiv = _zoomDiv.appendChild(document.createElement('div'));
			innerDiv.style.height = '2000px';
			MM.addEvent(map.parent, 'mousewheel', mouseWheel);
			return handler;
		};

		handler.precise = function(x) {
			if (!arguments.length) return precise;
			precise = x;
			return handler;
		};

		handler.remove = function() {
			MM.removeEvent(map.parent, 'mousewheel', mouseWheel);
			_zoomDiv.parentNode.removeChild(_zoomDiv);
		};

		return handler;
	};

	easey_handlers.DragHandler = function() {
		var handler = {},
			map,
			panner;

		function focusMap(e) {
			map.parent.focus();
		}

		function mouseDown(e) {
			if (e.shiftKey || e.button == 2) return;
			MM.addEvent(document, 'mousemove', mouseMove);
			MM.addEvent(document, 'mouseup', mouseUp);
			panner.down(e);
			map.parent.style.cursor = 'move';
			return MM.cancelEvent(e);
		}

		function mouseMove(e) {
			panner.move(e);
			return MM.cancelEvent(e);
		}

		function mouseUp(e) {
			MM.removeEvent(document, 'mousemove', mouseMove);
			MM.removeEvent(document, 'mouseup', mouseUp);
			panner.up();
			map.parent.style.cursor = '';
			return MM.cancelEvent(e);
		}

		handler.init = function(x) {
			map = x;
			MM.addEvent(map.parent, 'click', focusMap);
			MM.addEvent(map.parent, 'mousedown', mouseDown);
			panner = panning(map);
		};

		handler.remove = function() {
			MM.removeEvent(map.parent, 'click', focusMap);
			MM.removeEvent(map.parent, 'mousedown', mouseDown);
			panner.up();
			panner.remove();
		};

		return handler;
	};


	function panning(map, drag) {

		var p = {};
		drag = drag || 0.15;

		var speed = { x: 0, y: 0 },
			dir = { x: 0, y: 0 },
			removed = false,
			nowPoint = null,
			oldPoint = null,
			moveTime = null,
			prevMoveTime = null,
			animatedLastPoint = true,
			t,
			prevT = new Date().getTime();

		p.down = function(e) {
			nowPoint = oldPoint = MM.getMousePoint(e, map);
			moveTime = prevMoveTime = +new Date();
		};

		p.move = function(e) {
			if (nowPoint) {
				if (animatedLastPoint) {
					oldPoint = nowPoint;
					prevMoveTime = moveTime;
					animatedLastPoint = false;
				}
				nowPoint = MM.getMousePoint(e, map);
				moveTime = +new Date();
			}
		};

		p.up = function() {
			if (+new Date() - prevMoveTime < 50) {
				dt = Math.max(1, moveTime - prevMoveTime);
				dir.x = nowPoint.x - oldPoint.x;
				dir.y = nowPoint.y - oldPoint.y;
				speed.x = dir.x / dt;
				speed.y = dir.y / dt;
			} else {
				speed.x = 0;
				speed.y = 0;
			}
			nowPoint = oldPoint = null;
			moveTime = null;
		};

		p.remove = function() {
			removed = true;
		};

		function animate(t) {
			var dt = Math.max(1, t - prevT);
			if (nowPoint && oldPoint) {
				if (!animatedLastPoint) {
					dir.x = nowPoint.x - oldPoint.x;
					dir.y = nowPoint.y - oldPoint.y;
					map.panBy(dir.x, dir.y);
					animatedLastPoint = true;
				}
			} else {
				// Rough time based animation accuracy
				// using a linear approximation approach
				speed.x *= Math.pow(1 - drag, dt * 60 / 1000);
				speed.y *= Math.pow(1 - drag, dt * 60 / 1000);
				if (Math.abs(speed.x) < 0.001) {
					speed.x = 0;
				}
				if (Math.abs(speed.y) < 0.001) {
					speed.y = 0;
				}
				if (speed.x || speed.y) {
					map.panBy(speed.x * dt, speed.y * dt);
				}
			}
			prevT = t;
			if (!removed) MM.getFrame(animate);
		}

		MM.getFrame(animate);
		return p;
	}


	this.easey_handlers = easey_handlers;

})(this, MM);
if (typeof mapbox == 'undefined') mapbox = {};
if (typeof mapbox.markers == 'undefined') mapbox.markers = {};
mapbox.markers.layer = function() {

	var m = {},
	// external list of geojson features
		features = [],
	// internal list of markers
		markers = [],
	// internal list of callbacks
		callbackManager = new MM.CallbackManager(m, ['drawn', 'markeradded']),
	// the absolute position of the parent element
		position = null,
	// a factory function for creating DOM elements out of
	// GeoJSON objects
		factory = mapbox.markers.simplestyle_factory,
	// a sorter function for sorting GeoJSON objects
	// in the DOM
		sorter = function(a, b) {
			return b.geometry.coordinates[1] -
				a.geometry.coordinates[1];
		},
	// a list of urls from which features can be loaded.
	// these can be templated with {z}, {x}, and {y}
		urls,
	// map bounds
		left = null,
		right = null,
	// a function that filters points
		filter = function() {
			return true;
		},
		_seq = 0,
		keyfn = function() {
			return ++_seq;
		},
		index = {};

	// The parent DOM element
	m.parent = document.createElement('div');
	m.parent.style.cssText = 'position: absolute; top: 0px;' +
		'left:0px; width:100%; height:100%; margin:0; padding:0; z-index:0;pointer-events:none;';
	m.name = 'markers';

	// reposition a single marker element
	function reposition(marker) {
		// remember the tile coordinate so we don't have to reproject every time
		if (!marker.coord) marker.coord = m.map.locationCoordinate(marker.location);
		var pos = m.map.coordinatePoint(marker.coord);
		var pos_loc, new_pos;

		// If this point has wound around the world, adjust its position
		// to the new, onscreen location
		if (pos.x < 0) {
			pos_loc = new MM.Location(marker.location.lat, marker.location.lon);
			pos_loc.lon += Math.ceil((left.lon - marker.location.lon) / 360) * 360;
			new_pos = m.map.locationPoint(pos_loc);
			if (new_pos.x < m.map.dimensions.x) {
				pos = new_pos;
				marker.coord = m.map.locationCoordinate(pos_loc);
			}
		} else if (pos.x > m.map.dimensions.x) {
			pos_loc = new MM.Location(marker.location.lat, marker.location.lon);
			pos_loc.lon -= Math.ceil((marker.location.lon - right.lon) / 360) * 360;
			new_pos = m.map.locationPoint(pos_loc);
			if (new_pos.x > 0) {
				pos = new_pos;
				marker.coord = m.map.locationCoordinate(pos_loc);
			}
		}

		pos.scale = 1;
		pos.width = pos.height = 0;
		MM.moveElement(marker.element, pos);
	}

	// Adding and removing callbacks is mainly a way to enable mmg_interaction to operate.
	// I think there are better ways to do this, by, for instance, having mmg be able to
	// register 'binders' to markers, but this is backwards-compatible and equivalent
	// externally.
	m.addCallback = function(event, callback) {
		callbackManager.addCallback(event, callback);
		return m;
	};

	m.removeCallback = function(event, callback) {
		callbackManager.removeCallback(event, callback);
		return m;
	};

	// Draw this layer - reposition all markers on the div. This requires
	// the markers library to be attached to a map, and will noop otherwise.
	m.draw = function() {
		if (!m.map) return;
		left = m.map.pointLocation(new MM.Point(0, 0));
		right = m.map.pointLocation(new MM.Point(m.map.dimensions.x, 0));
		callbackManager.dispatchCallback('drawn', m);
		for (var i = 0; i < markers.length; i++) {
			reposition(markers[i]);
		}
	};

	// Add a fully-formed marker to the layer. This fires a `markeradded` event.
	// This does not require the map element t be attached.
	m.add = function(marker) {
		if (!marker || !marker.element) return null;
		m.parent.appendChild(marker.element);
		markers.push(marker);
		callbackManager.dispatchCallback('markeradded', marker);
		return marker;
	};

	// Remove a fully-formed marker - which must be the same exact marker
	// object as in the markers array - from the layer.
	m.remove = function(marker) {
		if (!marker) return null;
		m.parent.removeChild(marker.element);
		for (var i = 0; i < markers.length; i++) {
			if (markers[i] === marker) {
				markers.splice(i, 1);
				return marker;
			}
		}
		return marker;
	};

	m.markers = function(x) {
		if (!arguments.length) return markers;
	};

	// Add a GeoJSON feature to the markers layer.
	m.add_feature = function(x) {
		return m.features(m.features().concat([x]));
	};

	m.sort = function(x) {
		if (!arguments.length) return sorter;
		sorter = x;
		return m;
	};

	// Public data interface
	m.features = function(x) {
		// Return features
		if (!arguments.length) return features;

		// Set features
		if (!x) x = [];
		features = x.slice();

		features.sort(sorter);

		for (var j = 0; j < markers.length; j++) {
			markers[j].touch = false;
		}

		for (var i = 0; i < features.length; i++) {
			if (filter(features[i])) {
				var id = keyfn(features[i]);
				if (index[id]) {
					// marker is already on the map, needs to be moved or rebuilt
					index[id].location = new MM.Location(
						features[i].geometry.coordinates[1],
						features[i].geometry.coordinates[0]);
					index[id].coord = null;
					reposition(index[id]);
				} else {
					// marker needs to be added to the map
					index[id] = m.add({
						element: factory(features[i]),
						location: new MM.Location(
							features[i].geometry.coordinates[1],
							features[i].geometry.coordinates[0]),
						data: features[i]
					});
				}
				if (index[id]) index[id].touch = true;
			}
		}

		for (var k = markers.length - 1; k >= 0; k--) {
			if (markers[k].touch === false) {
				m.remove(markers[k]);
			}
		}

		if (m.map && m.map.coordinate) m.map.draw();

		return m;
	};

	// Request features from a URL - either a local URL or a JSONP call.
	// Expects GeoJSON-formatted features.
	m.url = function(x, callback) {
		if (!arguments.length) return urls;
		if (typeof reqwest === 'undefined') throw 'reqwest is required for url loading';
		if (typeof x === 'string') x = [x];

		urls = x;
		function add_features(err, x) {
			if (err && callback) return callback(err);
			var features = typeof x !== 'undefined' && x.features ? x.features : null;
			if (features) m.features(features);
			if (callback) callback(err, features, m);
		}

		reqwest((urls[0].match(/geojsonp$/)) ? {
			url: urls[0] + (~urls[0].indexOf('?') ? '&' : '?') + 'callback=?',
			type: 'jsonp',
			success: function(resp) { add_features(null, resp); },
			error: add_features
		} : {
			url: urls[0],
			type: 'json',
			success: function(resp) { add_features(null, resp); },
			error: add_features
		});
		return m;
	};

	m.id = function(x, callback) {
		return m.url('http://a.tiles.mapbox.com/v3/' + x + '/markers.geojsonp', callback);
	};

	m.csv = function(x) {
		return m.features(mapbox.markers.csv_to_geojson(x));
	};

	m.extent = function() {
		var ext = [{
			lat: Infinity,
			lon: Infinity
		}, {
			lat: -Infinity,
			lon: -Infinity
		}];
		var ft = m.features();
		for (var i = 0; i < ft.length; i++) {
			var coords = ft[i].geometry.coordinates;
			if (coords[0] < ext[0].lon) ext[0].lon = coords[0];
			if (coords[1] < ext[0].lat) ext[0].lat = coords[1];
			if (coords[0] > ext[1].lon) ext[1].lon = coords[0];
			if (coords[1] > ext[1].lat) ext[1].lat = coords[1];
		}
		return ext;
	};

	m.key = function(x) {
		if (!arguments.length) return keyfn;
		if (x === null) {
			keyfn = function() { return ++_seq; };
		} else {
			keyfn = x;
		}
		return m;
	};

	// Factory interface
	m.factory = function(x) {
		if (!arguments.length) return factory;
		factory = x;
		// re-render all features
		m.features(m.features());
		return m;
	};

	m.filter = function(x) {
		if (!arguments.length) return filter;
		filter = x;
		// Setting a filter re-sets the features into a new array.
		// This does _not_ change the actual output of .features()
		m.features(m.features());
		return m;
	};

	m.destroy = function() {
		if (m.parent.parentNode) {
			m.parent.parentNode.removeChild(m.parent);
		}
	};

	// Get or set this layer's name
	m.named = function(x) {
		if (!arguments.length) return m.name;
		m.name = x;
		return m;
	};

	m.enabled = true;

	m.enable = function() {
		this.enabled = true;
		this.parent.style.display = '';
		return m;
	};

	m.disable = function() {
		this.enabled = false;
		this.parent.style.display = 'none';
		return m;
	};

	return m;
};

mmg = mapbox.markers.layer; // Backwards compatibility
mapbox.markers.interaction = function(mmg) {
	// Make markersLayer.interaction a singleton and this an accessor.
	if (mmg && mmg.interaction) return mmg.interaction;

	var mi = {},
		tooltips = [],
		exclusive = true,
		hideOnMove = true,
		showOnHover = true,
		close_timer = null,
		on = true,
		formatter;

	mi.formatter = function(x) {
		if (!arguments.length) return formatter;
		formatter = x;
		return mi;
	};
	mi.formatter(function(feature) {
		var o = '',
			props = feature.properties;

		// Tolerate markers without properties at all.
		if (!props) return null;

		if (props.title) {
			o += '<div class="marker-title">' + props.title + '</div>';
		}
		if (props.description) {
			o += '<div class="marker-description">' + props.description + '</div>';
		}

		if (typeof html_sanitize !== undefined) {
			o = html_sanitize(o,
				function(url) {
					if (/^(https?:\/\/|data:image)/.test(url)) return url;
				},
				function(x) { return x; });
		}

		return o;
	});

	mi.hideOnMove = function(x) {
		if (!arguments.length) return hideOnMove;
		hideOnMove = x;
		return mi;
	};

	mi.exclusive = function(x) {
		if (!arguments.length) return exclusive;
		exclusive = x;
		return mi;
	};

	mi.showOnHover = function(x) {
		if (!arguments.length) return showOnHover;
		showOnHover = x;
		return mi;
	};

	mi.hideTooltips = function() {
		while (tooltips.length) mmg.remove(tooltips.pop());
		for (var i = 0; i < markers.length; i++) {
			delete markers[i].clicked;
		}
	};

	mi.add = function() {
		on = true;
		return mi;
	};

	mi.remove = function() {
		on = false;
		return mi;
	};

	mi.bindMarker = function(marker) {
		var delayed_close = function() {
			if (showOnHover === false) return;
			if (!marker.clicked) close_timer = window.setTimeout(function() {
				mi.hideTooltips();
			}, 200);
		};

		var show = function(e) {
			if (e && e.type == 'mouseover' && showOnHover === false) return;
			if (!on) return;
			var content = formatter(marker.data);
			// Don't show a popup if the formatter returns an
			// empty string. This does not do any magic around DOM elements.
			if (!content) return;

			if (exclusive && tooltips.length > 0) {
				mi.hideTooltips();
				// We've hidden all of the tooltips, so let's not close
				// the one that we're creating as soon as it is created.
				if (close_timer) window.clearTimeout(close_timer);
			}

			var tooltip = document.createElement('div');
			tooltip.className = 'marker-tooltip';
			tooltip.style.width = '100%';

			var wrapper = tooltip.appendChild(document.createElement('div'));
			wrapper.style.cssText = 'position: absolute; pointer-events: none;';

			var popup = wrapper.appendChild(document.createElement('div'));
			popup.className = 'marker-popup';
			popup.style.cssText = 'pointer-events: auto;';

			if (typeof content == 'string') {
				popup.innerHTML = content;
			} else {
				popup.appendChild(content);
			}

			// Align the bottom of the tooltip with the top of its marker
			wrapper.style.bottom = marker.element.offsetHeight / 2 + 20 + 'px';

			// Block mouse and touch events
			function stopPropagation(e) {
				e.cancelBubble = true;
				if (e.stopPropagation) { e.stopPropagation(); }
				return false;
			}
			MM.addEvent(popup, 'mousedown', stopPropagation);
			MM.addEvent(popup, 'touchstart', stopPropagation);

			if (showOnHover) {
				tooltip.onmouseover = function() {
					if (close_timer) window.clearTimeout(close_timer);
				};
				tooltip.onmouseout = delayed_close;
			}

			var t = {
				element: tooltip,
				data: {},
				interactive: false,
				location: marker.location.copy()
			};
			tooltips.push(t);
			marker.tooltip = t;
			mmg.add(t);
			mmg.draw();
		};

		marker.showTooltip = show;

		marker.element.onclick = marker.element.ontouchstart = function() {
			show();
			marker.clicked = true;
		};

		marker.element.onmouseover = show;
		marker.element.onmouseout = delayed_close;
	};

	function bindPanned() {
		mmg.map.addCallback('panned', function() {
			if (hideOnMove) {
				while (tooltips.length) {
					mmg.remove(tooltips.pop());
				}
			}
		});
	}

	if (mmg) {
		// Remove tooltips on panning
		mmg.addCallback('drawn', bindPanned);

		// Bind present markers
		var markers = mmg.markers();
		for (var i = 0; i < markers.length; i++) {
			mi.bindMarker(markers[i]);
		}

		// Bind future markers
		mmg.addCallback('markeradded', function(_, marker) {
			// Markers can choose to be not-interactive. The main example
			// of this currently is marker bubbles, which should not recursively
			// give marker bubbles.
			if (marker.interactive !== false) mi.bindMarker(marker);
		});

		// Save reference to self on the markers instance.
		mmg.interaction = mi;
	}

	return mi;
};

mmg_interaction = mapbox.markers.interaction;
mapbox.markers.csv_to_geojson = function(x) {
	// Extracted from d3
	function csv_parse(text) {
		var header;
		return csv_parseRows(text, function(row, i) {
			if (i) {
				var o = {}, j = -1, m = header.length;
				while (++j < m) o[header[j]] = row[j];
				return o;
			} else {
				header = row;
				return null;
			}
		});
	}

	function csv_parseRows (text, f) {
		var EOL = {}, // sentinel value for end-of-line
			EOF = {}, // sentinel value for end-of-file
			rows = [], // output rows
			re = /\r\n|[,\r\n]/g, // field separator regex
			n = 0, // the current line number
			t, // the current token
			eol; // is the current token followed by EOL?

		re.lastIndex = 0; // work-around bug in FF 3.6

		/** @private Returns the next token. */
		function token() {
			if (re.lastIndex >= text.length) return EOF; // special case: end of file
			if (eol) { eol = false; return EOL; } // special case: end of line

			// special case: quotes
			var j = re.lastIndex;
			if (text.charCodeAt(j) === 34) {
				var i = j;
				while (i++ < text.length) {
					if (text.charCodeAt(i) === 34) {
						if (text.charCodeAt(i + 1) !== 34) break;
						i++;
					}
				}
				re.lastIndex = i + 2;
				var c = text.charCodeAt(i + 1);
				if (c === 13) {
					eol = true;
					if (text.charCodeAt(i + 2) === 10) re.lastIndex++;
				} else if (c === 10) {
					eol = true;
				}
				return text.substring(j + 1, i).replace(/""/g, "\"");
			}

			// common case
			var m = re.exec(text);
			if (m) {
				eol = m[0].charCodeAt(0) !== 44;
				return text.substring(j, m.index);
			}
			re.lastIndex = text.length;
			return text.substring(j);
		}

		while ((t = token()) !== EOF) {
			var a = [];
			while ((t !== EOL) && (t !== EOF)) {
				a.push(t);
				t = token();
			}
			if (f && !(a = f(a, n++))) continue;
			rows.push(a);
		}

		return rows;
	}

	var features = [];
	var parsed = csv_parse(x);
	if (!parsed.length) return features;

	var latfield = '',
		lonfield = '';

	for (var f in parsed[0]) {
		if (f.match(/^Lat/i)) latfield = f;
		if (f.match(/^Lon/i)) lonfield = f;
	}

	if (!latfield || !lonfield) {
		throw 'CSV: Could not find latitude or longitude field';
	}

	for (var i = 0; i < parsed.length; i++) {
		if (parsed[i][lonfield] !== undefined &&
			parsed[i][lonfield] !== undefined) {
			features.push({
				type: 'Feature',
				properties: parsed[i],
				geometry: {
					type: 'Point',
					coordinates: [
						parseFloat(parsed[i][lonfield]),
						parseFloat(parsed[i][latfield])]
				}
			});
		}
	}
	return features;
};
mapbox.markers.simplestyle_factory = function(feature) {

	var sizes = {
		small: [20, 50],
		medium: [30, 70],
		large: [35, 90]
	};

	var fp = feature.properties || {};

	var size = fp['marker-size'] || 'medium';
	var symbol = (fp['marker-symbol']) ? '-' + fp['marker-symbol'] : '';
	var color = fp['marker-color'] || '7e7e7e';
	color = color.replace('#', '');

	var d = document.createElement('img');
	d.width = sizes[size][0];
	d.height = sizes[size][1];
	d.className = 'simplestyle-marker';
	d.alt = fp.title || '';
	d.src = (mapbox.markers.marker_baseurl || 'http://a.tiles.mapbox.com/v3/marker/') +
		'pin-' +
		// Internet Explorer does not support the `size[0]` syntax.
		size.charAt(0) + symbol + '+' + color +
		((window.devicePixelRatio === 2) ? '@2x' : '') +
		'.png';
	// Support retina markers for 2x devices

	var ds = d.style;
	ds.position = 'absolute';
	ds.clip = 'rect(auto auto ' + (sizes[size][1] * 0.75) + 'px auto)';
	ds.marginTop = -((sizes[size][1]) / 2) + 'px';
	ds.marginLeft = -(sizes[size][0] / 2) + 'px';
	ds.cursor = 'pointer';
	ds.pointerEvents = 'all';

	return d;
};
if (typeof mapbox === 'undefined') mapbox = {};

mapbox.MAPBOX_URL = 'http://a.tiles.mapbox.com/v3/';

// a `mapbox.map` is a modestmaps object with the
// easey handlers as defaults
mapbox.map = function(el, layer, dimensions, eventhandlers) {
	var m = new MM.Map(el, layer, dimensions,
		eventhandlers || [
			easey_handlers.TouchHandler(),
			easey_handlers.DragHandler(),
			easey_handlers.DoubleClickHandler(),
			easey_handlers.MouseWheelHandler()
		]);

	// Set maxzoom to 17, highest zoom level supported by MapBox streets
	m.setZoomRange(0, 17);

	// Attach easey, ui, and interaction
	m.ease = easey().map(m);
	m.ui = mapbox.ui(m);
	m.interaction = mapbox.interaction().map(m);

	// Autoconfigure map with sensible defaults
	m.auto = function() {
		this.ui.zoomer.add();
		this.ui.zoombox.add();
		this.ui.legend.add();
		this.ui.attribution.add();
		this.ui.refresh();
		this.interaction.auto();

		for (var i = 0; i < this.layers.length; i++) {
			if (this.layers[i].tilejson) {
				var tj = this.layers[i].tilejson(),
					center = tj.center || new MM.Location(0, 0),
					zoom = tj.zoom || 0;
				this.setCenterZoom(center, zoom);
				break;
			}
		}
		return this;
	};

	m.refresh = function() {
		this.ui.refresh();
		this.interaction.refresh();
		return this;
	};

	var smooth_handlers = [
		easey_handlers.TouchHandler,
		easey_handlers.DragHandler,
		easey_handlers.DoubleClickHandler,
		easey_handlers.MouseWheelHandler
	];

	var default_handlers = [
		MM.TouchHandler,
		MM.DragHandler,
		MM.DoubleClickHandler,
		MM.MouseWheelHandler
	];

	MM.Map.prototype.smooth = function(_) {
		while (this.eventHandlers.length) {
			this.eventHandlers.pop().remove();
		}

		var handlers = _ ? smooth_handlers : default_handlers;
		for (var j = 0; j < handlers.length; j++) {
			var h = handlers[j]();
			this.eventHandlers.push(h);
			h.init(this);
		}
		return m;
	};

	m.setPanLimits = function(locations) {
		if (!(locations instanceof MM.Extent)) {
			locations = new MM.Extent(
				new MM.Location(
					locations[0].lat,
					locations[0].lon),
				new MM.Location(
					locations[1].lat,
					locations[1].lon));
		}
		locations = locations.toArray();
		this.coordLimits = [
			this.locationCoordinate(locations[0]).zoomTo(this.coordLimits[0].zoom),
			this.locationCoordinate(locations[1]).zoomTo(this.coordLimits[1].zoom)
		];
		return m;
	};

	m.center = function(location, animate) {
		if (location && animate) {
			this.ease.location(location).zoom(this.zoom())
				.optimal(null, null, animate.callback);
		} else {
			return MM.Map.prototype.center.call(this, location);
		}
	};

	m.zoom = function(zoom, animate) {
		if (zoom !== undefined && animate) {
			this.ease.to(this.coordinate).zoom(zoom).run(600);
		} else {
			return MM.Map.prototype.zoom.call(this, zoom);
		}
	};

	m.centerzoom = function(location, zoom, animate) {
		if (location && zoom !== undefined && animate) {
			this.ease.location(location).zoom(zoom).optimal(null, null, animate.callback);
		} else if (location && zoom !== undefined) {
			return this.setCenterZoom(location, zoom);
		}
	};

	// Insert a tile layer below marker layers
	m.addTileLayer = function(layer) {
		for (var i = m.layers.length; i > 0; i--) {
			if (!m.layers[i - 1].features) {
				return this.insertLayerAt(i, layer);
			}
		}
		return this.insertLayerAt(0, layer);
	};

	// We need to redraw after removing due to compositing
	m.removeLayerAt = function(index) {
		MM.Map.prototype.removeLayerAt.call(this, index);
		MM.getFrame(this.getRedraw());
		return this;
	};

	// We need to redraw after removing due to compositing
	m.swapLayersAt = function(a, b) {
		MM.Map.prototype.swapLayersAt.call(this, a, b);
		MM.getFrame(this.getRedraw());
		return this;
	};

	return m;
};

this.mapbox = mapbox;
if (typeof mapbox === 'undefined') mapbox = {};

// Simplest way to create a map. Just provide an element id and
// a tilejson url (or an array of many) and an optional callback
// that takes one argument, the map.
mapbox.auto = function(elem, url, callback) {
	mapbox.load(url, function(tj) {

		var opts = tj instanceof Array ? tj : [tj];

		var tileLayers = [],
			markerLayers = [];
		for (var i = 0; i < opts.length; i++) {
			if (opts[i].layer) tileLayers.push(opts[i].layer);
			if (opts[i].markers) markerLayers.push(opts[i].markers);
		}

		var map = mapbox.map(elem, tileLayers.concat(markerLayers)).auto();
		if (callback) callback(map, tj);
	});
};


// mapbox.load pulls a [TileJSON](http://mapbox.com/wax/tilejson.html)
// object from a server and uses it to configure a map and various map-related
// objects
mapbox.load = function(url, callback) {

	// Support multiple urls
	if (url instanceof Array) {
		return mapbox.util.asyncMap(url, mapbox.load, callback);
	}

	// Support bare IDs as well as fully-formed URLs
	if (url.indexOf('http') !== 0) {
		url = mapbox.MAPBOX_URL + url + '.jsonp';
	}

	wax.tilejson(url, function(tj) {
		// Pull zoom level out of center
		tj.zoom = tj.center[2];

		// Instantiate center as a Modest Maps-compatible object
		tj.center = {
			lat: tj.center[1],
			lon: tj.center[0]
		};

		tj.thumbnail = mapbox.MAPBOX_URL + tj.id + '/thumb.png';

		// Instantiate tile layer
		tj.layer = mapbox.layer().tilejson(tj);

		// Instantiate markers layer
		if (tj.data) {
			tj.markers = mapbox.markers.layer();
			tj.markers.url(tj.data, function() {
				mapbox.markers.interaction(tj.markers);
				callback(tj);
			});
		} else {
			callback(tj);
		}
	});
};
if (typeof mapbox === 'undefined') mapbox = {};

mapbox.ui = function(map) {
	var ui = {
		zoomer: wax.mm.zoomer().map(map).smooth(true),
		pointselector: wax.mm.pointselector().map(map),
		hash: wax.mm.hash().map(map),
		zoombox: wax.mm.zoombox().map(map),
		fullscreen: wax.mm.fullscreen().map(map),
		legend: wax.mm.legend().map(map),
		attribution: wax.mm.attribution().map(map)
	};

	function unique(x) {
		var u = {}, l = [];
		for (var i = 0; i < x.length; i++) u[x[i]] = true;
		for (var a in u) { if (a) l.push(a); }
		return l;
	}

	ui.refresh = function() {
		if (!map) return console && console.error('ui not attached to map');

		var attributions = [], legends = [];
		for (var i = 0; i < map.layers.length; i++) {
			if (map.layers[i].enabled && map.layers[i].tilejson) {
				var attribution = map.layers[i].tilejson().attribution;
				if (attribution) attributions.push(attribution);
				var legend = map.layers[i].tilejson().legend;
				if (legend) legends.push(legend);
			}
		}

		var unique_attributions = unique(attributions);
		var unique_legends = unique(legends);

		ui.attribution.content(unique_attributions.length ? unique_attributions.join('<br />') : '');
		ui.legend.content(unique_legends.length ? unique_legends.join('<br />') : '');

		ui.attribution.element().style.display = unique_attributions.length ? '' : 'none';
		ui.legend.element().style.display = unique_legends.length ? '' : 'none';
	};

	return ui;
};
if (typeof mapbox === 'undefined') mapbox = {};


mapbox.util = {

	// Asynchronous map that groups results maintaining order
	asyncMap: function(values, func, callback) {
		var remaining = values.length,
			results = [];

		function next(index) {
			return function(result) {
				results[index] = result;
				remaining--;
				if (!remaining) callback(results);
			};
		}

		for (var i = 0; i < values.length; i++) {
			func(values[i], next(i));
		}
	}
};
if (typeof mapbox === 'undefined') mapbox = {};

mapbox.interaction = function() {

	var interaction = wax.mm.interaction(),
		auto = false;

	interaction.refresh = function() {
		var map = interaction.map();
		if (!auto || !map) return interaction;
		for (var i = map.layers.length - 1; i >= 0; i --) {
			if (map.layers[i].enabled) {
				var tj = map.layers[i].tilejson && map.layers[i].tilejson();
				if (tj && tj.template) return interaction.tilejson(tj);
			}
		}
		return interaction.tilejson({});
	};

	interaction.auto = function() {
		auto = true;
		interaction.on(wax.tooltip()
			.animate(true)
			.parent(interaction.map().parent)
			.events()).on(wax.location().events());
		return interaction.refresh();
	};

	return interaction;
};
if (typeof mapbox === 'undefined') mapbox = {};

mapbox.layer = function() {
	if (!(this instanceof mapbox.layer)) {
		return new mapbox.layer();
	}
	// instance variables
	this._tilejson = {};
	this._url = '';
	this._id = '';
	this._composite = true;

	this.name = '';
	this.parent = document.createElement('div');
	this.parent.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0';
	this.levels = {};
	this.requestManager = new MM.RequestManager();
	this.requestManager.addCallback('requestcomplete', this.getTileComplete());
	this.requestManager.addCallback('requesterror', this.getTileError());
	this.setProvider(new wax.mm._provider({
		tiles: ['data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7']
	}));
};

mapbox.layer.prototype.refresh = function(callback) {
	var that = this;
	// When the async request for a TileJSON blob comes back,
	// this resets its own tilejson and calls setProvider on itself.
	wax.tilejson(this._url, function(o) {
		that.tilejson(o);
		if (callback) callback(that);
	});
	return this;
};

mapbox.layer.prototype.url = function(x, callback) {
	if (!arguments.length) return this._url;
	this._mapboxhosting = x.indexOf(mapbox.MAPBOX_URL) == 0;
	this._url = x;
	return this.refresh(callback);
};

mapbox.layer.prototype.id = function(x, callback) {
	if (!arguments.length) return this._id;
	this.named(x);
	this._id = x;
	return this.url(mapbox.MAPBOX_URL + x + '.jsonp', callback);
};

mapbox.layer.prototype.named = function(x) {
	if (!arguments.length) return this.name;
	this.name = x;
	return this;
};

mapbox.layer.prototype.tilejson = function(x) {
	if (!arguments.length) return this._tilejson;

	if (!this._composite || !this._mapboxhosting) this.setProvider(new wax.mm._provider(x));

	this._tilejson = x;

	this.name = this.name || x.id;
	this._id = this._id || x.id;

	if (x.bounds) {
		var proj = new MM.MercatorProjection(0,
			MM.deriveTransformation(
				-Math.PI,  Math.PI, 0, 0,
				Math.PI,  Math.PI, 1, 0,
				-Math.PI, -Math.PI, 0, 1));

		this.provider.tileLimits = [
			proj.locationCoordinate(new MM.Location(x.bounds[3], x.bounds[0]))
				.zoomTo(x.minzoom ? x.minzoom : 0),
			proj.locationCoordinate(new MM.Location(x.bounds[1], x.bounds[2]))
				.zoomTo(x.maxzoom ? x.maxzoom : 18)
		];
	}

	return this;
};

mapbox.layer.prototype.draw = function() {
	if (!this.enabled || !this.map) return;

	if (this._composite && this._mapboxhosting) {

		// Get index of current layer
		var i = 0;
		for (i; i < this.map.layers.length; i++) {
			if (this.map.layers[i] == this) break;
		}

		// If layer is composited by layer below it, don't draw
		for (var j = i - 1; j >= 0; j--) {
			if (this.map.getLayerAt(j).enabled) {
				if (this.map.getLayerAt(j)._composite) {
					this.parent.style.display = 'none';
					this.compositeLayer = false;
					return this;
				}
				else break;
			}
		}

		// Get map IDs for all consecutive composited layers
		var ids = [];
		for (var k = i; k < this.map.layers.length; k++) {
			var l = this.map.getLayerAt(k);
			if (l.enabled) {
				if (l._composite && l._mapboxhosting) ids.push(l.id());
				else break;
			}
		}
		ids = ids.join(',');

		if (this.compositeLayer !== ids) {
			this.compositeLayer = ids;
			var that = this;
			wax.tilejson(mapbox.MAPBOX_URL + ids + '.jsonp', function(tiledata) {
				that.setProvider(new wax.mm._provider(tiledata));
				// setProvider calls .draw()
			});
			this.parent.style.display = '';
			return this;
		}

	} else {
		this.parent.style.display = '';
		// Set back to regular provider
		if (this.compositeLayer) {
			this.compositeLayer = false;
			this.setProvider(new wax.mm._provider(this.tilejson()));
			// .draw() called by .tilejson()
		}
	}

	return MM.Layer.prototype.draw.call(this);
};

mapbox.layer.prototype.composite = function(x) {
	if (!arguments.length) return this._composite;
	if (x) this._composite = true;
	else this._composite = false;
	return this;
};

// we need to redraw map due to compositing
mapbox.layer.prototype.enable = function(x) {
	MM.Layer.prototype.enable.call(this, x);
	if (this.map) this.map.draw();
	return this;
};

// we need to redraw map due to compositing
mapbox.layer.prototype.disable = function(x) {
	MM.Layer.prototype.disable.call(this, x);
	if (this.map) this.map.draw();
	return this;
};

MM.extend(mapbox.layer, MM.Layer);

define("mapbox", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.mapbox;
    };
}(this)));

/*

 Copyright (C) 2011 by Yehuda Katz

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */

// lib/handlebars/base.js

/*jshint eqnull:true*/
this.Handlebars = {};

(function (Handlebars) {

	Handlebars.VERSION = "1.0.0-rc.3";
	Handlebars.COMPILER_REVISION = 2;

	Handlebars.REVISION_CHANGES = {
		1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
		2: '>= 1.0.0-rc.3'
	};

	Handlebars.helpers = {};
	Handlebars.partials = {};

	Handlebars.registerHelper = function (name, fn, inverse) {
		if (inverse) {
			fn.not = inverse;
		}
		this.helpers[name] = fn;
	};

	Handlebars.registerPartial = function (name, str) {
		this.partials[name] = str;
	};

	Handlebars.registerHelper('helperMissing', function (arg) {
		if (arguments.length === 2) {
			return undefined;
		} else {
			throw new Error("Could not find property '" + arg + "'");
		}
	});

	var toString = Object.prototype.toString, functionType = "[object Function]";

	Handlebars.registerHelper('blockHelperMissing', function (context, options) {
		var inverse = options.inverse || function () {
		}, fn = options.fn;


		var ret = "";
		var type = toString.call(context);

		if (type === functionType) {
			context = context.call(this);
		}

		if (context === true) {
			return fn(this);
		} else if (context === false || context == null) {
			return inverse(this);
		} else if (type === "[object Array]") {
			if (context.length > 0) {
				return Handlebars.helpers.each(context, options);
			} else {
				return inverse(this);
			}
		} else {
			return fn(context);
		}
	});

	Handlebars.K = function () {
	};

	Handlebars.createFrame = Object.create || function (object) {
		Handlebars.K.prototype = object;
		var obj = new Handlebars.K();
		Handlebars.K.prototype = null;
		return obj;
	};

	Handlebars.logger = {
		DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, level: 3,

		methodMap: {0: 'debug', 1: 'info', 2: 'warn', 3: 'error'},

		// can be overridden in the host environment
		log: function (level, obj) {
			if (Handlebars.logger.level <= level) {
				var method = Handlebars.logger.methodMap[level];
				if (typeof console !== 'undefined' && console[method]) {
					console[method].call(console, obj);
				}
			}
		}
	};

	Handlebars.log = function (level, obj) {
		Handlebars.logger.log(level, obj);
	};

	Handlebars.registerHelper('each', function (context, options) {
		var fn = options.fn, inverse = options.inverse;
		var i = 0, ret = "", data;

		if (options.data) {
			data = Handlebars.createFrame(options.data);
		}

		if (context && typeof context === 'object') {
			if (context instanceof Array) {
				for (var j = context.length; i < j; i++) {
					if (data) {
						data.index = i;
					}
					ret = ret + fn(context[i], { data: data });
				}
			} else {
				for (var key in context) {
					if (context.hasOwnProperty(key)) {
						if (data) {
							data.key = key;
						}
						ret = ret + fn(context[key], {data: data});
						i++;
					}
				}
			}
		}

		if (i === 0) {
			ret = inverse(this);
		}

		return ret;
	});

	Handlebars.registerHelper('if', function (context, options) {
		var type = toString.call(context);
		if (type === functionType) {
			context = context.call(this);
		}

		if (!context || Handlebars.Utils.isEmpty(context)) {
			return options.inverse(this);
		} else {
			return options.fn(this);
		}
	});

	Handlebars.registerHelper('unless', function (context, options) {
		var fn = options.fn, inverse = options.inverse;
		options.fn = inverse;
		options.inverse = fn;

		return Handlebars.helpers['if'].call(this, context, options);
	});

	Handlebars.registerHelper('with', function (context, options) {
		return options.fn(context);
	});

	Handlebars.registerHelper('log', function (context, options) {
		var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
		Handlebars.log(level, context);
	});

}(this.Handlebars));
;
// lib/handlebars/compiler/parser.js
/* Jison generated parser */
var handlebars = (function () {
	var parser = {trace: function trace() {
	},
		yy: {},
		symbols_: {"error": 2, "root": 3, "program": 4, "EOF": 5, "simpleInverse": 6, "statements": 7, "statement": 8, "openInverse": 9, "closeBlock": 10, "openBlock": 11, "mustache": 12, "partial": 13, "CONTENT": 14, "COMMENT": 15, "OPEN_BLOCK": 16, "inMustache": 17, "CLOSE": 18, "OPEN_INVERSE": 19, "OPEN_ENDBLOCK": 20, "path": 21, "OPEN": 22, "OPEN_UNESCAPED": 23, "OPEN_PARTIAL": 24, "partialName": 25, "params": 26, "hash": 27, "DATA": 28, "param": 29, "STRING": 30, "INTEGER": 31, "BOOLEAN": 32, "hashSegments": 33, "hashSegment": 34, "ID": 35, "EQUALS": 36, "PARTIAL_NAME": 37, "pathSegments": 38, "SEP": 39, "$accept": 0, "$end": 1},
		terminals_: {2: "error", 5: "EOF", 14: "CONTENT", 15: "COMMENT", 16: "OPEN_BLOCK", 18: "CLOSE", 19: "OPEN_INVERSE", 20: "OPEN_ENDBLOCK", 22: "OPEN", 23: "OPEN_UNESCAPED", 24: "OPEN_PARTIAL", 28: "DATA", 30: "STRING", 31: "INTEGER", 32: "BOOLEAN", 35: "ID", 36: "EQUALS", 37: "PARTIAL_NAME", 39: "SEP"},
		productions_: [0, [3, 2], [4, 2], [4, 3], [4, 2], [4, 1], [4, 1], [4, 0], [7, 1], [7, 2], [8, 3], [8, 3], [8, 1], [8, 1], [8, 1], [8, 1], [11, 3], [9, 3], [10, 3], [12, 3], [12, 3], [13, 3], [13, 4], [6, 2], [17, 3], [17, 2], [17, 2], [17, 1], [17, 1], [26, 2], [26, 1], [29, 1], [29, 1], [29, 1], [29, 1], [29, 1], [27, 1], [33, 2], [33, 1], [34, 3], [34, 3], [34, 3], [34, 3], [34, 3], [25, 1], [21, 1], [38, 3], [38, 1]],
		performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

			var $0 = $$.length - 1;
			switch (yystate) {
				case 1:
					return $$[$0 - 1];
					break;
				case 2:
					this.$ = new yy.ProgramNode([], $$[$0]);
					break;
				case 3:
					this.$ = new yy.ProgramNode($$[$0 - 2], $$[$0]);
					break;
				case 4:
					this.$ = new yy.ProgramNode($$[$0 - 1], []);
					break;
				case 5:
					this.$ = new yy.ProgramNode($$[$0]);
					break;
				case 6:
					this.$ = new yy.ProgramNode([], []);
					break;
				case 7:
					this.$ = new yy.ProgramNode([]);
					break;
				case 8:
					this.$ = [$$[$0]];
					break;
				case 9:
					$$[$0 - 1].push($$[$0]);
					this.$ = $$[$0 - 1];
					break;
				case 10:
					this.$ = new yy.BlockNode($$[$0 - 2], $$[$0 - 1].inverse, $$[$0 - 1], $$[$0]);
					break;
				case 11:
					this.$ = new yy.BlockNode($$[$0 - 2], $$[$0 - 1], $$[$0 - 1].inverse, $$[$0]);
					break;
				case 12:
					this.$ = $$[$0];
					break;
				case 13:
					this.$ = $$[$0];
					break;
				case 14:
					this.$ = new yy.ContentNode($$[$0]);
					break;
				case 15:
					this.$ = new yy.CommentNode($$[$0]);
					break;
				case 16:
					this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1]);
					break;
				case 17:
					this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1]);
					break;
				case 18:
					this.$ = $$[$0 - 1];
					break;
				case 19:
					this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1]);
					break;
				case 20:
					this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1], true);
					break;
				case 21:
					this.$ = new yy.PartialNode($$[$0 - 1]);
					break;
				case 22:
					this.$ = new yy.PartialNode($$[$0 - 2], $$[$0 - 1]);
					break;
				case 23:
					break;
				case 24:
					this.$ = [[$$[$0 - 2]].concat($$[$0 - 1]), $$[$0]];
					break;
				case 25:
					this.$ = [[$$[$0 - 1]].concat($$[$0]), null];
					break;
				case 26:
					this.$ = [
						[$$[$0 - 1]],
						$$[$0]
					];
					break;
				case 27:
					this.$ = [
						[$$[$0]],
						null
					];
					break;
				case 28:
					this.$ = [
						[new yy.DataNode($$[$0])],
						null
					];
					break;
				case 29:
					$$[$0 - 1].push($$[$0]);
					this.$ = $$[$0 - 1];
					break;
				case 30:
					this.$ = [$$[$0]];
					break;
				case 31:
					this.$ = $$[$0];
					break;
				case 32:
					this.$ = new yy.StringNode($$[$0]);
					break;
				case 33:
					this.$ = new yy.IntegerNode($$[$0]);
					break;
				case 34:
					this.$ = new yy.BooleanNode($$[$0]);
					break;
				case 35:
					this.$ = new yy.DataNode($$[$0]);
					break;
				case 36:
					this.$ = new yy.HashNode($$[$0]);
					break;
				case 37:
					$$[$0 - 1].push($$[$0]);
					this.$ = $$[$0 - 1];
					break;
				case 38:
					this.$ = [$$[$0]];
					break;
				case 39:
					this.$ = [$$[$0 - 2], $$[$0]];
					break;
				case 40:
					this.$ = [$$[$0 - 2], new yy.StringNode($$[$0])];
					break;
				case 41:
					this.$ = [$$[$0 - 2], new yy.IntegerNode($$[$0])];
					break;
				case 42:
					this.$ = [$$[$0 - 2], new yy.BooleanNode($$[$0])];
					break;
				case 43:
					this.$ = [$$[$0 - 2], new yy.DataNode($$[$0])];
					break;
				case 44:
					this.$ = new yy.PartialNameNode($$[$0]);
					break;
				case 45:
					this.$ = new yy.IdNode($$[$0]);
					break;
				case 46:
					$$[$0 - 2].push($$[$0]);
					this.$ = $$[$0 - 2];
					break;
				case 47:
					this.$ = [$$[$0]];
					break;
			}
		},
		table: [
			{3: 1, 4: 2, 5: [2, 7], 6: 3, 7: 4, 8: 6, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 5], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{1: [3]},
			{5: [1, 17]},
			{5: [2, 6], 7: 18, 8: 6, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 19], 20: [2, 6], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{5: [2, 5], 6: 20, 8: 21, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 5], 20: [2, 5], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{17: 23, 18: [1, 22], 21: 24, 28: [1, 25], 35: [1, 27], 38: 26},
			{5: [2, 8], 14: [2, 8], 15: [2, 8], 16: [2, 8], 19: [2, 8], 20: [2, 8], 22: [2, 8], 23: [2, 8], 24: [2, 8]},
			{4: 28, 6: 3, 7: 4, 8: 6, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 5], 20: [2, 7], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{4: 29, 6: 3, 7: 4, 8: 6, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 5], 20: [2, 7], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{5: [2, 12], 14: [2, 12], 15: [2, 12], 16: [2, 12], 19: [2, 12], 20: [2, 12], 22: [2, 12], 23: [2, 12], 24: [2, 12]},
			{5: [2, 13], 14: [2, 13], 15: [2, 13], 16: [2, 13], 19: [2, 13], 20: [2, 13], 22: [2, 13], 23: [2, 13], 24: [2, 13]},
			{5: [2, 14], 14: [2, 14], 15: [2, 14], 16: [2, 14], 19: [2, 14], 20: [2, 14], 22: [2, 14], 23: [2, 14], 24: [2, 14]},
			{5: [2, 15], 14: [2, 15], 15: [2, 15], 16: [2, 15], 19: [2, 15], 20: [2, 15], 22: [2, 15], 23: [2, 15], 24: [2, 15]},
			{17: 30, 21: 24, 28: [1, 25], 35: [1, 27], 38: 26},
			{17: 31, 21: 24, 28: [1, 25], 35: [1, 27], 38: 26},
			{17: 32, 21: 24, 28: [1, 25], 35: [1, 27], 38: 26},
			{25: 33, 37: [1, 34]},
			{1: [2, 1]},
			{5: [2, 2], 8: 21, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 19], 20: [2, 2], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{17: 23, 21: 24, 28: [1, 25], 35: [1, 27], 38: 26},
			{5: [2, 4], 7: 35, 8: 6, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 19], 20: [2, 4], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{5: [2, 9], 14: [2, 9], 15: [2, 9], 16: [2, 9], 19: [2, 9], 20: [2, 9], 22: [2, 9], 23: [2, 9], 24: [2, 9]},
			{5: [2, 23], 14: [2, 23], 15: [2, 23], 16: [2, 23], 19: [2, 23], 20: [2, 23], 22: [2, 23], 23: [2, 23], 24: [2, 23]},
			{18: [1, 36]},
			{18: [2, 27], 21: 41, 26: 37, 27: 38, 28: [1, 45], 29: 39, 30: [1, 42], 31: [1, 43], 32: [1, 44], 33: 40, 34: 46, 35: [1, 47], 38: 26},
			{18: [2, 28]},
			{18: [2, 45], 28: [2, 45], 30: [2, 45], 31: [2, 45], 32: [2, 45], 35: [2, 45], 39: [1, 48]},
			{18: [2, 47], 28: [2, 47], 30: [2, 47], 31: [2, 47], 32: [2, 47], 35: [2, 47], 39: [2, 47]},
			{10: 49, 20: [1, 50]},
			{10: 51, 20: [1, 50]},
			{18: [1, 52]},
			{18: [1, 53]},
			{18: [1, 54]},
			{18: [1, 55], 21: 56, 35: [1, 27], 38: 26},
			{18: [2, 44], 35: [2, 44]},
			{5: [2, 3], 8: 21, 9: 7, 11: 8, 12: 9, 13: 10, 14: [1, 11], 15: [1, 12], 16: [1, 13], 19: [1, 19], 20: [2, 3], 22: [1, 14], 23: [1, 15], 24: [1, 16]},
			{14: [2, 17], 15: [2, 17], 16: [2, 17], 19: [2, 17], 20: [2, 17], 22: [2, 17], 23: [2, 17], 24: [2, 17]},
			{18: [2, 25], 21: 41, 27: 57, 28: [1, 45], 29: 58, 30: [1, 42], 31: [1, 43], 32: [1, 44], 33: 40, 34: 46, 35: [1, 47], 38: 26},
			{18: [2, 26]},
			{18: [2, 30], 28: [2, 30], 30: [2, 30], 31: [2, 30], 32: [2, 30], 35: [2, 30]},
			{18: [2, 36], 34: 59, 35: [1, 60]},
			{18: [2, 31], 28: [2, 31], 30: [2, 31], 31: [2, 31], 32: [2, 31], 35: [2, 31]},
			{18: [2, 32], 28: [2, 32], 30: [2, 32], 31: [2, 32], 32: [2, 32], 35: [2, 32]},
			{18: [2, 33], 28: [2, 33], 30: [2, 33], 31: [2, 33], 32: [2, 33], 35: [2, 33]},
			{18: [2, 34], 28: [2, 34], 30: [2, 34], 31: [2, 34], 32: [2, 34], 35: [2, 34]},
			{18: [2, 35], 28: [2, 35], 30: [2, 35], 31: [2, 35], 32: [2, 35], 35: [2, 35]},
			{18: [2, 38], 35: [2, 38]},
			{18: [2, 47], 28: [2, 47], 30: [2, 47], 31: [2, 47], 32: [2, 47], 35: [2, 47], 36: [1, 61], 39: [2, 47]},
			{35: [1, 62]},
			{5: [2, 10], 14: [2, 10], 15: [2, 10], 16: [2, 10], 19: [2, 10], 20: [2, 10], 22: [2, 10], 23: [2, 10], 24: [2, 10]},
			{21: 63, 35: [1, 27], 38: 26},
			{5: [2, 11], 14: [2, 11], 15: [2, 11], 16: [2, 11], 19: [2, 11], 20: [2, 11], 22: [2, 11], 23: [2, 11], 24: [2, 11]},
			{14: [2, 16], 15: [2, 16], 16: [2, 16], 19: [2, 16], 20: [2, 16], 22: [2, 16], 23: [2, 16], 24: [2, 16]},
			{5: [2, 19], 14: [2, 19], 15: [2, 19], 16: [2, 19], 19: [2, 19], 20: [2, 19], 22: [2, 19], 23: [2, 19], 24: [2, 19]},
			{5: [2, 20], 14: [2, 20], 15: [2, 20], 16: [2, 20], 19: [2, 20], 20: [2, 20], 22: [2, 20], 23: [2, 20], 24: [2, 20]},
			{5: [2, 21], 14: [2, 21], 15: [2, 21], 16: [2, 21], 19: [2, 21], 20: [2, 21], 22: [2, 21], 23: [2, 21], 24: [2, 21]},
			{18: [1, 64]},
			{18: [2, 24]},
			{18: [2, 29], 28: [2, 29], 30: [2, 29], 31: [2, 29], 32: [2, 29], 35: [2, 29]},
			{18: [2, 37], 35: [2, 37]},
			{36: [1, 61]},
			{21: 65, 28: [1, 69], 30: [1, 66], 31: [1, 67], 32: [1, 68], 35: [1, 27], 38: 26},
			{18: [2, 46], 28: [2, 46], 30: [2, 46], 31: [2, 46], 32: [2, 46], 35: [2, 46], 39: [2, 46]},
			{18: [1, 70]},
			{5: [2, 22], 14: [2, 22], 15: [2, 22], 16: [2, 22], 19: [2, 22], 20: [2, 22], 22: [2, 22], 23: [2, 22], 24: [2, 22]},
			{18: [2, 39], 35: [2, 39]},
			{18: [2, 40], 35: [2, 40]},
			{18: [2, 41], 35: [2, 41]},
			{18: [2, 42], 35: [2, 42]},
			{18: [2, 43], 35: [2, 43]},
			{5: [2, 18], 14: [2, 18], 15: [2, 18], 16: [2, 18], 19: [2, 18], 20: [2, 18], 22: [2, 18], 23: [2, 18], 24: [2, 18]}
		],
		defaultActions: {17: [2, 1], 25: [2, 28], 38: [2, 26], 57: [2, 24]},
		parseError: function parseError(str, hash) {
			throw new Error(str);
		},
		parse: function parse(input) {
			var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
			this.lexer.setInput(input);
			this.lexer.yy = this.yy;
			this.yy.lexer = this.lexer;
			this.yy.parser = this;
			if (typeof this.lexer.yylloc == "undefined")
				this.lexer.yylloc = {};
			var yyloc = this.lexer.yylloc;
			lstack.push(yyloc);
			var ranges = this.lexer.options && this.lexer.options.ranges;
			if (typeof this.yy.parseError === "function")
				this.parseError = this.yy.parseError;
			function popStack(n) {
				stack.length = stack.length - 2 * n;
				vstack.length = vstack.length - n;
				lstack.length = lstack.length - n;
			}

			function lex() {
				var token;
				token = self.lexer.lex() || 1;
				if (typeof token !== "number") {
					token = self.symbols_[token] || token;
				}
				return token;
			}

			var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
			while (true) {
				state = stack[stack.length - 1];
				if (this.defaultActions[state]) {
					action = this.defaultActions[state];
				} else {
					if (symbol === null || typeof symbol == "undefined") {
						symbol = lex();
					}
					action = table[state] && table[state][symbol];
				}
				if (typeof action === "undefined" || !action.length || !action[0]) {
					var errStr = "";
					if (!recovering) {
						expected = [];
						for (p in table[state])
							if (this.terminals_[p] && p > 2) {
								expected.push("'" + this.terminals_[p] + "'");
							}
						if (this.lexer.showPosition) {
							errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
						} else {
							errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
						}
						this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
					}
				}
				if (action[0] instanceof Array && action.length > 1) {
					throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
				}
				switch (action[0]) {
					case 1:
						stack.push(symbol);
						vstack.push(this.lexer.yytext);
						lstack.push(this.lexer.yylloc);
						stack.push(action[1]);
						symbol = null;
						if (!preErrorSymbol) {
							yyleng = this.lexer.yyleng;
							yytext = this.lexer.yytext;
							yylineno = this.lexer.yylineno;
							yyloc = this.lexer.yylloc;
							if (recovering > 0)
								recovering--;
						} else {
							symbol = preErrorSymbol;
							preErrorSymbol = null;
						}
						break;
					case 2:
						len = this.productions_[action[1]][1];
						yyval.$ = vstack[vstack.length - len];
						yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
						if (ranges) {
							yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
						}
						r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
						if (typeof r !== "undefined") {
							return r;
						}
						if (len) {
							stack = stack.slice(0, -1 * len * 2);
							vstack = vstack.slice(0, -1 * len);
							lstack = lstack.slice(0, -1 * len);
						}
						stack.push(this.productions_[action[1]][0]);
						vstack.push(yyval.$);
						lstack.push(yyval._$);
						newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
						stack.push(newState);
						break;
					case 3:
						return true;
				}
			}
			return true;
		}
	};
	/* Jison generated lexer */
	var lexer = (function () {
		var lexer = ({EOF: 1,
			parseError: function parseError(str, hash) {
				if (this.yy.parser) {
					this.yy.parser.parseError(str, hash);
				} else {
					throw new Error(str);
				}
			},
			setInput: function (input) {
				this._input = input;
				this._more = this._less = this.done = false;
				this.yylineno = this.yyleng = 0;
				this.yytext = this.matched = this.match = '';
				this.conditionStack = ['INITIAL'];
				this.yylloc = {first_line: 1, first_column: 0, last_line: 1, last_column: 0};
				if (this.options.ranges) this.yylloc.range = [0, 0];
				this.offset = 0;
				return this;
			},
			input: function () {
				var ch = this._input[0];
				this.yytext += ch;
				this.yyleng++;
				this.offset++;
				this.match += ch;
				this.matched += ch;
				var lines = ch.match(/(?:\r\n?|\n).*/g);
				if (lines) {
					this.yylineno++;
					this.yylloc.last_line++;
				} else {
					this.yylloc.last_column++;
				}
				if (this.options.ranges) this.yylloc.range[1]++;

				this._input = this._input.slice(1);
				return ch;
			},
			unput: function (ch) {
				var len = ch.length;
				var lines = ch.split(/(?:\r\n?|\n)/g);

				this._input = ch + this._input;
				this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
				//this.yyleng -= len;
				this.offset -= len;
				var oldLines = this.match.split(/(?:\r\n?|\n)/g);
				this.match = this.match.substr(0, this.match.length - 1);
				this.matched = this.matched.substr(0, this.matched.length - 1);

				if (lines.length - 1) this.yylineno -= lines.length - 1;
				var r = this.yylloc.range;

				this.yylloc = {first_line: this.yylloc.first_line,
					last_line: this.yylineno + 1,
					first_column: this.yylloc.first_column,
					last_column: lines ?
						(lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length :
						this.yylloc.first_column - len
				};

				if (this.options.ranges) {
					this.yylloc.range = [r[0], r[0] + this.yyleng - len];
				}
				return this;
			},
			more: function () {
				this._more = true;
				return this;
			},
			less: function (n) {
				this.unput(this.match.slice(n));
			},
			pastInput: function () {
				var past = this.matched.substr(0, this.matched.length - this.match.length);
				return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, "");
			},
			upcomingInput: function () {
				var next = this.match;
				if (next.length < 20) {
					next += this._input.substr(0, 20 - next.length);
				}
				return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
			},
			showPosition: function () {
				var pre = this.pastInput();
				var c = new Array(pre.length + 1).join("-");
				return pre + this.upcomingInput() + "\n" + c + "^";
			},
			next: function () {
				if (this.done) {
					return this.EOF;
				}
				if (!this._input) this.done = true;

				var token,
					match,
					tempMatch,
					index,
					col,
					lines;
				if (!this._more) {
					this.yytext = '';
					this.match = '';
				}
				var rules = this._currentRules();
				for (var i = 0; i < rules.length; i++) {
					tempMatch = this._input.match(this.rules[rules[i]]);
					if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
						match = tempMatch;
						index = i;
						if (!this.options.flex) break;
					}
				}
				if (match) {
					lines = match[0].match(/(?:\r\n?|\n).*/g);
					if (lines) this.yylineno += lines.length;
					this.yylloc = {first_line: this.yylloc.last_line,
						last_line: this.yylineno + 1,
						first_column: this.yylloc.last_column,
						last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
					this.yytext += match[0];
					this.match += match[0];
					this.matches = match;
					this.yyleng = this.yytext.length;
					if (this.options.ranges) {
						this.yylloc.range = [this.offset, this.offset += this.yyleng];
					}
					this._more = false;
					this._input = this._input.slice(match[0].length);
					this.matched += match[0];
					token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
					if (this.done && this._input) this.done = false;
					if (token) return token;
					else return;
				}
				if (this._input === "") {
					return this.EOF;
				} else {
					return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(),
						{text: "", token: null, line: this.yylineno});
				}
			},
			lex: function lex() {
				var r = this.next();
				if (typeof r !== 'undefined') {
					return r;
				} else {
					return this.lex();
				}
			},
			begin: function begin(condition) {
				this.conditionStack.push(condition);
			},
			popState: function popState() {
				return this.conditionStack.pop();
			},
			_currentRules: function _currentRules() {
				return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
			},
			topState: function () {
				return this.conditionStack[this.conditionStack.length - 2];
			},
			pushState: function begin(condition) {
				this.begin(condition);
			}});
		lexer.options = {};
		lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

			var YYSTATE = YY_START
			switch ($avoiding_name_collisions) {
				case 0:
					if (yy_.yytext.slice(-1) !== "\\") this.begin("mu");
					if (yy_.yytext.slice(-1) === "\\") yy_.yytext = yy_.yytext.substr(0, yy_.yyleng - 1), this.begin("emu");
					if (yy_.yytext) return 14;

					break;
				case 1:
					return 14;
					break;
				case 2:
					if (yy_.yytext.slice(-1) !== "\\") this.popState();
					if (yy_.yytext.slice(-1) === "\\") yy_.yytext = yy_.yytext.substr(0, yy_.yyleng - 1);
					return 14;

					break;
				case 3:
					yy_.yytext = yy_.yytext.substr(0, yy_.yyleng - 4);
					this.popState();
					return 15;
					break;
				case 4:
					this.begin("par");
					return 24;
					break;
				case 5:
					return 16;
					break;
				case 6:
					return 20;
					break;
				case 7:
					return 19;
					break;
				case 8:
					return 19;
					break;
				case 9:
					return 23;
					break;
				case 10:
					return 23;
					break;
				case 11:
					this.popState();
					this.begin('com');
					break;
				case 12:
					yy_.yytext = yy_.yytext.substr(3, yy_.yyleng - 5);
					this.popState();
					return 15;
					break;
				case 13:
					return 22;
					break;
				case 14:
					return 36;
					break;
				case 15:
					return 35;
					break;
				case 16:
					return 35;
					break;
				case 17:
					return 39;
					break;
				case 18: /*ignore whitespace*/
					break;
				case 19:
					this.popState();
					return 18;
					break;
				case 20:
					this.popState();
					return 18;
					break;
				case 21:
					yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2).replace(/\\"/g, '"');
					return 30;
					break;
				case 22:
					yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2).replace(/\\'/g, "'");
					return 30;
					break;
				case 23:
					yy_.yytext = yy_.yytext.substr(1);
					return 28;
					break;
				case 24:
					return 32;
					break;
				case 25:
					return 32;
					break;
				case 26:
					return 31;
					break;
				case 27:
					return 35;
					break;
				case 28:
					yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2);
					return 35;
					break;
				case 29:
					return 'INVALID';
					break;
				case 30: /*ignore whitespace*/
					break;
				case 31:
					this.popState();
					return 37;
					break;
				case 32:
					return 5;
					break;
			}
		};
		lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|$)))/, /^(?:[\s\S]*?--\}\})/, /^(?:\{\{>)/, /^(?:\{\{#)/, /^(?:\{\{\/)/, /^(?:\{\{\^)/, /^(?:\{\{\s*else\b)/, /^(?:\{\{\{)/, /^(?:\{\{&)/, /^(?:\{\{!--)/, /^(?:\{\{![\s\S]*?\}\})/, /^(?:\{\{)/, /^(?:=)/, /^(?:\.(?=[} ]))/, /^(?:\.\.)/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}\}\})/, /^(?:\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@[a-zA-Z]+)/, /^(?:true(?=[}\s]))/, /^(?:false(?=[}\s]))/, /^(?:[0-9]+(?=[}\s]))/, /^(?:[a-zA-Z0-9_$-]+(?=[=}\s\/.]))/, /^(?:\[[^\]]*\])/, /^(?:.)/, /^(?:\s+)/, /^(?:[a-zA-Z0-9_$-/]+)/, /^(?:$)/];
		lexer.conditions = {"mu": {"rules": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32], "inclusive": false}, "emu": {"rules": [2], "inclusive": false}, "com": {"rules": [3], "inclusive": false}, "par": {"rules": [30, 31], "inclusive": false}, "INITIAL": {"rules": [0, 1, 32], "inclusive": true}};
		return lexer;
	})()
	parser.lexer = lexer;
	function Parser() {
		this.yy = {};
	}

	Parser.prototype = parser;
	parser.Parser = Parser;
	return new Parser;
})();
;
// lib/handlebars/compiler/base.js
Handlebars.Parser = handlebars;

Handlebars.parse = function (input) {

	// Just return if an already-compile AST was passed in.
	if (input.constructor === Handlebars.AST.ProgramNode) {
		return input;
	}

	Handlebars.Parser.yy = Handlebars.AST;
	return Handlebars.Parser.parse(input);
};

Handlebars.print = function (ast) {
	return new Handlebars.PrintVisitor().accept(ast);
};
;
// lib/handlebars/compiler/ast.js
(function () {

	Handlebars.AST = {};

	Handlebars.AST.ProgramNode = function (statements, inverse) {
		this.type = "program";
		this.statements = statements;
		if (inverse) {
			this.inverse = new Handlebars.AST.ProgramNode(inverse);
		}
	};

	Handlebars.AST.MustacheNode = function (rawParams, hash, unescaped) {
		this.type = "mustache";
		this.escaped = !unescaped;
		this.hash = hash;

		var id = this.id = rawParams[0];
		var params = this.params = rawParams.slice(1);

		// a mustache is an eligible helper if:
		// * its id is simple (a single part, not `this` or `..`)
		var eligibleHelper = this.eligibleHelper = id.isSimple;

		// a mustache is definitely a helper if:
		// * it is an eligible helper, and
		// * it has at least one parameter or hash segment
		this.isHelper = eligibleHelper && (params.length || hash);

		// if a mustache is an eligible helper but not a definite
		// helper, it is ambiguous, and will be resolved in a later
		// pass or at runtime.
	};

	Handlebars.AST.PartialNode = function (partialName, context) {
		this.type = "partial";
		this.partialName = partialName;
		this.context = context;
	};

	var verifyMatch = function (open, close) {
		if (open.original !== close.original) {
			throw new Handlebars.Exception(open.original + " doesn't match " + close.original);
		}
	};

	Handlebars.AST.BlockNode = function (mustache, program, inverse, close) {
		verifyMatch(mustache.id, close);
		this.type = "block";
		this.mustache = mustache;
		this.program = program;
		this.inverse = inverse;

		if (this.inverse && !this.program) {
			this.isInverse = true;
		}
	};

	Handlebars.AST.ContentNode = function (string) {
		this.type = "content";
		this.string = string;
	};

	Handlebars.AST.HashNode = function (pairs) {
		this.type = "hash";
		this.pairs = pairs;
	};

	Handlebars.AST.IdNode = function (parts) {
		this.type = "ID";
		this.original = parts.join(".");

		var dig = [], depth = 0;

		for (var i = 0, l = parts.length; i < l; i++) {
			var part = parts[i];

			if (part === ".." || part === "." || part === "this") {
				if (dig.length > 0) {
					throw new Handlebars.Exception("Invalid path: " + this.original);
				}
				else if (part === "..") {
					depth++;
				}
				else {
					this.isScoped = true;
				}
			}
			else {
				dig.push(part);
			}
		}

		this.parts = dig;
		this.string = dig.join('.');
		this.depth = depth;

		// an ID is simple if it only has one part, and that part is not
		// `..` or `this`.
		this.isSimple = parts.length === 1 && !this.isScoped && depth === 0;

		this.stringModeValue = this.string;
	};

	Handlebars.AST.PartialNameNode = function (name) {
		this.type = "PARTIAL_NAME";
		this.name = name;
	};

	Handlebars.AST.DataNode = function (id) {
		this.type = "DATA";
		this.id = id;
	};

	Handlebars.AST.StringNode = function (string) {
		this.type = "STRING";
		this.string = string;
		this.stringModeValue = string;
	};

	Handlebars.AST.IntegerNode = function (integer) {
		this.type = "INTEGER";
		this.integer = integer;
		this.stringModeValue = Number(integer);
	};

	Handlebars.AST.BooleanNode = function (bool) {
		this.type = "BOOLEAN";
		this.bool = bool;
		this.stringModeValue = bool === "true";
	};

	Handlebars.AST.CommentNode = function (comment) {
		this.type = "comment";
		this.comment = comment;
	};

})();
;
// lib/handlebars/utils.js

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

Handlebars.Exception = function (message) {
	var tmp = Error.prototype.constructor.apply(this, arguments);

	// Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
	for (var idx = 0; idx < errorProps.length; idx++) {
		this[errorProps[idx]] = tmp[errorProps[idx]];
	}
};
Handlebars.Exception.prototype = new Error();

// Build out our basic SafeString type
Handlebars.SafeString = function (string) {
	this.string = string;
};
Handlebars.SafeString.prototype.toString = function () {
	return this.string.toString();
};

(function () {
	var escape = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#x27;",
		"`": "&#x60;"
	};

	var badChars = /[&<>"'`]/g;
	var possible = /[&<>"'`]/;

	var escapeChar = function (chr) {
		return escape[chr] || "&amp;";
	};

	Handlebars.Utils = {
		escapeExpression: function (string) {
			// don't escape SafeStrings, since they're already safe
			if (string instanceof Handlebars.SafeString) {
				return string.toString();
			} else if (string == null || string === false) {
				return "";
			}

			if (!possible.test(string)) {
				return string;
			}
			return string.replace(badChars, escapeChar);
		},

		isEmpty: function (value) {
			if (!value && value !== 0) {
				return true;
			} else if (Object.prototype.toString.call(value) === "[object Array]" && value.length === 0) {
				return true;
			} else {
				return false;
			}
		}
	};
})();
;
// lib/handlebars/compiler/compiler.js

/*jshint eqnull:true*/
Handlebars.Compiler = function () {
};
Handlebars.JavaScriptCompiler = function () {
};

(function (Compiler, JavaScriptCompiler) {
	// the foundHelper register will disambiguate helper lookup from finding a
	// function in a context. This is necessary for mustache compatibility, which
	// requires that context functions in blocks are evaluated by blockHelperMissing,
	// and then proceed as if the resulting value was provided to blockHelperMissing.

	Compiler.prototype = {
		compiler: Compiler,

		disassemble: function () {
			var opcodes = this.opcodes, opcode, out = [], params, param;

			for (var i = 0, l = opcodes.length; i < l; i++) {
				opcode = opcodes[i];

				if (opcode.opcode === 'DECLARE') {
					out.push("DECLARE " + opcode.name + "=" + opcode.value);
				} else {
					params = [];
					for (var j = 0; j < opcode.args.length; j++) {
						param = opcode.args[j];
						if (typeof param === "string") {
							param = "\"" + param.replace("\n", "\\n") + "\"";
						}
						params.push(param);
					}
					out.push(opcode.opcode + " " + params.join(" "));
				}
			}

			return out.join("\n");
		},
		equals: function (other) {
			var len = this.opcodes.length;
			if (other.opcodes.length !== len) {
				return false;
			}

			for (var i = 0; i < len; i++) {
				var opcode = this.opcodes[i],
					otherOpcode = other.opcodes[i];
				if (opcode.opcode !== otherOpcode.opcode || opcode.args.length !== otherOpcode.args.length) {
					return false;
				}
				for (var j = 0; j < opcode.args.length; j++) {
					if (opcode.args[j] !== otherOpcode.args[j]) {
						return false;
					}
				}
			}
			return true;
		},

		guid: 0,

		compile: function (program, options) {
			this.children = [];
			this.depths = {list: []};
			this.options = options;

			// These changes will propagate to the other compiler components
			var knownHelpers = this.options.knownHelpers;
			this.options.knownHelpers = {
				'helperMissing': true,
				'blockHelperMissing': true,
				'each': true,
				'if': true,
				'unless': true,
				'with': true,
				'log': true
			};
			if (knownHelpers) {
				for (var name in knownHelpers) {
					this.options.knownHelpers[name] = knownHelpers[name];
				}
			}

			return this.program(program);
		},

		accept: function (node) {
			return this[node.type](node);
		},

		program: function (program) {
			var statements = program.statements, statement;
			this.opcodes = [];

			for (var i = 0, l = statements.length; i < l; i++) {
				statement = statements[i];
				this[statement.type](statement);
			}
			this.isSimple = l === 1;

			this.depths.list = this.depths.list.sort(function (a, b) {
				return a - b;
			});

			return this;
		},

		compileProgram: function (program) {
			var result = new this.compiler().compile(program, this.options);
			var guid = this.guid++, depth;

			this.usePartial = this.usePartial || result.usePartial;

			this.children[guid] = result;

			for (var i = 0, l = result.depths.list.length; i < l; i++) {
				depth = result.depths.list[i];

				if (depth < 2) {
					continue;
				}
				else {
					this.addDepth(depth - 1);
				}
			}

			return guid;
		},

		block: function (block) {
			var mustache = block.mustache,
				program = block.program,
				inverse = block.inverse;

			if (program) {
				program = this.compileProgram(program);
			}

			if (inverse) {
				inverse = this.compileProgram(inverse);
			}

			var type = this.classifyMustache(mustache);

			if (type === "helper") {
				this.helperMustache(mustache, program, inverse);
			} else if (type === "simple") {
				this.simpleMustache(mustache);

				// now that the simple mustache is resolved, we need to
				// evaluate it by executing `blockHelperMissing`
				this.opcode('pushProgram', program);
				this.opcode('pushProgram', inverse);
				this.opcode('emptyHash');
				this.opcode('blockValue');
			} else {
				this.ambiguousMustache(mustache, program, inverse);

				// now that the simple mustache is resolved, we need to
				// evaluate it by executing `blockHelperMissing`
				this.opcode('pushProgram', program);
				this.opcode('pushProgram', inverse);
				this.opcode('emptyHash');
				this.opcode('ambiguousBlockValue');
			}

			this.opcode('append');
		},

		hash: function (hash) {
			var pairs = hash.pairs, pair, val;

			this.opcode('pushHash');

			for (var i = 0, l = pairs.length; i < l; i++) {
				pair = pairs[i];
				val = pair[1];

				if (this.options.stringParams) {
					this.opcode('pushStringParam', val.stringModeValue, val.type);
				} else {
					this.accept(val);
				}

				this.opcode('assignToHash', pair[0]);
			}
			this.opcode('popHash');
		},

		partial: function (partial) {
			var partialName = partial.partialName;
			this.usePartial = true;

			if (partial.context) {
				this.ID(partial.context);
			} else {
				this.opcode('push', 'depth0');
			}

			this.opcode('invokePartial', partialName.name);
			this.opcode('append');
		},

		content: function (content) {
			this.opcode('appendContent', content.string);
		},

		mustache: function (mustache) {
			var options = this.options;
			var type = this.classifyMustache(mustache);

			if (type === "simple") {
				this.simpleMustache(mustache);
			} else if (type === "helper") {
				this.helperMustache(mustache);
			} else {
				this.ambiguousMustache(mustache);
			}

			if (mustache.escaped && !options.noEscape) {
				this.opcode('appendEscaped');
			} else {
				this.opcode('append');
			}
		},

		ambiguousMustache: function (mustache, program, inverse) {
			var id = mustache.id,
				name = id.parts[0],
				isBlock = program != null || inverse != null;

			this.opcode('getContext', id.depth);

			this.opcode('pushProgram', program);
			this.opcode('pushProgram', inverse);

			this.opcode('invokeAmbiguous', name, isBlock);
		},

		simpleMustache: function (mustache) {
			var id = mustache.id;

			if (id.type === 'DATA') {
				this.DATA(id);
			} else if (id.parts.length) {
				this.ID(id);
			} else {
				// Simplified ID for `this`
				this.addDepth(id.depth);
				this.opcode('getContext', id.depth);
				this.opcode('pushContext');
			}

			this.opcode('resolvePossibleLambda');
		},

		helperMustache: function (mustache, program, inverse) {
			var params = this.setupFullMustacheParams(mustache, program, inverse),
				name = mustache.id.parts[0];

			if (this.options.knownHelpers[name]) {
				this.opcode('invokeKnownHelper', params.length, name);
			} else if (this.knownHelpersOnly) {
				throw new Error("You specified knownHelpersOnly, but used the unknown helper " + name);
			} else {
				this.opcode('invokeHelper', params.length, name);
			}
		},

		ID: function (id) {
			this.addDepth(id.depth);
			this.opcode('getContext', id.depth);

			var name = id.parts[0];
			if (!name) {
				this.opcode('pushContext');
			} else {
				this.opcode('lookupOnContext', id.parts[0]);
			}

			for (var i = 1, l = id.parts.length; i < l; i++) {
				this.opcode('lookup', id.parts[i]);
			}
		},

		DATA: function (data) {
			this.options.data = true;
			this.opcode('lookupData', data.id);
		},

		STRING: function (string) {
			this.opcode('pushString', string.string);
		},

		INTEGER: function (integer) {
			this.opcode('pushLiteral', integer.integer);
		},

		BOOLEAN: function (bool) {
			this.opcode('pushLiteral', bool.bool);
		},

		comment: function () {
		},

		// HELPERS
		opcode: function (name) {
			this.opcodes.push({ opcode: name, args: [].slice.call(arguments, 1) });
		},

		declare: function (name, value) {
			this.opcodes.push({ opcode: 'DECLARE', name: name, value: value });
		},

		addDepth: function (depth) {
			if (isNaN(depth)) {
				throw new Error("EWOT");
			}
			if (depth === 0) {
				return;
			}

			if (!this.depths[depth]) {
				this.depths[depth] = true;
				this.depths.list.push(depth);
			}
		},

		classifyMustache: function (mustache) {
			var isHelper = mustache.isHelper;
			var isEligible = mustache.eligibleHelper;
			var options = this.options;

			// if ambiguous, we can possibly resolve the ambiguity now
			if (isEligible && !isHelper) {
				var name = mustache.id.parts[0];

				if (options.knownHelpers[name]) {
					isHelper = true;
				} else if (options.knownHelpersOnly) {
					isEligible = false;
				}
			}

			if (isHelper) {
				return "helper";
			}
			else if (isEligible) {
				return "ambiguous";
			}
			else {
				return "simple";
			}
		},

		pushParams: function (params) {
			var i = params.length, param;

			while (i--) {
				param = params[i];

				if (this.options.stringParams) {
					if (param.depth) {
						this.addDepth(param.depth);
					}

					this.opcode('getContext', param.depth || 0);
					this.opcode('pushStringParam', param.stringModeValue, param.type);
				} else {
					this[param.type](param);
				}
			}
		},

		setupMustacheParams: function (mustache) {
			var params = mustache.params;
			this.pushParams(params);

			if (mustache.hash) {
				this.hash(mustache.hash);
			} else {
				this.opcode('emptyHash');
			}

			return params;
		},

		// this will replace setupMustacheParams when we're done
		setupFullMustacheParams: function (mustache, program, inverse) {
			var params = mustache.params;
			this.pushParams(params);

			this.opcode('pushProgram', program);
			this.opcode('pushProgram', inverse);

			if (mustache.hash) {
				this.hash(mustache.hash);
			} else {
				this.opcode('emptyHash');
			}

			return params;
		}
	};

	var Literal = function (value) {
		this.value = value;
	};

	JavaScriptCompiler.prototype = {
		// PUBLIC API: You can override these methods in a subclass to provide
		// alternative compiled forms for name lookup and buffering semantics
		nameLookup: function (parent, name /* , type*/) {
			if (/^[0-9]+$/.test(name)) {
				return parent + "[" + name + "]";
			} else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
				return parent + "." + name;
			}
			else {
				return parent + "['" + name + "']";
			}
		},

		appendToBuffer: function (string) {
			if (this.environment.isSimple) {
				return "return " + string + ";";
			} else {
				return {
					appendToBuffer: true,
					content: string,
					toString: function () {
						return "buffer += " + string + ";";
					}
				};
			}
		},

		initializeBuffer: function () {
			return this.quotedString("");
		},

		namespace: "Handlebars",
		// END PUBLIC API

		compile: function (environment, options, context, asObject) {
			this.environment = environment;
			this.options = options || {};

			Handlebars.log(Handlebars.logger.DEBUG, this.environment.disassemble() + "\n\n");

			this.name = this.environment.name;
			this.isChild = !!context;
			this.context = context || {
				programs: [],
				environments: [],
				aliases: { }
			};

			this.preamble();

			this.stackSlot = 0;
			this.stackVars = [];
			this.registers = { list: [] };
			this.compileStack = [];
			this.inlineStack = [];

			this.compileChildren(environment, options);

			var opcodes = environment.opcodes, opcode;

			this.i = 0;

			for (l = opcodes.length; this.i < l; this.i++) {
				opcode = opcodes[this.i];

				if (opcode.opcode === 'DECLARE') {
					this[opcode.name] = opcode.value;
				} else {
					this[opcode.opcode].apply(this, opcode.args);
				}
			}

			return this.createFunctionContext(asObject);
		},

		nextOpcode: function () {
			var opcodes = this.environment.opcodes;
			return opcodes[this.i + 1];
		},

		eat: function () {
			this.i = this.i + 1;
		},

		preamble: function () {
			var out = [];

			if (!this.isChild) {
				var namespace = this.namespace;
				var copies = "helpers = helpers || " + namespace + ".helpers;";
				if (this.environment.usePartial) {
					copies = copies + " partials = partials || " + namespace + ".partials;";
				}
				if (this.options.data) {
					copies = copies + " data = data || {};";
				}
				out.push(copies);
			} else {
				out.push('');
			}

			if (!this.environment.isSimple) {
				out.push(", buffer = " + this.initializeBuffer());
			} else {
				out.push("");
			}

			// track the last context pushed into place to allow skipping the
			// getContext opcode when it would be a noop
			this.lastContext = 0;
			this.source = out;
		},

		createFunctionContext: function (asObject) {
			var locals = this.stackVars.concat(this.registers.list);

			if (locals.length > 0) {
				this.source[1] = this.source[1] + ", " + locals.join(", ");
			}

			// Generate minimizer alias mappings
			if (!this.isChild) {
				for (var alias in this.context.aliases) {
					this.source[1] = this.source[1] + ', ' + alias + '=' + this.context.aliases[alias];
				}
			}

			if (this.source[1]) {
				this.source[1] = "var " + this.source[1].substring(2) + ";";
			}

			// Merge children
			if (!this.isChild) {
				this.source[1] += '\n' + this.context.programs.join('\n') + '\n';
			}

			if (!this.environment.isSimple) {
				this.source.push("return buffer;");
			}

			var params = this.isChild ? ["depth0", "data"] : ["Handlebars", "depth0", "helpers", "partials", "data"];

			for (var i = 0, l = this.environment.depths.list.length; i < l; i++) {
				params.push("depth" + this.environment.depths.list[i]);
			}

			// Perform a second pass over the output to merge content when possible
			var source = this.mergeSource();

			if (!this.isChild) {
				var revision = Handlebars.COMPILER_REVISION,
					versions = Handlebars.REVISION_CHANGES[revision];
				source = "this.compilerInfo = [" + revision + ",'" + versions + "'];\n" + source;
			}

			if (asObject) {
				params.push(source);

				return Function.apply(this, params);
			} else {
				var functionSource = 'function ' + (this.name || '') + '(' + params.join(',') + ') {\n  ' + source + '}';
				Handlebars.log(Handlebars.logger.DEBUG, functionSource + "\n\n");
				return functionSource;
			}
		},
		mergeSource: function () {
			// WARN: We are not handling the case where buffer is still populated as the source should
			// not have buffer append operations as their final action.
			var source = '',
				buffer;
			for (var i = 0, len = this.source.length; i < len; i++) {
				var line = this.source[i];
				if (line.appendToBuffer) {
					if (buffer) {
						buffer = buffer + '\n    + ' + line.content;
					} else {
						buffer = line.content;
					}
				} else {
					if (buffer) {
						source += 'buffer += ' + buffer + ';\n  ';
						buffer = undefined;
					}
					source += line + '\n  ';
				}
			}
			return source;
		},

		// [blockValue]
		//
		// On stack, before: hash, inverse, program, value
		// On stack, after: return value of blockHelperMissing
		//
		// The purpose of this opcode is to take a block of the form
		// `{{#foo}}...{{/foo}}`, resolve the value of `foo`, and
		// replace it on the stack with the result of properly
		// invoking blockHelperMissing.
		blockValue: function () {
			this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

			var params = ["depth0"];
			this.setupParams(0, params);

			this.replaceStack(function (current) {
				params.splice(1, 0, current);
				return "blockHelperMissing.call(" + params.join(", ") + ")";
			});
		},

		// [ambiguousBlockValue]
		//
		// On stack, before: hash, inverse, program, value
		// Compiler value, before: lastHelper=value of last found helper, if any
		// On stack, after, if no lastHelper: same as [blockValue]
		// On stack, after, if lastHelper: value
		ambiguousBlockValue: function () {
			this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

			var params = ["depth0"];
			this.setupParams(0, params);

			var current = this.topStack();
			params.splice(1, 0, current);

			// Use the options value generated from the invocation
			params[params.length - 1] = 'options';

			this.source.push("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
		},

		// [appendContent]
		//
		// On stack, before: ...
		// On stack, after: ...
		//
		// Appends the string value of `content` to the current buffer
		appendContent: function (content) {
			this.source.push(this.appendToBuffer(this.quotedString(content)));
		},

		// [append]
		//
		// On stack, before: value, ...
		// On stack, after: ...
		//
		// Coerces `value` to a String and appends it to the current buffer.
		//
		// If `value` is truthy, or 0, it is coerced into a string and appended
		// Otherwise, the empty string is appended
		append: function () {
			// Force anything that is inlined onto the stack so we don't have duplication
			// when we examine local
			this.flushInline();
			var local = this.popStack();
			this.source.push("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
			if (this.environment.isSimple) {
				this.source.push("else { " + this.appendToBuffer("''") + " }");
			}
		},

		// [appendEscaped]
		//
		// On stack, before: value, ...
		// On stack, after: ...
		//
		// Escape `value` and append it to the buffer
		appendEscaped: function () {
			this.context.aliases.escapeExpression = 'this.escapeExpression';

			this.source.push(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"));
		},

		// [getContext]
		//
		// On stack, before: ...
		// On stack, after: ...
		// Compiler value, after: lastContext=depth
		//
		// Set the value of the `lastContext` compiler value to the depth
		getContext: function (depth) {
			if (this.lastContext !== depth) {
				this.lastContext = depth;
			}
		},

		// [lookupOnContext]
		//
		// On stack, before: ...
		// On stack, after: currentContext[name], ...
		//
		// Looks up the value of `name` on the current context and pushes
		// it onto the stack.
		lookupOnContext: function (name) {
			this.push(this.nameLookup('depth' + this.lastContext, name, 'context'));
		},

		// [pushContext]
		//
		// On stack, before: ...
		// On stack, after: currentContext, ...
		//
		// Pushes the value of the current context onto the stack.
		pushContext: function () {
			this.pushStackLiteral('depth' + this.lastContext);
		},

		// [resolvePossibleLambda]
		//
		// On stack, before: value, ...
		// On stack, after: resolved value, ...
		//
		// If the `value` is a lambda, replace it on the stack by
		// the return value of the lambda
		resolvePossibleLambda: function () {
			this.context.aliases.functionType = '"function"';

			this.replaceStack(function (current) {
				return "typeof " + current + " === functionType ? " + current + ".apply(depth0) : " + current;
			});
		},

		// [lookup]
		//
		// On stack, before: value, ...
		// On stack, after: value[name], ...
		//
		// Replace the value on the stack with the result of looking
		// up `name` on `value`
		lookup: function (name) {
			this.replaceStack(function (current) {
				return current + " == null || " + current + " === false ? " + current + " : " + this.nameLookup(current, name, 'context');
			});
		},

		// [lookupData]
		//
		// On stack, before: ...
		// On stack, after: data[id], ...
		//
		// Push the result of looking up `id` on the current data
		lookupData: function (id) {
			this.push(this.nameLookup('data', id, 'data'));
		},

		// [pushStringParam]
		//
		// On stack, before: ...
		// On stack, after: string, currentContext, ...
		//
		// This opcode is designed for use in string mode, which
		// provides the string value of a parameter along with its
		// depth rather than resolving it immediately.
		pushStringParam: function (string, type) {
			this.pushStackLiteral('depth' + this.lastContext);

			this.pushString(type);

			if (typeof string === 'string') {
				this.pushString(string);
			} else {
				this.pushStackLiteral(string);
			}
		},

		emptyHash: function () {
			this.pushStackLiteral('{}');

			if (this.options.stringParams) {
				this.register('hashTypes', '{}');
			}
		},
		pushHash: function () {
			this.hash = {values: [], types: []};
		},
		popHash: function () {
			var hash = this.hash;
			this.hash = undefined;

			if (this.options.stringParams) {
				this.register('hashTypes', '{' + hash.types.join(',') + '}');
			}
			this.push('{\n    ' + hash.values.join(',\n    ') + '\n  }');
		},

		// [pushString]
		//
		// On stack, before: ...
		// On stack, after: quotedString(string), ...
		//
		// Push a quoted version of `string` onto the stack
		pushString: function (string) {
			this.pushStackLiteral(this.quotedString(string));
		},

		// [push]
		//
		// On stack, before: ...
		// On stack, after: expr, ...
		//
		// Push an expression onto the stack
		push: function (expr) {
			this.inlineStack.push(expr);
			return expr;
		},

		// [pushLiteral]
		//
		// On stack, before: ...
		// On stack, after: value, ...
		//
		// Pushes a value onto the stack. This operation prevents
		// the compiler from creating a temporary variable to hold
		// it.
		pushLiteral: function (value) {
			this.pushStackLiteral(value);
		},

		// [pushProgram]
		//
		// On stack, before: ...
		// On stack, after: program(guid), ...
		//
		// Push a program expression onto the stack. This takes
		// a compile-time guid and converts it into a runtime-accessible
		// expression.
		pushProgram: function (guid) {
			if (guid != null) {
				this.pushStackLiteral(this.programExpression(guid));
			} else {
				this.pushStackLiteral(null);
			}
		},

		// [invokeHelper]
		//
		// On stack, before: hash, inverse, program, params..., ...
		// On stack, after: result of helper invocation
		//
		// Pops off the helper's parameters, invokes the helper,
		// and pushes the helper's return value onto the stack.
		//
		// If the helper is not found, `helperMissing` is called.
		invokeHelper: function (paramSize, name) {
			this.context.aliases.helperMissing = 'helpers.helperMissing';

			var helper = this.lastHelper = this.setupHelper(paramSize, name, true);

			this.push(helper.name);
			this.replaceStack(function (name) {
				return name + ' ? ' + name + '.call(' +
					helper.callParams + ") " + ": helperMissing.call(" +
					helper.helperMissingParams + ")";
			});
		},

		// [invokeKnownHelper]
		//
		// On stack, before: hash, inverse, program, params..., ...
		// On stack, after: result of helper invocation
		//
		// This operation is used when the helper is known to exist,
		// so a `helperMissing` fallback is not required.
		invokeKnownHelper: function (paramSize, name) {
			var helper = this.setupHelper(paramSize, name);
			this.push(helper.name + ".call(" + helper.callParams + ")");
		},

		// [invokeAmbiguous]
		//
		// On stack, before: hash, inverse, program, params..., ...
		// On stack, after: result of disambiguation
		//
		// This operation is used when an expression like `{{foo}}`
		// is provided, but we don't know at compile-time whether it
		// is a helper or a path.
		//
		// This operation emits more code than the other options,
		// and can be avoided by passing the `knownHelpers` and
		// `knownHelpersOnly` flags at compile-time.
		invokeAmbiguous: function (name, helperCall) {
			this.context.aliases.functionType = '"function"';

			this.pushStackLiteral('{}');    // Hash value
			var helper = this.setupHelper(0, name, helperCall);

			var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

			var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');
			var nextStack = this.nextStack();

			this.source.push('if (' + nextStack + ' = ' + helperName + ') { ' + nextStack + ' = ' + nextStack + '.call(' + helper.callParams + '); }');
			this.source.push('else { ' + nextStack + ' = ' + nonHelper + '; ' + nextStack + ' = typeof ' + nextStack + ' === functionType ? ' + nextStack + '.apply(depth0) : ' + nextStack + '; }');
		},

		// [invokePartial]
		//
		// On stack, before: context, ...
		// On stack after: result of partial invocation
		//
		// This operation pops off a context, invokes a partial with that context,
		// and pushes the result of the invocation back.
		invokePartial: function (name) {
			var params = [this.nameLookup('partials', name, 'partial'), "'" + name + "'", this.popStack(), "helpers", "partials"];

			if (this.options.data) {
				params.push("data");
			}

			this.context.aliases.self = "this";
			this.push("self.invokePartial(" + params.join(", ") + ")");
		},

		// [assignToHash]
		//
		// On stack, before: value, hash, ...
		// On stack, after: hash, ...
		//
		// Pops a value and hash off the stack, assigns `hash[key] = value`
		// and pushes the hash back onto the stack.
		assignToHash: function (key) {
			var value = this.popStack(),
				type;

			if (this.options.stringParams) {
				type = this.popStack();
				this.popStack();
			}

			var hash = this.hash;
			if (type) {
				hash.types.push("'" + key + "': " + type);
			}
			hash.values.push("'" + key + "': (" + value + ")");
		},

		// HELPERS

		compiler: JavaScriptCompiler,

		compileChildren: function (environment, options) {
			var children = environment.children, child, compiler;

			for (var i = 0, l = children.length; i < l; i++) {
				child = children[i];
				compiler = new this.compiler();

				var index = this.matchExistingProgram(child);

				if (index == null) {
					this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
					index = this.context.programs.length;
					child.index = index;
					child.name = 'program' + index;
					this.context.programs[index] = compiler.compile(child, options, this.context);
					this.context.environments[index] = child;
				} else {
					child.index = index;
					child.name = 'program' + index;
				}
			}
		},
		matchExistingProgram: function (child) {
			for (var i = 0, len = this.context.environments.length; i < len; i++) {
				var environment = this.context.environments[i];
				if (environment && environment.equals(child)) {
					return i;
				}
			}
		},

		programExpression: function (guid) {
			this.context.aliases.self = "this";

			if (guid == null) {
				return "self.noop";
			}

			var child = this.environment.children[guid],
				depths = child.depths.list, depth;

			var programParams = [child.index, child.name, "data"];

			for (var i = 0, l = depths.length; i < l; i++) {
				depth = depths[i];

				if (depth === 1) {
					programParams.push("depth0");
				}
				else {
					programParams.push("depth" + (depth - 1));
				}
			}

			if (depths.length === 0) {
				return "self.program(" + programParams.join(", ") + ")";
			} else {
				programParams.shift();
				return "self.programWithDepth(" + programParams.join(", ") + ")";
			}
		},

		register: function (name, val) {
			this.useRegister(name);
			this.source.push(name + " = " + val + ";");
		},

		useRegister: function (name) {
			if (!this.registers[name]) {
				this.registers[name] = true;
				this.registers.list.push(name);
			}
		},

		pushStackLiteral: function (item) {
			return this.push(new Literal(item));
		},

		pushStack: function (item) {
			this.flushInline();

			var stack = this.incrStack();
			if (item) {
				this.source.push(stack + " = " + item + ";");
			}
			this.compileStack.push(stack);
			return stack;
		},

		replaceStack: function (callback) {
			var prefix = '',
				inline = this.isInline(),
				stack;

			// If we are currently inline then we want to merge the inline statement into the
			// replacement statement via ','
			if (inline) {
				var top = this.popStack(true);

				if (top instanceof Literal) {
					// Literals do not need to be inlined
					stack = top.value;
				} else {
					// Get or create the current stack name for use by the inline
					var name = this.stackSlot ? this.topStackName() : this.incrStack();

					prefix = '(' + this.push(name) + ' = ' + top + '),';
					stack = this.topStack();
				}
			} else {
				stack = this.topStack();
			}

			var item = callback.call(this, stack);

			if (inline) {
				if (this.inlineStack.length || this.compileStack.length) {
					this.popStack();
				}
				this.push('(' + prefix + item + ')');
			} else {
				// Prevent modification of the context depth variable. Through replaceStack
				if (!/^stack/.test(stack)) {
					stack = this.nextStack();
				}

				this.source.push(stack + " = (" + prefix + item + ");");
			}
			return stack;
		},

		nextStack: function () {
			return this.pushStack();
		},

		incrStack: function () {
			this.stackSlot++;
			if (this.stackSlot > this.stackVars.length) {
				this.stackVars.push("stack" + this.stackSlot);
			}
			return this.topStackName();
		},
		topStackName: function () {
			return "stack" + this.stackSlot;
		},
		flushInline: function () {
			var inlineStack = this.inlineStack;
			if (inlineStack.length) {
				this.inlineStack = [];
				for (var i = 0, len = inlineStack.length; i < len; i++) {
					var entry = inlineStack[i];
					if (entry instanceof Literal) {
						this.compileStack.push(entry);
					} else {
						this.pushStack(entry);
					}
				}
			}
		},
		isInline: function () {
			return this.inlineStack.length;
		},

		popStack: function (wrapped) {
			var inline = this.isInline(),
				item = (inline ? this.inlineStack : this.compileStack).pop();

			if (!wrapped && (item instanceof Literal)) {
				return item.value;
			} else {
				if (!inline) {
					this.stackSlot--;
				}
				return item;
			}
		},

		topStack: function (wrapped) {
			var stack = (this.isInline() ? this.inlineStack : this.compileStack),
				item = stack[stack.length - 1];

			if (!wrapped && (item instanceof Literal)) {
				return item.value;
			} else {
				return item;
			}
		},

		quotedString: function (str) {
			return '"' + str
				.replace(/\\/g, '\\\\')
				.replace(/"/g, '\\"')
				.replace(/\n/g, '\\n')
				.replace(/\r/g, '\\r') + '"';
		},

		setupHelper: function (paramSize, name, missingParams) {
			var params = [];
			this.setupParams(paramSize, params, missingParams);
			var foundHelper = this.nameLookup('helpers', name, 'helper');

			return {
				params: params,
				name: foundHelper,
				callParams: ["depth0"].concat(params).join(", "),
				helperMissingParams: missingParams && ["depth0", this.quotedString(name)].concat(params).join(", ")
			};
		},

		// the params and contexts arguments are passed in arrays
		// to fill in
		setupParams: function (paramSize, params, useRegister) {
			var options = [], contexts = [], types = [], param, inverse, program;

			options.push("hash:" + this.popStack());

			inverse = this.popStack();
			program = this.popStack();

			// Avoid setting fn and inverse if neither are set. This allows
			// helpers to do a check for `if (options.fn)`
			if (program || inverse) {
				if (!program) {
					this.context.aliases.self = "this";
					program = "self.noop";
				}

				if (!inverse) {
					this.context.aliases.self = "this";
					inverse = "self.noop";
				}

				options.push("inverse:" + inverse);
				options.push("fn:" + program);
			}

			for (var i = 0; i < paramSize; i++) {
				param = this.popStack();
				params.push(param);

				if (this.options.stringParams) {
					types.push(this.popStack());
					contexts.push(this.popStack());
				}
			}

			if (this.options.stringParams) {
				options.push("contexts:[" + contexts.join(",") + "]");
				options.push("types:[" + types.join(",") + "]");
				options.push("hashTypes:hashTypes");
			}

			if (this.options.data) {
				options.push("data:data");
			}

			options = "{" + options.join(",") + "}";
			if (useRegister) {
				this.register('options', options);
				params.push('options');
			} else {
				params.push(options);
			}
			return params.join(", ");
		}
	};

	var reservedWords = (
		"break else new var" +
			" case finally return void" +
			" catch for switch while" +
			" continue function this with" +
			" default if throw" +
			" delete in try" +
			" do instanceof typeof" +
			" abstract enum int short" +
			" boolean export interface static" +
			" byte extends long super" +
			" char final native synchronized" +
			" class float package throws" +
			" const goto private transient" +
			" debugger implements protected volatile" +
			" double import public let yield"
		).split(" ");

	var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

	for (var i = 0, l = reservedWords.length; i < l; i++) {
		compilerWords[reservedWords[i]] = true;
	}

	JavaScriptCompiler.isValidJavaScriptVariableName = function (name) {
		if (!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]+$/.test(name)) {
			return true;
		}
		return false;
	};

})(Handlebars.Compiler, Handlebars.JavaScriptCompiler);

Handlebars.precompile = function (input, options) {
	if (!input || (typeof input !== 'string' && input.constructor !== Handlebars.AST.ProgramNode)) {
		throw new Handlebars.Exception("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
	}

	options = options || {};
	if (!('data' in options)) {
		options.data = true;
	}
	var ast = Handlebars.parse(input);
	var environment = new Handlebars.Compiler().compile(ast, options);
	return new Handlebars.JavaScriptCompiler().compile(environment, options);
};

Handlebars.compile = function (input, options) {
	if (!input || (typeof input !== 'string' && input.constructor !== Handlebars.AST.ProgramNode)) {
		throw new Handlebars.Exception("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
	}

	options = options || {};
	if (!('data' in options)) {
		options.data = true;
	}
	var compiled;

	function compile() {
		var ast = Handlebars.parse(input);
		var environment = new Handlebars.Compiler().compile(ast, options);
		var templateSpec = new Handlebars.JavaScriptCompiler().compile(environment, options, undefined, true);
		return Handlebars.template(templateSpec);
	}

	// Template is only compiled on first use and cached after that point.
	return function (context, options) {
		if (!compiled) {
			compiled = compile();
		}
		return compiled.call(this, context, options);
	};
};
;
// lib/handlebars/runtime.js
Handlebars.VM = {
	template: function (templateSpec) {
		// Just add water
		var container = {
			escapeExpression: Handlebars.Utils.escapeExpression,
			invokePartial: Handlebars.VM.invokePartial,
			programs: [],
			program: function (i, fn, data) {
				var programWrapper = this.programs[i];
				if (data) {
					return Handlebars.VM.program(fn, data);
				} else if (programWrapper) {
					return programWrapper;
				} else {
					programWrapper = this.programs[i] = Handlebars.VM.program(fn);
					return programWrapper;
				}
			},
			programWithDepth: Handlebars.VM.programWithDepth,
			noop: Handlebars.VM.noop,
			compilerInfo: null
		};

		return function (context, options) {
			options = options || {};
			var result = templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);

			var compilerInfo = container.compilerInfo || [],
				compilerRevision = compilerInfo[0] || 1,
				currentRevision = Handlebars.COMPILER_REVISION;

			if (compilerRevision !== currentRevision) {
				if (compilerRevision < currentRevision) {
					var runtimeVersions = Handlebars.REVISION_CHANGES[currentRevision],
						compilerVersions = Handlebars.REVISION_CHANGES[compilerRevision];
					throw "Template was precompiled with an older version of Handlebars than the current runtime. " +
						"Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ").";
				} else {
					// Use the embedded version info since the runtime doesn't know about this revision yet
					throw "Template was precompiled with a newer version of Handlebars than the current runtime. " +
						"Please update your runtime to a newer version (" + compilerInfo[1] + ").";
				}
			}

			return result;
		};
	},

	programWithDepth: function (fn, data, $depth) {
		var args = Array.prototype.slice.call(arguments, 2);

		return function (context, options) {
			options = options || {};

			return fn.apply(this, [context, options.data || data].concat(args));
		};
	},
	program: function (fn, data) {
		return function (context, options) {
			options = options || {};

			return fn(context, options.data || data);
		};
	},
	noop: function () {
		return "";
	},
	invokePartial: function (partial, name, context, helpers, partials, data) {
		var options = { helpers: helpers, partials: partials, data: data };

		if (partial === undefined) {
			throw new Handlebars.Exception("The partial " + name + " could not be found");
		} else if (partial instanceof Function) {
			return partial(context, options);
		} else if (!Handlebars.compile) {
			throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
		} else {
			partials[name] = Handlebars.compile(partial, {data: data !== undefined});
			return partials[name](context, options);
		}
	}
};

Handlebars.template = Handlebars.VM.template;
;

define('handlebars',[],function () {
	return window.Handlebars;
});
define('templates/map',['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div data-d=\"";
  if (stack1 = helpers.data) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.data; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" id=\"map\"></div>\n";
  return buffer;
  })

});
define('globalEvents',[
	'backbone'
], function (Backbone) {
	return _.extend({}, Backbone.Events);
});
define('map/vMap',[
	'marionette',
	'jquery',
	'mapbox',
	'templates/map',
	'handlebars',
	'globalEvents'
], function (Marionette, $, mapbox, tmp, Handlebars, globalEvents) {

	var ViewMap = Marionette.ItemView.extend({

		className: "viewMap",
		modelEvents: {
			"change": "render"
		},

		template: tmp,

		onShow: function () {
			var self = this;
			// satellite - brightrain.map-bpwe9yas
			mapbox.auto('map', 'examples.map-4l7djmvo', function(map){
				self.map = map;
			});
			globalEvents.listenTo(globalEvents, 'personSelected', _.bind(this.showPersonLocation, this));
		},

		showPersonLocation: function(person) {
			var coords = person.location.geometry.coordinates;
			this.map.ease.location({ lat: coords[0], lon: coords[1] }).zoom(40).optimal(0.5, 1.00);
		}

	});

	return ViewMap;

});
define('map/mMap',[
	'backbone'
], function (Backbone) {

	var ModelMap = Backbone.Model.extend({
		url: '../../test/json/geodataPlaces.json'
	});
	return ModelMap;

});
define('map/moduleMap',[
	'map/vMap',
	'map/mMap'
], function (ViewMap, ModelMap) {

	return function(config) {

		var self = this;

		this.model = new ModelMap({
			initialised: false,
			module: this
		});

		this.view = new ViewMap({
			model: this.model,
			module: this
		});

		this.model.fetch()
			.done(function(){

			})
			.fail(function(){

			});

		config.onLoad && config.onLoad(this.view);

	};

});
define('templates/family',['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h2>Family members</h2>";
  })

});
(function(){if (!Date.now) Date.now = function() {
	return +new Date;
};
	try {
		document.createElement("div").style.setProperty("opacity", 0, "");
	} catch (error) {
		var d3_style_prototype = CSSStyleDeclaration.prototype,
			d3_style_setProperty = d3_style_prototype.setProperty;
		d3_style_prototype.setProperty = function(name, value, priority) {
			d3_style_setProperty.call(this, name, value + "", priority);
		};
	}
	d3 = {version: "2.4.4"}; // semver
	var d3_array = d3_arraySlice; // conversion for NodeLists

	function d3_arrayCopy(pseudoarray) {
		var i = -1, n = pseudoarray.length, array = [];
		while (++i < n) array.push(pseudoarray[i]);
		return array;
	}

	function d3_arraySlice(pseudoarray) {
		return Array.prototype.slice.call(pseudoarray);
	}

	try {
		d3_array(document.documentElement.childNodes)[0].nodeType;
	} catch(e) {
		d3_array = d3_arrayCopy;
	}

	var d3_arraySubclass = [].__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
		function(array, prototype) {
			array.__proto__ = prototype;
		}:

// And if your browser doesn't support __proto__, we'll use direct extension.
		function(array, prototype) {
			for (var property in prototype) array[property] = prototype[property];
		};
	function d3_this() {
		return this;
	}
	d3.functor = function(v) {
		return typeof v === "function" ? v : function() { return v; };
	};
// A getter-setter method that preserves the appropriate `this` context.
	d3.rebind = function(object, method) {
		return function() {
			var x = method.apply(object, arguments);
			return arguments.length ? object : x;
		};
	};
	d3.ascending = function(a, b) {
		return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	};
	d3.descending = function(a, b) {
		return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
	};
	d3.mean = function(array, f) {
		var n = array.length,
			a,
			m = 0,
			i = -1,
			j = 0;
		if (arguments.length === 1) {
			while (++i < n) if (d3_number(a = array[i])) m += (a - m) / ++j;
		} else {
			while (++i < n) if (d3_number(a = f.call(array, array[i], i))) m += (a - m) / ++j;
		}
		return j ? m : undefined;
	};
	d3.median = function(array, f) {
		if (arguments.length > 1) array = array.map(f);
		array = array.filter(d3_number);
		return array.length ? d3.quantile(array.sort(d3.ascending), .5) : undefined;
	};
	d3.min = function(array, f) {
		var i = -1,
			n = array.length,
			a,
			b;
		if (arguments.length === 1) {
			while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
			while (++i < n) if ((b = array[i]) != null && a > b) a = b;
		} else {
			while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
			while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
		}
		return a;
	};
	d3.max = function(array, f) {
		var i = -1,
			n = array.length,
			a,
			b;
		if (arguments.length === 1) {
			while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
			while (++i < n) if ((b = array[i]) != null && b > a) a = b;
		} else {
			while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
			while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
		}
		return a;
	};
	function d3_number(x) {
		return x != null && !isNaN(x);
	}
	d3.sum = function(array, f) {
		var s = 0,
			n = array.length,
			a,
			i = -1;

		if (arguments.length === 1) {
			while (++i < n) if (!isNaN(a = +array[i])) s += a;
		} else {
			while (++i < n) if (!isNaN(a = +f.call(array, array[i], i))) s += a;
		}

		return s;
	};
// R-7 per <http://en.wikipedia.org/wiki/Quantile>
	d3.quantile = function(values, p) {
		var H = (values.length - 1) * p + 1,
			h = Math.floor(H),
			v = values[h - 1],
			e = H - h;
		return e ? v + e * (values[h] - v) : v;
	};
	d3.zip = function() {
		if (!(n = arguments.length)) return [];
		for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m;) {
			for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n;) {
				zip[j] = arguments[j][i];
			}
		}
		return zips;
	};

	function d3_zipLength(d) {
		return d.length;
	}
// Locate the insertion point for x in a to maintain sorted order. The
// arguments lo and hi may be used to specify a subset of the array which should
// be considered; by default the entire array is used. If x is already present
// in a, the insertion point will be before (to the left of) any existing
// entries. The return value is suitable for use as the first argument to
// `array.splice` assuming that a is already sorted.
//
// The returned insertion point i partitions the array a into two halves so that
// all v < x for v in a[lo:i] for the left side and all v >= x for v in a[i:hi]
// for the right side.
	d3.bisectLeft = function(a, x, lo, hi) {
		if (arguments.length < 3) lo = 0;
		if (arguments.length < 4) hi = a.length;
		while (lo < hi) {
			var mid = (lo + hi) >> 1;
			if (a[mid] < x) lo = mid + 1;
			else hi = mid;
		}
		return lo;
	};

// Similar to bisectLeft, but returns an insertion point which comes after (to
// the right of) any existing entries of x in a.
//
// The returned insertion point i partitions the array into two halves so that
// all v <= x for v in a[lo:i] for the left side and all v > x for v in a[i:hi]
// for the right side.
	d3.bisect =
		d3.bisectRight = function(a, x, lo, hi) {
			if (arguments.length < 3) lo = 0;
			if (arguments.length < 4) hi = a.length;
			while (lo < hi) {
				var mid = (lo + hi) >> 1;
				if (x < a[mid]) hi = mid;
				else lo = mid + 1;
			}
			return lo;
		};
	d3.first = function(array, f) {
		var i = 0,
			n = array.length,
			a = array[0],
			b;
		if (arguments.length === 1) f = d3.ascending;
		while (++i < n) {
			if (f.call(array, a, b = array[i]) > 0) {
				a = b;
			}
		}
		return a;
	};
	d3.last = function(array, f) {
		var i = 0,
			n = array.length,
			a = array[0],
			b;
		if (arguments.length === 1) f = d3.ascending;
		while (++i < n) {
			if (f.call(array, a, b = array[i]) <= 0) {
				a = b;
			}
		}
		return a;
	};
	d3.nest = function() {
		var nest = {},
			keys = [],
			sortKeys = [],
			sortValues,
			rollup;

		function map(array, depth) {
			if (depth >= keys.length) return rollup
				? rollup.call(nest, array) : (sortValues
				? array.sort(sortValues)
				: array);

			var i = -1,
				n = array.length,
				key = keys[depth++],
				keyValue,
				object,
				o = {};

			while (++i < n) {
				if ((keyValue = key(object = array[i])) in o) {
					o[keyValue].push(object);
				} else {
					o[keyValue] = [object];
				}
			}

			for (keyValue in o) {
				o[keyValue] = map(o[keyValue], depth);
			}

			return o;
		}

		function entries(map, depth) {
			if (depth >= keys.length) return map;

			var a = [],
				sortKey = sortKeys[depth++],
				key;

			for (key in map) {
				a.push({key: key, values: entries(map[key], depth)});
			}

			if (sortKey) a.sort(function(a, b) {
				return sortKey(a.key, b.key);
			});

			return a;
		}

		nest.map = function(array) {
			return map(array, 0);
		};

		nest.entries = function(array) {
			return entries(map(array, 0), 0);
		};

		nest.key = function(d) {
			keys.push(d);
			return nest;
		};

		// Specifies the order for the most-recently specified key.
		// Note: only applies to entries. Map keys are unordered!
		nest.sortKeys = function(order) {
			sortKeys[keys.length - 1] = order;
			return nest;
		};

		// Specifies the order for leaf values.
		// Applies to both maps and entries array.
		nest.sortValues = function(order) {
			sortValues = order;
			return nest;
		};

		nest.rollup = function(f) {
			rollup = f;
			return nest;
		};

		return nest;
	};
	d3.keys = function(map) {
		var keys = [];
		for (var key in map) keys.push(key);
		return keys;
	};
	d3.values = function(map) {
		var values = [];
		for (var key in map) values.push(map[key]);
		return values;
	};
	d3.entries = function(map) {
		var entries = [];
		for (var key in map) entries.push({key: key, value: map[key]});
		return entries;
	};
	d3.permute = function(array, indexes) {
		var permutes = [],
			i = -1,
			n = indexes.length;
		while (++i < n) permutes[i] = array[indexes[i]];
		return permutes;
	};
	d3.merge = function(arrays) {
		return Array.prototype.concat.apply([], arrays);
	};
	d3.split = function(array, f) {
		var arrays = [],
			values = [],
			value,
			i = -1,
			n = array.length;
		if (arguments.length < 2) f = d3_splitter;
		while (++i < n) {
			if (f.call(values, value = array[i], i)) {
				values = [];
			} else {
				if (!values.length) arrays.push(values);
				values.push(value);
			}
		}
		return arrays;
	};

	function d3_splitter(d) {
		return d == null;
	}
	function d3_collapse(s) {
		return s.replace(/(^\s+)|(\s+$)/g, "").replace(/\s+/g, " ");
	}
	/**
	 * @param {number} start
	 * @param {number=} stop
	 * @param {number=} step
	 */
	d3.range = function(start, stop, step) {
		if (arguments.length < 3) {
			step = 1;
			if (arguments.length < 2) {
				stop = start;
				start = 0;
			}
		}
		if ((stop - start) / step == Infinity) throw new Error("infinite range");
		var range = [],
			i = -1,
			j;
		if (step < 0) while ((j = start + step * ++i) > stop) range.push(j);
		else while ((j = start + step * ++i) < stop) range.push(j);
		return range;
	};
	d3.requote = function(s) {
		return s.replace(d3_requote_re, "\\$&");
	};

	var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
	d3.round = function(x, n) {
		return n
			? Math.round(x * Math.pow(10, n)) * Math.pow(10, -n)
			: Math.round(x);
	};
	d3.xhr = function(url, mime, callback) {
		var req = new XMLHttpRequest;
		if (arguments.length < 3) callback = mime;
		else if (mime && req.overrideMimeType) req.overrideMimeType(mime);
		req.open("GET", url, true);
		req.onreadystatechange = function() {
			if (req.readyState === 4) callback(req.status < 300 ? req : null);
		};
		req.send(null);
	};
	d3.text = function(url, mime, callback) {
		function ready(req) {
			callback(req && req.responseText);
		}
		if (arguments.length < 3) {
			callback = mime;
			mime = null;
		}
		d3.xhr(url, mime, ready);
	};
	d3.json = function(url, callback) {
		d3.text(url, "application/json", function(text) {
			callback(text ? JSON.parse(text) : null);
		});
	};
	d3.html = function(url, callback) {
		d3.text(url, "text/html", function(text) {
			if (text != null) { // Treat empty string as valid HTML.
				var range = document.createRange();
				range.selectNode(document.body);
				text = range.createContextualFragment(text);
			}
			callback(text);
		});
	};
	d3.xml = function(url, mime, callback) {
		function ready(req) {
			callback(req && req.responseXML);
		}
		if (arguments.length < 3) {
			callback = mime;
			mime = null;
		}
		d3.xhr(url, mime, ready);
	};
	d3.ns = {

		prefix: {
			svg: "http://www.w3.org/2000/svg",
			xhtml: "http://www.w3.org/1999/xhtml",
			xlink: "http://www.w3.org/1999/xlink",
			xml: "http://www.w3.org/XML/1998/namespace",
			xmlns: "http://www.w3.org/2000/xmlns/"
		},

		qualify: function(name) {
			var i = name.indexOf(":");
			return i < 0 ? name : {
				space: d3.ns.prefix[name.substring(0, i)],
				local: name.substring(i + 1)
			};
		}

	};
	/** @param {...string} types */
	d3.dispatch = function(types) {
		var dispatch = {},
			type;
		for (var i = 0, n = arguments.length; i < n; i++) {
			type = arguments[i];
			dispatch[type] = d3_dispatch(type);
		}
		return dispatch;
	};

	function d3_dispatch(type) {
		var dispatch = {},
			listeners = [];

		dispatch.add = function(listener) {
			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i].listener == listener) return dispatch; // already registered
			}
			listeners.push({listener: listener, on: true});
			return dispatch;
		};

		dispatch.remove = function(listener) {
			for (var i = 0; i < listeners.length; i++) {
				var l = listeners[i];
				if (l.listener == listener) {
					l.on = false;
					listeners = listeners.slice(0, i).concat(listeners.slice(i + 1));
					break;
				}
			}
			return dispatch;
		};

		dispatch.dispatch = function() {
			var ls = listeners; // defensive reference
			for (var i = 0, n = ls.length; i < n; i++) {
				var l = ls[i];
				if (l.on) l.listener.apply(this, arguments);
			}
		};

		return dispatch;
	};
// TODO align
	d3.format = function(specifier) {
		var match = d3_format_re.exec(specifier),
			fill = match[1] || " ",
			sign = match[3] || "",
			zfill = match[5],
			width = +match[6],
			comma = match[7],
			precision = match[8],
			type = match[9],
			scale = 1,
			suffix = "",
			integer = false;

		if (precision) precision = +precision.substring(1);

		if (zfill) {
			fill = "0"; // TODO align = "=";
			if (comma) width -= Math.floor((width - 1) / 4);
		}

		switch (type) {
			case "n": comma = true; type = "g"; break;
			case "%": scale = 100; suffix = "%"; type = "f"; break;
			case "p": scale = 100; suffix = "%"; type = "r"; break;
			case "d": integer = true; precision = 0; break;
			case "s": scale = -1; type = "r"; break;
		}

		// If no precision is specified for r, fallback to general notation.
		if (type == "r" && !precision) type = "g";

		type = d3_format_types[type] || d3_format_typeDefault;

		return function(value) {

			// Return the empty string for floats formatted as ints.
			if (integer && (value % 1)) return "";

			// Convert negative to positive, and record the sign prefix.
			var negative = (value < 0) && (value = -value) ? "\u2212" : sign;

			// Apply the scale, computing it from the value's exponent for si format.
			if (scale < 0) {
				var prefix = d3.formatPrefix(value, precision);
				value *= prefix.scale;
				suffix = prefix.symbol;
			} else {
				value *= scale;
			}

			// Convert to the desired precision.
			value = type(value, precision);

			// If the fill character is 0, the sign and group is applied after the fill.
			if (zfill) {
				var length = value.length + negative.length;
				if (length < width) value = new Array(width - length + 1).join(fill) + value;
				if (comma) value = d3_format_group(value);
				value = negative + value;
			}

			// Otherwise (e.g., space-filling), the sign and group is applied before.
			else {
				if (comma) value = d3_format_group(value);
				value = negative + value;
				var length = value.length;
				if (length < width) value = new Array(width - length + 1).join(fill) + value;
			}

			return value + suffix;
		};
	};

// [[fill]align][sign][#][0][width][,][.precision][type]
	var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?(#)?(0)?([0-9]+)?(,)?(\.[0-9]+)?([a-zA-Z%])?/;

	var d3_format_types = {
		g: function(x, p) { return x.toPrecision(p); },
		e: function(x, p) { return x.toExponential(p); },
		f: function(x, p) { return x.toFixed(p); },
		r: function(x, p) { return d3.round(x, p = d3_format_precision(x, p)).toFixed(Math.max(0, Math.min(20, p))); }
	};

	function d3_format_precision(x, p) {
		return p - (x ? 1 + Math.floor(Math.log(x + Math.pow(10, 1 + Math.floor(Math.log(x) / Math.LN10) - p)) / Math.LN10) : 1);
	}

	function d3_format_typeDefault(x) {
		return x + "";
	}

// Apply comma grouping for thousands.
	function d3_format_group(value) {
		var i = value.lastIndexOf("."),
			f = i >= 0 ? value.substring(i) : (i = value.length, ""),
			t = [];
		while (i > 0) t.push(value.substring(i -= 3, i + 3));
		return t.reverse().join(",") + f;
	}
	var d3_formatPrefixes = ["y","z","a","f","p","n","Î¼","m","","k","M","G","T","P","E","Z","Y"].map(d3_formatPrefix);

	d3.formatPrefix = function(value, precision) {
		var i = 0;
		if (value) {
			if (value < 0) value *= -1;
			if (precision) value = d3.round(value, d3_format_precision(value, precision));
			i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
			i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
		}
		return d3_formatPrefixes[8 + i / 3];
	};

	function d3_formatPrefix(d, i) {
		return {
			scale: Math.pow(10, (8 - i) * 3),
			symbol: d
		};
	}

	/*
	 * TERMS OF USE - EASING EQUATIONS
	 *
	 * Open source under the BSD License.
	 *
	 * Copyright 2001 Robert Penner
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are met:
	 *
	 * - Redistributions of source code must retain the above copyright notice, this
	 *   list of conditions and the following disclaimer.
	 *
	 * - Redistributions in binary form must reproduce the above copyright notice,
	 *   this list of conditions and the following disclaimer in the documentation
	 *   and/or other materials provided with the distribution.
	 *
	 * - Neither the name of the author nor the names of contributors may be used to
	 *   endorse or promote products derived from this software without specific
	 *   prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
	 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
	 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
	 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
	 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
	 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
	 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
	 * POSSIBILITY OF SUCH DAMAGE.
	 */

	var d3_ease_quad = d3_ease_poly(2),
		d3_ease_cubic = d3_ease_poly(3);

	var d3_ease = {
		linear: function() { return d3_ease_linear; },
		poly: d3_ease_poly,
		quad: function() { return d3_ease_quad; },
		cubic: function() { return d3_ease_cubic; },
		sin: function() { return d3_ease_sin; },
		exp: function() { return d3_ease_exp; },
		circle: function() { return d3_ease_circle; },
		elastic: d3_ease_elastic,
		back: d3_ease_back,
		bounce: function() { return d3_ease_bounce; }
	};

	var d3_ease_mode = {
		"in": function(f) { return f; },
		"out": d3_ease_reverse,
		"in-out": d3_ease_reflect,
		"out-in": function(f) { return d3_ease_reflect(d3_ease_reverse(f)); }
	};

	d3.ease = function(name) {
		var i = name.indexOf("-"),
			t = i >= 0 ? name.substring(0, i) : name,
			m = i >= 0 ? name.substring(i + 1) : "in";
		return d3_ease_clamp(d3_ease_mode[m](d3_ease[t].apply(null, Array.prototype.slice.call(arguments, 1))));
	};

	function d3_ease_clamp(f) {
		return function(t) {
			return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
		};
	}

	function d3_ease_reverse(f) {
		return function(t) {
			return 1 - f(1 - t);
		};
	}

	function d3_ease_reflect(f) {
		return function(t) {
			return .5 * (t < .5 ? f(2 * t) : (2 - f(2 - 2 * t)));
		};
	}

	function d3_ease_linear(t) {
		return t;
	}

	function d3_ease_poly(e) {
		return function(t) {
			return Math.pow(t, e);
		}
	}

	function d3_ease_sin(t) {
		return 1 - Math.cos(t * Math.PI / 2);
	}

	function d3_ease_exp(t) {
		return Math.pow(2, 10 * (t - 1));
	}

	function d3_ease_circle(t) {
		return 1 - Math.sqrt(1 - t * t);
	}

	function d3_ease_elastic(a, p) {
		var s;
		if (arguments.length < 2) p = 0.45;
		if (arguments.length < 1) { a = 1; s = p / 4; }
		else s = p / (2 * Math.PI) * Math.asin(1 / a);
		return function(t) {
			return 1 + a * Math.pow(2, 10 * -t) * Math.sin((t - s) * 2 * Math.PI / p);
		};
	}

	function d3_ease_back(s) {
		if (!s) s = 1.70158;
		return function(t) {
			return t * t * ((s + 1) * t - s);
		};
	}

	function d3_ease_bounce(t) {
		return t < 1 / 2.75 ? 7.5625 * t * t
			: t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75
			: t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375
			: 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
	}
	d3.event = null;
	d3.interpolate = function(a, b) {
		var i = d3.interpolators.length, f;
		while (--i >= 0 && !(f = d3.interpolators[i](a, b)));
		return f;
	};

	d3.interpolateNumber = function(a, b) {
		b -= a;
		return function(t) { return a + b * t; };
	};

	d3.interpolateRound = function(a, b) {
		b -= a;
		return function(t) { return Math.round(a + b * t); };
	};

	d3.interpolateString = function(a, b) {
		var m, // current match
			i, // current index
			j, // current index (for coallescing)
			s0 = 0, // start index of current string prefix
			s1 = 0, // end index of current string prefix
			s = [], // string constants and placeholders
			q = [], // number interpolators
			n, // q.length
			o;

		// Reset our regular expression!
		d3_interpolate_number.lastIndex = 0;

		// Find all numbers in b.
		for (i = 0; m = d3_interpolate_number.exec(b); ++i) {
			if (m.index) s.push(b.substring(s0, s1 = m.index));
			q.push({i: s.length, x: m[0]});
			s.push(null);
			s0 = d3_interpolate_number.lastIndex;
		}
		if (s0 < b.length) s.push(b.substring(s0));

		// Find all numbers in a.
		for (i = 0, n = q.length; (m = d3_interpolate_number.exec(a)) && i < n; ++i) {
			o = q[i];
			if (o.x == m[0]) { // The numbers match, so coallesce.
				if (o.i) {
					if (s[o.i + 1] == null) { // This match is followed by another number.
						s[o.i - 1] += o.x;
						s.splice(o.i, 1);
						for (j = i + 1; j < n; ++j) q[j].i--;
					} else { // This match is followed by a string, so coallesce twice.
						s[o.i - 1] += o.x + s[o.i + 1];
						s.splice(o.i, 2);
						for (j = i + 1; j < n; ++j) q[j].i -= 2;
					}
				} else {
					if (s[o.i + 1] == null) { // This match is followed by another number.
						s[o.i] = o.x;
					} else { // This match is followed by a string, so coallesce twice.
						s[o.i] = o.x + s[o.i + 1];
						s.splice(o.i + 1, 1);
						for (j = i + 1; j < n; ++j) q[j].i--;
					}
				}
				q.splice(i, 1);
				n--;
				i--;
			} else {
				o.x = d3.interpolateNumber(parseFloat(m[0]), parseFloat(o.x));
			}
		}

		// Remove any numbers in b not found in a.
		while (i < n) {
			o = q.pop();
			if (s[o.i + 1] == null) { // This match is followed by another number.
				s[o.i] = o.x;
			} else { // This match is followed by a string, so coallesce twice.
				s[o.i] = o.x + s[o.i + 1];
				s.splice(o.i + 1, 1);
			}
			n--;
		}

		// Special optimization for only a single match.
		if (s.length === 1) {
			return s[0] == null ? q[0].x : function() { return b; };
		}

		// Otherwise, interpolate each of the numbers and rejoin the string.
		return function(t) {
			for (i = 0; i < n; ++i) s[(o = q[i]).i] = o.x(t);
			return s.join("");
		};
	};

	d3.interpolateRgb = function(a, b) {
		a = d3.rgb(a);
		b = d3.rgb(b);
		var ar = a.r,
			ag = a.g,
			ab = a.b,
			br = b.r - ar,
			bg = b.g - ag,
			bb = b.b - ab;
		return function(t) {
			return "#"
				+ d3_rgb_hex(Math.round(ar + br * t))
				+ d3_rgb_hex(Math.round(ag + bg * t))
				+ d3_rgb_hex(Math.round(ab + bb * t));
		};
	};

// interpolates HSL space, but outputs RGB string (for compatibility)
	d3.interpolateHsl = function(a, b) {
		a = d3.hsl(a);
		b = d3.hsl(b);
		var h0 = a.h,
			s0 = a.s,
			l0 = a.l,
			h1 = b.h - h0,
			s1 = b.s - s0,
			l1 = b.l - l0;
		return function(t) {
			return d3_hsl_rgb(h0 + h1 * t, s0 + s1 * t, l0 + l1 * t).toString();
		};
	};

	d3.interpolateArray = function(a, b) {
		var x = [],
			c = [],
			na = a.length,
			nb = b.length,
			n0 = Math.min(a.length, b.length),
			i;
		for (i = 0; i < n0; ++i) x.push(d3.interpolate(a[i], b[i]));
		for (; i < na; ++i) c[i] = a[i];
		for (; i < nb; ++i) c[i] = b[i];
		return function(t) {
			for (i = 0; i < n0; ++i) c[i] = x[i](t);
			return c;
		};
	};

	d3.interpolateObject = function(a, b) {
		var i = {},
			c = {},
			k;
		for (k in a) {
			if (k in b) {
				i[k] = d3_interpolateByName(k)(a[k], b[k]);
			} else {
				c[k] = a[k];
			}
		}
		for (k in b) {
			if (!(k in a)) {
				c[k] = b[k];
			}
		}
		return function(t) {
			for (k in i) c[k] = i[k](t);
			return c;
		};
	}

	var d3_interpolate_number = /[-+]?(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][-]?\d+)?/g,
		d3_interpolate_rgb = {background: 1, fill: 1, stroke: 1};

	function d3_interpolateByName(n) {
		return n in d3_interpolate_rgb || /\bcolor\b/.test(n)
			? d3.interpolateRgb
			: d3.interpolate;
	}

	d3.interpolators = [
		d3.interpolateObject,
		function(a, b) { return (b instanceof Array) && d3.interpolateArray(a, b); },
		function(a, b) { return (typeof b === "string") && d3.interpolateString(String(a), b); },
		function(a, b) { return (typeof b === "string" ? b in d3_rgb_names || /^(#|rgb\(|hsl\()/.test(b) : b instanceof d3_Rgb || b instanceof d3_Hsl) && d3.interpolateRgb(String(a), b); },
		function(a, b) { return (typeof b === "number") && d3.interpolateNumber(+a, b); }
	];
	function d3_uninterpolateNumber(a, b) {
		b = b - (a = +a) ? 1 / (b - a) : 0;
		return function(x) { return (x - a) * b; };
	}

	function d3_uninterpolateClamp(a, b) {
		b = b - (a = +a) ? 1 / (b - a) : 0;
		return function(x) { return Math.max(0, Math.min(1, (x - a) * b)); };
	}
	d3.rgb = function(r, g, b) {
		return arguments.length === 1
			? (r instanceof d3_Rgb ? d3_rgb(r.r, r.g, r.b)
			: d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb))
			: d3_rgb(~~r, ~~g, ~~b);
	};

	function d3_rgb(r, g, b) {
		return new d3_Rgb(r, g, b);
	}

	function d3_Rgb(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
	}

	d3_Rgb.prototype.brighter = function(k) {
		k = Math.pow(0.7, arguments.length ? k : 1);
		var r = this.r,
			g = this.g,
			b = this.b,
			i = 30;
		if (!r && !g && !b) return d3_rgb(i, i, i);
		if (r && r < i) r = i;
		if (g && g < i) g = i;
		if (b && b < i) b = i;
		return d3_rgb(
			Math.min(255, Math.floor(r / k)),
			Math.min(255, Math.floor(g / k)),
			Math.min(255, Math.floor(b / k)));
	};

	d3_Rgb.prototype.darker = function(k) {
		k = Math.pow(0.7, arguments.length ? k : 1);
		return d3_rgb(
			Math.floor(k * this.r),
			Math.floor(k * this.g),
			Math.floor(k * this.b));
	};

	d3_Rgb.prototype.hsl = function() {
		return d3_rgb_hsl(this.r, this.g, this.b);
	};

	d3_Rgb.prototype.toString = function() {
		return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
	};

	function d3_rgb_hex(v) {
		return v < 0x10
			? "0" + Math.max(0, v).toString(16)
			: Math.min(255, v).toString(16);
	}

	function d3_rgb_parse(format, rgb, hsl) {
		var r = 0, // red channel; int in [0, 255]
			g = 0, // green channel; int in [0, 255]
			b = 0, // blue channel; int in [0, 255]
			m1, // CSS color specification match
			m2, // CSS color specification type (e.g., rgb)
			name;

		/* Handle hsl, rgb. */
		m1 = /([a-z]+)\((.*)\)/i.exec(format);
		if (m1) {
			m2 = m1[2].split(",");
			switch (m1[1]) {
				case "hsl": {
					return hsl(
						parseFloat(m2[0]), // degrees
						parseFloat(m2[1]) / 100, // percentage
						parseFloat(m2[2]) / 100 // percentage
					);
				}
				case "rgb": {
					return rgb(
						d3_rgb_parseNumber(m2[0]),
						d3_rgb_parseNumber(m2[1]),
						d3_rgb_parseNumber(m2[2])
					);
				}
			}
		}

		/* Named colors. */
		if (name = d3_rgb_names[format]) return rgb(name.r, name.g, name.b);

		/* Hexadecimal colors: #rgb and #rrggbb. */
		if (format != null && format.charAt(0) === "#") {
			if (format.length === 4) {
				r = format.charAt(1); r += r;
				g = format.charAt(2); g += g;
				b = format.charAt(3); b += b;
			} else if (format.length === 7) {
				r = format.substring(1, 3);
				g = format.substring(3, 5);
				b = format.substring(5, 7);
			}
			r = parseInt(r, 16);
			g = parseInt(g, 16);
			b = parseInt(b, 16);
		}

		return rgb(r, g, b);
	}

	function d3_rgb_hsl(r, g, b) {
		var min = Math.min(r /= 255, g /= 255, b /= 255),
			max = Math.max(r, g, b),
			d = max - min,
			h,
			s,
			l = (max + min) / 2;
		if (d) {
			s = l < .5 ? d / (max + min) : d / (2 - max - min);
			if (r == max) h = (g - b) / d + (g < b ? 6 : 0);
			else if (g == max) h = (b - r) / d + 2;
			else h = (r - g) / d + 4;
			h *= 60;
		} else {
			s = h = 0;
		}
		return d3_hsl(h, s, l);
	}

	function d3_rgb_parseNumber(c) { // either integer or percentage
		var f = parseFloat(c);
		return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
	}

	var d3_rgb_names = {
		aliceblue: "#f0f8ff",
		antiquewhite: "#faebd7",
		aqua: "#00ffff",
		aquamarine: "#7fffd4",
		azure: "#f0ffff",
		beige: "#f5f5dc",
		bisque: "#ffe4c4",
		black: "#000000",
		blanchedalmond: "#ffebcd",
		blue: "#0000ff",
		blueviolet: "#8a2be2",
		brown: "#a52a2a",
		burlywood: "#deb887",
		cadetblue: "#5f9ea0",
		chartreuse: "#7fff00",
		chocolate: "#d2691e",
		coral: "#ff7f50",
		cornflowerblue: "#6495ed",
		cornsilk: "#fff8dc",
		crimson: "#dc143c",
		cyan: "#00ffff",
		darkblue: "#00008b",
		darkcyan: "#008b8b",
		darkgoldenrod: "#b8860b",
		darkgray: "#a9a9a9",
		darkgreen: "#006400",
		darkgrey: "#a9a9a9",
		darkkhaki: "#bdb76b",
		darkmagenta: "#8b008b",
		darkolivegreen: "#556b2f",
		darkorange: "#ff8c00",
		darkorchid: "#9932cc",
		darkred: "#8b0000",
		darksalmon: "#e9967a",
		darkseagreen: "#8fbc8f",
		darkslateblue: "#483d8b",
		darkslategray: "#2f4f4f",
		darkslategrey: "#2f4f4f",
		darkturquoise: "#00ced1",
		darkviolet: "#9400d3",
		deeppink: "#ff1493",
		deepskyblue: "#00bfff",
		dimgray: "#696969",
		dimgrey: "#696969",
		dodgerblue: "#1e90ff",
		firebrick: "#b22222",
		floralwhite: "#fffaf0",
		forestgreen: "#228b22",
		fuchsia: "#ff00ff",
		gainsboro: "#dcdcdc",
		ghostwhite: "#f8f8ff",
		gold: "#ffd700",
		goldenrod: "#daa520",
		gray: "#808080",
		green: "#008000",
		greenyellow: "#adff2f",
		grey: "#808080",
		honeydew: "#f0fff0",
		hotpink: "#ff69b4",
		indianred: "#cd5c5c",
		indigo: "#4b0082",
		ivory: "#fffff0",
		khaki: "#f0e68c",
		lavender: "#e6e6fa",
		lavenderblush: "#fff0f5",
		lawngreen: "#7cfc00",
		lemonchiffon: "#fffacd",
		lightblue: "#add8e6",
		lightcoral: "#f08080",
		lightcyan: "#e0ffff",
		lightgoldenrodyellow: "#fafad2",
		lightgray: "#d3d3d3",
		lightgreen: "#90ee90",
		lightgrey: "#d3d3d3",
		lightpink: "#ffb6c1",
		lightsalmon: "#ffa07a",
		lightseagreen: "#20b2aa",
		lightskyblue: "#87cefa",
		lightslategray: "#778899",
		lightslategrey: "#778899",
		lightsteelblue: "#b0c4de",
		lightyellow: "#ffffe0",
		lime: "#00ff00",
		limegreen: "#32cd32",
		linen: "#faf0e6",
		magenta: "#ff00ff",
		maroon: "#800000",
		mediumaquamarine: "#66cdaa",
		mediumblue: "#0000cd",
		mediumorchid: "#ba55d3",
		mediumpurple: "#9370db",
		mediumseagreen: "#3cb371",
		mediumslateblue: "#7b68ee",
		mediumspringgreen: "#00fa9a",
		mediumturquoise: "#48d1cc",
		mediumvioletred: "#c71585",
		midnightblue: "#191970",
		mintcream: "#f5fffa",
		mistyrose: "#ffe4e1",
		moccasin: "#ffe4b5",
		navajowhite: "#ffdead",
		navy: "#000080",
		oldlace: "#fdf5e6",
		olive: "#808000",
		olivedrab: "#6b8e23",
		orange: "#ffa500",
		orangered: "#ff4500",
		orchid: "#da70d6",
		palegoldenrod: "#eee8aa",
		palegreen: "#98fb98",
		paleturquoise: "#afeeee",
		palevioletred: "#db7093",
		papayawhip: "#ffefd5",
		peachpuff: "#ffdab9",
		peru: "#cd853f",
		pink: "#ffc0cb",
		plum: "#dda0dd",
		powderblue: "#b0e0e6",
		purple: "#800080",
		red: "#ff0000",
		rosybrown: "#bc8f8f",
		royalblue: "#4169e1",
		saddlebrown: "#8b4513",
		salmon: "#fa8072",
		sandybrown: "#f4a460",
		seagreen: "#2e8b57",
		seashell: "#fff5ee",
		sienna: "#a0522d",
		silver: "#c0c0c0",
		skyblue: "#87ceeb",
		slateblue: "#6a5acd",
		slategray: "#708090",
		slategrey: "#708090",
		snow: "#fffafa",
		springgreen: "#00ff7f",
		steelblue: "#4682b4",
		tan: "#d2b48c",
		teal: "#008080",
		thistle: "#d8bfd8",
		tomato: "#ff6347",
		turquoise: "#40e0d0",
		violet: "#ee82ee",
		wheat: "#f5deb3",
		white: "#ffffff",
		whitesmoke: "#f5f5f5",
		yellow: "#ffff00",
		yellowgreen: "#9acd32"
	};

	for (var d3_rgb_name in d3_rgb_names) {
		d3_rgb_names[d3_rgb_name] = d3_rgb_parse(
			d3_rgb_names[d3_rgb_name],
			d3_rgb,
			d3_hsl_rgb);
	}
	d3.hsl = function(h, s, l) {
		return arguments.length === 1
			? (h instanceof d3_Hsl ? d3_hsl(h.h, h.s, h.l)
			: d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl))
			: d3_hsl(+h, +s, +l);
	};

	function d3_hsl(h, s, l) {
		return new d3_Hsl(h, s, l);
	}

	function d3_Hsl(h, s, l) {
		this.h = h;
		this.s = s;
		this.l = l;
	}

	d3_Hsl.prototype.brighter = function(k) {
		k = Math.pow(0.7, arguments.length ? k : 1);
		return d3_hsl(this.h, this.s, this.l / k);
	};

	d3_Hsl.prototype.darker = function(k) {
		k = Math.pow(0.7, arguments.length ? k : 1);
		return d3_hsl(this.h, this.s, k * this.l);
	};

	d3_Hsl.prototype.rgb = function() {
		return d3_hsl_rgb(this.h, this.s, this.l);
	};

	d3_Hsl.prototype.toString = function() {
		return this.rgb().toString();
	};

	function d3_hsl_rgb(h, s, l) {
		var m1,
			m2;

		/* Some simple corrections for h, s and l. */
		h = h % 360; if (h < 0) h += 360;
		s = s < 0 ? 0 : s > 1 ? 1 : s;
		l = l < 0 ? 0 : l > 1 ? 1 : l;

		/* From FvD 13.37, CSS Color Module Level 3 */
		m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
		m1 = 2 * l - m2;

		function v(h) {
			if (h > 360) h -= 360;
			else if (h < 0) h += 360;
			if (h < 60) return m1 + (m2 - m1) * h / 60;
			if (h < 180) return m2;
			if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
			return m1;
		}

		function vv(h) {
			return Math.round(v(h) * 255);
		}

		return d3_rgb(vv(h + 120), vv(h), vv(h - 120));
	}
	function d3_selection(groups) {
		d3_arraySubclass(groups, d3_selectionPrototype);
		return groups;
	}

	var d3_select = function(s, n) { return n.querySelector(s); },
		d3_selectAll = function(s, n) { return n.querySelectorAll(s); };

// Prefer Sizzle, if available.
	if (typeof Sizzle === "function") {
		d3_select = function(s, n) { return Sizzle(s, n)[0]; };
		d3_selectAll = function(s, n) { return Sizzle.uniqueSort(Sizzle(s, n)); };
	}

	var d3_selectionPrototype = [];

	d3.selection = function() {
		return d3_selectionRoot;
	};

	d3.selection.prototype = d3_selectionPrototype;
	d3_selectionPrototype.select = function(selector) {
		var subgroups = [],
			subgroup,
			subnode,
			group,
			node;

		if (typeof selector !== "function") selector = d3_selection_selector(selector);

		for (var j = -1, m = this.length; ++j < m;) {
			subgroups.push(subgroup = []);
			subgroup.parentNode = (group = this[j]).parentNode;
			for (var i = -1, n = group.length; ++i < n;) {
				if (node = group[i]) {
					subgroup.push(subnode = selector.call(node, node.__data__, i));
					if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
				} else {
					subgroup.push(null);
				}
			}
		}

		return d3_selection(subgroups);
	};

	function d3_selection_selector(selector) {
		return function() {
			return d3_select(selector, this);
		};
	}
	d3_selectionPrototype.selectAll = function(selector) {
		var subgroups = [],
			subgroup,
			node;

		if (typeof selector !== "function") selector = d3_selection_selectorAll(selector);

		for (var j = -1, m = this.length; ++j < m;) {
			for (var group = this[j], i = -1, n = group.length; ++i < n;) {
				if (node = group[i]) {
					subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i)));
					subgroup.parentNode = node;
				}
			}
		}

		return d3_selection(subgroups);
	};

	function d3_selection_selectorAll(selector) {
		return function() {
			return d3_selectAll(selector, this);
		};
	}
	d3_selectionPrototype.attr = function(name, value) {
		name = d3.ns.qualify(name);

		// If no value is specified, return the first value.
		if (arguments.length < 2) {
			var node = this.node();
			return name.local
				? node.getAttributeNS(name.space, name.local)
				: node.getAttribute(name);
		}

		function attrNull() {
			this.removeAttribute(name);
		}

		function attrNullNS() {
			this.removeAttributeNS(name.space, name.local);
		}

		function attrConstant() {
			this.setAttribute(name, value);
		}

		function attrConstantNS() {
			this.setAttributeNS(name.space, name.local, value);
		}

		function attrFunction() {
			var x = value.apply(this, arguments);
			if (x == null) this.removeAttribute(name);
			else this.setAttribute(name, x);
		}

		function attrFunctionNS() {
			var x = value.apply(this, arguments);
			if (x == null) this.removeAttributeNS(name.space, name.local);
			else this.setAttributeNS(name.space, name.local, x);
		}

		return this.each(value == null
			? (name.local ? attrNullNS : attrNull) : (typeof value === "function"
			? (name.local ? attrFunctionNS : attrFunction)
			: (name.local ? attrConstantNS : attrConstant)));
	};
	d3_selectionPrototype.classed = function(name, value) {
		var names = name.split(d3_selection_classedWhitespace),
			n = names.length,
			i = -1;
		if (arguments.length > 1) {
			while (++i < n) d3_selection_classed.call(this, names[i], value);
			return this;
		} else {
			while (++i < n) if (!d3_selection_classed.call(this, names[i])) return false;
			return true;
		}
	};

	var d3_selection_classedWhitespace = /\s+/g;

	function d3_selection_classed(name, value) {
		var re = new RegExp("(^|\\s+)" + d3.requote(name) + "(\\s+|$)", "g");

		// If no value is specified, return the first value.
		if (arguments.length < 2) {
			var node = this.node();
			if (c = node.classList) return c.contains(name);
			var c = node.className;
			re.lastIndex = 0;
			return re.test(c.baseVal != null ? c.baseVal : c);
		}

		function classedAdd() {
			if (c = this.classList) return c.add(name);
			var c = this.className,
				cb = c.baseVal != null,
				cv = cb ? c.baseVal : c;
			re.lastIndex = 0;
			if (!re.test(cv)) {
				cv = d3_collapse(cv + " " + name);
				if (cb) c.baseVal = cv;
				else this.className = cv;
			}
		}

		function classedRemove() {
			if (c = this.classList) return c.remove(name);
			var c = this.className,
				cb = c.baseVal != null,
				cv = cb ? c.baseVal : c;
			cv = d3_collapse(cv.replace(re, " "));
			if (cb) c.baseVal = cv;
			else this.className = cv;
		}

		function classedFunction() {
			(value.apply(this, arguments)
				? classedAdd
				: classedRemove).call(this);
		}

		return this.each(typeof value === "function"
			? classedFunction : value
			? classedAdd
			: classedRemove);
	}
	d3_selectionPrototype.style = function(name, value, priority) {
		if (arguments.length < 3) priority = "";

		// If no value is specified, return the first value.
		if (arguments.length < 2) return window
			.getComputedStyle(this.node(), null)
			.getPropertyValue(name);

		function styleNull() {
			this.style.removeProperty(name);
		}

		function styleConstant() {
			this.style.setProperty(name, value, priority);
		}

		function styleFunction() {
			var x = value.apply(this, arguments);
			if (x == null) this.style.removeProperty(name);
			else this.style.setProperty(name, x, priority);
		}

		return this.each(value == null
			? styleNull : (typeof value === "function"
			? styleFunction : styleConstant));
	};
	d3_selectionPrototype.property = function(name, value) {

		// If no value is specified, return the first value.
		if (arguments.length < 2) return this.node()[name];

		function propertyNull() {
			delete this[name];
		}

		function propertyConstant() {
			this[name] = value;
		}

		function propertyFunction() {
			var x = value.apply(this, arguments);
			if (x == null) delete this[name];
			else this[name] = x;
		}

		return this.each(value == null
			? propertyNull : (typeof value === "function"
			? propertyFunction : propertyConstant));
	};
	d3_selectionPrototype.text = function(value) {
		return arguments.length < 1 ? this.node().textContent
			: (this.each(typeof value === "function"
			? function() { this.textContent = value.apply(this, arguments); }
			: function() { this.textContent = value; }));
	};
	d3_selectionPrototype.html = function(value) {
		return arguments.length < 1 ? this.node().innerHTML
			: (this.each(typeof value === "function"
			? function() { this.innerHTML = value.apply(this, arguments); }
			: function() { this.innerHTML = value; }));
	};
// TODO append(node)?
// TODO append(function)?
	d3_selectionPrototype.append = function(name) {
		name = d3.ns.qualify(name);

		function append() {
			return this.appendChild(document.createElement(name));
		}

		function appendNS() {
			return this.appendChild(document.createElementNS(name.space, name.local));
		}

		return this.select(name.local ? appendNS : append);
	};
// TODO insert(node, function)?
// TODO insert(function, string)?
// TODO insert(function, function)?
	d3_selectionPrototype.insert = function(name, before) {
		name = d3.ns.qualify(name);

		function insert() {
			return this.insertBefore(
				document.createElement(name),
				d3_select(before, this));
		}

		function insertNS() {
			return this.insertBefore(
				document.createElementNS(name.space, name.local),
				d3_select(before, this));
		}

		return this.select(name.local ? insertNS : insert);
	};
// TODO remove(selector)?
// TODO remove(node)?
// TODO remove(function)?
	d3_selectionPrototype.remove = function() {
		return this.each(function() {
			var parent = this.parentNode;
			if (parent) parent.removeChild(this);
		});
	};
// TODO data(null) for clearing data?
	d3_selectionPrototype.data = function(data, join) {
		var enter = [],
			update = [],
			exit = [];

		function bind(group, groupData) {
			var i,
				n = group.length,
				m = groupData.length,
				n0 = Math.min(n, m),
				n1 = Math.max(n, m),
				updateNodes = [],
				enterNodes = [],
				exitNodes = [],
				node,
				nodeData;

			if (join) {
				var nodeByKey = {},
					keys = [],
					key,
					j = groupData.length;

				for (i = -1; ++i < n;) {
					key = join.call(node = group[i], node.__data__, i);
					if (key in nodeByKey) {
						exitNodes[j++] = node; // duplicate key
					} else {
						nodeByKey[key] = node;
					}
					keys.push(key);
				}

				for (i = -1; ++i < m;) {
					node = nodeByKey[key = join.call(groupData, nodeData = groupData[i], i)];
					if (node) {
						node.__data__ = nodeData;
						updateNodes[i] = node;
						enterNodes[i] = exitNodes[i] = null;
					} else {
						enterNodes[i] = d3_selection_dataNode(nodeData);
						updateNodes[i] = exitNodes[i] = null;
					}
					delete nodeByKey[key];
				}

				for (i = -1; ++i < n;) {
					if (keys[i] in nodeByKey) {
						exitNodes[i] = group[i];
					}
				}
			} else {
				for (i = -1; ++i < n0;) {
					node = group[i];
					nodeData = groupData[i];
					if (node) {
						node.__data__ = nodeData;
						updateNodes[i] = node;
						enterNodes[i] = exitNodes[i] = null;
					} else {
						enterNodes[i] = d3_selection_dataNode(nodeData);
						updateNodes[i] = exitNodes[i] = null;
					}
				}
				for (; i < m; ++i) {
					enterNodes[i] = d3_selection_dataNode(groupData[i]);
					updateNodes[i] = exitNodes[i] = null;
				}
				for (; i < n1; ++i) {
					exitNodes[i] = group[i];
					enterNodes[i] = updateNodes[i] = null;
				}
			}

			enterNodes.update
				= updateNodes;

			enterNodes.parentNode
				= updateNodes.parentNode
				= exitNodes.parentNode
				= group.parentNode;

			enter.push(enterNodes);
			update.push(updateNodes);
			exit.push(exitNodes);
		}

		var i = -1,
			n = this.length,
			group;
		if (typeof data === "function") {
			while (++i < n) {
				bind(group = this[i], data.call(group, group.parentNode.__data__, i));
			}
		} else {
			while (++i < n) {
				bind(group = this[i], data);
			}
		}

		var selection = d3_selection(update);
		selection.enter = function() { return d3_selection_enter(enter); };
		selection.exit = function() { return d3_selection(exit); };
		return selection;
	};

	function d3_selection_dataNode(data) {
		return {__data__: data};
	}
	function d3_selection_enter(selection) {
		d3_arraySubclass(selection, d3_selection_enterPrototype);
		return selection;
	}

	var d3_selection_enterPrototype = [];

	d3_selection_enterPrototype.append = d3_selectionPrototype.append;
	d3_selection_enterPrototype.insert = d3_selectionPrototype.insert;
	d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
	d3_selection_enterPrototype.select = function(selector) {
		var subgroups = [],
			subgroup,
			subnode,
			upgroup,
			group,
			node;

		for (var j = -1, m = this.length; ++j < m;) {
			upgroup = (group = this[j]).update;
			subgroups.push(subgroup = []);
			subgroup.parentNode = group.parentNode;
			for (var i = -1, n = group.length; ++i < n;) {
				if (node = group[i]) {
					subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i));
					subnode.__data__ = node.__data__;
				} else {
					subgroup.push(null);
				}
			}
		}

		return d3_selection(subgroups);
	};
// TODO preserve null elements to maintain index?
	d3_selectionPrototype.filter = function(filter) {
		var subgroups = [],
			subgroup,
			group,
			node;

		for (var j = 0, m = this.length; j < m; j++) {
			subgroups.push(subgroup = []);
			subgroup.parentNode = (group = this[j]).parentNode;
			for (var i = 0, n = group.length; i < n; i++) {
				if ((node = group[i]) && filter.call(node, node.__data__, i)) {
					subgroup.push(node);
				}
			}
		}

		return d3_selection(subgroups);
	};
	d3_selectionPrototype.map = function(map) {
		return this.each(function() {
			this.__data__ = map.apply(this, arguments);
		});
	};
	d3_selectionPrototype.sort = function(comparator) {
		comparator = d3_selection_sortComparator.apply(this, arguments);
		for (var j = 0, m = this.length; j < m; j++) {
			for (var group = this[j].sort(comparator), i = 1, n = group.length, prev = group[0]; i < n; i++) {
				var node = group[i];
				if (node) {
					if (prev) prev.parentNode.insertBefore(node, prev.nextSibling);
					prev = node;
				}
			}
		}
		return this;
	};

	function d3_selection_sortComparator(comparator) {
		if (!arguments.length) comparator = d3.ascending;
		return function(a, b) {
			return comparator(a && a.__data__, b && b.__data__);
		};
	}
// type can be namespaced, e.g., "click.foo"
// listener can be null for removal
	d3_selectionPrototype.on = function(type, listener, capture) {
		if (arguments.length < 3) capture = false;

		// parse the type specifier
		var name = "__on" + type, i = type.indexOf(".");
		if (i > 0) type = type.substring(0, i);

		// if called with only one argument, return the current listener
		if (arguments.length < 2) return (i = this.node()[name]) && i._;

		// remove the old event listener, and add the new event listener
		return this.each(function(d, i) {
			var node = this;

			if (node[name]) node.removeEventListener(type, node[name], capture);
			if (listener) node.addEventListener(type, node[name] = l, capture);

			// wrapped event listener that preserves i
			function l(e) {
				var o = d3.event; // Events can be reentrant (e.g., focus).
				d3.event = e;
				try {
					listener.call(node, node.__data__, i);
				} finally {
					d3.event = o;
				}
			}

			// stash the unwrapped listener for retrieval
			l._ = listener;
		});
	};
	d3_selectionPrototype.each = function(callback) {
		for (var j = -1, m = this.length; ++j < m;) {
			for (var group = this[j], i = -1, n = group.length; ++i < n;) {
				var node = group[i];
				if (node) callback.call(node, node.__data__, i, j);
			}
		}
		return this;
	};
//
// Note: assigning to the arguments array simultaneously changes the value of
// the corresponding argument!
//
// TODO The `this` argument probably shouldn't be the first argument to the
// callback, anyway, since it's redundant. However, that will require a major
// version bump due to backwards compatibility, so I'm not changing it right
// away.
//
	d3_selectionPrototype.call = function(callback) {
		callback.apply(this, (arguments[0] = this, arguments));
		return this;
	};
	d3_selectionPrototype.empty = function() {
		return !this.node();
	};
	d3_selectionPrototype.node = function(callback) {
		for (var j = 0, m = this.length; j < m; j++) {
			for (var group = this[j], i = 0, n = group.length; i < n; i++) {
				var node = group[i];
				if (node) return node;
			}
		}
		return null;
	};
	d3_selectionPrototype.transition = function() {
		var subgroups = [],
			subgroup,
			node;

		for (var j = -1, m = this.length; ++j < m;) {
			subgroups.push(subgroup = []);
			for (var group = this[j], i = -1, n = group.length; ++i < n;) {
				subgroup.push((node = group[i]) ? {node: node, delay: 0, duration: 250} : null);
			}
		}

		return d3_transition(subgroups, d3_transitionInheritId || ++d3_transitionId, Date.now());
	};
	var d3_selectionRoot = d3_selection([[document]]);

	d3_selectionRoot[0].parentNode = document.documentElement;

// TODO fast singleton implementation!
// TODO select(function)
	d3.select = function(selector) {
		return typeof selector === "string"
			? d3_selectionRoot.select(selector)
			: d3_selection([[selector]]); // assume node
	};

// TODO selectAll(function)
	d3.selectAll = function(selector) {
		return typeof selector === "string"
			? d3_selectionRoot.selectAll(selector)
			: d3_selection([d3_array(selector)]); // assume node[]
	};
	function d3_transition(groups, id, time) {
		d3_arraySubclass(groups, d3_transitionPrototype);

		var tweens = {},
			event = d3.dispatch("start", "end"),
			ease = d3_transitionEase;

		groups.id = id;

		groups.time = time;

		groups.tween = function(name, tween) {
			if (arguments.length < 2) return tweens[name];
			if (tween == null) delete tweens[name];
			else tweens[name] = tween;
			return groups;
		};

		groups.ease = function(value) {
			if (!arguments.length) return ease;
			ease = typeof value === "function" ? value : d3.ease.apply(d3, arguments);
			return groups;
		};

		groups.each = function(type, listener) {
			if (arguments.length < 2) return d3_transition_each.call(groups, type);
			event[type].add(listener);
			return groups;
		};

		d3.timer(function(elapsed) {
			groups.each(function(d, i, j) {
				var tweened = [],
					node = this,
					delay = groups[j][i].delay,
					duration = groups[j][i].duration,
					lock = node.__transition__ || (node.__transition__ = {active: 0, count: 0});

				++lock.count;

				delay <= elapsed ? start(elapsed) : d3.timer(start, delay, time);

				function start(elapsed) {
					if (lock.active > id) return stop();
					lock.active = id;

					for (var tween in tweens) {
						if (tween = tweens[tween].call(node, d, i)) {
							tweened.push(tween);
						}
					}

					event.start.dispatch.call(node, d, i);
					if (!tick(elapsed)) d3.timer(tick, 0, time);
					return 1;
				}

				function tick(elapsed) {
					if (lock.active !== id) return stop();

					var t = (elapsed - delay) / duration,
						e = ease(t),
						n = tweened.length;

					while (n > 0) {
						tweened[--n].call(node, e);
					}

					if (t >= 1) {
						stop();
						d3_transitionInheritId = id;
						event.end.dispatch.call(node, d, i);
						d3_transitionInheritId = 0;
						return 1;
					}
				}

				function stop() {
					if (!--lock.count) delete node.__transition__;
					return 1;
				}
			});
			return 1;
		}, 0, time);

		return groups;
	}

	var d3_transitionRemove = {};

	function d3_transitionNull(d, i, a) {
		return a != "" && d3_transitionRemove;
	}

	function d3_transitionTween(b) {

		function transitionFunction(d, i, a) {
			var v = b.call(this, d, i);
			return v == null
				? a != "" && d3_transitionRemove
				: a != v && d3.interpolate(a, v);
		}

		function transitionString(d, i, a) {
			return a != b && d3.interpolate(a, b);
		}

		return typeof b === "function" ? transitionFunction
			: b == null ? d3_transitionNull
			: (b += "", transitionString);
	}

	var d3_transitionPrototype = [],
		d3_transitionId = 0,
		d3_transitionInheritId = 0,
		d3_transitionEase = d3.ease("cubic-in-out");

	d3_transitionPrototype.call = d3_selectionPrototype.call;

	d3.transition = function() {
		return d3_selectionRoot.transition();
	};

	d3.transition.prototype = d3_transitionPrototype;
	d3_transitionPrototype.select = function(selector) {
		var subgroups = [],
			subgroup,
			subnode,
			node;

		if (typeof selector !== "function") selector = d3_selection_selector(selector);

		for (var j = -1, m = this.length; ++j < m;) {
			subgroups.push(subgroup = []);
			for (var group = this[j], i = -1, n = group.length; ++i < n;) {
				if ((node = group[i]) && (subnode = selector.call(node.node, node.node.__data__, i))) {
					if ("__data__" in node.node) subnode.__data__ = node.node.__data__;
					subgroup.push({node: subnode, delay: node.delay, duration: node.duration});
				} else {
					subgroup.push(null);
				}
			}
		}

		return d3_transition(subgroups, this.id, this.time).ease(this.ease());
	};
	d3_transitionPrototype.selectAll = function(selector) {
		var subgroups = [],
			subgroup,
			subnodes,
			node;

		if (typeof selector !== "function") selector = d3_selection_selectorAll(selector);

		for (var j = -1, m = this.length; ++j < m;) {
			for (var group = this[j], i = -1, n = group.length; ++i < n;) {
				if (node = group[i]) {
					subnodes = selector.call(node.node, node.node.__data__, i);
					subgroups.push(subgroup = []);
					for (var k = -1, o = subnodes.length; ++k < o;) {
						subgroup.push({node: subnodes[k], delay: node.delay, duration: node.duration});
					}
				}
			}
		}

		return d3_transition(subgroups, this.id, this.time).ease(this.ease());
	};
	d3_transitionPrototype.attr = function(name, value) {
		return this.attrTween(name, d3_transitionTween(value));
	};

	d3_transitionPrototype.attrTween = function(nameNS, tween) {
		var name = d3.ns.qualify(nameNS);

		function attrTween(d, i) {
			var f = tween.call(this, d, i, this.getAttribute(name));
			return f === d3_transitionRemove
				? (this.removeAttribute(name), null)
				: f && function(t) { this.setAttribute(name, f(t)); };
		}

		function attrTweenNS(d, i) {
			var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
			return f === d3_transitionRemove
				? (this.removeAttributeNS(name.space, name.local), null)
				: f && function(t) { this.setAttributeNS(name.space, name.local, f(t)); };
		}

		return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
	};
	d3_transitionPrototype.style = function(name, value, priority) {
		if (arguments.length < 3) priority = "";
		return this.styleTween(name, d3_transitionTween(value), priority);
	};

	d3_transitionPrototype.styleTween = function(name, tween, priority) {
		if (arguments.length < 3) priority = "";
		return this.tween("style." + name, function(d, i) {
			var f = tween.call(this, d, i, window.getComputedStyle(this, null).getPropertyValue(name));
			return f === d3_transitionRemove
				? (this.style.removeProperty(name), null)
				: f && function(t) { this.style.setProperty(name, f(t), priority); };
		});
	};
	d3_transitionPrototype.text = function(value) {
		return this.tween("text", function(d, i) {
			this.textContent = typeof value === "function"
				? value.call(this, d, i)
				: value;
		});
	};
	d3_transitionPrototype.remove = function() {
		return this.each("end", function() {
			var p;
			if (!this.__transition__ && (p = this.parentNode)) p.removeChild(this);
		});
	};
	d3_transitionPrototype.delay = function(value) {
		var groups = this;
		return groups.each(typeof value === "function"
			? function(d, i, j) { groups[j][i].delay = +value.apply(this, arguments); }
			: (value = +value, function(d, i, j) { groups[j][i].delay = value; }));
	};
	d3_transitionPrototype.duration = function(value) {
		var groups = this;
		return groups.each(typeof value === "function"
			? function(d, i, j) { groups[j][i].duration = +value.apply(this, arguments); }
			: (value = +value, function(d, i, j) { groups[j][i].duration = value; }));
	};
	function d3_transition_each(callback) {
		for (var j = 0, m = this.length; j < m; j++) {
			for (var group = this[j], i = 0, n = group.length; i < n; i++) {
				var node = group[i];
				if (node) callback.call(node = node.node, node.__data__, i, j);
			}
		}
		return this;
	}
	d3_transitionPrototype.transition = function() {
		return this.select(d3_this);
	};
	var d3_timer_queue = null,
		d3_timer_interval, // is an interval (or frame) active?
		d3_timer_timeout; // is a timeout active?

// The timer will continue to fire until callback returns true.
	d3.timer = function(callback, delay, then) {
		var found = false,
			t0,
			t1 = d3_timer_queue;

		if (arguments.length < 3) {
			if (arguments.length < 2) delay = 0;
			else if (!isFinite(delay)) return;
			then = Date.now();
		}

		// See if the callback's already in the queue.
		while (t1) {
			if (t1.callback === callback) {
				t1.then = then;
				t1.delay = delay;
				found = true;
				break;
			}
			t0 = t1;
			t1 = t1.next;
		}

		// Otherwise, add the callback to the queue.
		if (!found) d3_timer_queue = {
			callback: callback,
			then: then,
			delay: delay,
			next: d3_timer_queue
		};

		// Start animatin'!
		if (!d3_timer_interval) {
			d3_timer_timeout = clearTimeout(d3_timer_timeout);
			d3_timer_interval = 1;
			d3_timer_frame(d3_timer_step);
		}
	}

	function d3_timer_step() {
		var elapsed,
			now = Date.now(),
			t1 = d3_timer_queue;

		while (t1) {
			elapsed = now - t1.then;
			if (elapsed >= t1.delay) t1.flush = t1.callback(elapsed);
			t1 = t1.next;
		}

		var delay = d3_timer_flush() - now;
		if (delay > 24) {
			if (isFinite(delay)) {
				clearTimeout(d3_timer_timeout);
				d3_timer_timeout = setTimeout(d3_timer_step, delay);
			}
			d3_timer_interval = 0;
		} else {
			d3_timer_interval = 1;
			d3_timer_frame(d3_timer_step);
		}
	}

	d3.timer.flush = function() {
		var elapsed,
			now = Date.now(),
			t1 = d3_timer_queue;

		while (t1) {
			elapsed = now - t1.then;
			if (!t1.delay) t1.flush = t1.callback(elapsed);
			t1 = t1.next;
		}

		d3_timer_flush();
	};

// Flush after callbacks, to avoid concurrent queue modification.
	function d3_timer_flush() {
		var t0 = null,
			t1 = d3_timer_queue,
			then = Infinity;
		while (t1) {
			if (t1.flush) {
				t1 = t0 ? t0.next = t1.next : d3_timer_queue = t1.next;
			} else {
				then = Math.min(then, t1.then + t1.delay);
				t1 = (t0 = t1).next;
			}
		}
		return then;
	}

	var d3_timer_frame = window.requestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame
		|| function(callback) { setTimeout(callback, 17); };
	function d3_noop() {}
	d3.scale = {};

	function d3_scaleExtent(domain) {
		var start = domain[0], stop = domain[domain.length - 1];
		return start < stop ? [start, stop] : [stop, start];
	}
	function d3_scale_nice(domain, nice) {
		var i0 = 0,
			i1 = domain.length - 1,
			x0 = domain[i0],
			x1 = domain[i1],
			dx;

		if (x1 < x0) {
			dx = i0; i0 = i1; i1 = dx;
			dx = x0; x0 = x1; x1 = dx;
		}

		if (dx = x1 - x0) {
			nice = nice(dx);
			domain[i0] = nice.floor(x0);
			domain[i1] = nice.ceil(x1);
		}

		return domain;
	}

	function d3_scale_niceDefault() {
		return Math;
	}
	d3.scale.linear = function() {
		return d3_scale_linear([0, 1], [0, 1], d3.interpolate, false);
	};

	function d3_scale_linear(domain, range, interpolate, clamp) {
		var output,
			input;

		function rescale() {
			var linear = domain.length == 2 ? d3_scale_bilinear : d3_scale_polylinear,
				uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
			output = linear(domain, range, uninterpolate, interpolate);
			input = linear(range, domain, uninterpolate, d3.interpolate);
			return scale;
		}

		function scale(x) {
			return output(x);
		}

		// Note: requires range is coercible to number!
		scale.invert = function(y) {
			return input(y);
		};

		scale.domain = function(x) {
			if (!arguments.length) return domain;
			domain = x.map(Number);
			return rescale();
		};

		scale.range = function(x) {
			if (!arguments.length) return range;
			range = x;
			return rescale();
		};

		scale.rangeRound = function(x) {
			return scale.range(x).interpolate(d3.interpolateRound);
		};

		scale.clamp = function(x) {
			if (!arguments.length) return clamp;
			clamp = x;
			return rescale();
		};

		scale.interpolate = function(x) {
			if (!arguments.length) return interpolate;
			interpolate = x;
			return rescale();
		};

		scale.ticks = function(m) {
			return d3_scale_linearTicks(domain, m);
		};

		scale.tickFormat = function(m) {
			return d3_scale_linearTickFormat(domain, m);
		};

		scale.nice = function() {
			d3_scale_nice(domain, d3_scale_linearNice);
			return rescale();
		};

		scale.copy = function() {
			return d3_scale_linear(domain, range, interpolate, clamp);
		};

		return rescale();
	};

	function d3_scale_linearRebind(scale, linear) {
		scale.range = d3.rebind(scale, linear.range);
		scale.rangeRound = d3.rebind(scale, linear.rangeRound);
		scale.interpolate = d3.rebind(scale, linear.interpolate);
		scale.clamp = d3.rebind(scale, linear.clamp);
		return scale;
	}

	function d3_scale_linearNice(dx) {
		dx = Math.pow(10, Math.round(Math.log(dx) / Math.LN10) - 1);
		return {
			floor: function(x) { return Math.floor(x / dx) * dx; },
			ceil: function(x) { return Math.ceil(x / dx) * dx; }
		};
	}

// TODO Dates? Ugh.
	function d3_scale_linearTickRange(domain, m) {
		var extent = d3_scaleExtent(domain),
			span = extent[1] - extent[0],
			step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)),
			err = m / span * step;

		// Filter ticks to get closer to the desired count.
		if (err <= .15) step *= 10;
		else if (err <= .35) step *= 5;
		else if (err <= .75) step *= 2;

		// Round start and stop values to step interval.
		extent[0] = Math.ceil(extent[0] / step) * step;
		extent[1] = Math.floor(extent[1] / step) * step + step * .5; // inclusive
		extent[2] = step;
		return extent;
	}

	function d3_scale_linearTicks(domain, m) {
		return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
	}

	function d3_scale_linearTickFormat(domain, m) {
		return d3.format(",." + Math.max(0, -Math.floor(Math.log(d3_scale_linearTickRange(domain, m)[2]) / Math.LN10 + .01)) + "f");
	}
	function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
		var u = uninterpolate(domain[0], domain[1]),
			i = interpolate(range[0], range[1]);
		return function(x) {
			return i(u(x));
		};
	}
	function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
		var u = [],
			i = [],
			j = 0,
			n = domain.length;

		while (++j < n) {
			u.push(uninterpolate(domain[j - 1], domain[j]));
			i.push(interpolate(range[j - 1], range[j]));
		}

		return function(x) {
			var j = d3.bisect(domain, x, 1, domain.length - 1) - 1;
			return i[j](u[j](x));
		};
	}
	d3.scale.log = function() {
		return d3_scale_log(d3.scale.linear(), d3_scale_logp);
	};

	function d3_scale_log(linear, log) {
		var pow = log.pow;

		function scale(x) {
			return linear(log(x));
		}

		scale.invert = function(x) {
			return pow(linear.invert(x));
		};

		scale.domain = function(x) {
			if (!arguments.length) return linear.domain().map(pow);
			log = x[0] < 0 ? d3_scale_logn : d3_scale_logp;
			pow = log.pow;
			linear.domain(x.map(log));
			return scale;
		};

		scale.nice = function() {
			linear.domain(d3_scale_nice(linear.domain(), d3_scale_niceDefault));
			return scale;
		};

		scale.ticks = function() {
			var extent = d3_scaleExtent(linear.domain()),
				ticks = [];
			if (extent.every(isFinite)) {
				var i = Math.floor(extent[0]),
					j = Math.ceil(extent[1]),
					u = Math.round(pow(extent[0])),
					v = Math.round(pow(extent[1]));
				if (log === d3_scale_logn) {
					ticks.push(pow(i));
					for (; i++ < j;) for (var k = 9; k > 0; k--) ticks.push(pow(i) * k);
				} else {
					for (; i < j; i++) for (var k = 1; k < 10; k++) ticks.push(pow(i) * k);
					ticks.push(pow(i));
				}
				for (i = 0; ticks[i] < u; i++) {} // strip small values
				for (j = ticks.length; ticks[j - 1] > v; j--) {} // strip big values
				ticks = ticks.slice(i, j);
			}
			return ticks;
		};

		scale.tickFormat = function(n, format) {
			if (arguments.length < 2) format = d3_scale_logFormat;
			if (arguments.length < 1) return format;
			var k = n / scale.ticks().length,
				f = log === d3_scale_logn ? (e = -1e-15, Math.floor) : (e = 1e-15, Math.ceil),
				e;
			return function(d) {
				return d / pow(f(log(d) + e)) < k ? format(d) : "";
			};
		};

		scale.copy = function() {
			return d3_scale_log(linear.copy(), log);
		};

		return d3_scale_linearRebind(scale, linear);
	};

	var d3_scale_logFormat = d3.format("e");

	function d3_scale_logp(x) {
		return Math.log(x) / Math.LN10;
	}

	function d3_scale_logn(x) {
		return -Math.log(-x) / Math.LN10;
	}

	d3_scale_logp.pow = function(x) {
		return Math.pow(10, x);
	};

	d3_scale_logn.pow = function(x) {
		return -Math.pow(10, -x);
	};
	d3.scale.pow = function() {
		return d3_scale_pow(d3.scale.linear(), 1);
	};

	function d3_scale_pow(linear, exponent) {
		var powp = d3_scale_powPow(exponent),
			powb = d3_scale_powPow(1 / exponent);

		function scale(x) {
			return linear(powp(x));
		}

		scale.invert = function(x) {
			return powb(linear.invert(x));
		};

		scale.domain = function(x) {
			if (!arguments.length) return linear.domain().map(powb);
			linear.domain(x.map(powp));
			return scale;
		};

		scale.ticks = function(m) {
			return d3_scale_linearTicks(scale.domain(), m);
		};

		scale.tickFormat = function(m) {
			return d3_scale_linearTickFormat(scale.domain(), m);
		};

		scale.nice = function() {
			return scale.domain(d3_scale_nice(scale.domain(), d3_scale_linearNice));
		};

		scale.exponent = function(x) {
			if (!arguments.length) return exponent;
			var domain = scale.domain();
			powp = d3_scale_powPow(exponent = x);
			powb = d3_scale_powPow(1 / exponent);
			return scale.domain(domain);
		};

		scale.copy = function() {
			return d3_scale_pow(linear.copy(), exponent);
		};

		return d3_scale_linearRebind(scale, linear);
	};

	function d3_scale_powPow(e) {
		return function(x) {
			return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
		};
	}
	d3.scale.sqrt = function() {
		return d3.scale.pow().exponent(.5);
	};
	d3.scale.ordinal = function() {
		return d3_scale_ordinal([], {t: "range", x: []});
	};

	function d3_scale_ordinal(domain, ranger) {
		var index,
			range,
			rangeBand;

		function scale(x) {
			return range[((index[x] || (index[x] = domain.push(x))) - 1) % range.length];
		}

		scale.domain = function(x) {
			if (!arguments.length) return domain;
			domain = [];
			index = {};
			var i = -1, n = x.length, xi;
			while (++i < n) if (!index[xi = x[i]]) index[xi] = domain.push(xi);
			return scale[ranger.t](ranger.x, ranger.p);
		};

		scale.range = function(x) {
			if (!arguments.length) return range;
			range = x;
			rangeBand = 0;
			ranger = {t: "range", x: x};
			return scale;
		};

		scale.rangePoints = function(x, padding) {
			if (arguments.length < 2) padding = 0;
			var start = x[0],
				stop = x[1],
				step = (stop - start) / (domain.length - 1 + padding);
			range = domain.length < 2 ? [(start + stop) / 2] : d3.range(start + step * padding / 2, stop + step / 2, step);
			rangeBand = 0;
			ranger = {t: "rangePoints", x: x, p: padding};
			return scale;
		};

		scale.rangeBands = function(x, padding) {
			if (arguments.length < 2) padding = 0;
			var start = x[0],
				stop = x[1],
				step = (stop - start) / (domain.length + padding);
			range = d3.range(start + step * padding, stop, step);
			rangeBand = step * (1 - padding);
			ranger = {t: "rangeBands", x: x, p: padding};
			return scale;
		};

		scale.rangeRoundBands = function(x, padding) {
			if (arguments.length < 2) padding = 0;
			var start = x[0],
				stop = x[1],
				step = Math.floor((stop - start) / (domain.length + padding)),
				err = stop - start - (domain.length - padding) * step;
			range = d3.range(start + Math.round(err / 2), stop, step);
			rangeBand = Math.round(step * (1 - padding));
			ranger = {t: "rangeRoundBands", x: x, p: padding};
			return scale;
		};

		scale.rangeBand = function() {
			return rangeBand;
		};

		scale.copy = function() {
			return d3_scale_ordinal(domain, ranger);
		};

		return scale.domain(domain);
	};
	/*
	 * This product includes color specifications and designs developed by Cynthia
	 * Brewer (http://colorbrewer.org/). See lib/colorbrewer for more information.
	 */

	d3.scale.category10 = function() {
		return d3.scale.ordinal().range(d3_category10);
	};

	d3.scale.category20 = function() {
		return d3.scale.ordinal().range(d3_category20);
	};

	d3.scale.category20b = function() {
		return d3.scale.ordinal().range(d3_category20b);
	};

	d3.scale.category20c = function() {
		return d3.scale.ordinal().range(d3_category20c);
	};

	var d3_category10 = [
		"#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
		"#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
	];

	var d3_category20 = [
		"#1f77b4", "#aec7e8",
		"#ff7f0e", "#ffbb78",
		"#2ca02c", "#98df8a",
		"#d62728", "#ff9896",
		"#9467bd", "#c5b0d5",
		"#8c564b", "#c49c94",
		"#e377c2", "#f7b6d2",
		"#7f7f7f", "#c7c7c7",
		"#bcbd22", "#dbdb8d",
		"#17becf", "#9edae5"
	];

	var d3_category20b = [
		"#393b79", "#5254a3", "#6b6ecf", "#9c9ede",
		"#637939", "#8ca252", "#b5cf6b", "#cedb9c",
		"#8c6d31", "#bd9e39", "#e7ba52", "#e7cb94",
		"#843c39", "#ad494a", "#d6616b", "#e7969c",
		"#7b4173", "#a55194", "#ce6dbd", "#de9ed6"
	];

	var d3_category20c = [
		"#3182bd", "#6baed6", "#9ecae1", "#c6dbef",
		"#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2",
		"#31a354", "#74c476", "#a1d99b", "#c7e9c0",
		"#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb",
		"#636363", "#969696", "#bdbdbd", "#d9d9d9"
	];
	d3.scale.quantile = function() {
		return d3_scale_quantile([], []);
	};

	function d3_scale_quantile(domain, range) {
		var thresholds;

		function rescale() {
			var k = 0,
				n = domain.length,
				q = range.length;
			thresholds = [];
			while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
			return scale;
		}

		function scale(x) {
			if (isNaN(x = +x)) return NaN;
			return range[d3.bisect(thresholds, x)];
		}

		scale.domain = function(x) {
			if (!arguments.length) return domain;
			domain = x.filter(function(d) { return !isNaN(d); }).sort(d3.ascending);
			return rescale();
		};

		scale.range = function(x) {
			if (!arguments.length) return range;
			range = x;
			return rescale();
		};

		scale.quantiles = function() {
			return thresholds;
		};

		scale.copy = function() {
			return d3_scale_quantile(domain, range); // copy on write!
		};

		return rescale();
	};
	d3.scale.quantize = function() {
		return d3_scale_quantize(0, 1, [0, 1]);
	};

	function d3_scale_quantize(x0, x1, range) {
		var kx, i;

		function scale(x) {
			return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
		}

		function rescale() {
			kx = range.length / (x1 - x0);
			i = range.length - 1;
			return scale;
		}

		scale.domain = function(x) {
			if (!arguments.length) return [x0, x1];
			x0 = +x[0];
			x1 = +x[x.length - 1];
			return rescale();
		};

		scale.range = function(x) {
			if (!arguments.length) return range;
			range = x;
			return rescale();
		};

		scale.copy = function() {
			return d3_scale_quantize(x0, x1, range); // copy on write
		};

		return rescale();
	};
	d3.svg = {};
	d3.svg.arc = function() {
		var innerRadius = d3_svg_arcInnerRadius,
			outerRadius = d3_svg_arcOuterRadius,
			startAngle = d3_svg_arcStartAngle,
			endAngle = d3_svg_arcEndAngle;

		function arc() {
			var r0 = innerRadius.apply(this, arguments),
				r1 = outerRadius.apply(this, arguments),
				a0 = startAngle.apply(this, arguments) + d3_svg_arcOffset,
				a1 = endAngle.apply(this, arguments) + d3_svg_arcOffset,
				da = (a1 < a0 && (da = a0, a0 = a1, a1 = da), a1 - a0),
				df = da < Math.PI ? "0" : "1",
				c0 = Math.cos(a0),
				s0 = Math.sin(a0),
				c1 = Math.cos(a1),
				s1 = Math.sin(a1);
			return da >= d3_svg_arcMax
				? (r0
				? "M0," + r1
				+ "A" + r1 + "," + r1 + " 0 1,1 0," + (-r1)
				+ "A" + r1 + "," + r1 + " 0 1,1 0," + r1
				+ "M0," + r0
				+ "A" + r0 + "," + r0 + " 0 1,0 0," + (-r0)
				+ "A" + r0 + "," + r0 + " 0 1,0 0," + r0
				+ "Z"
				: "M0," + r1
				+ "A" + r1 + "," + r1 + " 0 1,1 0," + (-r1)
				+ "A" + r1 + "," + r1 + " 0 1,1 0," + r1
				+ "Z")
				: (r0
				? "M" + r1 * c0 + "," + r1 * s0
				+ "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1
				+ "L" + r0 * c1 + "," + r0 * s1
				+ "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0
				+ "Z"
				: "M" + r1 * c0 + "," + r1 * s0
				+ "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1
				+ "L0,0"
				+ "Z");
		}

		arc.innerRadius = function(v) {
			if (!arguments.length) return innerRadius;
			innerRadius = d3.functor(v);
			return arc;
		};

		arc.outerRadius = function(v) {
			if (!arguments.length) return outerRadius;
			outerRadius = d3.functor(v);
			return arc;
		};

		arc.startAngle = function(v) {
			if (!arguments.length) return startAngle;
			startAngle = d3.functor(v);
			return arc;
		};

		arc.endAngle = function(v) {
			if (!arguments.length) return endAngle;
			endAngle = d3.functor(v);
			return arc;
		};

		arc.centroid = function() {
			var r = (innerRadius.apply(this, arguments)
					+ outerRadius.apply(this, arguments)) / 2,
				a = (startAngle.apply(this, arguments)
					+ endAngle.apply(this, arguments)) / 2 + d3_svg_arcOffset;
			return [Math.cos(a) * r, Math.sin(a) * r];
		};

		return arc;
	};

	var d3_svg_arcOffset = -Math.PI / 2,
		d3_svg_arcMax = 2 * Math.PI - 1e-6;

	function d3_svg_arcInnerRadius(d) {
		return d.innerRadius;
	}

	function d3_svg_arcOuterRadius(d) {
		return d.outerRadius;
	}

	function d3_svg_arcStartAngle(d) {
		return d.startAngle;
	}

	function d3_svg_arcEndAngle(d) {
		return d.endAngle;
	}
	function d3_svg_line(projection) {
		var x = d3_svg_lineX,
			y = d3_svg_lineY,
			interpolate = "linear",
			interpolator = d3_svg_lineInterpolators[interpolate],
			tension = .7;

		function line(d) {
			return d.length < 1 ? null : "M" + interpolator(projection(d3_svg_linePoints(this, d, x, y)), tension);
		}

		line.x = function(v) {
			if (!arguments.length) return x;
			x = v;
			return line;
		};

		line.y = function(v) {
			if (!arguments.length) return y;
			y = v;
			return line;
		};

		line.interpolate = function(v) {
			if (!arguments.length) return interpolate;
			interpolator = d3_svg_lineInterpolators[interpolate = v];
			return line;
		};

		line.tension = function(v) {
			if (!arguments.length) return tension;
			tension = v;
			return line;
		};

		return line;
	}

	d3.svg.line = function() {
		return d3_svg_line(Object);
	};

// Converts the specified array of data into an array of points
// (x-y tuples), by evaluating the specified `x` and `y` functions on each
// data point. The `this` context of the evaluated functions is the specified
// "self" object; each function is passed the current datum and index.
	function d3_svg_linePoints(self, d, x, y) {
		var points = [],
			i = -1,
			n = d.length,
			fx = typeof x === "function",
			fy = typeof y === "function",
			value;
		if (fx && fy) {
			while (++i < n) points.push([
				x.call(self, value = d[i], i),
				y.call(self, value, i)
			]);
		} else if (fx) {
			while (++i < n) points.push([x.call(self, d[i], i), y]);
		} else if (fy) {
			while (++i < n) points.push([x, y.call(self, d[i], i)]);
		} else {
			while (++i < n) points.push([x, y]);
		}
		return points;
	}

// The default `x` property, which references d[0].
	function d3_svg_lineX(d) {
		return d[0];
	}

// The default `y` property, which references d[1].
	function d3_svg_lineY(d) {
		return d[1];
	}

// The various interpolators supported by the `line` class.
	var d3_svg_lineInterpolators = {
		"linear": d3_svg_lineLinear,
		"step-before": d3_svg_lineStepBefore,
		"step-after": d3_svg_lineStepAfter,
		"basis": d3_svg_lineBasis,
		"basis-open": d3_svg_lineBasisOpen,
		"basis-closed": d3_svg_lineBasisClosed,
		"bundle": d3_svg_lineBundle,
		"cardinal": d3_svg_lineCardinal,
		"cardinal-open": d3_svg_lineCardinalOpen,
		"cardinal-closed": d3_svg_lineCardinalClosed,
		"monotone": d3_svg_lineMonotone
	};

// Linear interpolation; generates "L" commands.
	function d3_svg_lineLinear(points) {
		var i = 0,
			n = points.length,
			p = points[0],
			path = [p[0], ",", p[1]];
		while (++i < n) path.push("L", (p = points[i])[0], ",", p[1]);
		return path.join("");
	}

// Step interpolation; generates "H" and "V" commands.
	function d3_svg_lineStepBefore(points) {
		var i = 0,
			n = points.length,
			p = points[0],
			path = [p[0], ",", p[1]];
		while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
		return path.join("");
	}

// Step interpolation; generates "H" and "V" commands.
	function d3_svg_lineStepAfter(points) {
		var i = 0,
			n = points.length,
			p = points[0],
			path = [p[0], ",", p[1]];
		while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
		return path.join("");
	}

// Open cardinal spline interpolation; generates "C" commands.
	function d3_svg_lineCardinalOpen(points, tension) {
		return points.length < 4
			? d3_svg_lineLinear(points)
			: points[1] + d3_svg_lineHermite(points.slice(1, points.length - 1),
			d3_svg_lineCardinalTangents(points, tension));
	}

// Closed cardinal spline interpolation; generates "C" commands.
	function d3_svg_lineCardinalClosed(points, tension) {
		return points.length < 3
			? d3_svg_lineLinear(points)
			: points[0] + d3_svg_lineHermite((points.push(points[0]), points),
			d3_svg_lineCardinalTangents([points[points.length - 2]]
				.concat(points, [points[1]]), tension));
	}

// Cardinal spline interpolation; generates "C" commands.
	function d3_svg_lineCardinal(points, tension, closed) {
		return points.length < 3
			? d3_svg_lineLinear(points)
			: points[0] + d3_svg_lineHermite(points,
			d3_svg_lineCardinalTangents(points, tension));
	}

// Hermite spline construction; generates "C" commands.
	function d3_svg_lineHermite(points, tangents) {
		if (tangents.length < 1
			|| (points.length != tangents.length
			&& points.length != tangents.length + 2)) {
			return d3_svg_lineLinear(points);
		}

		var quad = points.length != tangents.length,
			path = "",
			p0 = points[0],
			p = points[1],
			t0 = tangents[0],
			t = t0,
			pi = 1;

		if (quad) {
			path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3)
				+ "," + p[0] + "," + p[1];
			p0 = points[1];
			pi = 2;
		}

		if (tangents.length > 1) {
			t = tangents[1];
			p = points[pi];
			pi++;
			path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1])
				+ "," + (p[0] - t[0]) + "," + (p[1] - t[1])
				+ "," + p[0] + "," + p[1];
			for (var i = 2; i < tangents.length; i++, pi++) {
				p = points[pi];
				t = tangents[i];
				path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1])
					+ "," + p[0] + "," + p[1];
			}
		}

		if (quad) {
			var lp = points[pi];
			path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3)
				+ "," + lp[0] + "," + lp[1];
		}

		return path;
	}

// Generates tangents for a cardinal spline.
	function d3_svg_lineCardinalTangents(points, tension) {
		var tangents = [],
			a = (1 - tension) / 2,
			p0,
			p1 = points[0],
			p2 = points[1],
			i = 1,
			n = points.length;
		while (++i < n) {
			p0 = p1;
			p1 = p2;
			p2 = points[i];
			tangents.push([a * (p2[0] - p0[0]), a * (p2[1] - p0[1])]);
		}
		return tangents;
	}

// B-spline interpolation; generates "C" commands.
	function d3_svg_lineBasis(points) {
		if (points.length < 3) return d3_svg_lineLinear(points);
		var i = 1,
			n = points.length,
			pi = points[0],
			x0 = pi[0],
			y0 = pi[1],
			px = [x0, x0, x0, (pi = points[1])[0]],
			py = [y0, y0, y0, pi[1]],
			path = [x0, ",", y0];
		d3_svg_lineBasisBezier(path, px, py);
		while (++i < n) {
			pi = points[i];
			px.shift(); px.push(pi[0]);
			py.shift(); py.push(pi[1]);
			d3_svg_lineBasisBezier(path, px, py);
		}
		i = -1;
		while (++i < 2) {
			px.shift(); px.push(pi[0]);
			py.shift(); py.push(pi[1]);
			d3_svg_lineBasisBezier(path, px, py);
		}
		return path.join("");
	}

// Open B-spline interpolation; generates "C" commands.
	function d3_svg_lineBasisOpen(points) {
		if (points.length < 4) return d3_svg_lineLinear(points);
		var path = [],
			i = -1,
			n = points.length,
			pi,
			px = [0],
			py = [0];
		while (++i < 3) {
			pi = points[i];
			px.push(pi[0]);
			py.push(pi[1]);
		}
		path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px)
			+ "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
		--i; while (++i < n) {
			pi = points[i];
			px.shift(); px.push(pi[0]);
			py.shift(); py.push(pi[1]);
			d3_svg_lineBasisBezier(path, px, py);
		}
		return path.join("");
	}

// Closed B-spline interpolation; generates "C" commands.
	function d3_svg_lineBasisClosed(points) {
		var path,
			i = -1,
			n = points.length,
			m = n + 4,
			pi,
			px = [],
			py = [];
		while (++i < 4) {
			pi = points[i % n];
			px.push(pi[0]);
			py.push(pi[1]);
		}
		path = [
			d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",",
			d3_svg_lineDot4(d3_svg_lineBasisBezier3, py)
		];
		--i; while (++i < m) {
			pi = points[i % n];
			px.shift(); px.push(pi[0]);
			py.shift(); py.push(pi[1]);
			d3_svg_lineBasisBezier(path, px, py);
		}
		return path.join("");
	}

	function d3_svg_lineBundle(points, tension) {
		var n = points.length - 1,
			x0 = points[0][0],
			y0 = points[0][1],
			dx = points[n][0] - x0,
			dy = points[n][1] - y0,
			i = -1,
			p,
			t;
		while (++i <= n) {
			p = points[i];
			t = i / n;
			p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
			p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
		}
		return d3_svg_lineBasis(points);
	}

// Returns the dot product of the given four-element vectors.
	function d3_svg_lineDot4(a, b) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
	}

// Matrix to transform basis (b-spline) control points to bezier
// control points. Derived from FvD 11.2.8.
	var d3_svg_lineBasisBezier1 = [0, 2/3, 1/3, 0],
		d3_svg_lineBasisBezier2 = [0, 1/3, 2/3, 0],
		d3_svg_lineBasisBezier3 = [0, 1/6, 2/3, 1/6];

// Pushes a "C" BÃ©zier curve onto the specified path array, given the
// two specified four-element arrays which define the control points.
	function d3_svg_lineBasisBezier(path, x, y) {
		path.push(
			"C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x),
			",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y),
			",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x),
			",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y),
			",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x),
			",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
	}

// Computes the slope from points p0 to p1.
	function d3_svg_lineSlope(p0, p1) {
		return (p1[1] - p0[1]) / (p1[0] - p0[0]);
	}

// Compute three-point differences for the given points.
// http://en.wikipedia.org/wiki/Cubic_Hermite_spline#Finite_difference
	function d3_svg_lineFiniteDifferences(points) {
		var i = 0,
			j = points.length - 1,
			m = [],
			p0 = points[0],
			p1 = points[1],
			d = m[0] = d3_svg_lineSlope(p0, p1);
		while (++i < j) {
			m[i] = d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]));
		}
		m[i] = d;
		return m;
	}

// Interpolates the given points using Fritsch-Carlson Monotone cubic Hermite
// interpolation. Returns an array of tangent vectors. For details, see
// http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
	function d3_svg_lineMonotoneTangents(points) {
		var tangents = [],
			d,
			a,
			b,
			s,
			m = d3_svg_lineFiniteDifferences(points),
			i = -1,
			j = points.length - 1;

		// The first two steps are done by computing finite-differences:
		// 1. Compute the slopes of the secant lines between successive points.
		// 2. Initialize the tangents at every point as the average of the secants.

		// Then, for each segmentâ€¦
		while (++i < j) {
			d = d3_svg_lineSlope(points[i], points[i + 1]);

			// 3. If two successive yk = y{k + 1} are equal (i.e., d is zero), then set
			// mk = m{k + 1} = 0 as the spline connecting these points must be flat to
			// preserve monotonicity. Ignore step 4 and 5 for those k.

			if (Math.abs(d) < 1e-6) {
				m[i] = m[i + 1] = 0;
			} else {
				// 4. Let ak = mk / dk and bk = m{k + 1} / dk.
				a = m[i] / d;
				b = m[i + 1] / d;

				// 5. Prevent overshoot and ensure monotonicity by restricting the
				// magnitude of vector <ak, bk> to a circle of radius 3.
				s = a * a + b * b;
				if (s > 9) {
					s = d * 3 / Math.sqrt(s);
					m[i] = s * a;
					m[i + 1] = s * b;
				}
			}
		}

		// Compute the normalized tangent vector from the slopes. Note that if x is
		// not monotonic, it's possible that the slope will be infinite, so we protect
		// against NaN by setting the coordinate to zero.
		i = -1; while (++i <= j) {
			s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0])
				/ (6 * (1 + m[i] * m[i]));
			tangents.push([s || 0, m[i] * s || 0]);
		}

		return tangents;
	}

	function d3_svg_lineMonotone(points) {
		return points.length < 3
			? d3_svg_lineLinear(points)
			: points[0] +
			d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
	}
	d3.svg.line.radial = function() {
		var line = d3_svg_line(d3_svg_lineRadial);
		line.radius = line.x, delete line.x;
		line.angle = line.y, delete line.y;
		return line;
	};

	function d3_svg_lineRadial(points) {
		var point,
			i = -1,
			n = points.length,
			r,
			a;
		while (++i < n) {
			point = points[i];
			r = point[0];
			a = point[1] + d3_svg_arcOffset;
			point[0] = r * Math.cos(a);
			point[1] = r * Math.sin(a);
		}
		return points;
	}
	function d3_svg_area(projection) {
		var x0 = d3_svg_lineX,
			x1 = d3_svg_lineX,
			y0 = 0,
			y1 = d3_svg_lineY,
			interpolate,
			i0,
			i1,
			tension = .7;

		function area(d) {
			if (d.length < 1) return null;
			var points0 = d3_svg_linePoints(this, d, x0, y0),
				points1 = d3_svg_linePoints(this, d, x0 === x1 ? d3_svg_areaX(points0) : x1, y0 === y1 ? d3_svg_areaY(points0) : y1);
			return "M" + i0(projection(points1), tension)
				+ "L" + i1(projection(points0.reverse()), tension)
				+ "Z";
		}

		area.x = function(x) {
			if (!arguments.length) return x1;
			x0 = x1 = x;
			return area;
		};

		area.x0 = function(x) {
			if (!arguments.length) return x0;
			x0 = x;
			return area;
		};

		area.x1 = function(x) {
			if (!arguments.length) return x1;
			x1 = x;
			return area;
		};

		area.y = function(y) {
			if (!arguments.length) return y1;
			y0 = y1 = y;
			return area;
		};

		area.y0 = function(y) {
			if (!arguments.length) return y0;
			y0 = y;
			return area;
		};

		area.y1 = function(y) {
			if (!arguments.length) return y1;
			y1 = y;
			return area;
		};

		area.interpolate = function(x) {
			if (!arguments.length) return interpolate;
			i0 = d3_svg_lineInterpolators[interpolate = x];
			i1 = i0.reverse || i0;
			return area;
		};

		area.tension = function(x) {
			if (!arguments.length) return tension;
			tension = x;
			return area;
		};

		return area.interpolate("linear");
	}

	d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
	d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;

	d3.svg.area = function() {
		return d3_svg_area(Object);
	};

	function d3_svg_areaX(points) {
		return function(d, i) {
			return points[i][0];
		};
	}

	function d3_svg_areaY(points) {
		return function(d, i) {
			return points[i][1];
		};
	}
	d3.svg.area.radial = function() {
		var area = d3_svg_area(d3_svg_lineRadial);
		area.radius = area.x, delete area.x;
		area.innerRadius = area.x0, delete area.x0;
		area.outerRadius = area.x1, delete area.x1;
		area.angle = area.y, delete area.y;
		area.startAngle = area.y0, delete area.y0;
		area.endAngle = area.y1, delete area.y1;
		return area;
	};
	d3.svg.chord = function() {
		var source = d3_svg_chordSource,
			target = d3_svg_chordTarget,
			radius = d3_svg_chordRadius,
			startAngle = d3_svg_arcStartAngle,
			endAngle = d3_svg_arcEndAngle;

		// TODO Allow control point to be customized.

		function chord(d, i) {
			var s = subgroup(this, source, d, i),
				t = subgroup(this, target, d, i);
			return "M" + s.p0
				+ arc(s.r, s.p1) + (equals(s, t)
				? curve(s.r, s.p1, s.r, s.p0)
				: curve(s.r, s.p1, t.r, t.p0)
				+ arc(t.r, t.p1)
				+ curve(t.r, t.p1, s.r, s.p0))
				+ "Z";
		}

		function subgroup(self, f, d, i) {
			var subgroup = f.call(self, d, i),
				r = radius.call(self, subgroup, i),
				a0 = startAngle.call(self, subgroup, i) + d3_svg_arcOffset,
				a1 = endAngle.call(self, subgroup, i) + d3_svg_arcOffset;
			return {
				r: r,
				a0: a0,
				a1: a1,
				p0: [r * Math.cos(a0), r * Math.sin(a0)],
				p1: [r * Math.cos(a1), r * Math.sin(a1)]
			};
		}

		function equals(a, b) {
			return a.a0 == b.a0 && a.a1 == b.a1;
		}

		function arc(r, p) {
			return "A" + r + "," + r + " 0 0,1 " + p;
		}

		function curve(r0, p0, r1, p1) {
			return "Q 0,0 " + p1;
		}

		chord.radius = function(v) {
			if (!arguments.length) return radius;
			radius = d3.functor(v);
			return chord;
		};

		chord.source = function(v) {
			if (!arguments.length) return source;
			source = d3.functor(v);
			return chord;
		};

		chord.target = function(v) {
			if (!arguments.length) return target;
			target = d3.functor(v);
			return chord;
		};

		chord.startAngle = function(v) {
			if (!arguments.length) return startAngle;
			startAngle = d3.functor(v);
			return chord;
		};

		chord.endAngle = function(v) {
			if (!arguments.length) return endAngle;
			endAngle = d3.functor(v);
			return chord;
		};

		return chord;
	};

	function d3_svg_chordSource(d) {
		return d.source;
	}

	function d3_svg_chordTarget(d) {
		return d.target;
	}

	function d3_svg_chordRadius(d) {
		return d.radius;
	}

	function d3_svg_chordStartAngle(d) {
		return d.startAngle;
	}

	function d3_svg_chordEndAngle(d) {
		return d.endAngle;
	}
	d3.svg.diagonal = function() {
		var source = d3_svg_chordSource,
			target = d3_svg_chordTarget,
			projection = d3_svg_diagonalProjection;

		function diagonal(d, i) {
			var p0 = source.call(this, d, i),
				p3 = target.call(this, d, i),
				m = (p0.y + p3.y) / 2,
				p = [p0, {x: p0.x, y: m}, {x: p3.x, y: m}, p3];
			p = p.map(projection);
			return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
		}

		diagonal.source = function(x) {
			if (!arguments.length) return source;
			source = d3.functor(x);
			return diagonal;
		};

		diagonal.target = function(x) {
			if (!arguments.length) return target;
			target = d3.functor(x);
			return diagonal;
		};

		diagonal.projection = function(x) {
			if (!arguments.length) return projection;
			projection = x;
			return diagonal;
		};

		return diagonal;
	};

	function d3_svg_diagonalProjection(d) {
		return [d.x, d.y];
	}
	d3.svg.diagonal.radial = function() {
		var diagonal = d3.svg.diagonal(),
			projection = d3_svg_diagonalProjection,
			projection_ = diagonal.projection;

		diagonal.projection = function(x) {
			return arguments.length
				? projection_(d3_svg_diagonalRadialProjection(projection = x))
				: projection;
		};

		return diagonal;
	};

	function d3_svg_diagonalRadialProjection(projection) {
		return function() {
			var d = projection.apply(this, arguments),
				r = d[0],
				a = d[1] + d3_svg_arcOffset;
			return [r * Math.cos(a), r * Math.sin(a)];
		};
	}
	d3.svg.mouse = function(container) {
		return d3_svg_mousePoint(container, d3.event);
	};

// https://bugs.webkit.org/show_bug.cgi?id=44083
	var d3_mouse_bug44083 = /WebKit/.test(navigator.userAgent) ? -1 : 0;

	function d3_svg_mousePoint(container, e) {
		var point = (container.ownerSVGElement || container).createSVGPoint();
		if ((d3_mouse_bug44083 < 0) && (window.scrollX || window.scrollY)) {
			var svg = d3.select(document.body)
				.append("svg:svg")
				.style("position", "absolute")
				.style("top", 0)
				.style("left", 0);
			var ctm = svg[0][0].getScreenCTM();
			d3_mouse_bug44083 = !(ctm.f || ctm.e);
			svg.remove();
		}
		if (d3_mouse_bug44083) {
			point.x = e.pageX;
			point.y = e.pageY;
		} else {
			point.x = e.clientX;
			point.y = e.clientY;
		}
		point = point.matrixTransform(container.getScreenCTM().inverse());
		return [point.x, point.y];
	};
	d3.svg.touches = function(container) {
		var touches = d3.event.touches;
		return touches ? d3_array(touches).map(function(touch) {
			var point = d3_svg_mousePoint(container, touch);
			point.identifier = touch.identifier;
			return point;
		}) : [];
	};
	d3.svg.symbol = function() {
		var type = d3_svg_symbolType,
			size = d3_svg_symbolSize;

		function symbol(d, i) {
			return (d3_svg_symbols[type.call(this, d, i)]
				|| d3_svg_symbols.circle)
				(size.call(this, d, i));
		}

		symbol.type = function(x) {
			if (!arguments.length) return type;
			type = d3.functor(x);
			return symbol;
		};

		// size of symbol in square pixels
		symbol.size = function(x) {
			if (!arguments.length) return size;
			size = d3.functor(x);
			return symbol;
		};

		return symbol;
	};

	function d3_svg_symbolSize() {
		return 64;
	}

	function d3_svg_symbolType() {
		return "circle";
	}

// TODO cross-diagonal?
	var d3_svg_symbols = {
		"circle": function(size) {
			var r = Math.sqrt(size / Math.PI);
			return "M0," + r
				+ "A" + r + "," + r + " 0 1,1 0," + (-r)
				+ "A" + r + "," + r + " 0 1,1 0," + r
				+ "Z";
		},
		"cross": function(size) {
			var r = Math.sqrt(size / 5) / 2;
			return "M" + -3 * r + "," + -r
				+ "H" + -r
				+ "V" + -3 * r
				+ "H" + r
				+ "V" + -r
				+ "H" + 3 * r
				+ "V" + r
				+ "H" + r
				+ "V" + 3 * r
				+ "H" + -r
				+ "V" + r
				+ "H" + -3 * r
				+ "Z";
		},
		"diamond": function(size) {
			var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)),
				rx = ry * d3_svg_symbolTan30;
			return "M0," + -ry
				+ "L" + rx + ",0"
				+ " 0," + ry
				+ " " + -rx + ",0"
				+ "Z";
		},
		"square": function(size) {
			var r = Math.sqrt(size) / 2;
			return "M" + -r + "," + -r
				+ "L" + r + "," + -r
				+ " " + r + "," + r
				+ " " + -r + "," + r
				+ "Z";
		},
		"triangle-down": function(size) {
			var rx = Math.sqrt(size / d3_svg_symbolSqrt3),
				ry = rx * d3_svg_symbolSqrt3 / 2;
			return "M0," + ry
				+ "L" + rx +"," + -ry
				+ " " + -rx + "," + -ry
				+ "Z";
		},
		"triangle-up": function(size) {
			var rx = Math.sqrt(size / d3_svg_symbolSqrt3),
				ry = rx * d3_svg_symbolSqrt3 / 2;
			return "M0," + -ry
				+ "L" + rx +"," + ry
				+ " " + -rx + "," + ry
				+ "Z";
		}
	};

	d3.svg.symbolTypes = d3.keys(d3_svg_symbols);

	var d3_svg_symbolSqrt3 = Math.sqrt(3),
		d3_svg_symbolTan30 = Math.tan(30 * Math.PI / 180);
	d3.svg.axis = function() {
		var scale = d3.scale.linear(),
			orient = "bottom",
			tickMajorSize = 6,
			tickMinorSize = 6,
			tickEndSize = 6,
			tickPadding = 3,
			tickArguments_ = [10],
			tickFormat_,
			tickSubdivide = 0;

		function axis(selection) {
			selection.each(function(d, i, j) {
				var g = d3.select(this);

				// If selection is a transition, create subtransitions.
				var transition = selection.delay ? function(o) {
					var id = d3_transitionInheritId;
					try {
						d3_transitionInheritId = selection.id;
						return o.transition()
							.delay(selection[j][i].delay)
							.duration(selection[j][i].duration)
							.ease(selection.ease());
					} finally {
						d3_transitionInheritId = id;
					}
				} : Object;

				// Ticks.
				var ticks = scale.ticks.apply(scale, tickArguments_),
					tickFormat = tickFormat_ == null ? scale.tickFormat.apply(scale, tickArguments_) : tickFormat_;

				// Minor ticks.
				var subticks = d3_svg_axisSubdivide(scale, ticks, tickSubdivide),
					subtick = g.selectAll(".minor").data(subticks, String),
					subtickEnter = subtick.enter().insert("svg:line", "g").attr("class", "tick minor").style("opacity", 1e-6),
					subtickExit = transition(subtick.exit()).style("opacity", 1e-6).remove(),
					subtickUpdate = transition(subtick).style("opacity", 1);

				// Major ticks.
				var tick = g.selectAll("g").data(ticks, String),
					tickEnter = tick.enter().insert("svg:g", "path").style("opacity", 1e-6),
					tickExit = transition(tick.exit()).style("opacity", 1e-6).remove(),
					tickUpdate = transition(tick).style("opacity", 1),
					tickTransform;

				// Domain.
				var range = d3_scaleExtent(scale.range()),
					path = g.selectAll(".domain").data([0]),
					pathEnter = path.enter().append("svg:path").attr("class", "domain"),
					pathUpdate = transition(path);

				// Stash the new scale and grab the old scale.
				var scale0 = this.__chart__ || scale;
				this.__chart__ = scale.copy();

				tickEnter.append("svg:line").attr("class", "tick");
				tickEnter.append("svg:text");
				tickUpdate.select("text").text(tickFormat);

				switch (orient) {
					case "bottom": {
						tickTransform = d3_svg_axisX;
						subtickUpdate.attr("x2", 0).attr("y2", tickMinorSize);
						tickUpdate.select("line").attr("x2", 0).attr("y2", tickMajorSize);
						tickUpdate.select("text").attr("x", 0).attr("y", Math.max(tickMajorSize, 0) + tickPadding).attr("dy", ".71em").attr("text-anchor", "middle");
						pathUpdate.attr("d", "M" + range[0] + "," + tickEndSize + "V0H" + range[1] + "V" + tickEndSize);
						break;
					}
					case "top": {
						tickTransform = d3_svg_axisX;
						subtickUpdate.attr("x2", 0).attr("y2", -tickMinorSize);
						tickUpdate.select("line").attr("x2", 0).attr("y2", -tickMajorSize);
						tickUpdate.select("text").attr("x", 0).attr("y", -(Math.max(tickMajorSize, 0) + tickPadding)).attr("dy", "0em").attr("text-anchor", "middle");
						pathUpdate.attr("d", "M" + range[0] + "," + -tickEndSize + "V0H" + range[1] + "V" + -tickEndSize);
						break;
					}
					case "left": {
						tickTransform = d3_svg_axisY;
						subtickUpdate.attr("x2", -tickMinorSize).attr("y2", 0);
						tickUpdate.select("line").attr("x2", -tickMajorSize).attr("y2", 0);
						tickUpdate.select("text").attr("x", -(Math.max(tickMajorSize, 0) + tickPadding)).attr("y", 0).attr("dy", ".32em").attr("text-anchor", "end");
						pathUpdate.attr("d", "M" + -tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + -tickEndSize);
						break;
					}
					case "right": {
						tickTransform = d3_svg_axisY;
						subtickUpdate.attr("x2", tickMinorSize).attr("y2", 0);
						tickUpdate.select("line").attr("x2", tickMajorSize).attr("y2", 0);
						tickUpdate.select("text").attr("x", Math.max(tickMajorSize, 0) + tickPadding).attr("y", 0).attr("dy", ".32em").attr("text-anchor", "start");
						pathUpdate.attr("d", "M" + tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + tickEndSize);
						break;
					}
				}

				tickEnter.call(tickTransform, scale0);
				tickUpdate.call(tickTransform, scale);
				tickExit.call(tickTransform, scale);

				subtickEnter.call(tickTransform, scale0);
				subtickUpdate.call(tickTransform, scale);
				subtickExit.call(tickTransform, scale);
			});
		}

		axis.scale = function(x) {
			if (!arguments.length) return scale;
			scale = x;
			return axis;
		};

		axis.orient = function(x) {
			if (!arguments.length) return orient;
			orient = x;
			return axis;
		};

		axis.ticks = function() {
			if (!arguments.length) return tickArguments_;
			tickArguments_ = arguments;
			return axis;
		};

		axis.tickFormat = function(x) {
			if (!arguments.length) return tickFormat_;
			tickFormat_ = x;
			return axis;
		};

		axis.tickSize = function(x, y, z) {
			if (!arguments.length) return tickMajorSize;
			var n = arguments.length - 1;
			tickMajorSize = +x;
			tickMinorSize = n > 1 ? +y : tickMajorSize;
			tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
			return axis;
		};

		axis.tickPadding = function(x) {
			if (!arguments.length) return tickPadding;
			tickPadding = +x;
			return axis;
		};

		axis.tickSubdivide = function(x) {
			if (!arguments.length) return tickSubdivide;
			tickSubdivide = +x;
			return axis;
		};

		return axis;
	};

	function d3_svg_axisX(selection, x) {
		selection.attr("transform", function(d) { return "translate(" + x(d) + ",0)"; });
	}

	function d3_svg_axisY(selection, y) {
		selection.attr("transform", function(d) { return "translate(0," + y(d) + ")"; });
	}

	function d3_svg_axisSubdivide(scale, ticks, m) {
		subticks = [];
		if (m && ticks.length > 1) {
			var extent = d3_scaleExtent(scale.domain()),
				subticks,
				i = -1,
				n = ticks.length,
				d = (ticks[1] - ticks[0]) / ++m,
				j,
				v;
			while (++i < n) {
				for (j = m; --j > 0;) {
					if ((v = +ticks[i] - j * d) >= extent[0]) {
						subticks.push(v);
					}
				}
			}
			for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
				subticks.push(v);
			}
		}
		return subticks;
	}
	d3.behavior = {};
	d3.behavior.drag = function() {
		var event = d3.dispatch("drag", "dragstart", "dragend");

		function drag() {
			this
				.on("mousedown.drag", mousedown)
				.on("touchstart.drag", mousedown);

			d3.select(window)
				.on("mousemove.drag", d3_behavior_dragMove)
				.on("touchmove.drag", d3_behavior_dragMove)
				.on("mouseup.drag", d3_behavior_dragUp, true)
				.on("touchend.drag", d3_behavior_dragUp, true)
				.on("click.drag", d3_behavior_dragClick, true);
		}

		// snapshot the local context for subsequent dispatch
		function start() {
			d3_behavior_dragEvent = event;
			d3_behavior_dragEventTarget = d3.event.target;
			d3_behavior_dragOffset = d3_behavior_dragPoint((d3_behavior_dragTarget = this).parentNode);
			d3_behavior_dragMoved = 0;
			d3_behavior_dragArguments = arguments;
		}

		function mousedown() {
			start.apply(this, arguments);
			d3_behavior_dragDispatch("dragstart");
		}

		drag.on = function(type, listener) {
			event[type].add(listener);
			return drag;
		};

		return drag;
	};

	var d3_behavior_dragEvent,
		d3_behavior_dragEventTarget,
		d3_behavior_dragTarget,
		d3_behavior_dragArguments,
		d3_behavior_dragOffset,
		d3_behavior_dragMoved,
		d3_behavior_dragStopClick;

	function d3_behavior_dragDispatch(type) {
		var o = d3.event, p = d3_behavior_dragTarget.parentNode, dx = 0, dy = 0;

		if (p) {
			p = d3_behavior_dragPoint(p);
			dx = p[0] - d3_behavior_dragOffset[0];
			dy = p[1] - d3_behavior_dragOffset[1];
			d3_behavior_dragOffset = p;
			d3_behavior_dragMoved |= dx | dy;
		}

		try {
			d3.event = {dx: dx, dy: dy};
			d3_behavior_dragEvent[type].dispatch.apply(d3_behavior_dragTarget, d3_behavior_dragArguments);
		} finally {
			d3.event = o;
		}

		o.preventDefault();
	}

	function d3_behavior_dragPoint(container) {
		return d3.event.touches
			? d3.svg.touches(container)[0]
			: d3.svg.mouse(container);
	}

	function d3_behavior_dragMove() {
		if (!d3_behavior_dragTarget) return;
		var parent = d3_behavior_dragTarget.parentNode;

		// O NOES! The drag element was removed from the DOM.
		if (!parent) return d3_behavior_dragUp();

		d3_behavior_dragDispatch("drag");
		d3_behavior_dragCancel();
	}

	function d3_behavior_dragUp() {
		if (!d3_behavior_dragTarget) return;
		d3_behavior_dragDispatch("dragend");
		d3_behavior_dragTarget = null;

		// If the node was moved, prevent the mouseup from propagating.
		// Also prevent the subsequent click from propagating (e.g., for anchors).
		if (d3_behavior_dragMoved && d3_behavior_dragEventTarget === d3.event.target) {
			d3_behavior_dragStopClick = true;
			d3_behavior_dragCancel();
		}
	}

	function d3_behavior_dragClick() {
		if (d3_behavior_dragStopClick && d3_behavior_dragEventTarget === d3.event.target) {
			d3_behavior_dragCancel();
			d3_behavior_dragStopClick = false;
			d3_behavior_dragEventTarget = null;
		}
	}

	function d3_behavior_dragCancel() {
		d3.event.stopPropagation();
		d3.event.preventDefault();
	}
// TODO unbind zoom behavior?
// TODO unbind listener?
	d3.behavior.zoom = function() {
		var xyz = [0, 0, 0],
			event = d3.dispatch("zoom");

		function zoom() {
			this
				.on("mousedown.zoom", mousedown)
				.on("mousewheel.zoom", mousewheel)
				.on("DOMMouseScroll.zoom", mousewheel)
				.on("dblclick.zoom", dblclick)
				.on("touchstart.zoom", touchstart);

			d3.select(window)
				.on("mousemove.zoom", d3_behavior_zoomMousemove)
				.on("mouseup.zoom", d3_behavior_zoomMouseup)
				.on("touchmove.zoom", d3_behavior_zoomTouchmove)
				.on("touchend.zoom", d3_behavior_zoomTouchup)
				.on("click.zoom", d3_behavior_zoomClick, true);
		}

		// snapshot the local context for subsequent dispatch
		function start() {
			d3_behavior_zoomXyz = xyz;
			d3_behavior_zoomDispatch = event.zoom.dispatch;
			d3_behavior_zoomEventTarget = d3.event.target;
			d3_behavior_zoomTarget = this;
			d3_behavior_zoomArguments = arguments;
		}

		function mousedown() {
			start.apply(this, arguments);
			d3_behavior_zoomPanning = d3_behavior_zoomLocation(d3.svg.mouse(d3_behavior_zoomTarget));
			d3_behavior_zoomMoved = false;
			d3.event.preventDefault();
			window.focus();
		}

		// store starting mouse location
		function mousewheel() {
			start.apply(this, arguments);
			if (!d3_behavior_zoomZooming) d3_behavior_zoomZooming = d3_behavior_zoomLocation(d3.svg.mouse(d3_behavior_zoomTarget));
			d3_behavior_zoomTo(d3_behavior_zoomDelta() + xyz[2], d3.svg.mouse(d3_behavior_zoomTarget), d3_behavior_zoomZooming);
		}

		function dblclick() {
			start.apply(this, arguments);
			var mouse = d3.svg.mouse(d3_behavior_zoomTarget);
			d3_behavior_zoomTo(d3.event.shiftKey ? Math.ceil(xyz[2] - 1) : Math.floor(xyz[2] + 1), mouse, d3_behavior_zoomLocation(mouse));
		}

		// doubletap detection
		function touchstart() {
			start.apply(this, arguments);
			var touches = d3_behavior_zoomTouchup(),
				touch,
				now = Date.now();
			if ((touches.length === 1) && (now - d3_behavior_zoomLast < 300)) {
				d3_behavior_zoomTo(1 + Math.floor(xyz[2]), touch = touches[0], d3_behavior_zoomLocations[touch.identifier]);
			}
			d3_behavior_zoomLast = now;
		}

		zoom.on = function(type, listener) {
			event[type].add(listener);
			return zoom;
		};

		return zoom;
	};

	var d3_behavior_zoomDiv,
		d3_behavior_zoomPanning,
		d3_behavior_zoomZooming,
		d3_behavior_zoomLocations = {}, // identifier -> location
		d3_behavior_zoomLast = 0,
		d3_behavior_zoomXyz,
		d3_behavior_zoomDispatch,
		d3_behavior_zoomEventTarget,
		d3_behavior_zoomTarget,
		d3_behavior_zoomArguments,
		d3_behavior_zoomMoved,
		d3_behavior_zoomStopClick;

	function d3_behavior_zoomLocation(point) {
		return [
			point[0] - d3_behavior_zoomXyz[0],
			point[1] - d3_behavior_zoomXyz[1],
			d3_behavior_zoomXyz[2]
		];
	}

// detect the pixels that would be scrolled by this wheel event
	function d3_behavior_zoomDelta() {

		// mousewheel events are totally broken!
		// https://bugs.webkit.org/show_bug.cgi?id=40441
		// not only that, but Chrome and Safari differ in re. to acceleration!
		if (!d3_behavior_zoomDiv) {
			d3_behavior_zoomDiv = d3.select("body").append("div")
				.style("visibility", "hidden")
				.style("top", 0)
				.style("height", 0)
				.style("width", 0)
				.style("overflow-y", "scroll")
				.append("div")
				.style("height", "2000px")
				.node().parentNode;
		}

		var e = d3.event, delta;
		try {
			d3_behavior_zoomDiv.scrollTop = 1000;
			d3_behavior_zoomDiv.dispatchEvent(e);
			delta = 1000 - d3_behavior_zoomDiv.scrollTop;
		} catch (error) {
			delta = e.wheelDelta || (-e.detail * 5);
		}

		return delta * .005;
	}

// Note: Since we don't rotate, it's possible for the touches to become
// slightly detached from their original positions. Thus, we recompute the
// touch points on touchend as well as touchstart!
	function d3_behavior_zoomTouchup() {
		var touches = d3.svg.touches(d3_behavior_zoomTarget),
			i = -1,
			n = touches.length,
			touch;
		while (++i < n) d3_behavior_zoomLocations[(touch = touches[i]).identifier] = d3_behavior_zoomLocation(touch);
		return touches;
	}

	function d3_behavior_zoomTouchmove() {
		var touches = d3.svg.touches(d3_behavior_zoomTarget);
		switch (touches.length) {

			// single-touch pan
			case 1: {
				var touch = touches[0];
				d3_behavior_zoomTo(d3_behavior_zoomXyz[2], touch, d3_behavior_zoomLocations[touch.identifier]);
				break;
			}

			// double-touch pan + zoom
			case 2: {
				var p0 = touches[0],
					p1 = touches[1],
					p2 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2],
					l0 = d3_behavior_zoomLocations[p0.identifier],
					l1 = d3_behavior_zoomLocations[p1.identifier],
					l2 = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2, l0[2]];
				d3_behavior_zoomTo(Math.log(d3.event.scale) / Math.LN2 + l0[2], p2, l2);
				break;
			}
		}
	}

	function d3_behavior_zoomMousemove() {
		d3_behavior_zoomZooming = null;
		if (d3_behavior_zoomPanning) {
			d3_behavior_zoomMoved = true;
			d3_behavior_zoomTo(d3_behavior_zoomXyz[2], d3.svg.mouse(d3_behavior_zoomTarget), d3_behavior_zoomPanning);
		}
	}

	function d3_behavior_zoomMouseup() {
		if (d3_behavior_zoomPanning) {
			if (d3_behavior_zoomMoved && d3_behavior_zoomEventTarget === d3.event.target) {
				d3_behavior_zoomStopClick = true;
			}
			d3_behavior_zoomMousemove();
			d3_behavior_zoomPanning = null;
		}
	}

	function d3_behavior_zoomClick() {
		if (d3_behavior_zoomStopClick && d3_behavior_zoomEventTarget === d3.event.target) {
			d3.event.stopPropagation();
			d3.event.preventDefault();
			d3_behavior_zoomStopClick = false;
			d3_behavior_zoomEventTarget = null;
		}
	}

	function d3_behavior_zoomTo(z, x0, x1) {
		var K = Math.pow(2, (d3_behavior_zoomXyz[2] = z) - x1[2]),
			x = d3_behavior_zoomXyz[0] = x0[0] - K * x1[0],
			y = d3_behavior_zoomXyz[1] = x0[1] - K * x1[1],
			o = d3.event, // Events can be reentrant (e.g., focus).
			k = Math.pow(2, z);

		d3.event = {
			scale: k,
			translate: [x, y],
			transform: function(sx, sy) {
				if (sx) transform(sx, x);
				if (sy) transform(sy, y);
			}
		};

		function transform(scale, o) {
			var domain = scale.__domain || (scale.__domain = scale.domain()),
				range = scale.range().map(function(v) { return (v - o) / k; });
			scale.domain(domain).domain(range.map(scale.invert));
		}

		try {
			d3_behavior_zoomDispatch.apply(d3_behavior_zoomTarget, d3_behavior_zoomArguments);
		} finally {
			d3.event = o;
		}

		o.preventDefault();
	}
})();


(function(){d3.layout = {};
// Implements hierarchical edge bundling using Holten's algorithm. For each
// input link, a path is computed that travels through the tree, up the parent
// hierarchy to the least common ancestor, and then back down to the destination
// node. Each path is simply an array of nodes.
	d3.layout.bundle = function() {
		return function(links) {
			var paths = [],
				i = -1,
				n = links.length;
			while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
			return paths;
		};
	};

	function d3_layout_bundlePath(link) {
		var start = link.source,
			end = link.target,
			lca = d3_layout_bundleLeastCommonAncestor(start, end),
			points = [start];
		while (start !== lca) {
			start = start.parent;
			points.push(start);
		}
		var k = points.length;
		while (end !== lca) {
			points.splice(k, 0, end);
			end = end.parent;
		}
		return points;
	}

	function d3_layout_bundleAncestors(node) {
		var ancestors = [],
			parent = node.parent;
		while (parent != null) {
			ancestors.push(node);
			node = parent;
			parent = parent.parent;
		}
		ancestors.push(node);
		return ancestors;
	}

	function d3_layout_bundleLeastCommonAncestor(a, b) {
		if (a === b) return a;
		var aNodes = d3_layout_bundleAncestors(a),
			bNodes = d3_layout_bundleAncestors(b),
			aNode = aNodes.pop(),
			bNode = bNodes.pop(),
			sharedNode = null;
		while (aNode === bNode) {
			sharedNode = aNode;
			aNode = aNodes.pop();
			bNode = bNodes.pop();
		}
		return sharedNode;
	}
	d3.layout.chord = function() {
		var chord = {},
			chords,
			groups,
			matrix,
			n,
			padding = 0,
			sortGroups,
			sortSubgroups,
			sortChords;

		function relayout() {
			var subgroups = {},
				groupSums = [],
				groupIndex = d3.range(n),
				subgroupIndex = [],
				k,
				x,
				x0,
				i,
				j;

			chords = [];
			groups = [];

			// Compute the sum.
			k = 0, i = -1; while (++i < n) {
				x = 0, j = -1; while (++j < n) {
					x += matrix[i][j];
				}
				groupSums.push(x);
				subgroupIndex.push(d3.range(n));
				k += x;
			}

			// Sort groupsâ€¦
			if (sortGroups) {
				groupIndex.sort(function(a, b) {
					return sortGroups(groupSums[a], groupSums[b]);
				});
			}

			// Sort subgroupsâ€¦
			if (sortSubgroups) {
				subgroupIndex.forEach(function(d, i) {
					d.sort(function(a, b) {
						return sortSubgroups(matrix[i][a], matrix[i][b]);
					});
				});
			}

			// Convert the sum to scaling factor for [0, 2pi].
			// TODO Allow start and end angle to be specified.
			// TODO Allow padding to be specified as percentage?
			k = (2 * Math.PI - padding * n) / k;

			// Compute the start and end angle for each group and subgroup.
			x = 0, i = -1; while (++i < n) {
				x0 = x, j = -1; while (++j < n) {
					var di = groupIndex[i],
						dj = subgroupIndex[i][j],
						v = matrix[di][dj];
					subgroups[di + "-" + dj] = {
						index: di,
						subindex: dj,
						startAngle: x,
						endAngle: x += v * k,
						value: v
					};
				}
				groups.push({
					index: di,
					startAngle: x0,
					endAngle: x,
					value: (x - x0) / k
				});
				x += padding;
			}

			// Generate chords for each (non-empty) subgroup-subgroup link.
			i = -1; while (++i < n) {
				j = i - 1; while (++j < n) {
					var source = subgroups[i + "-" + j],
						target = subgroups[j + "-" + i];
					if (source.value || target.value) {
						chords.push(source.value < target.value
							? {source: target, target: source}
							: {source: source, target: target});
					}
				}
			}

			if (sortChords) resort();
		}

		function resort() {
			chords.sort(function(a, b) {
				return sortChords(a.target.value, b.target.value);
			});
		}

		chord.matrix = function(x) {
			if (!arguments.length) return matrix;
			n = (matrix = x) && matrix.length;
			chords = groups = null;
			return chord;
		};

		chord.padding = function(x) {
			if (!arguments.length) return padding;
			padding = x;
			chords = groups = null;
			return chord;
		};

		chord.sortGroups = function(x) {
			if (!arguments.length) return sortGroups;
			sortGroups = x;
			chords = groups = null;
			return chord;
		};

		chord.sortSubgroups = function(x) {
			if (!arguments.length) return sortSubgroups;
			sortSubgroups = x;
			chords = null;
			return chord;
		};

		chord.sortChords = function(x) {
			if (!arguments.length) return sortChords;
			sortChords = x;
			if (chords) resort();
			return chord;
		};

		chord.chords = function() {
			if (!chords) relayout();
			return chords;
		};

		chord.groups = function() {
			if (!groups) relayout();
			return groups;
		};

		return chord;
	};
// A rudimentary force layout using Gauss-Seidel.
	d3.layout.force = function() {
		var force = {},
			event = d3.dispatch("tick"),
			size = [1, 1],
			drag,
			alpha,
			friction = .9,
			linkDistance = d3_layout_forceLinkDistance,
			linkStrength = d3_layout_forceLinkStrength,
			charge = -30,
			gravity = .1,
			theta = .8,
			interval,
			nodes = [],
			links = [],
			distances,
			strengths,
			charges;

		function repulse(node) {
			return function(quad, x1, y1, x2, y2) {
				if (quad.point !== node) {
					var dx = quad.cx - node.x,
						dy = quad.cy - node.y,
						dn = 1 / Math.sqrt(dx * dx + dy * dy);

					/* Barnes-Hut criterion. */
					if ((x2 - x1) * dn < theta) {
						var k = quad.charge * dn * dn;
						node.px -= dx * k;
						node.py -= dy * k;
						return true;
					}

					if (quad.point && isFinite(dn)) {
						var k = quad.pointCharge * dn * dn;
						node.px -= dx * k;
						node.py -= dy * k;
					}
				}
				return !quad.charge;
			};
		}

		function tick() {
			var n = nodes.length,
				m = links.length,
				q,
				i, // current index
				o, // current object
				s, // current source
				t, // current target
				l, // current distance
				k, // current force
				x, // x-distance
				y; // y-distance

			// gauss-seidel relaxation for links
			for (i = 0; i < m; ++i) {
				o = links[i];
				s = o.source;
				t = o.target;
				x = t.x - s.x;
				y = t.y - s.y;
				if (l = (x * x + y * y)) {
					l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
					x *= l;
					y *= l;
					t.x -= x * (k = s.weight / (t.weight + s.weight));
					t.y -= y * k;
					s.x += x * (k = 1 - k);
					s.y += y * k;
				}
			}

			// apply gravity forces
			if (k = alpha * gravity) {
				x = size[0] / 2;
				y = size[1] / 2;
				i = -1; if (k) while (++i < n) {
					o = nodes[i];
					o.x += (x - o.x) * k;
					o.y += (y - o.y) * k;
				}
			}

			// compute quadtree center of mass and apply charge forces
			if (charge) {
				d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
				i = -1; while (++i < n) {
					if (!(o = nodes[i]).fixed) {
						q.visit(repulse(o));
					}
				}
			}

			// position verlet integration
			i = -1; while (++i < n) {
				o = nodes[i];
				if (o.fixed) {
					o.x = o.px;
					o.y = o.py;
				} else {
					o.x -= (o.px - (o.px = o.x)) * friction;
					o.y -= (o.py - (o.py = o.y)) * friction;
				}
			}

			event.tick.dispatch({type: "tick", alpha: alpha});

			// simulated annealing, basically
			return (alpha *= .99) < .005;
		}

		force.on = function(type, listener) {
			event[type].add(listener);
			return force;
		};

		force.nodes = function(x) {
			if (!arguments.length) return nodes;
			nodes = x;
			return force;
		};

		force.links = function(x) {
			if (!arguments.length) return links;
			links = x;
			return force;
		};

		force.size = function(x) {
			if (!arguments.length) return size;
			size = x;
			return force;
		};

		force.linkDistance = function(x) {
			if (!arguments.length) return linkDistance;
			linkDistance = d3.functor(x);
			return force;
		};

		// For backwards-compatibility.
		force.distance = force.linkDistance;

		force.linkStrength = function(x) {
			if (!arguments.length) return linkStrength;
			linkStrength = d3.functor(x);
			return force;
		};

		force.friction = function(x) {
			if (!arguments.length) return friction;
			friction = x;
			return force;
		};

		force.charge = function(x) {
			if (!arguments.length) return charge;
			charge = typeof x === "function" ? x : +x;
			return force;
		};

		force.gravity = function(x) {
			if (!arguments.length) return gravity;
			gravity = x;
			return force;
		};

		force.theta = function(x) {
			if (!arguments.length) return theta;
			theta = x;
			return force;
		};

		force.start = function() {
			var i,
				j,
				n = nodes.length,
				m = links.length,
				w = size[0],
				h = size[1],
				neighbors,
				o;

			for (i = 0; i < n; ++i) {
				(o = nodes[i]).index = i;
				o.weight = 0;
			}

			distances = [];
			strengths = [];
			for (i = 0; i < m; ++i) {
				o = links[i];
				if (typeof o.source == "number") o.source = nodes[o.source];
				if (typeof o.target == "number") o.target = nodes[o.target];
				distances[i] = linkDistance.call(this, o, i);
				strengths[i] = linkStrength.call(this, o, i);
				++o.source.weight;
				++o.target.weight;
			}

			for (i = 0; i < n; ++i) {
				o = nodes[i];
				if (isNaN(o.x)) o.x = position("x", w);
				if (isNaN(o.y)) o.y = position("y", h);
				if (isNaN(o.px)) o.px = o.x;
				if (isNaN(o.py)) o.py = o.y;
			}

			charges = [];
			if (typeof charge === "function") {
				for (i = 0; i < n; ++i) {
					charges[i] = +charge.call(this, nodes[i], i);
				}
			} else {
				for (i = 0; i < n; ++i) {
					charges[i] = charge;
				}
			}

			// initialize node position based on first neighbor
			function position(dimension, size) {
				var neighbors = neighbor(i),
					j = -1,
					m = neighbors.length,
					x;
				while (++j < m) if (!isNaN(x = neighbors[j][dimension])) return x;
				return Math.random() * size;
			}

			// initialize neighbors lazily
			function neighbor() {
				if (!neighbors) {
					neighbors = [];
					for (j = 0; j < n; ++j) {
						neighbors[j] = [];
					}
					for (j = 0; j < m; ++j) {
						var o = links[j];
						neighbors[o.source.index].push(o.target);
						neighbors[o.target.index].push(o.source);
					}
				}
				return neighbors[i];
			}

			return force.resume();
		};

		force.resume = function() {
			alpha = .1;
			d3.timer(tick);
			return force;
		};

		force.stop = function() {
			alpha = 0;
			return force;
		};

		// use `node.call(force.drag)` to make nodes draggable
		force.drag = function() {
			if (!drag) drag = d3.behavior.drag()
				.on("dragstart", dragstart)
				.on("drag", d3_layout_forceDrag)
				.on("dragend", d3_layout_forceDragEnd);

			this.on("mouseover.force", d3_layout_forceDragOver)
				.on("mouseout.force", d3_layout_forceDragOut)
				.call(drag);
		};

		function dragstart(d) {
			d3_layout_forceDragOver(d3_layout_forceDragNode = d);
			d3_layout_forceDragForce = force;
		}

		return force;
	};

	var d3_layout_forceDragForce,
		d3_layout_forceDragNode;

	function d3_layout_forceDragOver(d) {
		d.fixed |= 2;
	}

	function d3_layout_forceDragOut(d) {
		if (d !== d3_layout_forceDragNode) d.fixed &= 1;
	}

	function d3_layout_forceDragEnd() {
		d3_layout_forceDrag();
		d3_layout_forceDragNode.fixed &= 1;
		d3_layout_forceDragForce = d3_layout_forceDragNode = null;
	}

	function d3_layout_forceDrag() {
		d3_layout_forceDragNode.px += d3.event.dx;
		d3_layout_forceDragNode.py += d3.event.dy;
		d3_layout_forceDragForce.resume(); // restart annealing
	}

	function d3_layout_forceAccumulate(quad, alpha, charges) {
		var cx = 0,
			cy = 0;
		quad.charge = 0;
		if (!quad.leaf) {
			var nodes = quad.nodes,
				n = nodes.length,
				i = -1,
				c;
			while (++i < n) {
				c = nodes[i];
				if (c == null) continue;
				d3_layout_forceAccumulate(c, alpha, charges);
				quad.charge += c.charge;
				cx += c.charge * c.cx;
				cy += c.charge * c.cy;
			}
		}
		if (quad.point) {
			// jitter internal nodes that are coincident
			if (!quad.leaf) {
				quad.point.x += Math.random() - .5;
				quad.point.y += Math.random() - .5;
			}
			var k = alpha * charges[quad.point.index];
			quad.charge += quad.pointCharge = k;
			cx += k * quad.point.x;
			cy += k * quad.point.y;
		}
		quad.cx = cx / quad.charge;
		quad.cy = cy / quad.charge;
	}

	function d3_layout_forceLinkDistance(link) {
		return 20;
	}

	function d3_layout_forceLinkStrength(link) {
		return 1;
	}
	d3.layout.partition = function() {
		var hierarchy = d3.layout.hierarchy(),
			size = [1, 1]; // width, height

		function position(node, x, dx, dy) {
			var children = node.children;
			node.x = x;
			node.y = node.depth * dy;
			node.dx = dx;
			node.dy = dy;
			if (children && (n = children.length)) {
				var i = -1,
					n,
					c,
					d;
				dx = node.value ? dx / node.value : 0;
				while (++i < n) {
					position(c = children[i], x, d = c.value * dx, dy);
					x += d;
				}
			}
		}

		function depth(node) {
			var children = node.children,
				d = 0;
			if (children && (n = children.length)) {
				var i = -1,
					n;
				while (++i < n) d = Math.max(d, depth(children[i]));
			}
			return 1 + d;
		}

		function partition(d, i) {
			var nodes = hierarchy.call(this, d, i);
			position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
			return nodes;
		}

		partition.size = function(x) {
			if (!arguments.length) return size;
			size = x;
			return partition;
		};

		return d3_layout_hierarchyRebind(partition, hierarchy);
	};
	d3.layout.pie = function() {
		var value = Number,
			sort = null,
			startAngle = 0,
			endAngle = 2 * Math.PI;

		function pie(data, i) {

			// Compute the start angle.
			var a = +(typeof startAngle === "function"
				? startAngle.apply(this, arguments)
				: startAngle);

			// Compute the angular range (end - start).
			var k = (typeof endAngle === "function"
				? endAngle.apply(this, arguments)
				: endAngle) - startAngle;

			// Optionally sort the data.
			var index = d3.range(data.length);
			if (sort != null) index.sort(function(i, j) {
				return sort(data[i], data[j]);
			});

			// Compute the numeric values for each data element.
			var values = data.map(value);

			// Convert k into a scale factor from value to angle, using the sum.
			k /= values.reduce(function(p, d) { return p + d; }, 0);

			// Compute the arcs!
			var arcs = index.map(function(i) {
				return {
					data: data[i],
					value: d = values[i],
					startAngle: a,
					endAngle: a += d * k
				};
			});

			// Return the arcs in the original data's order.
			return data.map(function(d, i) {
				return arcs[index[i]];
			});
		}

		/**
		 * Specifies the value function *x*, which returns a nonnegative numeric value
		 * for each datum. The default value function is `Number`. The value function
		 * is passed two arguments: the current datum and the current index.
		 */
		pie.value = function(x) {
			if (!arguments.length) return value;
			value = x;
			return pie;
		};

		/**
		 * Specifies a sort comparison operator *x*. The comparator is passed two data
		 * elements from the data array, a and b; it returns a negative value if a is
		 * less than b, a positive value if a is greater than b, and zero if a equals
		 * b.
		 */
		pie.sort = function(x) {
			if (!arguments.length) return sort;
			sort = x;
			return pie;
		};

		/**
		 * Specifies the overall start angle of the pie chart. Defaults to 0. The
		 * start angle can be specified either as a constant or as a function; in the
		 * case of a function, it is evaluated once per array (as opposed to per
		 * element).
		 */
		pie.startAngle = function(x) {
			if (!arguments.length) return startAngle;
			startAngle = x;
			return pie;
		};

		/**
		 * Specifies the overall end angle of the pie chart. Defaults to 2Ï€. The
		 * end angle can be specified either as a constant or as a function; in the
		 * case of a function, it is evaluated once per array (as opposed to per
		 * element).
		 */
		pie.endAngle = function(x) {
			if (!arguments.length) return endAngle;
			endAngle = x;
			return pie;
		};

		return pie;
	};
// data is two-dimensional array of x,y; we populate y0
	d3.layout.stack = function() {
		var values = Object,
			order = d3_layout_stackOrders["default"],
			offset = d3_layout_stackOffsets["zero"],
			out = d3_layout_stackOut,
			x = d3_layout_stackX,
			y = d3_layout_stackY;

		function stack(data, index) {

			// Convert series to canonical two-dimensional representation.
			var series = data.map(function(d, i) {
				return values.call(stack, d, i);
			});

			// Convert each series to canonical [[x,y]] representation.
			var points = series.map(function(d, i) {
				return d.map(function(v, i) {
					return [x.call(stack, v, i), y.call(stack, v, i)];
				});
			});

			// Compute the order of series, and permute them.
			var orders = order.call(stack, points, index);
			series = d3.permute(series, orders);
			points = d3.permute(points, orders);

			// Compute the baselineâ€¦
			var offsets = offset.call(stack, points, index);

			// And propagate it to other series.
			var n = series.length,
				m = series[0].length,
				i,
				j,
				o;
			for (j = 0; j < m; ++j) {
				out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
				for (i = 1; i < n; ++i) {
					out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
				}
			}

			return data;
		}

		stack.values = function(x) {
			if (!arguments.length) return values;
			values = x;
			return stack;
		};

		stack.order = function(x) {
			if (!arguments.length) return order;
			order = typeof x === "function" ? x : d3_layout_stackOrders[x];
			return stack;
		};

		stack.offset = function(x) {
			if (!arguments.length) return offset;
			offset = typeof x === "function" ? x : d3_layout_stackOffsets[x];
			return stack;
		};

		stack.x = function(z) {
			if (!arguments.length) return x;
			x = z;
			return stack;
		};

		stack.y = function(z) {
			if (!arguments.length) return y;
			y = z;
			return stack;
		};

		stack.out = function(z) {
			if (!arguments.length) return out;
			out = z;
			return stack;
		};

		return stack;
	}

	function d3_layout_stackX(d) {
		return d.x;
	}

	function d3_layout_stackY(d) {
		return d.y;
	}

	function d3_layout_stackOut(d, y0, y) {
		d.y0 = y0;
		d.y = y;
	}

	var d3_layout_stackOrders = {

		"inside-out": function(data) {
			var n = data.length,
				i,
				j,
				max = data.map(d3_layout_stackMaxIndex),
				sums = data.map(d3_layout_stackReduceSum),
				index = d3.range(n).sort(function(a, b) { return max[a] - max[b]; }),
				top = 0,
				bottom = 0,
				tops = [],
				bottoms = [];
			for (i = 0; i < n; ++i) {
				j = index[i];
				if (top < bottom) {
					top += sums[j];
					tops.push(j);
				} else {
					bottom += sums[j];
					bottoms.push(j);
				}
			}
			return bottoms.reverse().concat(tops);
		},

		"reverse": function(data) {
			return d3.range(data.length).reverse();
		},

		"default": function(data) {
			return d3.range(data.length);
		}

	};

	var d3_layout_stackOffsets = {

		"silhouette": function(data) {
			var n = data.length,
				m = data[0].length,
				sums = [],
				max = 0,
				i,
				j,
				o,
				y0 = [];
			for (j = 0; j < m; ++j) {
				for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
				if (o > max) max = o;
				sums.push(o);
			}
			for (j = 0; j < m; ++j) {
				y0[j] = (max - sums[j]) / 2;
			}
			return y0;
		},

		"wiggle": function(data) {
			var n = data.length,
				x = data[0],
				m = x.length,
				max = 0,
				i,
				j,
				k,
				s1,
				s2,
				s3,
				dx,
				o,
				o0,
				y0 = [];
			y0[0] = o = o0 = 0;
			for (j = 1; j < m; ++j) {
				for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
				for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
					for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
						s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
					}
					s2 += s3 * data[i][j][1];
				}
				y0[j] = o -= s1 ? s2 / s1 * dx : 0;
				if (o < o0) o0 = o;
			}
			for (j = 0; j < m; ++j) y0[j] -= o0;
			return y0;
		},

		"expand": function(data) {
			var n = data.length,
				m = data[0].length,
				k = 1 / n,
				i,
				j,
				o,
				y0 = [];
			for (j = 0; j < m; ++j) {
				for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
				if (o) for (i = 0; i < n; i++) data[i][j][1] /= o;
				else for (i = 0; i < n; i++) data[i][j][1] = k;
			}
			for (j = 0; j < m; ++j) y0[j] = 0;
			return y0;
		},

		"zero": function(data) {
			var j = -1,
				m = data[0].length,
				y0 = [];
			while (++j < m) y0[j] = 0;
			return y0;
		}

	};

	function d3_layout_stackMaxIndex(array) {
		var i = 1,
			j = 0,
			v = array[0][1],
			k,
			n = array.length;
		for (; i < n; ++i) {
			if ((k = array[i][1]) > v) {
				j = i;
				v = k;
			}
		}
		return j;
	}

	function d3_layout_stackReduceSum(d) {
		return d.reduce(d3_layout_stackSum, 0);
	}

	function d3_layout_stackSum(p, d) {
		return p + d[1];
	}
	d3.layout.histogram = function() {
		var frequency = true,
			valuer = Number,
			ranger = d3_layout_histogramRange,
			binner = d3_layout_histogramBinSturges;

		function histogram(data, i) {
			var bins = [],
				values = data.map(valuer, this),
				range = ranger.call(this, values, i),
				thresholds = binner.call(this, range, values, i),
				bin,
				i = -1,
				n = values.length,
				m = thresholds.length - 1,
				k = frequency ? 1 : 1 / n,
				x;

			// Initialize the bins.
			while (++i < m) {
				bin = bins[i] = [];
				bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
				bin.y = 0;
			}

			// Fill the bins, ignoring values outside the range.
			i = -1; while(++i < n) {
				x = values[i];
				if ((x >= range[0]) && (x <= range[1])) {
					bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
					bin.y += k;
					bin.push(data[i]);
				}
			}

			return bins;
		}

		// Specifies how to extract a value from the associated data. The default
		// value function is `Number`, which is equivalent to the identity function.
		histogram.value = function(x) {
			if (!arguments.length) return valuer;
			valuer = x;
			return histogram;
		};

		// Specifies the range of the histogram. Values outside the specified range
		// will be ignored. The argument `x` may be specified either as a two-element
		// array representing the minimum and maximum value of the range, or as a
		// function that returns the range given the array of values and the current
		// index `i`. The default range is the extent (minimum and maximum) of the
		// values.
		histogram.range = function(x) {
			if (!arguments.length) return ranger;
			ranger = d3.functor(x);
			return histogram;
		};

		// Specifies how to bin values in the histogram. The argument `x` may be
		// specified as a number, in which case the range of values will be split
		// uniformly into the given number of bins. Or, `x` may be an array of
		// threshold values, defining the bins; the specified array must contain the
		// rightmost (upper) value, thus specifying n + 1 values for n bins. Or, `x`
		// may be a function which is evaluated, being passed the range, the array of
		// values, and the current index `i`, returning an array of thresholds. The
		// default bin function will divide the values into uniform bins using
		// Sturges' formula.
		histogram.bins = function(x) {
			if (!arguments.length) return binner;
			binner = typeof x === "number"
				? function(range) { return d3_layout_histogramBinFixed(range, x); }
				: d3.functor(x);
			return histogram;
		};

		// Specifies whether the histogram's `y` value is a count (frequency) or a
		// probability (density). The default value is true.
		histogram.frequency = function(x) {
			if (!arguments.length) return frequency;
			frequency = !!x;
			return histogram;
		};

		return histogram;
	};

	function d3_layout_histogramBinSturges(range, values) {
		return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
	}

	function d3_layout_histogramBinFixed(range, n) {
		var x = -1,
			b = +range[0],
			m = (range[1] - b) / n,
			f = [];
		while (++x <= n) f[x] = m * x + b;
		return f;
	}

	function d3_layout_histogramRange(values) {
		return [d3.min(values), d3.max(values)];
	}
	d3.layout.hierarchy = function() {
		var sort = d3_layout_hierarchySort,
			children = d3_layout_hierarchyChildren,
			value = d3_layout_hierarchyValue;

		// Recursively compute the node depth and value.
		// Also converts the data representation into a standard hierarchy structure.
		function recurse(data, depth, nodes) {
			var childs = children.call(hierarchy, data, depth),
				node = d3_layout_hierarchyInline ? data : {data: data};
			node.depth = depth;
			nodes.push(node);
			if (childs && (n = childs.length)) {
				var i = -1,
					n,
					c = node.children = [],
					v = 0,
					j = depth + 1;
				while (++i < n) {
					d = recurse(childs[i], j, nodes);
					d.parent = node;
					c.push(d);
					v += d.value;
				}
				if (sort) c.sort(sort);
				if (value) node.value = v;
			} else if (value) {
				node.value = +value.call(hierarchy, data, depth) || 0;
			}
			return node;
		}

		// Recursively re-evaluates the node value.
		function revalue(node, depth) {
			var children = node.children,
				v = 0;
			if (children && (n = children.length)) {
				var i = -1,
					n,
					j = depth + 1;
				while (++i < n) v += revalue(children[i], j);
			} else if (value) {
				v = +value.call(hierarchy, d3_layout_hierarchyInline ? node : node.data, depth) || 0;
			}
			if (value) node.value = v;
			return v;
		}

		function hierarchy(d) {
			var nodes = [];
			recurse(d, 0, nodes);
			return nodes;
		}

		hierarchy.sort = function(x) {
			if (!arguments.length) return sort;
			sort = x;
			return hierarchy;
		};

		hierarchy.children = function(x) {
			if (!arguments.length) return children;
			children = x;
			return hierarchy;
		};

		hierarchy.value = function(x) {
			if (!arguments.length) return value;
			value = x;
			return hierarchy;
		};

		// Re-evaluates the `value` property for the specified hierarchy.
		hierarchy.revalue = function(root) {
			revalue(root, 0);
			return root;
		};

		return hierarchy;
	};

// A method assignment helper for hierarchy subclasses.
	function d3_layout_hierarchyRebind(object, hierarchy) {
		object.sort = d3.rebind(object, hierarchy.sort);
		object.children = d3.rebind(object, hierarchy.children);
		object.links = d3_layout_hierarchyLinks;
		object.value = d3.rebind(object, hierarchy.value);

		// If the new API is used, enabling inlining.
		object.nodes = function(d) {
			d3_layout_hierarchyInline = true;
			return (object.nodes = object)(d);
		};

		return object;
	}

	function d3_layout_hierarchyChildren(d) {
		return d.children;
	}

	function d3_layout_hierarchyValue(d) {
		return d.value;
	}

	function d3_layout_hierarchySort(a, b) {
		return b.value - a.value;
	}

// Returns an array source+target objects for the specified nodes.
	function d3_layout_hierarchyLinks(nodes) {
		return d3.merge(nodes.map(function(parent) {
			return (parent.children || []).map(function(child) {
				return {source: parent, target: child};
			});
		}));
	}

// For backwards-compatibility, don't enable inlining by default.
	var d3_layout_hierarchyInline = false;
	d3.layout.pack = function() {
		var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort),
			size = [1, 1];

		function pack(d, i) {
			var nodes = hierarchy.call(this, d, i),
				root = nodes[0];

			// Recursively compute the layout.
			root.x = 0;
			root.y = 0;
			d3_layout_packTree(root);

			// Scale the layout to fit the requested size.
			var w = size[0],
				h = size[1],
				k = 1 / Math.max(2 * root.r / w, 2 * root.r / h);
			d3_layout_packTransform(root, w / 2, h / 2, k);

			return nodes;
		}

		pack.size = function(x) {
			if (!arguments.length) return size;
			size = x;
			return pack;
		};

		return d3_layout_hierarchyRebind(pack, hierarchy);
	};

	function d3_layout_packSort(a, b) {
		return a.value - b.value;
	}

	function d3_layout_packInsert(a, b) {
		var c = a._pack_next;
		a._pack_next = b;
		b._pack_prev = a;
		b._pack_next = c;
		c._pack_prev = b;
	}

	function d3_layout_packSplice(a, b) {
		a._pack_next = b;
		b._pack_prev = a;
	}

	function d3_layout_packIntersects(a, b) {
		var dx = b.x - a.x,
			dy = b.y - a.y,
			dr = a.r + b.r;
		return (dr * dr - dx * dx - dy * dy) > .001; // within epsilon
	}

	function d3_layout_packCircle(nodes) {
		var xMin = Infinity,
			xMax = -Infinity,
			yMin = Infinity,
			yMax = -Infinity,
			n = nodes.length,
			a, b, c, j, k;

		function bound(node) {
			xMin = Math.min(node.x - node.r, xMin);
			xMax = Math.max(node.x + node.r, xMax);
			yMin = Math.min(node.y - node.r, yMin);
			yMax = Math.max(node.y + node.r, yMax);
		}

		// Create node links.
		nodes.forEach(d3_layout_packLink);

		// Create first node.
		a = nodes[0];
		a.x = -a.r;
		a.y = 0;
		bound(a);

		// Create second node.
		if (n > 1) {
			b = nodes[1];
			b.x = b.r;
			b.y = 0;
			bound(b);

			// Create third node and build chain.
			if (n > 2) {
				c = nodes[2];
				d3_layout_packPlace(a, b, c);
				bound(c);
				d3_layout_packInsert(a, c);
				a._pack_prev = c;
				d3_layout_packInsert(c, b);
				b = a._pack_next;

				// Now iterate through the rest.
				for (var i = 3; i < n; i++) {
					d3_layout_packPlace(a, b, c = nodes[i]);

					// Search for the closest intersection.
					var isect = 0, s1 = 1, s2 = 1;
					for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
						if (d3_layout_packIntersects(j, c)) {
							isect = 1;
							break;
						}
					}
					if (isect == 1) {
						for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
							if (d3_layout_packIntersects(k, c)) {
								if (s2 < s1) {
									isect = -1;
									j = k;
								}
								break;
							}
						}
					}

					// Update node chain.
					if (isect == 0) {
						d3_layout_packInsert(a, c);
						b = c;
						bound(c);
					} else if (isect > 0) {
						d3_layout_packSplice(a, j);
						b = j;
						i--;
					} else { // isect < 0
						d3_layout_packSplice(j, b);
						a = j;
						i--;
					}
				}
			}
		}

		// Re-center the circles and return the encompassing radius.
		var cx = (xMin + xMax) / 2,
			cy = (yMin + yMax) / 2,
			cr = 0;
		for (var i = 0; i < n; i++) {
			var node = nodes[i];
			node.x -= cx;
			node.y -= cy;
			cr = Math.max(cr, node.r + Math.sqrt(node.x * node.x + node.y * node.y));
		}

		// Remove node links.
		nodes.forEach(d3_layout_packUnlink);

		return cr;
	}

	function d3_layout_packLink(node) {
		node._pack_next = node._pack_prev = node;
	}

	function d3_layout_packUnlink(node) {
		delete node._pack_next;
		delete node._pack_prev;
	}

	function d3_layout_packTree(node) {
		var children = node.children;
		if (children && children.length) {
			children.forEach(d3_layout_packTree);
			node.r = d3_layout_packCircle(children);
		} else {
			node.r = Math.sqrt(node.value);
		}
	}

	function d3_layout_packTransform(node, x, y, k) {
		var children = node.children;
		node.x = (x += k * node.x);
		node.y = (y += k * node.y);
		node.r *= k;
		if (children) {
			var i = -1, n = children.length;
			while (++i < n) d3_layout_packTransform(children[i], x, y, k);
		}
	}

	function d3_layout_packPlace(a, b, c) {
		var db = a.r + c.r,
			dx = b.x - a.x,
			dy = b.y - a.y;
		if (db && (dx || dy)) {
			var da = b.r + c.r,
				dc = Math.sqrt(dx * dx + dy * dy),
				cos = Math.max(-1, Math.min(1, (db * db + dc * dc - da * da) / (2 * db * dc))),
				theta = Math.acos(cos),
				x = cos * (db /= dc),
				y = Math.sin(theta) * db;
			c.x = a.x + x * dx + y * dy;
			c.y = a.y + x * dy - y * dx;
		} else {
			c.x = a.x + db;
			c.y = a.y;
		}
	}
// Implements a hierarchical layout using the cluster (or dendogram) algorithm.
	d3.layout.cluster = function() {
		var hierarchy = d3.layout.hierarchy().sort(null).value(null),
			separation = d3_layout_treeSeparation,
			size = [1, 1]; // width, height

		function cluster(d, i) {
			var nodes = hierarchy.call(this, d, i),
				root = nodes[0],
				previousNode,
				x = 0,
				kx,
				ky;

			// First walk, computing the initial x & y values.
			d3_layout_treeVisitAfter(root, function(node) {
				var children = node.children;
				if (children && children.length) {
					node.x = d3_layout_clusterX(children);
					node.y = d3_layout_clusterY(children);
				} else {
					node.x = previousNode ? x += separation(node, previousNode) : 0;
					node.y = 0;
					previousNode = node;
				}
			});

			// Compute the left-most, right-most, and depth-most nodes for extents.
			var left = d3_layout_clusterLeft(root),
				right = d3_layout_clusterRight(root),
				x0 = left.x - separation(left, right) / 2,
				x1 = right.x + separation(right, left) / 2;

			// Second walk, normalizing x & y to the desired size.
			d3_layout_treeVisitAfter(root, function(node) {
				node.x = (node.x - x0) / (x1 - x0) * size[0];
				node.y = (1 - node.y / root.y) * size[1];
			});

			return nodes;
		}

		cluster.separation = function(x) {
			if (!arguments.length) return separation;
			separation = x;
			return cluster;
		};

		cluster.size = function(x) {
			if (!arguments.length) return size;
			size = x;
			return cluster;
		};

		return d3_layout_hierarchyRebind(cluster, hierarchy);
	};

	function d3_layout_clusterY(children) {
		return 1 + d3.max(children, function(child) {
			return child.y;
		});
	}

	function d3_layout_clusterX(children) {
		return children.reduce(function(x, child) {
			return x + child.x;
		}, 0) / children.length;
	}

	function d3_layout_clusterLeft(node) {
		var children = node.children;
		return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
	}

	function d3_layout_clusterRight(node) {
		var children = node.children, n;
		return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
	}
// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
	d3.layout.tree = function() {
		var hierarchy = d3.layout.hierarchy().sort(null).value(null),
			separation = d3_layout_treeSeparation,
			size = [1, 1]; // width, height

		function tree(d, i) {
			var nodes = hierarchy.call(this, d, i),
				root = nodes[0];

			function firstWalk(node, previousSibling) {
				var children = node.children,
					layout = node._tree;
				if (children && (n = children.length)) {
					var n,
						firstChild = children[0],
						previousChild,
						ancestor = firstChild,
						child,
						i = -1;
					while (++i < n) {
						child = children[i];
						firstWalk(child, previousChild);
						ancestor = apportion(child, previousChild, ancestor);
						previousChild = child;
					}
					d3_layout_treeShift(node);
					var midpoint = .5 * (firstChild._tree.prelim + child._tree.prelim);
					if (previousSibling) {
						layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
						layout.mod = layout.prelim - midpoint;
					} else {
						layout.prelim = midpoint;
					}
				} else {
					if (previousSibling) {
						layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
					}
				}
			}

			function secondWalk(node, x) {
				node.x = node._tree.prelim + x;
				var children = node.children;
				if (children && (n = children.length)) {
					var i = -1,
						n;
					x += node._tree.mod;
					while (++i < n) {
						secondWalk(children[i], x);
					}
				}
			}

			function apportion(node, previousSibling, ancestor) {
				if (previousSibling) {
					var vip = node,
						vop = node,
						vim = previousSibling,
						vom = node.parent.children[0],
						sip = vip._tree.mod,
						sop = vop._tree.mod,
						sim = vim._tree.mod,
						som = vom._tree.mod,
						shift;
					while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
						vom = d3_layout_treeLeft(vom);
						vop = d3_layout_treeRight(vop);
						vop._tree.ancestor = node;
						shift = vim._tree.prelim + sim - vip._tree.prelim - sip + separation(vim, vip);
						if (shift > 0) {
							d3_layout_treeMove(d3_layout_treeAncestor(vim, node, ancestor), node, shift);
							sip += shift;
							sop += shift;
						}
						sim += vim._tree.mod;
						sip += vip._tree.mod;
						som += vom._tree.mod;
						sop += vop._tree.mod;
					}
					if (vim && !d3_layout_treeRight(vop)) {
						vop._tree.thread = vim;
						vop._tree.mod += sim - sop;
					}
					if (vip && !d3_layout_treeLeft(vom)) {
						vom._tree.thread = vip;
						vom._tree.mod += sip - som;
						ancestor = node;
					}
				}
				return ancestor;
			}

			// Initialize temporary layout variables.
			d3_layout_treeVisitAfter(root, function(node, previousSibling) {
				node._tree = {
					ancestor: node,
					prelim: 0,
					mod: 0,
					change: 0,
					shift: 0,
					number: previousSibling ? previousSibling._tree.number + 1 : 0
				};
			});

			// Compute the layout using Buchheim et al.'s algorithm.
			firstWalk(root);
			secondWalk(root, -root._tree.prelim);

			// Compute the left-most, right-most, and depth-most nodes for extents.
			var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost),
				right = d3_layout_treeSearch(root, d3_layout_treeRightmost),
				deep = d3_layout_treeSearch(root, d3_layout_treeDeepest),
				x0 = left.x - separation(left, right) / 2,
				x1 = right.x + separation(right, left) / 2,
				y1 = deep.depth || 1;

			// Clear temporary layout variables; transform x and y.
			d3_layout_treeVisitAfter(root, function(node) {
				node.x = (node.x - x0) / (x1 - x0) * size[0];
				node.y = node.depth / y1 * size[1];
				delete node._tree;
			});

			return nodes;
		}

		tree.separation = function(x) {
			if (!arguments.length) return separation;
			separation = x;
			return tree;
		};

		tree.size = function(x) {
			if (!arguments.length) return size;
			size = x;
			return tree;
		};

		return d3_layout_hierarchyRebind(tree, hierarchy);
	};

	function d3_layout_treeSeparation(a, b) {
		return a.parent == b.parent ? 1 : 2;
	}

// function d3_layout_treeSeparationRadial(a, b) {
//   return (a.parent == b.parent ? 1 : 2) / a.depth;
// }

	function d3_layout_treeLeft(node) {
		var children = node.children;
		return children && children.length ? children[0] : node._tree.thread;
	}

	function d3_layout_treeRight(node) {
		var children = node.children,
			n;
		return children && (n = children.length) ? children[n - 1] : node._tree.thread;
	}

	function d3_layout_treeSearch(node, compare) {
		var children = node.children;
		if (children && (n = children.length)) {
			var child,
				n,
				i = -1;
			while (++i < n) {
				if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {
					node = child;
				}
			}
		}
		return node;
	}

	function d3_layout_treeRightmost(a, b) {
		return a.x - b.x;
	}

	function d3_layout_treeLeftmost(a, b) {
		return b.x - a.x;
	}

	function d3_layout_treeDeepest(a, b) {
		return a.depth - b.depth;
	}

	function d3_layout_treeVisitAfter(node, callback) {
		function visit(node, previousSibling) {
			var children = node.children;
			if (children && (n = children.length)) {
				var child,
					previousChild = null,
					i = -1,
					n;
				while (++i < n) {
					child = children[i];
					visit(child, previousChild);
					previousChild = child;
				}
			}
			callback(node, previousSibling);
		}
		visit(node, null);
	}

	function d3_layout_treeShift(node) {
		var shift = 0,
			change = 0,
			children = node.children,
			i = children.length,
			child;
		while (--i >= 0) {
			child = children[i]._tree;
			child.prelim += shift;
			child.mod += shift;
			shift += child.shift + (change += child.change);
		}
	}

	function d3_layout_treeMove(ancestor, node, shift) {
		ancestor = ancestor._tree;
		node = node._tree;
		var change = shift / (node.number - ancestor.number);
		ancestor.change += change;
		node.change -= change;
		node.shift += shift;
		node.prelim += shift;
		node.mod += shift;
	}

	function d3_layout_treeAncestor(vim, node, ancestor) {
		return vim._tree.ancestor.parent == node.parent
			? vim._tree.ancestor
			: ancestor;
	}
// Squarified Treemaps by Mark Bruls, Kees Huizing, and Jarke J. van Wijk
// Modified to support a target aspect ratio by Jeff Heer
	d3.layout.treemap = function() {
		var hierarchy = d3.layout.hierarchy(),
			round = Math.round,
			size = [1, 1], // width, height
			padding = null,
			pad = d3_layout_treemapPadNull,
			sticky = false,
			stickies,
			ratio = 0.5 * (1 + Math.sqrt(5)); // golden ratio

		// Compute the area for each child based on value & scale.
		function scale(children, k) {
			var i = -1,
				n = children.length,
				child,
				area;
			while (++i < n) {
				area = (child = children[i]).value * (k < 0 ? 0 : k);
				child.area = isNaN(area) || area <= 0 ? 0 : area;
			}
		}

		// Recursively arranges the specified node's children into squarified rows.
		function squarify(node) {
			var children = node.children;
			if (children && children.length) {
				var rect = pad(node),
					row = [],
					remaining = children.slice(), // copy-on-write
					child,
					best = Infinity, // the best row score so far
					score, // the current row score
					u = Math.min(rect.dx, rect.dy), // initial orientation
					n;
				scale(remaining, rect.dx * rect.dy / node.value);
				row.area = 0;
				while ((n = remaining.length) > 0) {
					row.push(child = remaining[n - 1]);
					row.area += child.area;
					if ((score = worst(row, u)) <= best) { // continue with this orientation
						remaining.pop();
						best = score;
					} else { // abort, and try a different orientation
						row.area -= row.pop().area;
						position(row, u, rect, false);
						u = Math.min(rect.dx, rect.dy);
						row.length = row.area = 0;
						best = Infinity;
					}
				}
				if (row.length) {
					position(row, u, rect, true);
					row.length = row.area = 0;
				}
				children.forEach(squarify);
			}
		}

		// Recursively resizes the specified node's children into existing rows.
		// Preserves the existing layout!
		function stickify(node) {
			var children = node.children;
			if (children && children.length) {
				var rect = pad(node),
					remaining = children.slice(), // copy-on-write
					child,
					row = [];
				scale(remaining, rect.dx * rect.dy / node.value);
				row.area = 0;
				while (child = remaining.pop()) {
					row.push(child);
					row.area += child.area;
					if (child.z != null) {
						position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
						row.length = row.area = 0;
					}
				}
				children.forEach(stickify);
			}
		}

		// Computes the score for the specified row, as the worst aspect ratio.
		function worst(row, u) {
			var s = row.area,
				r,
				rmax = 0,
				rmin = Infinity,
				i = -1,
				n = row.length;
			while (++i < n) {
				if (!(r = row[i].area)) continue;
				if (r < rmin) rmin = r;
				if (r > rmax) rmax = r;
			}
			s *= s;
			u *= u;
			return s
				? Math.max((u * rmax * ratio) / s, s / (u * rmin * ratio))
				: Infinity;
		}

		// Positions the specified row of nodes. Modifies `rect`.
		function position(row, u, rect, flush) {
			var i = -1,
				n = row.length,
				x = rect.x,
				y = rect.y,
				v = u ? round(row.area / u) : 0,
				o;
			if (u == rect.dx) { // horizontal subdivision
				if (flush || v > rect.dy) v = v ? rect.dy : 0; // over+underflow
				while (++i < n) {
					o = row[i];
					o.x = x;
					o.y = y;
					o.dy = v;
					x += o.dx = v ? round(o.area / v) : 0;
				}
				o.z = true;
				o.dx += rect.x + rect.dx - x; // rounding error
				rect.y += v;
				rect.dy -= v;
			} else { // vertical subdivision
				if (flush || v > rect.dx) v = v ? rect.dx : 0; // over+underflow
				while (++i < n) {
					o = row[i];
					o.x = x;
					o.y = y;
					o.dx = v;
					y += o.dy = v ? round(o.area / v) : 0;
				}
				o.z = false;
				o.dy += rect.y + rect.dy - y; // rounding error
				rect.x += v;
				rect.dx -= v;
			}
		}

		function treemap(d) {
			var nodes = stickies || hierarchy(d),
				root = nodes[0];
			root.x = 0;
			root.y = 0;
			root.dx = size[0];
			root.dy = size[1];
			if (stickies) hierarchy.revalue(root);
			scale([root], root.dx * root.dy / root.value);
			(stickies ? stickify : squarify)(root);
			if (sticky) stickies = nodes;
			return nodes;
		}

		treemap.size = function(x) {
			if (!arguments.length) return size;
			size = x;
			return treemap;
		};

		treemap.padding = function(x) {
			if (!arguments.length) return padding;

			function padFunction(node) {
				var p = x.call(treemap, node, node.depth);
				return p == null
					? d3_layout_treemapPadNull(node)
					: d3_layout_treemapPad(node, typeof p === "number" ? [p, p, p, p] : p);
			}

			function padConstant(node) {
				return d3_layout_treemapPad(node, x);
			}

			var type;
			pad = (padding = x) == null ? d3_layout_treemapPadNull
				: (type = typeof x) === "function" ? padFunction
				: type === "number" ? (x = [x, x, x, x], padConstant)
				: padConstant;
			return treemap;
		};

		treemap.round = function(x) {
			if (!arguments.length) return round != Number;
			round = x ? Math.round : Number;
			return treemap;
		};

		treemap.sticky = function(x) {
			if (!arguments.length) return sticky;
			sticky = x;
			stickies = null;
			return treemap;
		};

		treemap.ratio = function(x) {
			if (!arguments.length) return ratio;
			ratio = x;
			return treemap;
		};

		return d3_layout_hierarchyRebind(treemap, hierarchy);
	};

	function d3_layout_treemapPadNull(node) {
		return {x: node.x, y: node.y, dx: node.dx, dy: node.dy};
	}

	function d3_layout_treemapPad(node, padding) {
		var x = node.x + padding[3],
			y = node.y + padding[0],
			dx = node.dx - padding[1] - padding[3],
			dy = node.dy - padding[0] - padding[2];
		if (dx < 0) { x += dx / 2; dx = 0; }
		if (dy < 0) { y += dy / 2; dy = 0; }
		return {x: x, y: y, dx: dx, dy: dy};
	}
})();

define("d3", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.d3;
    };
}(this)));

define('family/graph',['d3'], function (d3) {

	return function (config) {

		var selector = config.selector;
		var data = config.data;
		var selectedHandler = config.selectedHandler;

		var m = [20, 20, 20, 120],
			w = config.width - m[1] - m[3],
			h = config.height - m[0] - m[2],
			i = 0,
			root;

		var tree = d3.layout.tree()
			.size([h, w]);

		var diagonal = d3.svg.diagonal()
			.projection(function (d) {
				return [d.y, d.x];
			});

		var vis = d3.select(selector).append("svg:svg")
			.attr("width", w + m[1] + m[3])
			.attr("height", h + m[0] + m[2])
			.append("svg:g")
			.attr("transform", "translate(" + m[3] + "," + m[0] + ")");

		root = data;
		root.x0 = h / 2;
		root.y0 = 0;

		function toggleAll(d) {
			if (d.children) {
				d.children.forEach(toggleAll);
				toggle(d);
			}
		}

		// Initialize the display to show a few nodes.
		root.children.forEach(toggleAll);
		/*toggle(root.children[1]);
		toggle(root.children[1].children[2]);
		toggle(root.children[9]);
		toggle(root.children[9].children[0]);*/

		update(root);

		function update(source) {
			var duration = d3.event && d3.event.altKey ? 5000 : 500;

			// Compute the new tree layout.
			var nodes = tree.nodes(root).reverse();

			// Normalize for fixed-depth.
			nodes.forEach(function (d) {
				d.y = d.depth * 100;
			});

			// Update the nodes…
			var node = vis.selectAll("g.node")
				.data(nodes, function (d) {
					return d.id || (d.id = ++i);
				});

			// Enter any new nodes at the parent's previous position.
			var nodeEnter = node.enter().append("svg:g")
				.attr("class", "node")
				.attr("transform", function (d) {
					return "translate(" + source.y0 + "," + source.x0 + ")";
				})
				.on("click", function (d) {
					toggle(d);
					update(d);
					selectedHandler(d);
				});

			nodeEnter.append("svg:circle")
				.attr("r", 1e-6)
				.style("fill", function (d) {
					return d._children ? "lightsteelblue" : "#fff";
				});

			nodeEnter.append("svg:text")
				.attr("x", function (d) {
					return d.children || d._children ? -10 : 10;
				})
				.attr("dy", "-0.9em")
				.attr("text-anchor", function (d) {
					return d.children || d._children ? "end" : "start";
				})
				.text(function (d) {
					return d.name;
				})
				.style("fill-opacity", 1e-6)
			;

			// Transition nodes to their new position.
			var nodeUpdate = node.transition()
				.duration(duration)
				.attr("transform", function (d) {
					return "translate(" + d.y + "," + d.x + ")";
				});

			nodeUpdate.select("circle")
				.attr("r", 4.5)
				.style("fill", function (d) {
					return d._children ? "lightsteelblue" : "#fff";
				});

			nodeUpdate.select("text")
				.style("fill-opacity", 1);

			// Transition exiting nodes to the parent's new position.
			var nodeExit = node.exit().transition()
				.duration(duration)
				.attr("transform", function (d) {
					return "translate(" + source.y + "," + source.x + ")";
				})
				.remove();

			nodeExit.select("circle")
				.attr("r", 1e-6);

			nodeExit.select("text")
				.style("fill-opacity", 1e-6);

			// Update the links…
			var link = vis.selectAll("path.link")
				.data(tree.links(nodes), function (d) {
					return d.target.id;
				});

			// Enter any new links at the parent's previous position.
			link.enter().insert("svg:path", "g")
				.attr("class", "link")
				.attr("d", function (d) {
					var o = {x: source.x0, y: source.y0};
					return diagonal({source: o, target: o});
				})
				.transition()
				.duration(duration)
				.attr("d", diagonal);

			// Transition links to their new position.
			link.transition()
				.duration(duration)
				.attr("d", diagonal);

			// Transition exiting nodes to the parent's new position.
			link.exit().transition()
				.duration(duration)
				.attr("d", function (d) {
					var o = {x: source.x, y: source.y};
					return diagonal({source: o, target: o});
				})
				.remove();

			// Stash the old positions for transition.
			nodes.forEach(function (d) {
				d.x0 = d.x;
				d.y0 = d.y;
			});
		}

// Toggle children.
		function toggle(d) {
			if (d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
		}

	}
});
define('family/vFamily',[
	'marionette',
	'jquery',
	'templates/family',
	'handlebars',
	'family/graph'
], function (Marionette, $, tmp, Handlebars, graph) {

	var ViewFamily = Marionette.ItemView.extend({

		className: 'viewFamily',

		modelEvents: {
			"change": "renderGraph"
		},

		template: tmp,

		initialize: function(options) {
			this.module = options.module;
		},

		renderGraph: function () {
			var w, h;
			w = this.$el.width();
			h = this.$el.height();
			graph({
				selector: '.' + this.className,
				width: w,
				height: h,
				data: this.model.get('familyData'),
				selectedHandler: this.module.personSelected
			});
		}
	});

	return ViewFamily;

});
define('family/mFamily',[
	'backbone'
], function (Backbone) {

	var ModelFamily = Backbone.Model.extend({
		url: '../../test/json/family.json'
	});
	return ModelFamily;

});
define('family/moduleFamily',[
	'globalEvents',
	'family/vFamily',
	'family/mFamily'
], function (globalEvents, ViewFamily, ModelFamily) {

	return function(config) {

		this.model = new ModelFamily({
			initialised: false,
			module: this
		});

		this.view = new ViewFamily({
			model: this.model,
			module: this
		});

		this.personSelected = function(person){
			globalEvents.trigger('personSelected', person);
		};

		this.model.fetch()
			.done(function(){

			})
			.fail(function(){

			});

		config.onLoad && config.onLoad(this.view);

	};

});
define('main',[
	'map/moduleMap',
	'family/moduleFamily'
], function (moduleMap, moduleFamily) {

	var mapApp = new Backbone.Marionette.Application();

	mapApp.addInitializer(function (options) {
		mapApp.addRegions({
			regionMap: ".regionMap",
			regionFamily: ".regionFamily"
		});
	});

	mapApp.addInitializer(function (options) {
		var self = this;
		this.module("moduleMap", moduleMap({
			onLoad: function(view){
				self.regionMap.show(view);
			}
		}));
		this.module("moduleFamily", moduleFamily({
			onLoad: function(view){
				self.regionFamily.show(view);
			}
		}));

	});

	mapApp.start();

});