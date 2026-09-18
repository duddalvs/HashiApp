const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Ferramentas locais e documentos não fazem parte do aplicativo.
config.resolver.blockList = [
  /[\\/]\.tools[\\/]/,
  /[\\/]docs[\\/]/,
  /[\\/]supabase[\\/]/,
  /[\\/]test-results[\\/]/,
];
config.maxWorkers = 2;
module.exports = config;
