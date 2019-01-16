import { pugToJsx } from 'pug-as-jsx-utils';

import { getOptions } from 'loader-utils';
// import validateOptions from 'schema-utils';

// const schema = {
//   type: 'object',
//   properties: {
//     test: {
//       type: 'string'
//     }
//   }
// };

export default function loader(source) {
  const options = getOptions(this);

  // console.log(options);

  // { resolveComponents: { Intl: 'useIntl/FormattedMessage' },
  // resolveVariables:
  //  { intl: 'useIntl/intl',
  //    classNames: 'classnames',
  //    cx: 'classnames' },
  // transpiledFile: true,
  // autoUpdateJsFile: true }


  // validateOptions(schema, options, 'Example Loader');

  // Apply some transformations to the source...

  const { jsxTemplate: code } = pugToJsx(source, {
    template: true,
    // resolve: options.resolve || {},
  });
  return code;


  // return `export default ${ JSON.stringify(source) }`;
}