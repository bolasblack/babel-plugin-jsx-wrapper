const { types, template, traverse } = require('@babel/core');
const { addNamed } = require("@babel/helper-module-imports");

module.exports = {
  view_transform,
};

const processedPaths = new Set();
const wrappedNameSuffix = '$$$$$$jsxWrapped';

function view_transform(path, opts = {}) {
  let cursor = path;
  let cursor_path;

  let is_func_expr = 0;
  let is_arrow_expr = 0;

  let last_fn = 0;
  let last_fn_path;

  while (cursor) {
    if (
      types.isFunctionExpression(cursor.parent) ||
      types.isArrowFunctionExpression(cursor.parent)
    ) {
      let has_return_statement =
        types.isArrowFunctionExpression(cursor.parent) &&
        !types.isBlockStatement(cursor.parent.body);

      if (!has_return_statement) {
        traverse(
          cursor.parent,
          {
            ReturnStatement(path) {
              let cur = path;

              loop: while (cur) {
                switch (true) {
                  case types.isFunctionExpression(cur.node):
                  case types.isArrowFunctionExpression(cur.node):
                    if (cur.node !== cursor.parent) return;
                    break loop;
                }
                cur = cur.parentPath;
              }

              has_return_statement = true;
            },
          },
          cursor.parentPath.scope,
          cursor.parentPath
        );
      }

      if (has_return_statement) {
        last_fn = cursor.parent;
        last_fn_path = cursor.parentPath;
      }
    }
    if (types.isProgram(cursor.parent)) {
      break;
    }
    cursor = cursor.parentPath;
  }

  if (!last_fn) return;

  cursor = last_fn;
  cursor_path = last_fn_path;

  if (types.isFunctionExpression(cursor)) {
    is_func_expr = 1;
  } else if (types.isArrowFunctionExpression(cursor)) {
    is_arrow_expr = 1;
  }

  if (!cursor) return;
  if (!is_func_expr && !is_arrow_expr) return;

  // Already wrapped
  if (types.isCallExpression(cursor_path.parent)) return;
  if (types.isJSXExpressionContainer(cursor_path.parent)) return;
  if (cursor_path.parentPath && processedPaths.has(cursor_path.parentPath)) return;
  
  if (opts.ucfirst !== false) {
    // Check if first letter of function name is uppercased
    if (types.isVariableDeclarator(cursor_path.parent)) {
      if (cursor_path.parent.id && !/^[A-Z]/.test(cursor_path.parent.id.name)) {
        return;
      }
    }
    if (types.isAssignmentExpression(cursor_path.parent)) {
      if (cursor_path.parent.left && !/^[A-Z]/.test(cursor_path.parent.left.name)) {
        return;
      }
    }
  }

  let assigningVarName;
  if (types.isVariableDeclarator(cursor_path.parent)) {
    assigningVarName = cursor_path.parent.id.name;
  }
  if (types.isAssignmentExpression(cursor_path.parent)) {
    assigningVarName = cursor_path.parent.id.name;
  }
  if (assigningVarName && assigningVarName.endsWith(wrappedNameSuffix)) return;

  let decoratorModule = opts.decoratorModule;
  let decoratorFn = opts.decoratorFn;
  if (decoratorModule == null || decoratorFn == null) {
    switch (opts.decorator) {
      case 'mobx':
      case 'mobx-react':
        decoratorModule = 'mobx-react';
        decoratorFn = 'observer';
        break;
      case 'mobx-lite':
      case 'mobx-react-lite':
        decoratorModule = 'mobx-react-lite';
        decoratorFn = 'observer';
        break;
      case 'remini-react':
      case 'remini':
        decoratorModule = 'remini/react';
        decoratorFn = 'component';
        break;
      case 'remini-preact':
        decoratorModule = 'remini/preact';
        decoratorFn = 'component';
        break;
      case 'realar':
        decoratorModule = 'realar';
        decoratorFn = 'observe';
        break;
      default:
        decoratorFn = opts.decorator;
    }
  }

  let replacer = cursor;
  if (assigningVarName && opts.displayName) {
    const newVarName = `${assigningVarName}${wrappedNameSuffix}`;
    const wrapperName = (decoratorModule == null ? '' : `${decoratorModule}.`) + decoratorFn
    cursor_path.parentPath.parentPath.insertBefore(
      template(`
        const ${newVarName} = BODY;
        ${newVarName}.displayName = "${wrapperName || 'wrapped'}(${assigningVarName})";
      `)({
        BODY: cursor,
      })
    );
    replacer = types.identifier(newVarName);
  }

  let tpl = `BODY`
  if (decoratorFn != null) {
    if (decoratorModule == null) {
      tpl = `${decoratorFn}(${tpl})`;
    } else if (opts.esImport) {
      const importedId = addNamed(path, decoratorFn, decoratorModule);
      tpl = `${importedId.name}(${tpl})`;
    } else {
      tpl = `require("${decoratorModule}").${decoratorFn}(${tpl})`;
    }
  }
  if (opts.memo) {
    tpl = `require("react").memo(${tpl})`;
  }

  const decorated = template(tpl)({
    BODY: replacer,
  });
  cursor_path.replaceWith(decorated);

  processedPaths.add(cursor_path.parentPath);
}
