const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 需要压缩的组件文件夹（剩余的4个文件夹）
const componentDirs = ['foot', 'head', 'tail', 'wing'];

const modelsDir = './public/models';

// 检查gltf-transform是否安装
try {
    execSync('gltf-transform --version', { stdio: 'pipe' });
    console.log('✅ gltf-transform 已安装');
} catch (error) {
    console.error('❌ gltf-transform 未安装，请先运行: npm install -g @gltf-transform/cli');
    process.exit(1);
}

// 简化：直接检查文件大小，大于1MB就压缩
function shouldCompress(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size > 1024 * 1024; // 大于1MB
    } catch (error) {
        console.log(`⚠️  无法检查文件: ${path.basename(filePath)}`);
        return false;
    }
}

// 获取所有大于1MB的GLB文件（直接检查大小）
function getLargeGlbFiles() {
    const largeFiles = [];

    componentDirs.forEach(component => {
        const componentPath = path.join(modelsDir, 'bird_components', component);

        if (!fs.existsSync(componentPath)) {
            console.log(`⚠️ 组件文件夹不存在: ${component}`);
            return;
        }

        try {
            const files = fs.readdirSync(componentPath)
                .filter(file => file.endsWith('.glb'))
                .map(file => {
                    const filePath = path.join(componentPath, file);
                    const stats = fs.statSync(filePath);
                    return {
                        path: filePath,
                        size: stats.size,
                        name: file,
                        component: component
                    };
                })
                .filter(file => file.size > 1024 * 1024); // 大于1MB

            if (files.length > 0) {
                console.log(`📁 ${component}: 发现 ${files.length} 个大文件需要压缩`);
                largeFiles.push(...files);
            } else {
                console.log(`✅ ${component}: 没有需要压缩的大文件`);
            }

        } catch (error) {
            console.error(`❌ 读取文件夹失败 ${component}:`, error.message);
        }
    });

    return largeFiles;
}

// 使用gltf-transform优化单个GLB文件
function optimizeGlbFile(inputPath, componentName) {
    const outputPath = inputPath.replace('.glb', '_optimized.glb');
    const originalSize = fs.statSync(inputPath).size;

    console.log(`\n🔄 开始优化: ${componentName}/${path.basename(inputPath)} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);

    try {
        // 使用gltf-transform进行综合优化
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

        // 替换原文件
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath, inputPath);
        console.log(`   💾 文件已更新，替换原文件`);

        return { originalSize, optimizedSize, success: true };

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
    console.log('\n🚀 开始压缩所有大文件 (>1MB)...\n');
    console.log('🎯 优化策略:');
    console.log('   • 直接检查文件大小');
    console.log('   • 仅处理>1MB的文件');
    console.log('   • WebP纹理压缩');
    console.log('   • 网格简化50%');
    console.log('   • Meshopt压缩');
    console.log('');

    // 获取需要压缩的文件
    const largeFiles = getLargeGlbFiles();
    console.log(`\n📁 总共发现 ${largeFiles.length} 个未压缩的大文件需要处理\n`);

    if (largeFiles.length === 0) {
        console.log('🎉 所有大文件都已经被压缩过了！');
        return;
    }

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let successCount = 0;

    // 逐个优化文件
    for (let i = 0; i < largeFiles.length; i++) {
        const file = largeFiles[i];
        const result = optimizeGlbFile(file.path, file.component);
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;
        if (result.success) successCount++;
    }

    // 输出统计信息
    console.log('\n📊 优化统计:');
    console.log(`✅ 成功优化: ${successCount}/${largeFiles.length} 个文件`);
    console.log(`📦 原始总大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📦 优化后总大小: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);

    if (totalOriginalSize > 0) {
        const totalCompressionRatio = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
        const savedSpace = ((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2);
        console.log(`💾 节省空间: ${savedSpace} MB (${totalCompressionRatio}%)`);
        console.log(`📈 平均压缩率: ${totalCompressionRatio}%`);
    }

    console.log('\n🎉 大文件优化完成!');

    // Three.js使用说明
    console.log('\n📚 Three.js 使用说明:');
    console.log('优化后的GLB文件包含Meshopt压缩，需要配置MeshoptDecoder:');
    console.log('');
    console.log('import { GLTFLoader } from \'three/addons/loaders/GLTFLoader.js\';');
    console.log('import { MeshoptDecoder } from \'three/addons/libs/meshopt_decoder.module.js\';');
    console.log('');
    console.log('const loader = new GLTFLoader();');
    console.log('loader.setMeshoptDecoder(MeshoptDecoder);');
    console.log('');
    console.log('loader.load(\'compressed-model.glb\', (gltf) => {');
    console.log('    scene.add(gltf.scene);');
    console.log('});');
}

// 运行主函数
main().catch(console.error);