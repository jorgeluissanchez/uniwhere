'use strict';
const mockFileInstance = {
  exists: true,
  uri: 'file://mock/path.jpg',
  write: jest.fn(),
};
module.exports = {
  File: jest.fn(() => mockFileInstance),
  Paths: { cache: 'file://cache/', document: 'file://document/' },
};
