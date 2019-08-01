const j = require('jscodeshift');
const babylon = require('@babel/parser');

const parser = {
  parse(code) {
    return babylon.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      startLine: 1,
      tokens: true,
      plugins: [
        'jsx',
        'asyncGenerators',
        'bigInt',
        'classPrivateMethods',
        'classPrivateProperties',
        'classProperties',
        'decorators-legacy',
        'doExpressions',
        'dynamicImport',
        'exportDefaultFrom',
        'exportExtensions',
        'exportNamespaceFrom',
        'functionBind',
        'functionSent',
        'importMeta',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        ['pipelineOperator', {
          proposal: 'minimal'
        }],
        'throwExpressions',
        'typescript'
      ],
    });
  },
};

const getSource = (source, file) => {
  const fileExt = file.split('.').pop();
  if (fileExt === 'ts' || fileExt === 'tsx') {
    return j(source, {
      parser,
    });
  }
  return j(source);
};

export { getSource };
