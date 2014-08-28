(function() {
  var MODIFIERS, OPERATORS, assertArray, buildPair, buildSearchParams, evalObjectValue, evalValue, expandParam, identity, isOperator, linearizeOne, linearizeParams, tap, type;

  type = function(obj) {
    var classToType;
    if (obj === void 0 || obj === null) {
      return String(obj);
    }
    classToType = {
      '[object Boolean]': 'boolean',
      '[object Number]': 'number',
      '[object String]': 'string',
      '[object Function]': 'function',
      '[object Array]': 'array',
      '[object Date]': 'date',
      '[object RegExp]': 'regexp',
      '[object Object]': 'object'
    };
    return classToType[Object.prototype.toString.call(obj)];
  };

  OPERATORS = {
    $gt: '>',
    $lt: '<',
    $lte: '<=',
    $gte: '>='
  };

  MODIFIERS = {
    $asc: ':asc',
    $desc: ':desc',
    $exact: ':exact',
    $missing: ':missing',
    $null: ':missing',
    $text: ':text'
  };

  isOperator = function(v) {
    return v.indexOf('$') === 0;
  };

  evalObjectValue = function(o) {
    var k, v;
    return ((function() {
      var _results;
      _results = [];
      for (k in o) {
        v = o[k];
        _results.push("" + OPERATORS[k] + v);
      }
      return _results;
    })()).join("???");
  };

  evalValue = function(v) {
    switch (type(v)) {
      case 'object':
        return evalObjectValue(v);
      case 'string':
        return v;
      default:
        throw 'could not evalValue';
    }
  };

  tap = function(o, cb) {
    cb(o);
    return o;
  };

  assertArray = function(a) {
    if (type(a) !== 'array') {
      throw 'not array';
    }
    return a;
  };

  expandParam = function(k, v) {
    var reduceFn, x, y;
    reduceFn = function(acc, _arg) {
      var kk, o, res, vv;
      kk = _arg[0], vv = _arg[1];
      return acc.concat(kk === '$and' ? assertArray(vv).reduce((function(a, vvv) {
        return a.concat(linearizeOne(k, vvv));
      }), []) : kk === '$type' ? [] : isOperator(kk) ? (o = {
        param: k
      }, kk === '$or' ? o.value = vv : (OPERATORS[kk] ? o.operator = OPERATORS[kk] : void 0, MODIFIERS[kk] ? o.modifier = MODIFIERS[kk] : void 0, type(vv) === 'object' && vv.$or ? o.value = vv.$or : o.value = [vv]), [o]) : (v.$type ? res = ":" + v.$type : void 0, linearizeOne("" + k + (res || '') + "." + kk, vv)));
    };
    return ((function() {
      var _results;
      _results = [];
      for (x in v) {
        y = v[x];
        _results.push([x, y]);
      }
      return _results;
    })()).reduce(reduceFn, []);
  };

  linearizeOne = function(k, v) {
    switch (type(v)) {
      case 'object':
        return expandParam(k, v);
      case 'string':
        return [
          {
            param: k,
            value: [v]
          }
        ];
      case 'number':
        return [
          {
            param: k,
            value: [v]
          }
        ];
      case 'array':
        return [
          {
            param: k,
            value: [v.join("|")]
          }
        ];
      default:
        throw "could not linearizeParams " + (type(v));
    }
  };

  linearizeParams = function(query) {
    var k, reduceFn, v;
    reduceFn = function(acc, _arg) {
      var k, v;
      k = _arg[0], v = _arg[1];
      return acc.concat(linearizeOne(k, v));
    };
    return ((function() {
      var _results;
      _results = [];
      for (k in query) {
        v = query[k];
        _results.push([k, v]);
      }
      return _results;
    })()).reduce(reduceFn, []);
  };

  buildPair = function(k, v) {
    return "" + k + "=" + (evalValue(v));
  };

  identity = function(x) {
    return x;
  };

  buildSearchParams = function(query) {
    var p, ps;
    ps = (function() {
      var _i, _len, _ref, _results;
      _ref = linearizeParams(query);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        _results.push([p.param, p.modifier, '=', p.operator, p.value].filter(identity).join(''));
      }
      return _results;
    })();
    return ps.join("&");
  };

  window.fhir || (window.fhir = {});

  window.fhir._query = linearizeParams;

  window.fhir.query = buildSearchParams;

}).call(this);