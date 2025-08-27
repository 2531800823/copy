/**
 * Electron Builder 配置
 * @see - https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.liushipeng.copy',
  asar: true,
  productName: 'CopyApp',
  directories: {
     
    output: 'release/${version}',
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
  ],
  // 移除extraFiles配置，避免重复复制
  // extraFiles: [
  //   {
  //     from: '../web/dist/',
  //     to: 'resources/web/dist',
  //     filter: ['**/*'],
  //   },
  // ],
  buildDependenciesFromSource: true,
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
