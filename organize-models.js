#!/usr/bin/env node

/**
 * 鸟类组件模型文件组织工具
 * 帮助将散乱的GLB文件组织到正确的部位文件夹中
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const COMPONENTS_DIR = 'public/models/bird_components';

// 部位类型映射
const PART_TYPES = {
  head: ['head', '头部', '头', '脑袋', 'brain', 'skull'],
  chest: ['chest', '胸部', '胸', '身体', 'body', 'torso', '躯干'],
  belly: ['belly', '腹部', '腹', '肚子', 'abdomen', 'stomach'],
  wing: ['wing', '翅膀', '翼', '翅', 'feather', '羽毛'],
  tail: ['tail', '尾巴', '尾', '尾部'],
  foot: ['foot', '足', '脚', '爪', 'feet', 'paw', 'leg', '腿']
};

function detectPartType(fileName) {
  const lowerFileName = fileName.toLowerCase();

  for (const [partType, keywords] of Object.entries(PART_TYPES)) {
    for (const keyword of keywords) {
      if (lowerFileName.includes(keyword)) {
        return partType;
      }
    }
  }

  return null;
}

async function promptPartType(fileName) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log(`\n文件: ${fileName}`);
    console.log('请选择部位类型:');
    console.log('1. head (头部)');
    console.log('2. chest (胸部)');
    console.log('3. belly (腹部)');
    console.log('4. wing (翅膀)');
    console.log('5. tail (尾巴)');
    console.log('6. foot (足部)');
    console.log('7. skip (跳过)');

    rl.question('请输入选择 (1-7): ', (answer) => {
      rl.close();
      const choice = answer.trim();
      switch (choice) {
        case '1': resolve('head'); break;
        case '2': resolve('chest'); break;
        case '3': resolve('belly'); break;
        case '4': resolve('wing'); break;
        case '5': resolve('tail'); break;
        case '6': resolve('foot'); break;
        default: resolve('skip'); break;
      }
    });
  });
}

async function organizeFiles() {
  console.log('🗂️  鸟类组件模型文件组织工具');
  console.log('================================\n');

  // 确保部位文件夹存在
  const parts = Object.keys(PART_TYPES);
  for (const part of parts) {
    const folderPath = path.join(COMPONENTS_DIR, part);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 创建文件夹: ${part}/`);
    }
  }

  // 扫描根目录中的GLB文件
  const rootFiles = [];
  if (fs.existsSync(COMPONENTS_DIR)) {
    const items = fs.readdirSync(COMPONENTS_DIR);
    for (const item of items) {
      const itemPath = path.join(COMPONENTS_DIR, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile() && item.toLowerCase().endsWith('.glb')) {
        rootFiles.push(item);
      }
    }
  }

  if (rootFiles.length === 0) {
    console.log('✅ 根目录中没有需要组织的GLB文件');
    console.log('\n📋 当前文件夹结构:');
    showCurrentStructure();
    return;
  }

  console.log(`📂 找到 ${rootFiles.length} 个需要组织的GLB文件:\n`);

  // 处理每个文件
  for (const fileName of rootFiles) {
    const baseName = fileName.replace('.glb', '');
    let partType = detectPartType(baseName);

    // 如果无法自动识别，让用户选择
    if (!partType) {
      console.log(`\n⚠️  无法自动识别: ${fileName}`);
      partType = await promptPartType(fileName);

      if (partType === 'skip') {
        console.log(`⏭️  跳过: ${fileName}`);
        continue;
      }
    }

    // 移动文件到对应文件夹
    const sourcePath = path.join(COMPONENTS_DIR, fileName);
    const targetDir = path.join(COMPONENTS_DIR, partType);
    const targetPath = path.join(targetDir, fileName);

    try {
      fs.renameSync(sourcePath, targetPath);
      console.log(`✅ ${fileName} → ${partType}/${fileName}`);
    } catch (error) {
      console.error(`❌ 移动失败 ${fileName}:`, error.message);
    }
  }

  console.log('\n🎯 文件组织完成！');
  console.log('\n📋 最终文件夹结构:');
  showCurrentStructure();
}

function showCurrentStructure() {
  const parts = Object.keys(PART_TYPES);

  parts.forEach(part => {
    const folderPath = path.join(COMPONENTS_DIR, part);
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.glb'));
      console.log(`  ${part}/ (${files.length} files):`);
      files.forEach(file => console.log(`    - ${file}`));
    } else {
      console.log(`  ${part}/ (0 files)`);
    }
  });
}

// 运行组织工具
if (require.main === module) {
  organizeFiles().catch(console.error);
}

module.exports = {
  organizeFiles,
  detectPartType,
  PART_TYPES
};