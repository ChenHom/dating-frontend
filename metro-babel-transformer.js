// metro-babel-transformer.js
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

module.exports.transform = function ({ src, filename, options }) {
  if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    // 替換所有 import.meta 相關用法
    src = src.replace(/import\.meta\.env/g, 'process.env');
    src = src.replace(/import\.meta/g, '({env: (typeof process !== "undefined" && process.env) || {}})');
  }

  return upstreamTransformer.transform({ src, filename, options });
};