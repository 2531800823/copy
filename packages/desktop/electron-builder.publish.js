/**
 * Electron Builder 发布配置
 * 专门用于需要发布到 GitHub Releases 的构建
 * @see - https://www.electron.build/configuration/configuration
 */
const config = require('./electron-builder.js');

module.exports = {
  ...config,
  publish: [
    {
      provider: 'github',
      owner: '2531800823',
      repo: 'copy',
      releaseType: 'release',
      private: false,
      publishAutoUpdate: true,
    },
  ],
};
