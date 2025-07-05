import fs from 'node:fs';
import * as glob from 'glob';

/**
 * 对依赖对象进行字母排序
 * @param {object} dependencies - 依赖对象
 * @returns {object} 排序后的依赖对象
 */
function sortDependencies(dependencies) {
  if (!dependencies || typeof dependencies !== 'object') {
    return dependencies;
  }

  const sortedKeys = Object.keys(dependencies).sort();
  const sortedDeps = {};

  for (const key of sortedKeys) {
    sortedDeps[key] = dependencies[key];
  }

  return sortedDeps;
}

/**
 * 处理单个package.json文件，只对依赖项进行排序
 * @param {string} filePath - package.json文件路径
 */
function sortPackageJsonDependencies(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(content);

    let hasChanges = false;

    // 需要排序的依赖字段
    const dependencyFields = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ];

    // 只对依赖字段进行排序
    for (const field of dependencyFields) {
      if (packageJson[field]) {
        const originalKeys = Object.keys(packageJson[field]);
        const sortedDeps = sortDependencies(packageJson[field]);
        const sortedKeys = Object.keys(sortedDeps);

        // 检查是否有变化
        if (JSON.stringify(originalKeys) !== JSON.stringify(sortedKeys)) {
          packageJson[field] = sortedDeps;
          hasChanges = true;
        }
      }
    }

    // 只有在有变化时才写入文件
    if (hasChanges) {
      const updatedContent = `${JSON.stringify(packageJson, null, 2)}\n`;
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✓ 已排序依赖项: ${filePath}`);
      return true;
    } else {
      console.log(`- 无需排序: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ 处理文件失败 ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 主函数：查找并处理所有package.json文件
 */
function main() {
  console.log('��� 正在查找package.json文件...');

  // 查找所有package.json文件
  const packageJsonFiles = glob.sync('**/package.json', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  });

  if (packageJsonFiles.length === 0) {
    console.log('未找到package.json文件');
    return;
  }

  console.log(`��� 找到 ${packageJsonFiles.length} 个package.json文件`);

  let processedCount = 0;
  let changedCount = 0;

  for (const filePath of packageJsonFiles) {
    const hasChanges = sortPackageJsonDependencies(filePath);
    processedCount++;
    if (hasChanges) {
      changedCount++;
    }
  }

  console.log(`\n��� 处理完成！`);
  console.log(`   处理文件: ${processedCount}`);
  console.log(`   已更新: ${changedCount}`);
  console.log(`   无需更新: ${processedCount - changedCount}`);
}

// 运行主函数
main();
