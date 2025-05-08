import ReactDomNamespace from 'react-dom';
import ReactNamespace from 'react/index';

// Bypass RAM cost of Window access
const w = eval(`window`) as Window & typeof globalThis

const React = w.React as typeof ReactNamespace;
const ReactDOM = w.ReactDOM as typeof ReactDomNamespace;

export default React;
export {
    ReactDOM
};
