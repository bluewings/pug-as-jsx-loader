export function getRoutes(store, context) {
  return [
    // eslint-disable-next-line global-require
    require('../index').default.getRoute(store, context),
  ];
}

export default { getRoutes };
