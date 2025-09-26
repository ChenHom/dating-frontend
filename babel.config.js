module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';
  const isWeb = process.env.EXPO_PLATFORM === 'web';

  const plugins = [
    // For React Native Reanimated (must be last)
    'react-native-reanimated/plugin',
  ];

  // Web 平台專用插件
  if (isWeb) {
    plugins.unshift(
      // 支援動態導入
      '@babel/plugin-syntax-dynamic-import',
    );
  }

  // 生產環境 Web 優化
  if (isProduction && isWeb) {
    plugins.unshift(
      // 移除 console.log
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
      // 移除 prop-types（生產環境不需要）
      'babel-plugin-transform-react-remove-prop-types',
    );
  }

  return {
    presets: [
      ['babel-preset-expo', {
        jsxImportSource: 'nativewind',
        web: isWeb ? {
          // 啟用 ES modules 以支援 tree shaking
          disableImportExportTransform: false,
        } : undefined
      }]
    ],
    plugins,
  };
};