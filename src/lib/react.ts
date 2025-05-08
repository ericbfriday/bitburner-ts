// @ts-expect-error
import ReactNamespace from 'react/index';
// @ts-expect-error
import ReactDomNamespace from 'react-dom';

declare global {
  interface Window {
    React: typeof ReactNamespace;
    ReactDOM: typeof ReactDomNamespace;
  }
}

const React = window.React as typeof ReactNamespace;
const ReactDOM = window.ReactDOM as typeof ReactDomNamespace;

export default React;
export {
  ReactDOM
}