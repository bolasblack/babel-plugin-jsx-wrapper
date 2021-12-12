const babel = require('@babel/core');
const plugin = require('../src/plugin');

function transform(code, { decorator, filename, include, exclude, root, memo }) {
  return babel.transform(code, {
    plugins: [[plugin, { decorator, include, exclude, root, memo }]],
    code: true,
    ast: false,
    filename,
  }).code;
}

test('should work decorator option', () => {
  const code = `const A = (p) => <h1 />`;
  const expected = `const A = k(p => <h1 />);`;
  expect(transform(code, { decorator: 'k' })).toBe(expected);
});

test('should work mobx decorator option', () => {
  const code = `const A = (p) => <h1 />`;
  const expected = `const A = require("mobx-react").observer(p => <h1 />);`;
  expect(transform(code, { decorator: 'mobx' })).toBe(expected);
});

test('should work mobx-lite decorator option', () => {
  const code = `const A = (p) => <h1 />`;
  const expected = `const A = require("mobx-react-lite").observer(p => <h1 />);`;
  expect(transform(code, { decorator: 'mobx-lite' })).toBe(expected);
});

test('should work realar decorator option', () => {
  const code = `const A = (p) => <h1 />`;
  const expected = `const A = require("realar").observe(p => <h1 />);`;
  expect(transform(code, { decorator: 'realar' })).toBe(expected);
});

test('should work include option', () => {
  const code = `const A = p => <h1 />;`;
  const decorated = `const A = k(p => <h1 />);`;
  expect(transform(code, { include: ['src/*'], filename: __filename })).toBe(code);
  expect(
    transform(code, { include: ['src/*', 'tests/*'], filename: __filename, decorator: 'k' })
  ).toBe(decorated);
});

test('should work exclude option', () => {
  const code = `const A = p => <h1 />;`;
  const decorated = `const A = k(p => <h1 />);`;
  expect(transform(code, { exclude: ['tests/*'], filename: __filename })).toBe(code);
  expect(
    transform(code, {
      exclude: ['tests/*'],
      include: ['tests/*'],
      filename: __filename,
      decorator: 'k',
    })
  ).toBe(decorated);
  expect(transform(code, { exclude: ['src/*'], filename: __filename, decorator: 'k' })).toBe(
    decorated
  );
});

test('should work root option', () => {
  const code = `const A = p => <h1 />;`;
  const decorated = `const A = k(p => <h1 />);`;
  expect(
    transform(code, { root: __dirname, exclude: ['src/*'], filename: __filename, decorator: 'k' })
  ).toBe(decorated);
});

test('should work switch on memo option', () => {
  const code = `const A = p => <h1 />;`;
  const decorated = `const A = require("react").memo(k(p => <h1 />));`;
  expect(transform(code, { filename: __filename, decorator: 'k', memo: true })).toBe(decorated);
});

test('should work switch off memo option', () => {
  const code = `const A = p => <h1 />;`;
  const decorated = `const A = require("realar").observe(p => <h1 />);`;
  expect(transform(code, { filename: __filename, memo: false })).toBe(decorated);
});
