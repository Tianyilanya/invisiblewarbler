import * as THREE from 'three';

/**
 * AI合成模块
 * 伪AI算法，按身体部位组合碎片成完整鸟类模型
 */

/**
 * 计算对象的包围盒
 * @param {THREE.Object3D} object - 3D对象
 * @param {number} scale - 缩放因子（用于缩小碰撞体积，允许穿模，默认0.80，更紧密）
 * @returns {Object} 包围盒信息 {box, size, center}
 */
function getBoundingBox(object, scale = 0.80) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  // 如果指定了缩放，返回缩小的包围盒（用于碰撞检测，允许轻微穿模）
  if (scale !== 1.0) {
    const scaledSize = size.clone().multiplyScalar(scale);
    const scaledBox = new THREE.Box3();
    scaledBox.setFromCenterAndSize(center, scaledSize);
    return { box: scaledBox, size: scaledSize, center };
  }
  
  return { box, size, center };
}

/**
 * 检测两个对象是否碰撞（使用缩小的包围盒，允许轻微穿模）
 * @param {THREE.Object3D} obj1 - 第一个对象
 * @param {THREE.Object3D} obj2 - 第二个对象
 * @param {number} collisionScale - 碰撞体积缩放因子（默认0.80，允许20%的穿模，更紧密）
 * @returns {boolean} 是否碰撞
 */
function checkCollision(obj1, obj2, collisionScale = 0.80) {
  const box1 = new THREE.Box3().setFromObject(obj1);
  const box2 = new THREE.Box3().setFromObject(obj2);
  
  // 缩小碰撞体积，允许轻微穿模
  const size1 = box1.getSize(new THREE.Vector3());
  const size2 = box2.getSize(new THREE.Vector3());
  const center1 = box1.getCenter(new THREE.Vector3());
  const center2 = box2.getCenter(new THREE.Vector3());
  
  const scaledBox1 = new THREE.Box3();
  const scaledBox2 = new THREE.Box3();
  scaledBox1.setFromCenterAndSize(center1, size1.clone().multiplyScalar(collisionScale));
  scaledBox2.setFromCenterAndSize(center2, size2.clone().multiplyScalar(collisionScale));
  
  return scaledBox1.intersectsBox(scaledBox2);
}

/**
 * 计算两个对象之间的贴合位置
 * 让新对象贴合到已存在的对象，允许轻微穿模以保持完型
 * @param {THREE.Object3D} newObj - 要放置的新对象
 * @param {THREE.Object3D} existingObj - 已存在的对象
 * @param {THREE.Vector3} desiredDirection - 期望的贴合方向（归一化向量）
 * @param {number} penetration - 允许的穿模深度（负数表示允许重叠，默认-0.2，允许20%的穿模，更紧密）
 * @returns {THREE.Vector3} 调整后的位置
 */
function calculateSnapPosition(newObj, existingObj, desiredDirection, penetration = -0.2) {
  // 确保方向向量已归一化
  const direction = desiredDirection.clone().normalize();
  
  // 获取包围盒（使用原始尺寸，但允许穿模）
  const newBox = new THREE.Box3().setFromObject(newObj);
  const existingBox = new THREE.Box3().setFromObject(existingObj);
  
  // 计算两个包围盒的中心
  const newCenter = newBox.getCenter(new THREE.Vector3());
  const existingCenter = existingBox.getCenter(new THREE.Vector3());
  
  // 计算两个包围盒的尺寸
  const newSize = newBox.getSize(new THREE.Vector3());
  const existingSize = existingBox.getSize(new THREE.Vector3());
  
  // 计算在指定方向上的投影尺寸
  // 对于轴对齐包围盒，在方向上的投影 = |direction.x| * size.x + |direction.y| * size.y + |direction.z| * size.z
  const newProjection = 
    Math.abs(direction.x) * newSize.x / 2 +
    Math.abs(direction.y) * newSize.y / 2 +
    Math.abs(direction.z) * newSize.z / 2;
  
  const existingProjection = 
    Math.abs(direction.x) * existingSize.x / 2 +
    Math.abs(direction.y) * existingSize.y / 2 +
    Math.abs(direction.z) * existingSize.z / 2;
  
  // 计算贴合距离（两个投影之和 - 穿模深度，负数表示允许重叠）
  // 使用平均尺寸来计算穿模深度，使其更自然
  const avgSize = (newProjection + existingProjection) / 2;
  // 增加穿模深度，让贴合更紧密（使用更大的penetration值和系数）
  const snapDistance = newProjection + existingProjection + penetration * avgSize * 1.5;
  
  // 计算新对象的中心应该在哪里（从已存在对象的中心沿方向移动）
  const targetCenter = new THREE.Vector3()
    .copy(existingCenter)
    .add(direction.clone().multiplyScalar(snapDistance));
  
  // 计算当前新对象中心的位置
  const currentCenter = newBox.getCenter(new THREE.Vector3());
  
  // 计算需要调整的偏移量
  const offset = new THREE.Vector3().subVectors(targetCenter, currentCenter);
  
  // 返回新对象应该移动到的位置（相对于其当前位置）
  return newObj.position.clone().add(offset);
}

/**
 * 调整对象位置以避免与已存在的对象碰撞
 * 允许轻微穿模以保持整体形状的完型
 * @param {THREE.Object3D} newObj - 要放置的新对象
 * @param {Array<THREE.Object3D>} existingObjs - 已存在的对象数组
 * @param {THREE.Vector3} initialPosition - 初始位置
 * @param {THREE.Vector3} preferredDirection - 优先贴合方向
 * @param {number} penetration - 允许的穿模深度（默认-0.25，允许25%的穿模以保持完型，更紧密）
 * @returns {THREE.Vector3} 调整后的位置
 */
function adjustPositionToAvoidCollision(newObj, existingObjs, initialPosition, preferredDirection, penetration = -0.25) {
  if (existingObjs.length === 0) {
    return initialPosition.clone();
  }
  
  // 先设置初始位置
  newObj.position.copy(initialPosition);
  
  // 迭代调整，增加迭代次数以获得更紧密的贴合
  const maxIterations = 8; // 从5增加到8，允许更多次调整
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasCollision = false;
    let bestPosition = null;
    let minDistance = Infinity;
    
    // 检查与所有已存在对象的碰撞（使用更宽松的碰撞体积，允许更紧密贴合）
    for (const existingObj of existingObjs) {
      if (checkCollision(newObj, existingObj, 0.80)) { // 从0.85减少到0.80，允许更紧密贴合
        hasCollision = true;
        // 有碰撞，计算贴合位置（允许穿模）
        const snapPos = calculateSnapPosition(newObj, existingObj, preferredDirection, penetration);
        
        // 选择距离初始位置最近的有效位置
        const distance = snapPos.distanceTo(initialPosition);
        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = snapPos;
        }
      }
    }
    
    // 如果没有碰撞，退出循环
    if (!hasCollision) {
      break;
    }
    
    // 如果有最佳位置，应用它
    if (bestPosition) {
      newObj.position.copy(bestPosition);
    } else {
      // 如果没有找到有效位置，尝试沿优先方向移动（减小步长，更精确）
      newObj.position.add(preferredDirection.clone().multiplyScalar(0.03)); // 从0.05减少到0.03
    }
  }
  
  return newObj.position.clone();
}

/**
 * 检查两个对象是否接触（使用更宽松的检测，允许轻微重叠）
 * @param {THREE.Object3D} obj1 - 第一个对象
 * @param {THREE.Object3D} obj2 - 第二个对象
 * @param {number} contactScale - 接触检测缩放因子（默认1.0，使用原始尺寸）
 * @returns {boolean} 是否接触
 */
function checkContact(obj1, obj2, contactScale = 1.0) {
  const box1 = new THREE.Box3().setFromObject(obj1);
  const box2 = new THREE.Box3().setFromObject(obj2);
  
  // 如果缩放因子为1.0，直接检测原始包围盒
  if (contactScale === 1.0) {
    return box1.intersectsBox(box2);
  }
  
  // 否则使用缩放的包围盒
  const size1 = box1.getSize(new THREE.Vector3());
  const size2 = box2.getSize(new THREE.Vector3());
  const center1 = box1.getCenter(new THREE.Vector3());
  const center2 = box2.getCenter(new THREE.Vector3());
  
  const scaledBox1 = new THREE.Box3();
  const scaledBox2 = new THREE.Box3();
  scaledBox1.setFromCenterAndSize(center1, size1.clone().multiplyScalar(contactScale));
  scaledBox2.setFromCenterAndSize(center2, size2.clone().multiplyScalar(contactScale));
  
  return scaledBox1.intersectsBox(scaledBox2);
}

/**
 * 计算两个对象之间的最短距离方向
 * @param {THREE.Object3D} obj1 - 第一个对象
 * @param {THREE.Object3D} obj2 - 第二个对象
 * @returns {THREE.Vector3} 从obj1到obj2的方向向量（归一化）
 */
function getDirectionToObject(obj1, obj2) {
  const box1 = new THREE.Box3().setFromObject(obj1);
  const box2 = new THREE.Box3().setFromObject(obj2);
  
  const center1 = box1.getCenter(new THREE.Vector3());
  const center2 = box2.getCenter(new THREE.Vector3());
  
  const direction = new THREE.Vector3().subVectors(center2, center1);
  return direction.normalize();
}

/**
 * 确保对象与至少一个其他对象接触
 * @param {THREE.Object3D} obj - 要确保接触的对象
 * @param {Array<THREE.Object3D>} otherObjs - 其他对象数组
 * @param {number} maxAttempts - 最大尝试次数（默认10）
 */
function ensureContact(obj, otherObjs, maxAttempts = 10) {
  if (otherObjs.length === 0) return;
  
  // 检查是否已经与至少一个对象接触（使用更宽松的检测，允许更紧密贴合）
  let hasContact = false;
  for (const otherObj of otherObjs) {
    if (checkContact(obj, otherObj, 0.90)) { // 从0.95减少到0.90，允许更紧密贴合
      hasContact = true;
      break;
    }
  }
  
  // 如果已经有接触，不需要调整
  if (hasContact) return;
  
  // 找到最近的对象
  let nearestObj = null;
  let minDistance = Infinity;
  
  for (const otherObj of otherObjs) {
    const box1 = new THREE.Box3().setFromObject(obj);
    const box2 = new THREE.Box3().setFromObject(otherObj);
    const center1 = box1.getCenter(new THREE.Vector3());
    const center2 = box2.getCenter(new THREE.Vector3());
    const distance = center1.distanceTo(center2);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestObj = otherObj;
    }
  }
  
  if (!nearestObj) return;
  
  // 计算方向并移动对象使其接触
  const direction = getDirectionToObject(obj, nearestObj);
  
  // 尝试移动对象使其接触（增加尝试次数，允许更紧密贴合）
  for (let attempt = 0; attempt < maxAttempts * 1.5; attempt++) { // 增加尝试次数
    // 计算贴合位置（允许更深的穿模以保持紧密接触）
    const snapPos = calculateSnapPosition(obj, nearestObj, direction, -0.2); // 从-0.1增加到-0.2，更紧密
    obj.position.copy(snapPos);
    
    // 检查是否现在有接触
    if (checkContact(obj, nearestObj, 0.90)) { // 从0.95减少到0.90
      break;
    }
    
    // 如果没有接触，继续向目标对象移动（减小步长，更精确）
    const moveStep = 0.03 * (attempt + 1); // 从0.05减少到0.03，更精确
    obj.position.add(direction.clone().multiplyScalar(moveStep));
  }
}

/**
 * 确保所有碎片都至少和一个其他碎片接触
 * 特别是对于同一部位的多个碎片，确保它们之间也能相接
 * @param {Array<THREE.Object3D>} allObjects - 所有已放置的对象
 * @param {Object} partsInfo - 部位信息，用于识别同一部位的碎片
 */
function ensureAllFragmentsContact(allObjects, partsInfo) {
  if (allObjects.length <= 1) return;
  
  // 为每个对象确保至少有一个接触
  for (let i = 0; i < allObjects.length; i++) {
    const obj = allObjects[i];
    const otherObjs = allObjects.filter((o, idx) => idx !== i);
    
    // 确保当前对象与至少一个其他对象接触
    ensureContact(obj, otherObjs);
  }
  
  // 特别处理同一部位的多个碎片（翅膀、足部）
  // 确保同一侧的多个碎片之间也能相接
  
  // 处理翅膀：确保同一侧的多个翅膀相接
  const wingObjects = [];
  allObjects.forEach((obj, idx) => {
    // 通过位置判断是否是翅膀（在胸部两侧）
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    if (Math.abs(center.x) > 0.2 && Math.abs(center.y) < 0.5) {
      wingObjects.push({ obj, idx, side: center.x < 0 ? 'left' : 'right' });
    }
  });
  
  // 按侧分组
  const leftWings = wingObjects.filter(w => w.side === 'left').map(w => w.obj);
  const rightWings = wingObjects.filter(w => w.side === 'right').map(w => w.obj);
  
  // 确保同一侧的翅膀相接
  if (leftWings.length > 1) {
    for (let i = 1; i < leftWings.length; i++) {
      const otherWings = leftWings.slice(0, i);
      ensureContact(leftWings[i], otherWings);
    }
  }
  
  if (rightWings.length > 1) {
    for (let i = 1; i < rightWings.length; i++) {
      const otherWings = rightWings.slice(0, i);
      ensureContact(rightWings[i], otherWings);
    }
  }
  
  // 处理足部：确保同一侧的多个足部相接
  const footObjects = [];
  allObjects.forEach((obj, idx) => {
    // 通过位置判断是否是足部（在底部）
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    if (Math.abs(center.y) > 0.3 && center.y < 0) {
      footObjects.push({ obj, idx, side: center.x < 0 ? 'left' : 'right' });
    }
  });
  
  // 按侧分组
  const leftFeet = footObjects.filter(f => f.side === 'left').map(f => f.obj);
  const rightFeet = footObjects.filter(f => f.side === 'right').map(f => f.obj);
  
  // 确保同一侧的足部相接
  if (leftFeet.length > 1) {
    for (let i = 1; i < leftFeet.length; i++) {
      const otherFeet = leftFeet.slice(0, i);
      ensureContact(leftFeet[i], otherFeet);
    }
  }
  
  if (rightFeet.length > 1) {
    for (let i = 1; i < rightFeet.length; i++) {
      const otherFeet = rightFeet.slice(0, i);
      ensureContact(rightFeet[i], otherFeet);
    }
  }
}

/**
 * 合成完整生物
 * @param {Array} fragments - 碎片数组 [{partType, fragment}, ...]
 * @returns {Promise<THREE.Group>} 合成后的3D模型
 */
export async function synthesizeCreature(fragments) {
  // 模拟异步处理（可以添加延迟以显示加载状态）
  return new Promise((resolve) => {
    // 使用 setTimeout 模拟合成延迟
    setTimeout(() => {
      const creature = new THREE.Group();
      const parts = {
        head: null,
        chest: null,
        belly: null,
        wings: [],
        tail: null,
        feet: []
      };
      
      // 重新分配碎片：忽略原始partType，按照鸟的形态规则重新组合
      // 优先级：胸部(必须) > 头部 > 腹部 > 翅膀(对称) > 尾巴 > 足部(最多2个，对称)
      if (fragments.length === 0) {
        resolve(creature);
        return;
      }
      
      // 打乱碎片顺序，增加随机性（但保持第一个作为胸部）
      const shuffledFragments = [...fragments];
      // 只打乱除了第一个之外的其他碎片
      for (let i = shuffledFragments.length - 1; i > 1; i--) {
        const j = Math.floor(Math.random() * (i - 1)) + 1; // j的范围是[1, i]
        [shuffledFragments[i], shuffledFragments[j]] = [shuffledFragments[j], shuffledFragments[i]];
      }
      
      let index = 0;
      
      // 1. 第一个碎片必须是胸部（核心参考点）
      parts.chest = shuffledFragments[index++].fragment;
      
      // 2. 第二个碎片作为头部（如果有）
      if (index < shuffledFragments.length) {
        parts.head = shuffledFragments[index++].fragment;
      }
      
      // 3. 第三个碎片作为腹部（如果有）
      if (index < shuffledFragments.length) {
        parts.belly = shuffledFragments[index++].fragment;
      }
      
      // 4. 剩余的碎片优先分配给翅膀（对称分布），直到剩下最后1-2个
      // 计算留给尾巴和足部的数量：如果有5个以上碎片，留2个；否则留1个
      const remainingCount = shuffledFragments.length - index;
      const reservedForTailAndFeet = remainingCount > 2 ? 2 : (remainingCount > 0 ? 1 : 0);
      const wingCount = remainingCount - reservedForTailAndFeet;
      
      // 分配翅膀
      for (let i = 0; i < wingCount && index < shuffledFragments.length; i++) {
        parts.wings.push(shuffledFragments[index++].fragment);
      }
      
      // 5. 倒数第二个碎片作为尾巴（如果有2个以上剩余）
      if (reservedForTailAndFeet >= 2 && index < shuffledFragments.length) {
        parts.tail = shuffledFragments[index++].fragment;
      }
      
      // 6. 最后一个碎片作为足部（如果有，最多1个，因为会对称复制）
      if (index < shuffledFragments.length) {
        parts.feet.push(shuffledFragments[index++].fragment);
      }
      
      // 限制足部最多2个（会在组装时对称复制）
      if (parts.feet.length > 2) {
        parts.feet = parts.feet.slice(0, 2);
      }
      
      // 按位置组装
      let referenceY = 0; // 参考Y坐标（胸部中心）
      let chestHeight = 0;
      const placedObjects = []; // 已放置的对象列表，用于碰撞检测
      
      // 1. 放置胸部（中心参考点）
      if (parts.chest) {
        const chestBB = getBoundingBox(parts.chest);
        const chestClone = parts.chest.clone();
        chestClone.position.set(0, 0, 0);
        creature.add(chestClone);
        placedObjects.push(chestClone);
        referenceY = 0;
        chestHeight = chestBB.size.y;
      }
      
      // 2. 头部在胸部上方（贴合，允许轻微穿模以保持完型）
      if (parts.head) {
        const headBB = getBoundingBox(parts.head);
        const headClone = parts.head.clone();
        // 初始位置：胸部上方，更紧密贴合（减少间隙）
        const initialHeadY = chestHeight / 2 + headBB.size.y / 2 * 0.5; // 允许50%的嵌入，更紧密
        headClone.position.set(0, initialHeadY, 0);
        // 使用碰撞检测调整位置，向上贴合，允许更深的嵌入以保持完型
        adjustPositionToAvoidCollision(
          headClone, 
          placedObjects, 
          headClone.position.clone(),
          new THREE.Vector3(0, 1, 0), // 向上贴合
          -0.3 // 允许30%的穿模深度，更紧密
        );
        creature.add(headClone);
        placedObjects.push(headClone);
      }
      
      // 3. 腹部在胸部下方（贴合，允许轻微穿模以保持完型）
      if (parts.belly) {
        const bellyBB = getBoundingBox(parts.belly);
        const bellyClone = parts.belly.clone();
        // 初始位置：胸部下方，更紧密贴合
        const initialBellyY = -chestHeight / 2 - bellyBB.size.y / 2 * 0.5; // 允许50%的嵌入，更紧密
        bellyClone.position.set(0, initialBellyY, 0);
        // 使用碰撞检测调整位置，向下贴合，允许更深的嵌入以保持完型
        adjustPositionToAvoidCollision(
          bellyClone, 
          placedObjects, 
          bellyClone.position.clone(),
          new THREE.Vector3(0, -1, 0), // 向下贴合
          -0.3 // 允许30%的穿模深度，更紧密
        );
        creature.add(bellyClone);
        placedObjects.push(bellyClone);
      }
      
      // 4. 翅膀在胸部两侧（符合鸟类身体结构，贴合但不穿模）
      if (parts.wings.length > 0) {
        const chestBB = parts.chest ? getBoundingBox(parts.chest) : { size: { x: 1, z: 1 } };
        const wingSpacing = chestBB.size.x / 2;
        
        // 确保至少有两个翅膀，对称分布在两侧
        const wingCount = Math.max(2, parts.wings.length);
        const leftWings = [];
        const rightWings = [];
        
        // 分配翅膀到左右两侧
        parts.wings.forEach((wing, index) => {
          if (index % 2 === 0) {
            leftWings.push(wing);
          } else {
            rightWings.push(wing);
          }
        });
        
        // 如果只有一侧有翅膀，从另一侧复制或创建对称的
        if (leftWings.length === 0 && rightWings.length > 0) {
          leftWings.push(rightWings[0].clone());
        } else if (rightWings.length === 0 && leftWings.length > 0) {
          rightWings.push(leftWings[0].clone());
        }
        
        // 放置左侧翅膀
        leftWings.forEach((wing, index) => {
          const wingClone = wing.clone();
          const wingBB = getBoundingBox(wing);
          // 翅膀向外展开的角度
          wingClone.rotation.y = -Math.PI / 3 + (index * 0.1);
          wingClone.rotation.z = Math.PI / 6; // 稍微向上倾斜
          
          // 初始位置：胸部左侧，更紧密贴合
          // 如果有多个左侧翅膀，让它们更紧密地排列
          let initialX = -wingSpacing * 0.6; // 从0.8减少到0.6，更紧密
          if (index > 0) {
            // 找到已放置的左侧翅膀，尝试贴合到它们
            const existingLeftWings = placedObjects.filter(obj => {
              const box = new THREE.Box3().setFromObject(obj);
              const center = box.getCenter(new THREE.Vector3());
              return center.x < 0 && Math.abs(center.y) < 0.5;
            });
            if (existingLeftWings.length > 0) {
              // 找到最近的左侧翅膀，在其附近放置
              const nearestWing = existingLeftWings[existingLeftWings.length - 1];
              const nearestBox = new THREE.Box3().setFromObject(nearestWing);
              const nearestCenter = nearestBox.getCenter(new THREE.Vector3());
              initialX = nearestCenter.x - wingBB.size.x * 0.15; // 从0.3减少到0.15，更紧密贴合
            }
          }
          
          wingClone.position.set(initialX, 0, 0);
          // 使用碰撞检测调整位置，向左贴合，允许轻微穿模
          adjustPositionToAvoidCollision(
            wingClone, 
            placedObjects, 
            wingClone.position.clone(),
            new THREE.Vector3(-1, 0, 0), // 向左贴合
            -0.25 // 从0.15增加到0.25，允许25%的穿模深度，更紧密
          );
          creature.add(wingClone);
          placedObjects.push(wingClone);
        });
        
        // 放置右侧翅膀
        rightWings.forEach((wing, index) => {
          const wingClone = wing.clone();
          const wingBB = getBoundingBox(wing);
          // 翅膀向外展开的角度（镜像）
          wingClone.rotation.y = Math.PI / 3 - (index * 0.1);
          wingClone.rotation.z = -Math.PI / 6; // 稍微向上倾斜（镜像）
          
          // 初始位置：胸部右侧，更紧密贴合
          // 如果有多个右侧翅膀，让它们更紧密地排列
          let initialX = wingSpacing * 0.6; // 从0.8减少到0.6，更紧密
          if (index > 0) {
            // 找到已放置的右侧翅膀，尝试贴合到它们
            const existingRightWings = placedObjects.filter(obj => {
              const box = new THREE.Box3().setFromObject(obj);
              const center = box.getCenter(new THREE.Vector3());
              return center.x > 0 && Math.abs(center.y) < 0.5;
            });
            if (existingRightWings.length > 0) {
              // 找到最近的右侧翅膀，在其附近放置
              const nearestWing = existingRightWings[existingRightWings.length - 1];
              const nearestBox = new THREE.Box3().setFromObject(nearestWing);
              const nearestCenter = nearestBox.getCenter(new THREE.Vector3());
              initialX = nearestCenter.x + wingBB.size.x * 0.15; // 从0.3减少到0.15，更紧密贴合
            }
          }
          
          wingClone.position.set(initialX, 0, 0);
          // 使用碰撞检测调整位置，向右贴合，允许轻微穿模
          adjustPositionToAvoidCollision(
            wingClone, 
            placedObjects, 
            wingClone.position.clone(),
            new THREE.Vector3(1, 0, 0), // 向右贴合
            -0.25 // 从0.15增加到0.25，允许25%的穿模深度，更紧密
          );
          creature.add(wingClone);
          placedObjects.push(wingClone);
        });
      }
      
      // 5. 尾部在腹部后方（符合鸟类身体结构，贴合，允许轻微穿模以保持完型）
      if (parts.tail) {
        const tailClone = parts.tail.clone();
        const tailBB = getBoundingBox(parts.tail);
        tailClone.rotation.x = -Math.PI / 12; // 稍微向下倾斜
        // 初始位置：腹部后方，更紧密贴合
        let tailY = -chestHeight / 2;
        if (parts.belly) {
          const bellyBB = getBoundingBox(parts.belly);
          tailY = -chestHeight / 2 - bellyBB.size.y / 2 * 0.5; // 从0.7减少到0.5，允许50%的嵌入，更紧密
        }
        tailClone.position.set(0, tailY - 0.05, tailBB.size.z / 2 * 0.4); // 从0.6减少到0.4，允许60%的嵌入，更紧密
        // 使用碰撞检测调整位置，向后贴合，允许轻微穿模
        adjustPositionToAvoidCollision(
          tailClone, 
          placedObjects, 
          tailClone.position.clone(),
          new THREE.Vector3(0, 0, 1), // 向后贴合
          -0.25 // 从0.15增加到0.25，允许25%的穿模深度，更紧密
        );
        creature.add(tailClone);
        placedObjects.push(tailClone);
      }
      
      // 6. 足部在底部（符合鸟类身体结构，贴合但不穿模）
      if (parts.feet.length > 0) {
        let bottomY = -chestHeight / 2;
        if (parts.belly) {
          const bellyBB = getBoundingBox(parts.belly);
          bottomY = -chestHeight / 2 - bellyBB.size.y / 2;
        }
        
        // 确保至少有两个足部，对称分布
        const footCount = Math.max(2, parts.feet.length);
        const leftFeet = [];
        const rightFeet = [];
        
        // 分配足部到左右两侧
        parts.feet.forEach((foot, index) => {
          if (index % 2 === 0) {
            leftFeet.push(foot);
          } else {
            rightFeet.push(foot);
          }
        });
        
        // 如果只有一侧有足部，从另一侧复制或创建对称的
        if (leftFeet.length === 0 && rightFeet.length > 0) {
          leftFeet.push(rightFeet[0].clone());
        } else if (rightFeet.length === 0 && leftFeet.length > 0) {
          rightFeet.push(leftFeet[0].clone());
        }
        
        // 放置左侧足部
        leftFeet.forEach((foot, index) => {
          const footClone = foot.clone();
          const footBB = getBoundingBox(foot);
          
          // 初始位置：底部左侧，更紧密贴合
          // 如果有多个左侧足部，让它们更紧密地排列
          let initialX = -0.3;
          let initialY = bottomY - footBB.size.y / 2 * 0.5; // 从0.7减少到0.5，允许50%的嵌入，更紧密
          
          if (index > 0) {
            // 找到已放置的左侧足部，尝试贴合到它们
            const existingLeftFeet = placedObjects.filter(obj => {
              const box = new THREE.Box3().setFromObject(obj);
              const center = box.getCenter(new THREE.Vector3());
              return center.x < 0 && center.y < 0;
            });
            if (existingLeftFeet.length > 0) {
              // 找到最近的左侧足部，在其附近放置
              const nearestFoot = existingLeftFeet[existingLeftFeet.length - 1];
              const nearestBox = new THREE.Box3().setFromObject(nearestFoot);
              const nearestCenter = nearestBox.getCenter(new THREE.Vector3());
              initialX = nearestCenter.x - footBB.size.x * 0.1; // 从0.2减少到0.1，更紧密贴合
              initialY = nearestCenter.y; // 保持相同高度
            }
          }
          
          footClone.position.set(initialX, initialY, 0);
          // 使用碰撞检测调整位置，向下贴合，允许轻微穿模
          adjustPositionToAvoidCollision(
            footClone, 
            placedObjects, 
            footClone.position.clone(),
            new THREE.Vector3(0, -1, 0), // 向下贴合
            -0.25 // 从0.15增加到0.25，允许25%的穿模深度，更紧密
          );
          creature.add(footClone);
          placedObjects.push(footClone);
        });
        
        // 放置右侧足部
        rightFeet.forEach((foot, index) => {
          const footClone = foot.clone();
          const footBB = getBoundingBox(foot);
          
          // 初始位置：底部右侧，更紧密贴合
          // 如果有多个右侧足部，让它们更紧密地排列
          let initialX = 0.3;
          let initialY = bottomY - footBB.size.y / 2 * 0.5; // 从0.7减少到0.5，允许50%的嵌入，更紧密
          
          if (index > 0) {
            // 找到已放置的右侧足部，尝试贴合到它们
            const existingRightFeet = placedObjects.filter(obj => {
              const box = new THREE.Box3().setFromObject(obj);
              const center = box.getCenter(new THREE.Vector3());
              return center.x > 0 && center.y < 0;
            });
            if (existingRightFeet.length > 0) {
              // 找到最近的右侧足部，在其附近放置
              const nearestFoot = existingRightFeet[existingRightFeet.length - 1];
              const nearestBox = new THREE.Box3().setFromObject(nearestFoot);
              const nearestCenter = nearestBox.getCenter(new THREE.Vector3());
              initialX = nearestCenter.x + footBB.size.x * 0.1; // 从0.2减少到0.1，更紧密贴合
              initialY = nearestCenter.y; // 保持相同高度
            }
          }
          
          footClone.position.set(initialX, initialY, 0);
          // 使用碰撞检测调整位置，向下贴合，允许轻微穿模
          adjustPositionToAvoidCollision(
            footClone, 
            placedObjects, 
            footClone.position.clone(),
            new THREE.Vector3(0, -1, 0), // 向下贴合
            -0.25 // 从0.15增加到0.25，允许25%的穿模深度，更紧密
          );
          creature.add(footClone);
          placedObjects.push(footClone);
        });
      }
      
      // 后处理：确保所有碎片都至少和一个其他碎片接触
      // 特别是对于同一部位的多个碎片，确保它们之间也能相接
      if (placedObjects.length > 1) {
        ensureAllFragmentsContact(placedObjects, parts);
      }
      
      // 设置用户数据
      creature.userData.synthesized = true;
      creature.userData.fragmentCount = fragments.length;
      creature.userData.partTypes = fragments.map(f => f.partType);
      
      resolve(creature);
    }, 500 + Math.random() * 1000); // 500-1500ms 延迟，模拟合成时间
  });
}

