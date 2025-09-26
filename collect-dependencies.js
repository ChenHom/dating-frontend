/**
 * Custom dependency collector for Metro
 * 自定義依賴收集器用於更好的代碼分割
 */

const { collectDependenciesFromAST } = require('metro/src/JSTransformer/worker/collectDependencies');

function collectDependencies(ast, filename, options) {
  // 為特定的大型模組進行代碼分割標記
  const largePaths = [
    '/features/game/',
    '/features/gifts/',
    '/features/profile/EditProfileScreen',
    '/features/profile/StatsScreen',
    '/features/profile/SettingsScreen',
    'react-native-reanimated',
    'react-native-svg',
    '@expo/vector-icons',
  ];

  const isLargeModule = largePaths.some(path => filename.includes(path));

  const dependencies = collectDependenciesFromAST(ast, filename, options);

  // 標記大型模組為異步導入候選
  if (isLargeModule) {
    dependencies.asyncType = 'weak';
  }

  return dependencies;
}

module.exports = collectDependencies;