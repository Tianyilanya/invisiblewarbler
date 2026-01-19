#!/usr/bin/env node

/**
 * GLB文件性能分析工具
 * 分析模型的面数、文件大小等性能指标
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = 'public/models/bird_components';

async function analyzeGLBFiles() {
    console.log('🔍 GLB Performance Analysis Tool');
    console.log('================================\n');

    if (!fs.existsSync(COMPONENTS_DIR)) {
        console.log(`目录 ${COMPONENTS_DIR} 不存在`);
        return;
    }

    // 获取所有GLB文件
    const files = fs.readdirSync(COMPONENTS_DIR)
        .filter(file => file.toLowerCase().endsWith('.glb'))
        .map(file => ({
            name: file,
            path: path.join(COMPONENTS_DIR, file),
            size: fs.statSync(path.join(COMPONENTS_DIR, file)).size
        }));

    if (files.length === 0) {
        console.log('未找到GLB文件');
        return;
    }

    console.log(`📁 找到 ${files.length} 个GLB文件:\n`);

    let totalSize = 0;
    const analysisResults = [];

    for (const file of files) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(3);
        totalSize += file.size;

        console.log(`${file.name}:`);
        console.log(`  📏 文件大小: ${sizeMB} MB`);

        // 估算性能指标
        const estimatedTriangles = estimateTrianglesFromSize(file.size);
        const performanceRating = getPerformanceRating(estimatedTriangles);

        console.log(`  🔺 预估三角形: ~${estimatedTriangles.toLocaleString()}`);
        console.log(`  ⚡ 性能评级: ${performanceRating}`);
        console.log('');

        analysisResults.push({
            name: file.name,
            size: file.size,
            sizeMB: parseFloat(sizeMB),
            estimatedTriangles: estimatedTriangles,
            rating: performanceRating
        });
    }

    // 输出总结报告
    console.log('📊 性能分析总结报告');
    console.log('==================');

    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`📁 总文件数: ${files.length}`);
    console.log(`💾 总大小: ${totalSizeMB} MB`);
    console.log(`📊 平均大小: ${(totalSize / files.length / 1024 / 1024).toFixed(3)} MB/文件`);

    // 统计性能分布
    const ratings = analysisResults.map(r => r.rating);
    const excellent = ratings.filter(r => r.includes('优秀')).length;
    const good = ratings.filter(r => r.includes('良好')).length;
    const warning = ratings.filter(r => r.includes('警告')).length;
    const bad = ratings.filter(r => r.includes('严重')).length;

    console.log('\n🎯 性能分布:');
    console.log(`  ✅ 优秀: ${excellent} 个文件`);
    console.log(`  🟢 良好: ${good} 个文件`);
    console.log(`  🟡 警告: ${warning} 个文件`);
    console.log(`  🔴 严重: ${bad} 个文件`);

    // 总体建议
    console.log('\n💡 优化建议:');

    if (bad > 0) {
        console.log('❌ 发现严重影响性能的文件，建议立即优化或替换');
        console.log('   - 使用Blender的Decimate修改器降低面数');
        console.log('   - 目标面数: 每个组件 < 5000面');
    } else if (warning > files.length * 0.5) {
        console.log('⚠️ 超过一半的文件性能一般，建议优化');
        console.log('   - 考虑降低面数到 2000-5000面');
        console.log('   - 或实现LOD系统');
    } else if (good + excellent > files.length * 0.8) {
        console.log('✅ 大部分文件性能良好，可以接受');
    }

    // 内存使用预估
    const avgTriangles = analysisResults.reduce((sum, r) => sum + r.estimatedTriangles, 0) / files.length;
    const estimatedMemoryMB = (avgTriangles * 0.5) / 1024; // 粗略估算

    console.log(`\n🧠 内存使用预估:`);
    console.log(`  单个模型平均: ~${estimatedMemoryMB.toFixed(1)} MB`);
    console.log(`  同时加载${Math.min(10, files.length)}个: ~${(estimatedMemoryMB * Math.min(10, files.length)).toFixed(1)} MB`);
}

function estimateTrianglesFromSize(fileSize) {
    // 基于经验估算：GLB文件大小与三角形数量的相关性
    // 这是一个粗略的估算，实际可能有差异
    const sizeKB = fileSize / 1024;

    if (sizeKB < 50) return Math.round(sizeKB * 20);      // 小文件：~20 triangles/KB
    if (sizeKB < 200) return Math.round(sizeKB * 15);     // 中等文件：~15 triangles/KB
    if (sizeKB < 1000) return Math.round(sizeKB * 10);    // 大文件：~10 triangles/KB
    return Math.round(sizeKB * 5);                        // 超大文件：~5 triangles/KB
}

function getPerformanceRating(triangleCount) {
    if (triangleCount < 1000) return '✅ 优秀 (高性能)';
    if (triangleCount < 5000) return '🟢 良好 (可接受)';
    if (triangleCount < 20000) return '🟡 警告 (影响性能)';
    if (triangleCount < 50000) return '🔴 严重 (高负载)';
    return '❌ 极度严重 (不推荐)';
}

// 运行分析
analyzeGLBFiles().catch(console.error);