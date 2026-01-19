import * as THREE from 'three';

/**
 * 地面圆环模型加载模块
 * 用于加载和管理地面圆环的自定义模型
 * 模型文件应放在 public/models/ 目录下
 */

/**
 * 地面圆环配置对象
 * @typedef {Object} GroundRingConfig
 * @property {Object|null} customModel - 自定义圆环模型（可选）
 * @property {boolean} showDefaultRings - 是否显示默认圆环（已隐藏色彩，仅用于调试）
 * @property {number} innerRadius - 内圆半径
 * @property {number} outerRadius - 外圆半径
 */

/**
 * 创建地面圆环配置
 * @param {Object} options - 配置选项
 * @param {Object|null} options.customModel - 自定义圆环模型
 *   - 格式1: { innerRing: THREE.Object3D, outerRing: THREE.Object3D } - 分别提供内圆和外圆模型
 *   - 格式2: { model: THREE.Object3D } - 提供单个模型
 *   - 格式3: THREE.Object3D - 直接提供 Object3D
 * @param {boolean} options.showDefaultRings - 是否显示默认圆环（已隐藏色彩，仅用于调试）
 * @param {number} options.innerRadius - 内圆半径（可选，用于默认圆环）
 * @param {number} options.outerRadius - 外圆半径（可选，用于默认圆环）
 * @returns {GroundRingConfig} 配置对象
 */
export function createGroundRingConfig(options = {}) {
  return {
    // 自定义圆环模型（可选）
    // 如果提供，将使用自定义模型替代默认圆环
    // 格式：{ innerRing: THREE.Object3D, outerRing: THREE.Object3D } 或单个模型 { model: THREE.Object3D }
    customModel: options.customModel || null,
    
    // 是否显示默认圆环（已隐藏色彩，仅用于调试）
    showDefaultRings: options.showDefaultRings || false,
    
    // 圆环半径（用于默认圆环）
    innerRadius: options.innerRadius || 0,
    outerRadius: options.outerRadius || 10
  };
}

/**
 * 从模型路径加载地面圆环模型
 * 支持从 public/models/ 目录加载 OBJ、GLTF 等格式的模型
 * @param {string|Array<string>} modelPath - 模型文件路径（相对于 public/ 目录）
 *   如果是数组，第一个为内圆模型，第二个为外圆模型
 * @param {Object} options - 加载选项
 * @param {number} options.innerRadius - 内圆半径（用于缩放）
 * @param {number} options.outerRadius - 外圆半径（用于缩放）
 * @returns {Promise<Object>} 返回 { innerRing, outerRing } 或 { model }
 */
export async function loadGroundRingModel(modelPath, options = {}) {
  // TODO: 实现模型加载逻辑
  // 可以使用 OBJLoader、GLTFLoader 等加载器
  // import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
  // import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  
  // 示例代码（需要根据实际需求实现）：
  // if (Array.isArray(modelPath)) {
  //   const innerRing = await loadModel(modelPath[0]);
  //   const outerRing = await loadModel(modelPath[1]);
  //   return { innerRing, outerRing };
  // } else {
  //   const model = await loadModel(modelPath);
  //   return { model };
  // }
  
  // 目前返回 null，表示未实现
  console.warn('loadGroundRingModel: 模型加载功能待实现，请使用 customModel 直接传入 THREE.Object3D');
  return null;
}

/**
 * 添加地面圆环模型到场景
 * @param {THREE.Scene} scene - Three.js 场景对象
 * @param {GroundRingConfig} config - 地面圆环配置
 * @returns {Array<THREE.Object3D>} 返回添加的模型对象数组
 */
export function addGroundRingModel(scene, config) {
  const addedModels = [];
  
  if (config.customModel) {
    // 使用自定义模型
    if (config.customModel.innerRing && config.customModel.outerRing) {
      // 分别提供内圆和外圆模型
      scene.add(config.customModel.innerRing);
      scene.add(config.customModel.outerRing);
      addedModels.push(config.customModel.innerRing, config.customModel.outerRing);
    } else if (config.customModel.model) {
      // 提供单个模型
      scene.add(config.customModel.model);
      addedModels.push(config.customModel.model);
    } else if (config.customModel instanceof THREE.Object3D) {
      // 直接提供 Object3D
      scene.add(config.customModel);
      addedModels.push(config.customModel);
    }
  } else if (config.showDefaultRings) {
    // 显示默认圆环（无色彩，仅用于调试）
    // 内圆（小圆）- 使用圆形平面
    const innerCircleGeometry = new THREE.CircleGeometry(config.innerRadius, 64);
    const innerCircleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
      side: THREE.DoubleSide,
      visible: false // 完全隐藏
    });
    const innerCircle = new THREE.Mesh(innerCircleGeometry, innerCircleMaterial);
    innerCircle.rotation.x = -Math.PI / 2;
    innerCircle.position.y = 0.01;
    innerCircle.visible = false; // 隐藏
    // scene.add(innerCircle); // 不添加到场景

    // 外圆（大圆）- 使用圆环平面
    const outerRingGeometry = new THREE.RingGeometry(config.innerRadius, config.outerRadius, 64);
    const outerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
      side: THREE.DoubleSide,
      visible: false // 完全隐藏
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.01;
    outerRing.visible = false; // 隐藏
    // scene.add(outerRing); // 不添加到场景
  }
  // 如果都不满足，则不添加任何圆环模型
  
  return addedModels;
}

