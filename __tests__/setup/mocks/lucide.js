'use strict';
const React = require('react');
const Icon = (props) => React.createElement('View', props);
module.exports = new Proxy({}, { get: () => Icon });
