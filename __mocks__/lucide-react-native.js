/* Lightweight stand-in for the lucide ESM bundle (it ships .mjs which Jest will not parse). */
const React = require('react');
const { View } = require('react-native');

const makeIcon = (name) => {
  const C = (props) => React.createElement(View, { accessibilityLabel: `icon-${name}`, ...props });
  C.displayName = name;
  return C;
};

module.exports = new Proxy(
  {},
  {
    get: (target, prop) => {
      if (prop === '__esModule') return true;
      if (typeof prop !== 'string') return undefined;
      if (!target[prop]) target[prop] = makeIcon(prop);
      return target[prop];
    },
  }
);
