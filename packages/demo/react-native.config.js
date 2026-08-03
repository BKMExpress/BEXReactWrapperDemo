const path = require('path');
const pkg = require('../bex-react-native/package.json');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '../bex-react-native'),
      platforms: {
        ios: {},
        android: {},
      },
    },
  },
};
