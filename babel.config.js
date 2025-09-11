module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }]
    ],
    plugins: [
      // For React Native Reanimated
      'react-native-reanimated/plugin',
    ],
  };
};