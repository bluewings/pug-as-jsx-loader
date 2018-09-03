/* eslint-disable */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

var macro_for = function macro_for(items) {
  return {
    map: function map(mapFn) {
      var mapFns = [];
      if (items && items[IS_MAP_SENTINEL]) {
        items.mapEntries(function (_ref, i) {
          var _ref2 = _slicedToArray(_ref, 2),
              key = _ref2[0],
              value = _ref2[1];

          mapFns.push(mapFn(value, key, i));
        });
      } else if (items && items[IS_LIST_SENTINEL]) {
        items.forEach(function (value, i) {
          mapFns.push(mapFn(value, i, i));
        });
      } else {
        mapFns = Object.keys(items || []).map(function (key, index) {
          return mapFn(items[key], key, index);
        });
      }
      return mapFns;
    }
  };
};

exports.default = {
  for: macro_for
};
