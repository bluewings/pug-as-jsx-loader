import CSSModules from 'react-css-modules'
import withStyles from 'isomorphic-style-loader/lib/withStyles'

export default (styles) => {
  return (Component) => withStyles(styles)(CSSModules(Component, styles, { allowMultiple: true }))
}
