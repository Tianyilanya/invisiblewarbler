#!/usr/bin/env node

/**
 * 鸟类组件模型文件组织工具 (已废弃)
 *
 * 注意：从 v2.0 开始，系统使用文件夹组织方式，不再需要重命名工具。
 * 请将模型文件放入对应的部位文件夹中：
 * - head/ (头部)
 * - chest/ (胸部)
 * - belly/ (腹部)
 * - wing/ (翅膀)
 * - tail/ (尾巴)
 * - foot/ (足部)
 *
 * 文件名可以任意命名，系统会自动识别。
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = 'public/models/bird_components';

// 定义关键词映射到标准名称
const KEYWORD_MAPPINGS = {
  // 头部关键词
  head: ['head', '头部', '头', '脑袋', 'brain', 'skull'],
  // 胸部关键词
  chest: ['chest', '胸部', '胸', '身体', 'body', 'torso', '躯干'],
  // 腹部关键词
  belly: ['belly', '腹部', '腹', '肚子', 'abdomen', 'stomach'],
  // 翅膀关键词
  wing: ['wing', '翅膀', '翼', '翅', 'feather', '羽毛'],
  // 尾巴关键词
  tail: ['tail', '尾巴', '尾', '尾部'],
  // 足部关键词
  foot: ['foot', '足', '脚', '爪', 'feet', 'paw', 'leg', '腿']
};

// 手动映射表（对于无法自动识别的文件）
const MANUAL_MAPPING = {
  'Mesh-texture_00001_': 'head',   // 假设第一个是头部
  'Mesh-texture_00002_': 'chest',  // 第二个是胸部
  'Mesh-texture_00003_': 'belly',  // 第三个是腹部
  'Mesh-texture_00004_': 'wing',   // 第四个是翅膀
  'Mesh-texture_00005_': 'wing',   // 第五个也是翅膀
  'Mesh-texture_00006_': 'tail',   // 第六个是尾巴
  'Mesh-texture_00007_': 'foot',   // 第七个是足部
  'Mesh-texture_00008_': 'foot',   // 第八个也是足部
  'Mesh-texture_00009_': 'head',   // 第九个是头部变体
  'Mesh-texture_00010_': 'chest'   // 第十个是胸部变体
};

/**
 * 扫描目录中的所有GLB文件
 */
function scanGLBFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    console.log(`目录 ${dir} 不存在`);
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 递归扫描子目录
      files.push(...scanGLBFiles(fullPath));
    } else if (item.toLowerCase().endsWith('.glb')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 根据文件名判断组件类型
 */
function detectComponentType(fileName) {
  // 先检查手动映射表
  if (MANUAL_MAPPING[fileName]) {
    return MANUAL_MAPPING[fileName];
  }

  // 再检查关键词映射
  const lowerFileName = fileName.toLowerCase();

  for (const [componentType, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
    for (const keyword of keywords) {
      if (lowerFileName.includes(keyword)) {
        return componentType;
      }
    }
  }

  return null;
}

/**
 * 交互式组件类型选择
 */
function promptComponentType(fileName) {
  console.log(`\n文件: ${fileName}`);
  console.log('请选择组件类型:');
  console.log('1. head (头部)');
  console.log('2. chest (胸部)');
  console.log('3. belly (腹部)');
  console.log('4. wing (翅膀)');
  console.log('5. tail (尾巴)');
  console.log('6. foot (足部)');
  console.log('7. skip (跳过)');

  return new Promise((resolve) => {
    process.stdout.write('请输入选择 (1-7): ');
    process.stdin.once('data', (input) => {
      const choice = input.toString().trim();
      switch (choice) {
        case '1': resolve('head'); break;
        case '2': resolve('chest'); break;
        case '3': resolve('belly'); break;
        case '4': resolve('wing'); break;
        case '5': resolve('tail'); break;
        case '6': resolve('foot'); break;
        case '7': resolve('skip'); break;
        default: resolve('skip'); break;
      }
    });
  });
}

/**
 * 生成新的文件名
 */
function generateNewFileName(componentType, index) {
  return `${componentType}_${index.toString().padStart(2, '0')}.glb`;
}

/**
 * 重命名文件
 */
function renameFile(oldPath, newPath) {
  try {
    fs.renameSync(oldPath, newPath);
    console.log(`✓ ${path.basename(oldPath)} -> ${path.basename(newPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ 重命名失败 ${oldPath}: ${error.message}`);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🦅 鸟类组件模型文件重命名工具');
  console.log('================================\n');

  // 扫描所有GLB文件
  const glbFiles = scanGLBFiles(COMPONENTS_DIR);

  if (glbFiles.length === 0) {
    console.log(`在 ${COMPONENTS_DIR} 中没有找到GLB文件`);
    return;
  }

  console.log(`找到 ${glbFiles.length} 个GLB文件:\n`);

  // 按组件类型分组
  const groupedFiles = {};

  for (const filePath of glbFiles) {
    const fileName = path.basename(filePath, '.glb');
    let componentType = detectComponentType(fileName);

    // 如果无法自动识别，让用户手动选择
    if (!componentType) {
      console.log(`\n⚠ 无法自动识别组件类型: ${fileName}`);
      componentType = await promptComponentType(fileName);

      if (componentType === 'skip') {
        console.log(`⏭ 跳过文件: ${fileName}`);
        continue;
      }
    }

    if (!groupedFiles[componentType]) {
      groupedFiles[componentType] = [];
    }
    groupedFiles[componentType].push({
      path: filePath,
      name: fileName,
      type: componentType
    });
  }

  // 显示分组结果
  console.log('\n📁 文件分组结果:');
  for (const [componentType, files] of Object.entries(groupedFiles)) {
    console.log(`  ${componentType}: ${files.length} 个文件`);
    files.forEach(file => {
      console.log(`    - ${file.name}`);
    });
  }

  // 询问用户是否继续
  console.log('\n❓ 是否要重命名这些文件？(y/N)');
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (input) => {
    const answer = input.trim().toLowerCase();

    if (answer === 'y' || answer === 'yes') {
      console.log('\n🔄 开始重命名...\n');

      // 执行重命名
      const renameCount = {};

      for (const [componentType, files] of Object.entries(groupedFiles)) {
        if (!renameCount[componentType]) {
          renameCount[componentType] = 0;
        }

        for (const file of files) {
          const newIndex = ++renameCount[componentType];
          const newFileName = generateNewFileName(componentType, newIndex);
          const newPath = path.join(COMPONENTS_DIR, newFileName);

          renameFile(file.path, newPath);
        }
      }

      console.log('\n✅ 重命名完成！');
      console.log('\n📊 统计结果:');
      for (const [componentType, count] of Object.entries(renameCount)) {
        console.log(`  ${componentType}: ${count} 个文件`);
      }

    } else {
      console.log('取消重命名操作');
    }

    process.exit(0);
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  scanGLBFiles,
  detectComponentType,
  generateNewFileName
};