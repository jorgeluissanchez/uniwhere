'use strict';
const React = require('react');
const { View } = require('react-native');

module.exports = {
  Drawer: ({ children, open, onOpenChange }) =>
    open ? React.createElement(View, { testID: 'drawer' }, children) : null,
  DrawerContent: ({ children }) => React.createElement(View, null, children),
  DrawerTitle: ({ children }) => React.createElement(View, null, children),
  DrawerClose: ({ children }) => React.createElement(View, null, children),
  DrawerTrigger: ({ children }) => React.createElement(View, null, children),
  DrawerOverlay: ({ children }) => React.createElement(View, null, children),
};
