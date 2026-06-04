/**
 * Electron Builder 配置
 * @see - https://www.electron.build/configuration/configuration
 */
const path = require('path');

const projectDir = __dirname;

module.exports = {
  appId: 'com.liushipeng.copy',
  asar: true,
  productName: 'CopyApp',
  directories: {
    // 使用绝对路径，避免 CI / pnpm 工作目录变化导致产物写到别处
    output: path.join(projectDir, 'release', '${version}'),
  },
  files: ['dist', 'dist-electron', 'build/icons/png/32x32.png'],
  extraResources: [
    {
      from: '../web/dist/',
      to: 'web/dist',
      filter: ['**/*'],
    },
    {
      from: './build/icons/png/32x32.png',
      to: 'build/icons/png/32x32.png',
      filter: ['**/*'],
    },
    {
      from: './src/native/',
      to: 'native',
      filter: ['**/*'],
    },
  ],
  // 移除extraFiles配置，避免重复复制
  // extraFiles: [
  //   {
  //     from: '../web/dist/',
  //     to: 'resources/web/dist',
  //     filter: ['**/*'],
  //   },
  // ],
  buildDependenciesFromSource: false,
  npmRebuild: false,
  forceCodeSigning: false,
  mac: {
    target: ['dmg'],
    icon: 'build/icons/mac/icon.icns',

    artifactName: '${productName}-Mac-${version}.${ext}',
    category: 'public.app-category.productivity',
  },
  win: {
    icon: 'build/icons/win/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],

    artifactName: '${productName}-Windows-${version}.${ext}',
    signingHashAlgorithms: null,
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
    shortcutName: 'CopyApp',
    include: 'build/installer.nsh',
  },
  linux: {
    target: ['AppImage'],
    icon: 'build/icons/png',

    artifactName: '${productName}-Linux-${version}.${ext}',
    category: 'Utility',
  },
  // 移除 publish 配置，避免构建时自动发布导致卡住
  // publish 将在 GitHub Actions 中单独处理
  // publish: [
  //   {
  //     provider: 'github',
  //     owner: '2531800823',
  //     repo: 'copy',
  //     releaseType: 'release',
  //     private: false,
  //     publishAutoUpdate: true,
  //   },
  // ],
  generateUpdatesFilesForAllChannels: true,
  asarUnpack: [],
};
