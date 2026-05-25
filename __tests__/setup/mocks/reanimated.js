'use strict';
// Minimal mock for react-native-reanimated and react-native-worklets
const React = require('react');

const Animated = {
  View: 'Animated.View',
  Text: 'Animated.Text',
  ScrollView: 'Animated.ScrollView',
  FlatList: 'Animated.FlatList',
  Image: 'Animated.Image',
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => ({}),
  withTiming: (v) => v,
  withSpring: (v) => v,
  withDelay: (_, v) => v,
  withSequence: (...args) => args[args.length - 1],
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  interpolate: (v, input, output) => output[0],
  Easing: { linear: (t) => t, ease: (t) => t, bezier: () => (t) => t, out: (e) => e, in: (e) => e },
  FadeIn: { duration: () => FadeIn },
  FadeOut: { duration: () => FadeOut },
  SlideInDown: { duration: () => SlideInDown, springify: () => SlideInDown },
  SlideOutDown: { duration: () => SlideOutDown, springify: () => SlideOutDown },
  createAnimatedComponent: (Component) => Component,
};

// Fix self-references in layout animations
const self = module.exports;
['FadeIn', 'FadeOut', 'SlideInDown', 'SlideOutDown'].forEach((name) => {
  self[name] = new Proxy({}, { get: (_, prop) => () => self[name] });
});
