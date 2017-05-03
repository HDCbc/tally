module.exports = {
  extends: 'airbnb-base',
  installedESLint: true,
  plugins: [
    'import',
  ],
  rules: {
    'require-jsdoc': [1, {
      require: {
        ClassDeclaration: true,
        MethodDefinition: true,
        FunctionDeclaration: true,
      },
    }],
    'valid-jsdoc': 1,
  },
};
