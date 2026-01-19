const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 指定要优化的文件列表（可以根据需要修改）
const selectedFiles = [
    'public/models/bird_components/belly/belly (2).glb',
    'public/models/bird_components/belly/belly (3).glb',
    'public/models/bird_components/belly/belly (4).glb',
    'public/models/bird_components/belly/belly (5).glb',
    'public/models/bird_components/belly/belly (6).glb',
    'public/models/bird_components/belly/belly (7).glb',
    'public/models/bird_components/belly/belly (8).glb',
    'public/models/bird_components/belly/belly (9).glb',
    'public/models/bird_components/chest/chest (1).glb',
    'public/models/bird_components/chest/chest (2).glb',
    'public/models/bird_components/chest/chest (3).glb',
    'public/models/bird_components/chest/chest (4).glb',
    'public/models/bird_components/chest/chest (5).glb',
    'public/models/bird_components/chest/chest (6).glb',
    'public/models/bird_components/chest/chest (7).glb',
    'public/models/bird_components/chest/chest (8).glb',
    'public/models/bird_components/chest/chest (9).glb',
    'public/models/bird_components/chest/chest (10).glb'
];

// 检查gltf-transform是否安装
try {
    execSync('gltf-transform --version', { stdio: 'pipe' });
    console.log('✅ gltf-transform 已安装');
} catch (error) {
    console.error('❌ gltf-transform 未安装，请先运行: npm install -g @gltf-transform/cli');
    process.exit(1);
}

// 检查文件是否存在并获取大小信息
console.log('\n📁 检查文件状态:');
let totalFiles = 0;
let totalSize = 0;
selectedFiles.forEach(file => {
    try {
        const stats = fs.statSync(file);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ ${path.basename(file)}: ${sizeMB} MB`);
        totalFiles++;
        totalSize += stats.size;
    } catch (error) {
        console.log(`❌ ${path.basename(file)}: 文件不存在`);
    }
});
console.log(`\n📊 总计: ${totalFiles} 个文件, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// 使用gltf-transform优化单个GLB文件
function optimizeGlbFile(inputPath) {
    const outputPath = inputPath.replace('.glb', '_optimized.glb');
    const originalSize = fs.statSync(inputPath).size;

    console.log(`\n🔄 开始优化: ${path.basename(inputPath)} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);

    try {
        // 使用gltf-transform进行综合优化
        // --texture-compress webp: 将纹理转换为WebP格式
        // --simplify 0.5: 将模型面数减半
        // --compress meshopt: 使用Meshopt压缩
        const command = `gltf-transform optimize "${inputPath}" "${outputPath}" --texture-compress webp --simplify 0.5 --compress meshopt --verbose`;

        console.log(`   🛠️  执行命令: ${command}`);
        execSync(command, { stdio: 'inherit' }); // 使用inherit显示详细输出

        // 获取优化后的文件大小
        const optimizedSize = fs.statSync(outputPath).size;
        const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

        console.log(`   📊 优化结果: ${compressionRatio}% 压缩率`);
        console.log(`   📏 原始大小: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📏 优化后: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   💾 节省空间: ${((originalSize - optimizedSize) / 1024).toFixed(0)} KB`);

        // 只有在优化有意义时才替换原文件（节省至少5KB空间）
        if (originalSize - optimizedSize > 5 * 1024) {
            fs.unlinkSync(inputPath);
            fs.renameSync(outputPath, inputPath);
            console.log(`   💾 文件已更新，替换原文件`);
            return { originalSize, optimizedSize, success: true };
        } else {
            fs.unlinkSync(outputPath); // 删除临时文件
            console.log(`   📋 优化效果不明显，保留原文件`);
            return { originalSize, optimizedSize: originalSize, success: false };
        }

    } catch (error) {
        console.error(`   ❌ 优化失败: ${error.message}`);

        // 清理失败的输出文件
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        return { originalSize, optimizedSize: originalSize, success: false };
    }
}

// 主函数
async function main() {
    console.log('\n🚀 开始使用gltf-transform优化GLB模型文件...\n');
    console.log('🎯 优化策略:');
    console.log('   • 纹理压缩: WebP格式');
    console.log('   • 网格简化: 面数减半 (50%)');
    console.log('   • 通用压缩: 已启用');
    console.log('');

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let successCount = 0;

    // 逐个优化文件
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        if (!fs.existsSync(file)) {
            console.log(`⏭️  跳过: ${path.basename(file)} (文件不存在)`);
            continue;
        }

        const result = optimizeGlbFile(file);
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;
        if (result.success) successCount++;
    }

    // 输出统计信息
    console.log('\n📊 优化统计:');
    console.log(`✅ 成功优化: ${successCount}/${selectedFiles.length} 个文件`);
    console.log(`📦 原始总大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📦 优化后总大小: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);

    if (totalOriginalSize > 0) {
        const totalCompressionRatio = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
        const savedSpace = ((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2);
        console.log(`💾 节省空间: ${savedSpace} MB (${totalCompressionRatio}%)`);
        console.log(`📈 平均压缩率: ${totalCompressionRatio}%`);
    }

    console.log('\n🎉 GLB文件优化完成!');

    // Three.js使用说明
    console.log('\n📚 Three.js 使用说明:');
    console.log('优化后的GLB文件包含WebP纹理和简化网格，直接使用标准GLTFLoader即可:');
    console.log('');
    console.log('import { GLTFLoader } from \'three/addons/loaders/GLTFLoader.js\';');
    console.log('');
    console.log('const loader = new GLTFLoader();');
    console.log('');
    console.log('// 加载优化后的GLB文件');
    console.log('loader.load(\'optimized-model.glb\', (gltf) => {');
    console.log('    scene.add(gltf.scene);');
    console.log('},');
    console.log('(progress) => console.log(\'加载进度:\', progress),');
    console.log('(error) => console.error(\'加载失败:\', error));');
    console.log('');
    console.log('⚡ 优化效果: 更小的文件大小，更快的加载速度，保持视觉质量。');
}

// 运行主函数
main().catch(console.error);