import * as THREE from 'three';
import { GLTFLoader } from '../loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../loaders/meshopt_decoder.module.js';

/**
 * GLB/GLTF模型加载器 - 支持Meshopt压缩
 */
class GLBModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map(); // 缓存已加载的模型
    // 设置基础路径为public目录
    this.basePath = '/';

    // 配置MeshoptDecoder以支持压缩后的GLB文件
    this.loader.setMeshoptDecoder(MeshoptDecoder);
    console.log('✅ GLB加载器已配置MeshoptDecoder，支持压缩文件');
  }

  /**
   * 异步加载GLB模型
   * @param {string} path - 模型路径
   * @returns {Promise<THREE.Group>} 加载的模型组
   */
  async loadModel(path) {
    // 检查缓存
    if (this.cache.has(path)) {
      return this.cache.get(path).clone();
    }

    try {
      // 确保路径以/开头，相对于public目录
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      console.log(`Loading GLB model: ${fullPath}`);

      const gltf = await this.loader.loadAsync(fullPath);
      const model = gltf.scene;

      console.log(`Successfully loaded GLB model: ${path}`);

      // 预处理模型
      this.preprocessModel(model);

      // 缓存模型
      this.cache.set(path, model.clone());

      return model;
    } catch (error) {
      console.error(`Failed to load GLB model: ${path}`, error);
      return null;
    }
  }

  /**
   * 预处理加载的模型
   * @param {THREE.Group} model - 加载的模型
   */
  preprocessModel(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        // 确保材质是MeshStandardMaterial
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.convertToStandardMaterial(mat));
          } else {
            this.convertToStandardMaterial(child.material);
          }
        }

        // 设置阴影
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 居中模型
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
  }

  /**
   * 将材质转换为MeshStandardMaterial
   * @param {THREE.Material} material - 原始材质
   */
  convertToStandardMaterial(material) {
    if (!(material instanceof THREE.MeshStandardMaterial)) {
      const newMaterial = new THREE.MeshStandardMaterial();

      // 复制基本属性
      if (material.color) newMaterial.color.copy(material.color);
      if (material.map) newMaterial.map = material.map;
      if (material.normalMap) newMaterial.normalMap = material.normalMap;
      if (material.roughnessMap) newMaterial.roughnessMap = material.roughnessMap;
      if (material.metalnessMap) newMaterial.metalnessMap = material.metalnessMap;

      // 设置默认值
      newMaterial.roughness = material.roughness !== undefined ? material.roughness : 0.5;
      newMaterial.metalness = material.metalness !== undefined ? material.metalness : 0.0;
      newMaterial.transparent = material.transparent || false;
      newMaterial.opacity = material.opacity !== undefined ? material.opacity : 1.0;

      material = newMaterial;
    }

    // 确保flatShading设置
    material.flatShading = true;
  }

  /**
   * 批量预加载模型
   * @param {string[]} paths - 模型路径数组
   */
  async preloadModels(paths) {
    const promises = paths.map(path => this.loadModel(path));
    await Promise.all(promises);
    console.log(`Preloaded ${paths.length} GLB models`);
  }
}

// 创建全局实例
export const glbLoader = new GLBModelLoader();
export default glbLoader;