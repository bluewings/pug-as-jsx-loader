/* eslint-disable */
const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

const macro_for = items => ({
  map: (mapFn) => {
    let mapFns = [];
    if (items && items[IS_MAP_SENTINEL]) {
      items.mapEntries(([key, value], i) => {
        mapFns.push(mapFn(value, key, i));
      });
    } else if (items && items[IS_LIST_SENTINEL]) {
      items.forEach((value, i) => {
        mapFns.push(mapFn(value, i, i));
      });
    } else {
      mapFns = Object.keys((items || [])).map((key, index) => mapFn(items[key], key, index));
    }
    return mapFns;
  },
});

export default {
  for: macro_for,
};
