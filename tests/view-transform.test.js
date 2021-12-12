const babel = require('@babel/core');
const plugin = require('../src/plugin');

const decorator_fn_name = 'require("realar").observe';

function transform(code) {
  return babel.transform(code, {
    plugins: [plugin],
    code: true,
    ast: false,
  }).code;
}

describe('should work babel transform', () => {
  test('arrow jsx with args', () => {
    const code = `const A = (p) => <h1 />`;
    const expected = `const A = ${decorator_fn_name}(p => <h1 />);`;
    expect(transform(code)).toBe(expected);
  });

  test('arrow jsx no args', () => {
    const code = `const A = () => <h1 />`;
    const expected = `const A = ${decorator_fn_name}(() => <h1 />);`;
    expect(transform(code)).toBe(expected);
  });

  test('arrow no jsx return', () => {
    const code = `const A = () => 0`;
    const expected = `const A = () => 0;`;
    expect(transform(code)).toBe(expected);
  });

  test('processed arrow jsx', () => {
    const code = `const A = f((p) => <h1 />)`;
    const expected = `const A = f(p => <h1 />);`;
    expect(transform(code)).toBe(expected);
  });

  test('not component arrow jsx', () => {
    const code = `const a = (p) => <h1 />`;
    const expected = `const a = p => <h1 />;`;
    expect(transform(code)).toBe(expected);
  });

  test('block arrow jsx with args', () => {
    const code = `const A = (p) => { return <h1 /> }`;
    const expected = `const A = ${decorator_fn_name}(p => {\n  return <h1 />;\n});`;
    expect(transform(code)).toBe(expected);
  });

  test('block arrow jsx no args', () => {
    const code = `const A = () => { return <h1 /> }`;
    const expected = `const A = ${decorator_fn_name}(() => {\n  return <h1 />;\n});`;
    expect(transform(code)).toBe(expected);
  });

  test('block arrow no return', () => {
    const code = `const A = () => {}`;
    const expected = `const A = () => {};`;
    expect(transform(code)).toBe(expected);
  });

  test('not component block arrow no return', () => {
    const code = `const a = () => <h1 />`;
    const expected = `const a = () => <h1 />;`;
    expect(transform(code)).toBe(expected);
  });

  test('fn expr jsx', () => {
    const code = `const A = function A(p) { return <h1 /> }`;
    const expected = `const A = ${decorator_fn_name}(function A(p) {\n  return <h1 />;\n});`;
    expect(transform(code)).toBe(expected);
  });

  test('processed fn expr jsx', () => {
    const code = `const A = f(function a(p) { return <h1 /> })`;
    const expected = `const A = f(function a(p) {\n  return <h1 />;\n});`;
    expect(transform(code)).toBe(expected);
  });

  test('fn expr jsx no args', () => {
    const code = `const A = function() { return <h1 /> }`;
    const expected = `const A = ${decorator_fn_name}(function () {\n  return <h1 />;\n});`;
    expect(transform(code)).toBe(expected);
  });

  test('not component fn expr jsx', () => {
    const code = `const a = function() { return <h1 /> }`;
    const expected = `const a = function () {\n  return <h1 />;\n};`;
    expect(transform(code)).toBe(expected);
  });

  test('fn decl jsx with args', () => {
    const code = `function A(p) { return <h1 /> }`;
    const expected = `function A(p) {\n  return <h1 />;\n}`;
    expect(transform(code)).toBe(expected);
  });

  test('fn decl jsx no args', () => {
    const code = `function A() { return <h1 /> }`;
    const expected = `function A() {\n  return <h1 />;\n}`;
    expect(transform(code)).toBe(expected);
  });

  test('export fn decl jsx with args', () => {
    const code = `export function A(p) { return <h1 /> }`;
    const expected = `export function A(p) {\n  return <h1 />;\n}`;
    expect(transform(code)).toBe(expected);
  });

  test('export default fn decl jsx with args', () => {
    const code = `export default function A(p) { return <h1 /> }`;
    const expected = `export default function A(p) {\n  return <h1 />;\n}`;
    expect(transform(code)).toBe(expected);
  });
});
