// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 配置以解決 import.meta 問題
config.transformer.unstable_allowRequireContext = true;

// 使用 Babel 插件處理 import.meta
config.transformer.babelTransformerPath = require.resolve('./metro-babel-transformer.js');

// 確保 Web 平台支援
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
