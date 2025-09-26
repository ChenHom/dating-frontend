// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 配置以解決 import.meta 問題
config.transformer.unstable_allowRequireContext = true;

// 使用 Babel 插件處理 import.meta
config.transformer.babelTransformerPath = require.resolve('./metro-babel-transformer.js');

// 確保 Web 平台支援
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 確保字體正確處理
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'ttf',
  'otf',
  'woff',
  'woff2',
];

// Web 優化配置
if (process.env.EXPO_PLATFORM === 'web') {
  // 啟用 minification 和優化
  config.transformer.minifierConfig = {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    compress: {
      drop_console: true, // 移除 console.log
      drop_debugger: true, // 移除 debugger
      pure_funcs: ['console.log', 'console.info', 'console.warn'], // 移除指定函數調用
      dead_code: true, // 移除無用代碼
      unused: true, // 移除未使用的變數
    },
  };

  // 啟用 tree shaking 和代碼分割
  config.resolver.unstable_enablePackageExports = true;
  config.transformer.unstable_collectDependenciesPath = require.resolve('./collect-dependencies');

  // 優化解析和別名
  config.resolver.alias = {
    // 減少包大小的優化
    'react-native-svg': 'react-native-svg/lib/commonjs/ReactNativeSVG.web.js',
    // 使用較小的日期庫替代
    'dayjs': 'dayjs/esm',
  };

  // 忽略一些只在原生平台需要的包
  config.resolver.resolverMainFields = ['browser', 'main'];
  config.resolver.alias = {
    ...config.resolver.alias,
    '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage/lib/commonjs/index.web.js',
  };
}

module.exports = config;
