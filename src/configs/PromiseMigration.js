module.exports = class PromiseMigration {
  getVisitorObject() {
      return Object.assign({}, this._removeDoneStatement());
  }

  _removeDoneStatement() {
      return {
          ExpressionStatement(path) {
              const expression = path.node.expression;
              const callee = expression.callee;
              console.log(callee)
              if (
                  callee &&
                  callee.property &&
                  callee.object &&
                  callee.property.type === 'Identifier' &&
                  callee.property.name === 'done' &&
                  callee.object.type === 'CallExpression'
              ) {
                  path.node.expression = callee.object;
              }
          }
      }
  }
};
