/**
 * 胶卷UI组件
 * 右下角胶卷圆盘UI
 */

let filmRollElement = null;
let countElement = null;
let currentRotation = 0;

/**
 * 重置旋转角度
 */
export function resetFilmRollRotation() {
  currentRotation = 0;
  if (filmRollElement) {
    filmRollElement.style.transform = 'rotate(0deg)';
  }
  if (countElement) {
    countElement.style.transform = 'translate(-50%, -50%) rotate(0deg)';
  }
}

/**
 * 创建胶卷UI元素
 * @param {Function} onClick - 点击回调函数
 * @returns {HTMLElement} DOM元素
 */
export function createFilmRollUI(onClick) {
  // 创建主容器
  filmRollElement = document.createElement('div');
  filmRollElement.id = 'film-roll-ui';
  filmRollElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 100px;
    height: 100px;
    cursor: pointer;
    z-index: 1000;
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;
  
  // 创建SVG用于绘制胶卷圆盘
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100');
  svg.setAttribute('height', '100');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
  
  // 绘制圆形背景
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '50');
  circle.setAttribute('cy', '50');
  circle.setAttribute('r', '45');
  circle.setAttribute('fill', 'rgba(0, 0, 0, 0.6)');
  circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  circle.setAttribute('stroke-width', '2');
  svg.appendChild(circle);
  
  // 绘制圆周上的正方形镂空格子（10个）
  const holeCount = 10;
  const holeSize = 8;
  const holeRadius = 40; // 距离中心的距离
  
  for (let i = 0; i < holeCount; i++) {
    const angle = (i * 360 / holeCount) * Math.PI / 180;
    const x = 50 + holeRadius * Math.cos(angle);
    const y = 50 + holeRadius * Math.sin(angle);
    
    const hole = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hole.setAttribute('x', (x - holeSize / 2).toString());
    hole.setAttribute('y', (y - holeSize / 2).toString());
    hole.setAttribute('width', holeSize.toString());
    hole.setAttribute('height', holeSize.toString());
    hole.setAttribute('fill', 'transparent');
    hole.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
    hole.setAttribute('stroke-width', '1');
    hole.setAttribute('rx', '1');
    svg.appendChild(hole);
  }
  
  filmRollElement.appendChild(svg);
  
  // 创建中心数字显示
  countElement = document.createElement('div');
  countElement.id = 'film-roll-count';
  countElement.textContent = '0';
  countElement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    z-index: 10;
    pointer-events: none;
  `;
  filmRollElement.appendChild(countElement);
  
  // 添加点击事件
  filmRollElement.addEventListener('click', () => {
    if (onClick) {
      onClick();
    }
  });
  
  // 初始状态：灰色，不可点击
  updateFilmRollUI(0);
  
  return filmRollElement;
}

/**
 * 更新UI显示
 * @param {number} count - 当前碎片数量
 */
export function updateFilmRollUI(count) {
  if (!countElement) return;
  
  countElement.textContent = count.toString();
  
  // 更新状态颜色和可点击性
  if (count < 1) {
    // 未达到1个：灰色，不可点击
    filmRollElement.style.opacity = '0.5';
    filmRollElement.style.cursor = 'not-allowed';
    filmRollElement.style.pointerEvents = 'none';
  } else if (count >= 10) {
    // 达到10个：金色，可点击
    filmRollElement.style.opacity = '1';
    filmRollElement.style.cursor = 'pointer';
    filmRollElement.style.pointerEvents = 'auto';
    // 可以添加金色高亮效果
    const circle = filmRollElement.querySelector('circle');
    if (circle) {
      circle.setAttribute('stroke', 'rgba(255, 215, 0, 0.8)');
      circle.setAttribute('stroke-width', '3');
    }
  } else {
    // 达到1个：可点击，显示高亮
    filmRollElement.style.opacity = '1';
    filmRollElement.style.cursor = 'pointer';
    filmRollElement.style.pointerEvents = 'auto';
    const circle = filmRollElement.querySelector('circle');
    if (circle) {
      circle.setAttribute('stroke', 'rgba(100, 200, 255, 0.8)');
      circle.setAttribute('stroke-width', '2');
    }
  }
}

/**
 * 旋转圆盘
 * @param {number} angle - 旋转角度（度）
 */
export function rotateFilmRoll(angle) {
  if (!filmRollElement) return;
  
  currentRotation += angle;
  filmRollElement.style.transform = `rotate(${currentRotation}deg)`;
  
  // 保持数字不旋转（反向旋转）
  if (countElement) {
    countElement.style.transform = `translate(-50%, -50%) rotate(${-currentRotation}deg)`;
  }
}

