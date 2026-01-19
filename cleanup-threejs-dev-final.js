const fs = require('fs');
const path = require('path');

// 真正被项目使用的three.js-dev文件
const essentialFiles = [
    // 核心构建文件
    'build/three.module.js',

    // 控制器（whitebox.html使用）
    'examples/jsm/controls/OrbitControls.js',

    // JSM模块目录结构（保留目录但清理内容）
    'examples/jsm/',
];

// 递归删除目录内容
function removeDirectoryContents(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            removeDirectoryContents(itemPath);
            try {
                fs.rmdirSync(itemPath);
            } catch (error) {
                console.log(`⚠️  无法删除子目录: ${path.relative('three.js-dev', itemPath)}`);
            }
        } else {
            try {
                fs.unlinkSync(itemPath);
                console.log(`🗑️  删除文件: ${path.relative('three.js-dev', itemPath)}`);
            } catch (error) {
                console.log(`⚠️  无法删除文件: ${path.relative('three.js-dev', itemPath)}`);
            }
        }
    });
}

// 安全删除文件或目录
function safeDelete(itemPath) {
    if (!fs.existsSync(itemPath)) return;

    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
        // 对于目录，我们只删除空目录
        try {
            const items = fs.readdirSync(itemPath);
            if (items.length === 0) {
                fs.rmdirSync(itemPath);
                console.log(`🗂️  删除空目录: ${path.relative('three.js-dev', itemPath)}`);
            } else {
                console.log(`⚠️  跳过非空目录: ${path.relative('three.js-dev', itemPath)} (${items.length} 项)`);
            }
        } catch (error) {
            console.log(`⚠️  无法读取目录: ${path.relative('three.js-dev', itemPath)}`);
        }
    } else {
        try {
            fs.unlinkSync(itemPath);
            console.log(`🗑️  删除文件: ${path.relative('three.js-dev', itemPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } catch (error) {
            console.log(`⚠️  无法删除文件: ${path.relative('three.js-dev', itemPath)}`);
        }
    }
}

// 检查文件是否应该保留
function shouldKeepFile(filePath) {
    const relativePath = path.relative('three.js-dev', filePath).replace(/\\/g, '/');

    // 保留基础文件
    if (relativePath === 'package.json' ||
        relativePath === 'README.md' ||
        relativePath === 'LICENSE') {
        return true;
    }

    // 保留build目录下的所有文件（whitebox.html需要three.module.js）
    if (relativePath.startsWith('build/')) {
        return true;
    }

    // 保留examples/jsm/controls/OrbitControls.js
    if (relativePath === 'examples/jsm/controls/OrbitControls.js') {
        return true;
    }

    return false;
}

// 主函数
function main() {
    const threeJsDevDir = './three.js-dev';

    console.log('🧹 最终清理three.js-dev文件夹...\n');

    if (!fs.existsSync(threeJsDevDir)) {
        console.log('❌ three.js-dev文件夹不存在');
        return;
    }

    // 显示清理前的统计
    function getStats(dirPath) {
        let files = 0;
        let size = 0;

        if (!fs.existsSync(dirPath)) return { files, size };

        function calcStats(itemPath) {
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                const items = fs.readdirSync(itemPath);
                items.forEach(item => calcStats(path.join(itemPath, item)));
            } else {
                files++;
                size += stats.size;
            }
        }

        calcStats(dirPath);
        return { files, size };
    }

    const beforeStats = getStats(threeJsDevDir);
    console.log(`📊 清理前: ${beforeStats.files} 个文件, ${(beforeStats.size / 1024 / 1024).toFixed(2)} MB\n`);

    console.log('✅ 保留的文件:');
    essentialFiles.forEach(file => {
        console.log(`   📄 ${file}`);
    });
    console.log('   📄 package.json, README.md, LICENSE\n');

    // 获取根目录的所有项目
    const rootItems = fs.readdirSync(threeJsDevDir);

    console.log('🔍 删除未使用的文件...');
    for (const item of rootItems) {
        const itemPath = path.join(threeJsDevDir, item);

        if (!shouldKeepFile(itemPath)) {
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // 对于大目录，我们需要递归删除内容然后删除目录
                const dirStats = getStats(itemPath);
                console.log(`🗂️  删除目录: ${item}/ (${dirStats.files} 个文件, ${(dirStats.size / 1024 / 1024).toFixed(2)} MB)`);

                // 递归删除目录内容
                removeDirectoryContents(itemPath);

                // 尝试删除目录
                try {
                    fs.rmdirSync(itemPath);
                    console.log(`✅ 目录已删除: ${item}/`);
                } catch (error) {
                    console.log(`⚠️  无法删除目录: ${item}/ - ${error.message}`);
                }
            } else {
                safeDelete(itemPath);
            }
        } else {
            console.log(`✅ 保留: ${item}`);
        }
    }

    // 显示清理结果
    const afterStats = getStats(threeJsDevDir);
    const savedSize = beforeStats.size - afterStats.size;
    const compressionRatio = (savedSize / beforeStats.size * 100).toFixed(1);

    console.log('\n📊 最终清理结果:');
    console.log(`📁 清理前: ${beforeStats.files} 个文件, ${(beforeStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 清理后: ${afterStats.files} 个文件, ${(afterStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`💾 释放空间: ${(savedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 压缩率: ${compressionRatio}%`);

    console.log('\n🎯 保留的核心文件:');
    console.log('   • build/three.module.js - Three.js核心模块');
    console.log('   • examples/jsm/controls/OrbitControls.js - 相机控制器');
    console.log('   • 基础文档文件');

    console.log('\n✅ three.js-dev最终清理完成！');
    console.log('🎉 项目现在只保留真正需要的Three.js文件！');
}

// 运行主函数
main().catch(console.error);