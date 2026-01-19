import glbLoader from './glbLoader.js';

/**
 * 鸟类身体部位组件库
 */
class BirdComponentLibrary {
  constructor() {
    this.components = {
      head: [],
      chest: [],
      belly: [],
      wing: [],
      tail: [],
      foot: []
    };

    this.basePath = '/models/bird_components/';
    this.loaded = false;
  }

  /**
   * 初始化组件库（异步加载所有模型）
   */
  async initialize() {
    if (this.loaded) return;

    // 定义部位到文件夹的映射
    const partFolders = {
      head: 'head',
      chest: 'chest',
      belly: 'belly',
      wing: 'wing',
      tail: 'tail',
      foot: 'foot'
    };

    // 为每个部位扫描其文件夹
    for (const [partType, folderName] of Object.entries(partFolders)) {
      const folderPath = `${this.basePath}${folderName}/`;

      try {
        // 扫描文件夹中的所有GLB文件
        const files = await this.scanFolderForGLB(folderPath);

        // 加载每个文件
        for (const fileName of files) {
          const fullPath = `${folderPath}${fileName}`;
          try {
            const model = await glbLoader.loadModel(fullPath);
            if (model) {
              this.components[partType].push({
                model: model,
                path: fullPath,
                id: `${folderName}_${fileName.replace('.glb', '')}`,
                fileName: fileName,
                partType: partType
              });
            }
          } catch (error) {
            console.error(`Failed to load model ${fullPath}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Failed to scan folder ${folderPath}:`, error);
      }
    }

    this.loaded = true;

    console.log('Bird component library initialized (folder-based):', {
      head: this.components.head.length,
      chest: this.components.chest.length,
      belly: this.components.belly.length,
      wing: this.components.wing.length,
      tail: this.components.tail.length,
      foot: this.components.foot.length
    });

    // 显示每个部位的文件详情
    for (const [partType, components] of Object.entries(this.components)) {
      if (components.length > 0) {
        console.log(`${partType}:`, components.map(c => c.fileName));
      } else {
        console.warn(`⚠️  ${partType}: No components found! Check if files exist in ${partType}/ folder`);
      }
    }
  }

  /**
   * 扫描指定文件夹中的所有GLB文件（优先使用压缩文件，支持 part (n).glb 格式）
   * @param {string} folderPath - 文件夹路径
   * @returns {Promise<string[]>} GLB文件名数组
   */
  async scanFolderForGLB(folderPath) {
    try {
      const files = [];

      // 获取当前文件夹的部位名称（从路径中提取）
      const pathParts = folderPath.split('/');
      const partName = pathParts[pathParts.length - 2]; // 例如 'head' 从 'models/bird_components/head/'

      console.log(`🔍 正在扫描文件夹: ${folderPath} (${partName})`);

      // 配置参数
      //const MAX_INDEX = 10; // 最多尝试的文件序号
      const MAX_INDEX = 500; // 最多尝试的文件序号
      const CONSECUTIVE_MISS_LIMIT = 10; // 连续失败次数上限
      const CONCURRENT_LOADS = 50; // 并发加载数量限制

      let consecutiveMisses = 0;
      let activeLoads = 0;
      const loadPromises = [];

      // 从1开始尝试加载 part (1).glb, part (2).glb, ... (优先使用压缩文件)
      for (let i = 1; i <= MAX_INDEX && consecutiveMisses < CONSECUTIVE_MISS_LIMIT; i++) {
        // 直接使用原始文件名（压缩后文件替换了原文件）
        const fileName = `${partName} (${i}).glb`;
        const fullPath = `${folderPath}${fileName}`;

        // 等待并发槽位
        while (activeLoads >= CONCURRENT_LOADS) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        activeLoads++;
        console.log(`🔗 尝试加载: ${fileName}`);

        const loadPromise = glbLoader.loadModel(fullPath)
          .then(model => {
            if (model) {
              files.push(fileName);
              consecutiveMisses = 0; // 重置连续失败计数
              console.log(`✅ 成功加载: ${fileName}`);
            }
          })
          .catch(error => {
            consecutiveMisses++;
            console.log(`❌ 加载失败: ${fileName} (连续失败: ${consecutiveMisses})`);
          })
          .finally(() => {
            activeLoads--;
          });

        loadPromises.push(loadPromise);

        // 如果并发已满，等待一个完成
        if (activeLoads >= CONCURRENT_LOADS) {
          await Promise.race(loadPromises.filter(p => p !== loadPromise));
        }
      }

      // 等待所有加载完成
      await Promise.all(loadPromises);

      console.log(`🎯 ${partName} 扫描完成: 找到 ${files.length} 个可用文件:`, files);
      return files;
    } catch (error) {
      console.error(`Failed to scan folder ${folderPath}:`, error);
      return [];
    }
  }

  /**
   * 扫描bird_components文件夹中的所有GLB文件（兼容旧版本）
   */
  async scanGLBFiles() {
    try {
      const files = [];
      const maxFiles = 5000; // 最多扫描100个文件

      // 首先尝试扫描已知的文件名模式
      const knownPatterns = [
        'head', 'chest', 'belly', 'wing', 'tail', 'foot',
        '头部', '胸部', '腹部', '翅膀', '尾巴', '足部'
      ];

      for (const pattern of knownPatterns) {
        for (let i = 1; i <= 20; i++) {
          const fileName = `${pattern}_${i.toString().padStart(2, '0')}.glb`;
          try {
            const response = await fetch(`${this.basePath}${fileName}`, { method: 'HEAD' });
            if (response.ok && !files.includes(fileName)) {
              files.push(fileName);
            }
          } catch (e) {
            // 文件不存在
          }
        }
      }

      // 如果没找到标准文件，扫描所有可能的GLB文件
      if (files.length === 0) {
        for (let i = 1; i <= maxFiles; i++) {
          // 尝试各种可能的命名模式
          const possibleNames = [
            `Mesh-texture_${i.toString().padStart(5, '0')}_.glb`,
            `model_${i}.glb`,
            `part_${i}.glb`,
            `component_${i}.glb`,
            `${i}.glb`,
            `bird_part_${i}.glb`
          ];

          for (const fileName of possibleNames) {
            try {
              const response = await fetch(`${this.basePath}${fileName}`, { method: 'HEAD' });
              if (response.ok && !files.includes(fileName)) {
                files.push(fileName);
                break; // 找到一个就停止尝试其他命名
              }
            } catch (e) {
              // 文件不存在
            }
          }
        }
      }

      // 最后尝试通配符扫描（如果上面的都没找到）
      if (files.length === 0) {
        console.log('未找到标准命名的GLB文件，尝试扫描所有文件...');
        // 这里可以添加更宽泛的扫描逻辑
      }

      return files;
    } catch (error) {
      console.error('Failed to scan GLB files:', error);
      return [];
    }
  }

  /**
   * 获取随机组件
   * @param {string} type - 组件类型
   * @returns {Object|null} 组件对象 {model, path, id, fileName}
   */
  getRandomComponent(type) {
    const components = this.components[type];
    if (!components || components.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * components.length);
    const component = components[randomIndex];

    // 返回克隆的模型以避免共享引用
    return {
      model: component.model.clone(),
      path: component.path,
      id: component.id,
      fileName: component.fileName
    };
  }

  /**
   * 获取指定ID的组件
   * @param {string} type - 组件类型
   * @param {string} id - 组件ID
   * @returns {Object|null} 组件对象
   */
  getComponent(type, id) {
    const components = this.components[type];
    if (!components) return null;

    return components.find(comp => comp.id === id) || null;
  }

  /**
   * 获取所有可用组件
   * @param {string} type - 组件类型
   * @returns {Array} 组件数组
   */
  getAllComponents(type) {
    return this.components[type] || [];
  }

  /**
   * 检查组件库是否已加载
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * 获取组件统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {};
    for (const [type, components] of Object.entries(this.components)) {
      stats[type] = components.length;
    }
    return stats;
  }
}

// 创建全局实例
export const birdComponentLibrary = new BirdComponentLibrary();
export default birdComponentLibrary;