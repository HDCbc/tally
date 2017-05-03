module.exports = {
  installedESLint: true,
  env: {
    mocha: true,
  },
  rules: {
    'import/no-extraneous-dependencies': [ 'error', {
      devDependencies: [ '**/*.spec.js' ],
    }],
  },
};
