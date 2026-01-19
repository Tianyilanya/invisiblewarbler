/**
 * 胶卷状态管理模块
 * 管理碎片收集状态
 */

const state = {
  fragments: [],
  maxFragments: 10,
  minFragments: 3
};

/**
 * 添加碎片到胶卷
 * @param {string} partType - 部位类型
 * @param {THREE.Group} fragment - 碎片3D对象
 * @returns {boolean} 是否成功添加
 */
export function addFragment(partType, fragment) {
  if (state.fragments.length >= state.maxFragments) {
    console.warn('Film roll is full!');
    return false;
  }
  
  const fragmentData = {
    id: `fragment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    partType: partType,
    timestamp: Date.now(),
    fragment: fragment.clone(), // 克隆碎片，避免引用问题
    thumbnail: null // 缩略图可以后续生成
  };
  
  state.fragments.push(fragmentData);
  return true;
}

/**
 * 获取所有碎片
 * @returns {Array} 碎片数组
 */
export function getFragments() {
  return state.fragments.map(f => ({
    id: f.id,
    partType: f.partType,
    timestamp: f.timestamp,
    fragment: f.fragment,
    thumbnail: f.thumbnail
  }));
}

/**
 * 获取碎片数量
 * @returns {number} 碎片数量
 */
export function getFragmentCount() {
  return state.fragments.length;
}

/**
 * 检查是否可以合成
 * @returns {boolean} 是否可以合成（≥3个）
 */
export function canSynthesize() {
  return state.fragments.length >= state.minFragments;
}

/**
 * 清空胶卷
 */
export function clearFragments() {
  // 清理3D对象
  state.fragments.forEach(f => {
    if (f.fragment) {
      f.fragment.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  });
  
  state.fragments = [];
}

/**
 * 获取状态（用于调试）
 * @returns {Object} 状态对象
 */
export function getState() {
  return {
    fragmentCount: state.fragments.length,
    maxFragments: state.maxFragments,
    minFragments: state.minFragments,
    canSynthesize: canSynthesize()
  };
}

