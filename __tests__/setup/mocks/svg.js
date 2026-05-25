'use strict';
const React = require('react');
const Svg = (props) => React.createElement('Svg', props);
const Line = (props) => React.createElement('Line', props);
const Circle = (props) => React.createElement('Circle', props);
const SvgXml = (props) => React.createElement('SvgXml', props);
// __esModule: true tells Babel's _interopRequireDefault to use .default directly
module.exports = { __esModule: true, default: Svg, Svg, Line, Circle, SvgXml };
