#!/usr/bin/env node

/**
 * GitHub Release 自动上传脚本
 * 用于将 Electron 构建产物上传到 GitHub Release
 *
 * 使用方法:
 * 1. 设置环境变量: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
 * 2. 运行: node scripts/update-github.js [version] [--draft] [--prerelease]
 *
 * 示例:
 * - node scripts/update-github.js v1.0.0
 * - node scripts/update-github.js v1.0.0 --draft
 * - node scripts/update-github.js v1.0.0 --prerelease
 */

const fs = require('fs');
const path = require('path');
const {Octokit} = require('@octokit/rest');
const {execSync} = require('child_process');
const {version} = require('../package.json');

/**
 * 加载 .env 文件
 * 支持标准 .env 格式，包括引号、注释等
 */
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      let loadedCount = 0;

      lines.forEach((line, index) => {
        // 跳过注释和空行
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          // 查找第一个等号的位置
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            let value = trimmedLine.substring(equalIndex + 1).trim();

            // 处理引号包围的值
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1);
            }

            // 处理多行值（以 \ 结尾的行）
            if (value.endsWith('\\')) {
              value = value.slice(0, -1);
              let nextLineIndex = index + 1;
              while (nextLineIndex < lines.length) {
                const nextLine = lines[nextLineIndex].trim();
                if (nextLine && !nextLine.startsWith('#')) {
                  if (nextLine.endsWith('\\')) {
                    value += '\n' + nextLine.slice(0, -1);
                    nextLineIndex++;
                  } else {
                    value += '\n' + nextLine;
                    break;
                  }
                } else {
                  nextLineIndex++;
                }
              }
            }

            // 设置环境变量
            process.env[key] = value;
            loadedCount++;
          }
        }
      });

      if (loadedCount > 0) {
        console.log(`✅ 已加载 .env 文件，共 ${loadedCount} 个环境变量`);
      } else {
        console.log('ℹ️ .env 文件为空或格式不正确');
      }
    } catch (error) {
      console.warn('⚠️ 加载 .env 文件失败:', error.message);
    }
  } else {
    console.log('ℹ️ 未找到 .env 文件，使用系统环境变量');
  }
}

/**
 * 配置类
 */
class Config {
  constructor() {
    // 加载 .env 文件
    loadEnvFile();

    this.token = process.env.GITHUB_TOKEN;
    console.log("🚀 liu123 ~ this.token:", this.token)
    this.owner = process.env.GITHUB_OWNER || '2531800823';
    this.repo = process.env.GITHUB_REPO || 'copy';
    this.version = `v${version}`;
    this.isDraft = process.argv.includes('--draft');
    this.isPrerelease = process.argv.includes('--prerelease');

    this.validate();
  }

  /**
   * 验证配置
   */
  validate() {
    if (!this.token) {
      throw new Error('❌ 请设置环境变量 GITHUB_TOKEN');
    }

    if (!this.version) {
      throw new Error(
        '❌ 请提供版本号，例如: node scripts/update-github.js v1.0.0'
      );
    }

    // 验证版本号格式
    if (!/^v\d+\.\d+\.\d+/.test(this.version)) {
      throw new Error('❌ 版本号格式错误，应为 v1.0.0 格式');
    }

    console.log(`🚀 配置验证通过:`);
    console.log(`   - 仓库: ${this.owner}/${this.repo}`);
    console.log(`   - 版本: ${this.version}`);
    console.log(`   - 草稿: ${this.isDraft}`);
    console.log(`   - 预发布: ${this.isPrerelease}`);
  }
}

/**
 * GitHub Release 管理器
 */
class GitHubReleaseManager {
  constructor(config) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
    });
    this.releasePath = path.join(
      __dirname,
      '..',
      'release',
      config.version.replace('v', '')
    );
  }

  /**
   * 检查构建产物是否存在
   */
  checkBuildArtifacts() {
    if (!fs.existsSync(this.releasePath)) {
      throw new Error(`❌ 构建产物目录不存在: ${this.releasePath}`);
    }

    const files = fs.readdirSync(this.releasePath);
    if (files.length === 0) {
      throw new Error(`❌ 构建产物目录为空: ${this.releasePath}`);
    }

    console.log(`📁 找到构建产物目录: ${this.releasePath}`);
    console.log(`📦 包含文件: ${files.join(', ')}`);

    return files;
  }

  /**
   * 获取 Release 信息
   */
  async getReleaseInfo() {
    try {
      const response = await this.octokit.repos.getReleaseByTag({
        owner: this.config.owner,
        repo: this.config.repo,
        tag: this.config.version,
      });
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        return null; // Release 不存在
      }
      throw error;
    }
  }

  /**
   * 创建或更新 Release
   */
  async createOrUpdateRelease() {
    const existingRelease = await this.getReleaseInfo();

    if (existingRelease) {
      console.log(`🔄 更新已存在的 Release: ${this.config.version}`);
      return await this.updateRelease(existingRelease);
    } else {
      console.log(`🚀 创建新的 Release: ${this.config.version}`);
      return await this.createRelease();
    }
  }

  /**
   * 检查 Token 权限
   */
  async checkTokenPermissions() {
    try {
      console.log('🔐 检查 GitHub Token 权限...');
      console.log(
        `🚀 liu123 ~ {
        owner: this.config.owner,
        repo: this.config.repo,
      }:`,
        {
          owner: this.config.owner,
          repo: this.config.repo,
        }
      );

      // 尝试获取仓库信息
      const repoResponse = await this.octokit.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });

      console.log(`✅ 仓库访问权限正常: ${repoResponse.data.full_name}`);

      // 检查是否有写入权限
      if (repoResponse.data.permissions) {
        const permissions = repoResponse.data.permissions;
        console.log(`📋 权限详情:`);
        console.log(`   - 读取: ${permissions.pull ? '✅' : '❌'}`);
        console.log(`   - 推送: ${permissions.push ? '✅' : '❌'}`);
        console.log(`   - 管理: ${permissions.admin ? '✅' : '❌'}`);

        if (!permissions.push) {
          throw new Error('❌ Token 没有推送权限，无法创建 Release');
        }
      }
    } catch (error) {
      if (error.status === 404) {
        throw new Error(
          `❌ 仓库不存在或 Token 没有访问权限: ${this.config.owner}/${this.config.repo}`
        );
      } else if (error.status === 401) {
        throw new Error('❌ Token 无效或已过期');
      } else if (error.status === 403) {
        throw new Error('❌ Token 权限不足，需要 repo 权限');
      } else {
        throw new Error(`❌ 权限检查失败: ${error.message}`);
      }
    }
  }

  /**
   * 创建新的 Release
   */
  async createRelease() {
    const releaseNotes = this.generateReleaseNotes();

    const response = await this.octokit.repos.createRelease({
      owner: this.config.owner,
      repo: this.config.repo,
      tag_name: this.config.version,
      name: `Release ${this.config.version}`,
      body: releaseNotes,
      draft: this.config.isDraft,
      prerelease: this.config.isPrerelease,
    });

    return response.data;
  }

  /**
   * 更新现有的 Release
   */
  async updateRelease(existingRelease) {
    const releaseNotes = this.generateReleaseNotes();

    const response = await this.octokit.repos.updateRelease({
      owner: this.config.owner,
      repo: this.config.repo,
      release_id: existingRelease.id,
      tag_name: this.config.version,
      name: `Release ${this.config.version}`,
      body: releaseNotes,
      draft: this.config.isDraft,
      prerelease: this.config.isPrerelease,
    });

    return response.data;
  }

  /**
   * 生成 Release 说明
   */
  generateReleaseNotes() {
    const date = new Date().toISOString().split('T')[0];
    const changelogPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'CHANGELOG.md'
    );

    let changelog = '';
    if (fs.existsSync(changelogPath)) {
      try {
        const content = fs.readFileSync(changelogPath, 'utf8');
        // 提取对应版本的 changelog
        const versionMatch = content.match(
          new RegExp(
            `## \\[${this.config.version.replace('v', '')}\\][\\s\\S]*?(?=## \\[|$)`
          )
        );
        if (versionMatch) {
          changelog = versionMatch[0].trim();
        }
      } catch (error) {
        console.warn('⚠️ 读取 CHANGELOG.md 失败:', error.message);
      }
    }

    if (!changelog) {
      changelog = `## 新功能\n- 版本 ${this.config.version} 发布\n\n## 下载\n请下载对应平台的安装包进行安装。`;
    }

    return `# CopyApp ${this.config.version}\n\n发布日期: ${date}\n\n${changelog}`;
  }

  /**
   * 上传文件到 Release
   */
  async uploadAsset(releaseId, filePath) {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fs.statSync(filePath).size;

    console.log(`📤 上传文件: ${fileName} (${this.formatFileSize(fileSize)})`);

    try {
      const response = await this.octokit.repos.uploadReleaseAsset({
        owner: this.config.owner,
        repo: this.config.repo,
        release_id: releaseId,
        name: fileName,
        data: fileBuffer,
        headers: {
          'content-type': this.getMimeType(fileName),
          'content-length': fileSize,
        },
      });

      console.log(`✅ 文件上传成功: ${fileName}`);
      return response.data;
    } catch (error) {
      if (error.status === 422) {
        console.log(`⚠️ 文件已存在，跳过: ${fileName}`);
        return null;
      }
      console.error(`❌ 文件上传失败: ${fileName}`, error.message);
      throw error;
    }
  }

  /**
   * 批量上传文件
   */
  async uploadAssets(releaseId) {
    const files = this.checkBuildArtifacts();
    const results = [];

    console.log(`🚀 开始上传 ${files.length} 个文件...`);

    for (const file of files) {
      const filePath = path.join(this.releasePath, file);
      try {
        const result = await this.uploadAsset(releaseId, filePath);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`❌ 跳过文件: ${file}`);
      }
    }

    return results;
  }

  /**
   * 获取文件的 MIME 类型
   */
  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.exe': 'application/vnd.microsoft.portable-executable',
      '.zip': 'application/zip',
      '.tar.gz': 'application/gzip',
      '.dmg': 'application/x-apple-diskimage',
      '.deb': 'application/vnd.debian.binary-package',
      '.rpm': 'application/x-rpm',
      '.msi': 'application/x-msi',
      '.pkg': 'application/x-newton-compatible-pkg',
      '.AppImage': 'application/x-executable',
      '.blockmap': 'application/octet-stream',
      '.yml': 'text/yaml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 创建 Git 标签
   */
  async createGitTag() {
    try {
      console.log(`🏷️ 检查 Git 标签: ${this.config.version}`);

      // 检查是否在 Git 仓库中
      execSync('git status', {stdio: 'pipe'});

      // 检查本地标签是否已存在
      let localTagExists = false;
      try {
        const localTags = execSync(`git tag -l "${this.config.version}"`, {
          stdio: 'pipe',
        })
          .toString()
          .trim();
        localTagExists = localTags.length > 0;
      } catch (error) {
        // 标签不存在
      }

      // 检查远程标签是否已存在
      let remoteTagExists = false;
      try {
        const remoteTags = execSync(
          `git ls-remote --tags origin "${this.config.version}"`,
          {stdio: 'pipe'}
        )
          .toString()
          .trim();
        remoteTagExists = remoteTags.length > 0;
      } catch (error) {
        // 远程标签不存在
      }

      if (localTagExists && remoteTagExists) {
        console.log(`✅ Git 标签已存在且已推送到远程: ${this.config.version}`);
        return;
      }

      if (localTagExists && !remoteTagExists) {
        console.log(`📤 推送本地标签到远程仓库...`);
        execSync(`git push origin ${this.config.version}`, {stdio: 'inherit'});
        console.log(`✅ Git 标签推送成功`);
        return;
      }

      if (!localTagExists) {
        console.log(`🏷️ 创建新的 Git 标签: ${this.config.version}`);
        // 创建标签
        execSync(`git tag ${this.config.version}`, {stdio: 'inherit'});

        // 推送标签到远程仓库
        console.log(`📤 推送标签到远程仓库...`);
        execSync(`git push origin ${this.config.version}`, {stdio: 'inherit'});

        console.log(`✅ Git 标签创建并推送成功`);
      }
    } catch (error) {
      console.warn('⚠️ Git 标签操作失败:', error.message);
      console.log('💡 请手动创建并推送标签');
      console.log(
        `   手动命令: git tag ${this.config.version} && git push origin ${this.config.version}`
      );

      // 询问是否继续
      console.log('\n❓ Git 标签操作失败，是否继续尝试创建 Release？');
      console.log('   注意：如果标签不存在，Release 创建可能会失败');
      console.log('   建议：先手动创建标签，然后重新运行脚本');
    }
  }

  /**
   * 执行完整的 Release 流程
   */
  async execute() {
    try {
      console.log('🚀 开始 GitHub Release 流程...\n');

      // 1. 检查构建产物
      this.checkBuildArtifacts();

      // 2. 检查 Token 权限
      await this.checkTokenPermissions();

      // 3. 创建 Git 标签
      await this.createGitTag();

      // 4. 创建或更新 Release
      const release = await this.createOrUpdateRelease();
      console.log(`🎉 Release 创建/更新成功: ${release.html_url}\n`);

      // 5. 上传文件
      const assets = await this.uploadAssets(release.id);
      console.log(`\n✅ 文件上传完成，共上传 ${assets.length} 个文件`);

      // 6. 显示结果
      console.log(`\n🎊 GitHub Release 流程完成！`);
      console.log(`🔗 Release 地址: ${release.html_url}`);
      console.log(`📦 构建产物: ${this.releasePath}`);
    } catch (error) {
      console.error('❌ GitHub Release 流程失败:', error.message);
      process.exit(1);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 1. 加载配置
    const config = new Config();

    // 2. 创建 Release 管理器
    const manager = new GitHubReleaseManager(config);

    // 3. 执行流程
    await manager.execute();
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    console.log('\n💡 使用说明:');
    console.log(
      '   node scripts/update-github.js <version> [--draft] [--prerelease]'
    );
    console.log('   示例: node scripts/update-github.js v1.0.0');
    console.log('\n🔧 环境变量:');
    console.log('   GITHUB_TOKEN: GitHub 个人访问令牌');
    console.log(
      '   GITHUB_OWNER: GitHub 用户名或组织名 (可选，默认: 2531800823)'
    );
    console.log('   GITHUB_REPO: GitHub 仓库名 (可选，默认: copy)');
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {GitHubReleaseManager, Config};
