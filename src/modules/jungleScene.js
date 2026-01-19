import * as THREE from 'three';
import { meshToPointCloud } from './pointCloudShader';

// ==================== 模型加载接口 ====================
// 后期可以将此函数替换为加载OBJ模型
// 模型文件应放在 public/models/ 目录下
/**
 * 加载单个模型（目前使用随机立方体代替，后期可替换为OBJ加载）
 * @param {string} modelPath - 模型文件路径（目前未使用，预留接口）
 * @returns {THREE.Mesh} 模型Mesh对象
 */
function loadModel(modelPath = null) {
  // TODO: 后期替换为OBJ加载
  // import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
  // const loader = new OBJLoader();
  // const object = await loader.loadAsync(modelPath);
  // return object;
  
  // 目前使用随机立方体代替
  const size = 0.15 + Math.random() * 0.25; // 随机大小
  const geometry = new THREE.BoxGeometry(size, size, size);
  
  // 随机颜色（棕色系，模拟木头/杂物）
  const hue = 20 + Math.random() * 30; // 20-50 棕色范围
  const saturation = 30 + Math.random() * 30; // 30-60%
  const lightness = 15 + Math.random() * 20; // 15-35%
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`),
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * 从模型文件夹中随机选择一个模型路径
 * @param {Array<string>} modelPaths - 可用的模型路径列表
 * @returns {string} 随机选择的模型路径
 */
function getRandomModelPath(modelPaths = []) {
  if (modelPaths.length === 0) {
    return null; // 如果没有模型，返回null使用默认立方体
  }
  return modelPaths[Math.floor(Math.random() * modelPaths.length)];
}

// ==================== 杂物堆生成 ====================
/**
 * 创建单个杂物堆（由多个模型堆叠而成）
 * @param {Object} options - 配置选项
 * @param {number} options.pieceCount - 杂物堆中的模型数量（3-8个）
 * @param {Array<string>} options.modelPaths - 可用的模型路径列表
 * @param {boolean} options.usePointCloud - 是否使用点云渲染
 * @returns {THREE.Group} 杂物堆组
 */
function createDebrisPile(options = {}) {
  const {
    pieceCount = 3 + Math.floor(Math.random() * 6), // 3-8个模型
    modelPaths = [],
    usePointCloud = true
  } = options;
  
  const pile = new THREE.Group();
  const pieces = []; // 存储所有模型，用于碰撞检测和堆叠
  
  // 基础位置（杂物堆的中心）
  const baseX = (Math.random() - 0.5) * 0.3;
  const baseZ = (Math.random() - 0.5) * 0.3;
  let currentHeight = 0;
  
  for (let i = 0; i < pieceCount; i++) {
    // 加载模型（目前是立方体）
    const modelPath = getRandomModelPath(modelPaths);
    const piece = loadModel(modelPath);
    
    // 随机旋转
    piece.rotation.x = (Math.random() - 0.5) * Math.PI * 0.5;
    piece.rotation.y = Math.random() * Math.PI * 2;
    piece.rotation.z = (Math.random() - 0.5) * Math.PI * 0.3;
    
    // 随机缩放
    const scale = 0.7 + Math.random() * 0.6; // 0.7-1.3倍
    piece.scale.set(scale, scale, scale);
    
    // 计算位置（堆叠逻辑）
    // 获取模型的包围盒
    const box = new THREE.Box3().setFromObject(piece);
    const size = box.getSize(new THREE.Vector3());
    const height = size.y;
    
    // 随机偏移（模拟不规则的堆叠）
    const offsetX = baseX + (Math.random() - 0.5) * 0.4;
    const offsetZ = baseZ + (Math.random() - 0.5) * 0.4;
    
    // 堆叠：每个模型放在前一个的上方
    piece.position.set(
      offsetX,
      currentHeight + height / 2,
      offsetZ
    );
    
    currentHeight += height * 0.7; // 重叠一些，看起来更紧密
    
    // 添加到组
    if (usePointCloud) {
      const piecePoints = meshToPointCloud(piece, {
        pointDensity: 0.6 + Math.random() * 0.2, // 0.6-0.8
        materialOptions: {
          size: 0.08 + Math.random() * 0.06,
          sizeAttenuation: true,
          opacity: 0.75 + Math.random() * 0.2
        }
      });
      
      if (piecePoints) {
        pile.add(piecePoints);
        pieces.push(piecePoints);
      }
    } else {
      pile.add(piece);
      pieces.push(piece);
    }
  }
  
  // 计算整个杂物堆的包围盒，用于定位
  const pileBox = new THREE.Box3().setFromObject(pile);
  const pileCenter = pileBox.getCenter(new THREE.Vector3());
  const pileSize = pileBox.getSize(new THREE.Vector3());
  
  // 调整位置，使底部对齐到y=0
  pile.position.y = -pileCenter.y + pileSize.y / 2;
  
  return pile;
}

// ==================== 灌木丛生成 ====================
/**
 * 创建灌木丛（多个杂物堆聚集在一起，形成大致长方形的区域）
 * @param {Object} options - 配置选项
 * @param {number} options.pileCount - 杂物堆数量（4-10个）
 * @param {number} options.width - 灌木丛宽度（默认2-4米）
 * @param {number} options.depth - 灌木丛深度（默认2-4米）
 * @param {Array<string>} options.modelPaths - 可用的模型路径列表
 * @param {boolean} options.usePointCloud - 是否使用点云渲染
 * @returns {THREE.Group} 灌木丛组
 */
function createBushCluster(options = {}) {
  const {
    pileCount = 4 + Math.floor(Math.random() * 7), // 4-10个杂物堆
    width = 2 + Math.random() * 2, // 2-4米宽
    depth = 2 + Math.random() * 2, // 2-4米深
    modelPaths = [],
    usePointCloud = true
  } = options;
  
  const cluster = new THREE.Group();
  
  // 在长方形区域内随机分布杂物堆
  for (let i = 0; i < pileCount; i++) {
    const pile = createDebrisPile({
      pieceCount: 3 + Math.floor(Math.random() * 6),
      modelPaths: modelPaths,
      usePointCloud: usePointCloud
    });
    
    // 在长方形区域内随机位置
    const x = (Math.random() - 0.5) * width;
    const z = (Math.random() - 0.5) * depth;
    
    pile.position.set(x, 0, z);
    
    // 随机旋转整个杂物堆
    pile.rotation.y = Math.random() * Math.PI * 2;
    
    cluster.add(pile);
  }
  
  return cluster;
}

// ==================== 主函数 ====================
/**
 * 创建整个丛林场景组
 * @param {Object} options - 配置选项
 * @param {boolean} options.usePointCloud - 是否使用点云渲染
 * @param {number} options.clusterCount - 灌木丛数量（默认8-15个）
 * @param {string} options.modelsFolder - 模型文件夹路径（默认 'models/'）
 * @param {Array<string>} options.modelPaths - 可用的模型路径列表（如果提供，将使用这些路径）
 * @returns {THREE.Group} 丛林场景组
 */
export function createJungleSceneGroup(options = {}) {
  // 兼容旧版本调用方式
  let usePointCloud = true;
  let clusterCount = 8 + Math.floor(Math.random() * 8); // 8-15个灌木丛
  let modelsFolder = 'models/';
  let modelPaths = [];
  let innerRadius = 0; // 小圆半径（避开区域）
  let outerRadius = 10; // 大圆半径（外边界）
  
  if (typeof options === 'boolean') {
    // 旧版本：createJungleSceneGroup(true)
    usePointCloud = options;
  } else {
    // 新版本：createJungleSceneGroup({ usePointCloud: true, ... })
    usePointCloud = options.usePointCloud !== undefined ? options.usePointCloud : true;
    clusterCount = options.clusterCount || clusterCount;
    modelsFolder = options.modelsFolder || modelsFolder;
    modelPaths = options.modelPaths || [];
    innerRadius = options.innerRadius || innerRadius;
    outerRadius = options.outerRadius || outerRadius;
  }
  
  const jungle = new THREE.Group();
  
  // 生成多个灌木丛，分布在圆环区域内（避开小圆）
  for (let i = 0; i < clusterCount; i++) {
    const cluster = createBushCluster({
      pileCount: 4 + Math.floor(Math.random() * 7), // 每个灌木丛4-10个杂物堆
      width: 1.5 + Math.random() * 2.5, // 1.5-4米宽
      depth: 1.5 + Math.random() * 2.5, // 1.5-4米深
      modelPaths: modelPaths,
      usePointCloud: usePointCloud
    });
    
    // 在圆环区域内分布灌木丛（小圆半径到大圆半径之间）
    // 使用均匀分布确保覆盖整个圆环
    let r, theta;
    // 在圆环内均匀分布：使用平方根分布确保面积均匀
    // 平方根分布确保在圆环面积上均匀分布，而不是在半径上均匀分布
    const randomFactor = Math.random();
    r = Math.sqrt(innerRadius * innerRadius + randomFactor * (outerRadius * outerRadius - innerRadius * innerRadius));
    // 确保r在有效范围内（理论上应该总是满足，但添加检查以防万一）
    r = Math.max(innerRadius, Math.min(outerRadius, r));
    // 角度分布：每个灌木丛均匀分布在圆周上，加上一些随机偏移
    theta = (i / clusterCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    
    cluster.position.set(
      Math.cos(theta) * r,
      0,
      Math.sin(theta) * r
    );
    
    // 随机旋转整个灌木丛
    cluster.rotation.y = Math.random() * Math.PI * 2;
    
    jungle.add(cluster);
  }
  
  // 调整地面大小以匹配大圆半径（考虑缩放因子）
  // 注意：由于后面会整体放大5倍，传入的outerRadius已经是除以5的值
  // 所以这里直接使用outerRadius，放大5倍后就是实际的外圆半径
  const groundRadius = outerRadius; // 直接使用outerRadius（已经是除以5的值）
  const platGeo = new THREE.CircleGeometry(groundRadius, 64); // 使用圆形平面而不是圆柱
  const platMat = new THREE.MeshStandardMaterial({ 
    color: 0xf9f6f1, 
    roughness: 0.8, 
    metalness: 0.18, 
    flatShading: true,
    side: THREE.DoubleSide // 双面渲染
  });
  const plat = new THREE.Mesh(platGeo, platMat);
  plat.rotation.x = -Math.PI / 2; // 水平放置
  plat.position.y = -0.11;
  jungle.add(plat);

  // 调整暖光环地投影，使其在圆环区域内
  // 注意：传入的innerRadius和outerRadius已经是除以5的值，所以直接使用
  const ringInnerRadius = innerRadius; // 直接使用（已经是除以5的值）
  const ringOuterRadius = outerRadius; // 直接使用（已经是除以5的值）
  const ringGeo = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 82, 1);
  const ringMat = new THREE.MeshBasicMaterial({ 
    color: 0xffe6c7, 
    opacity: 0.13, 
    transparent: true 
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.13;
  ring.rotation.x = -Math.PI / 2;
  jungle.add(ring);

  return jungle;
}

// ==================== 导出辅助函数（可选） ====================
// 如果需要单独创建杂物堆或灌木丛，可以使用这些函数
export { createDebrisPile, createBushCluster, loadModel };
