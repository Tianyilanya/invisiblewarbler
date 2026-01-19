import * as THREE from 'three';
import { synthesizeCreature } from '../modules/aiSynthesis';
import { updatePointCloudTime } from '../modules/pointCloudShader';

let resultPageElement = null;
let loadingElement = null;
let scene = null;
let camera = null;
let renderer = null;
let creature = null;
let animationId = null;
let time = 0;

/**
 * 显示加载状态
 */
export function showLoadingUI() {
  if (!resultPageElement) return;
  
  if (!loadingElement) {
    loadingElement = document.createElement('div');
    loadingElement.id = 'synthesis-loading';
    loadingElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2001;
      text-align: center;
      color: white;
    `;
    
    // 转圈圈动画
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      margin: 0 auto 20px;
      animation: spin 1s linear infinite;
    `;
    
    // 添加CSS动画
    if (!document.getElementById('synthesis-loading-style')) {
      const style = document.createElement('style');
      style.id = 'synthesis-loading-style';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    const text = document.createElement('div');
    text.textContent = '正在合成...';
    text.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    `;
    
    loadingElement.appendChild(spinner);
    loadingElement.appendChild(text);
  }
  
  resultPageElement.appendChild(loadingElement);
  loadingElement.style.display = 'block';
}

/**
 * 隐藏加载状态
 */
export function hideLoadingUI() {
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

/**
 * 显示合成结果页面并开始合成
 * @param {Array} fragments - 碎片数组
 */
export async function showSynthesisResultPage(fragments) {
  // 创建结果页面容器
  if (!resultPageElement) {
    resultPageElement = document.createElement('div');
    resultPageElement.id = 'synthesis-result-page';
    resultPageElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 2000;
      display: none;
    `;
    document.body.appendChild(resultPageElement);
  }
  
  // 显示页面
  resultPageElement.style.display = 'block';
  
  // 显示加载状态
  showLoadingUI();
  
  // 创建Three.js场景
  if (!scene) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    // 创建摄像机
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    resultPageElement.appendChild(renderer.domElement);
    
    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    // 添加轨道控制器（如果需要）
    // 可以添加鼠标控制旋转
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
      if (isDragging && creature) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // 处理窗口大小变化
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  // 清理之前的模型
  if (creature) {
    scene.remove(creature);
    creature.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    creature = null;
  }
  
  try {
    // 异步合成
    creature = await synthesizeCreature(fragments);
    
    // 隐藏加载状态
    hideLoadingUI();
    
    // 计算模型的包围盒和中心点
    const box = new THREE.Box3().setFromObject(creature);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // 将模型中心移动到原点 (0, 0, 0)
    // 这样旋转中心就会在模型中心
    creature.position.sub(center);
    
    // 将模型添加到场景
    scene.add(creature);
    
    // 调整摄像机位置以适应模型（现在模型中心在原点）
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;
    camera.position.set(0, maxDim * 0.3, distance);
    camera.lookAt(0, 0, 0);
    
    // 创建控制按钮
    createControlButtons();
    
    // 开始动画循环
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    animate();
    
  } catch (error) {
    console.error('Synthesis failed:', error);
    hideLoadingUI();
    // 显示错误信息
    const errorMsg = document.createElement('div');
    errorMsg.textContent = '合成失败，请重试';
    errorMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 20px;
      z-index: 2002;
    `;
    resultPageElement.appendChild(errorMsg);
  }
}

/**
 * 创建控制按钮
 */
function createControlButtons() {
  // 移除旧按钮
  const oldButtons = resultPageElement.querySelectorAll('.synthesis-button');
  oldButtons.forEach(btn => btn.remove());
  
  // 继续探索按钮
  const continueBtn = document.createElement('button');
  continueBtn.textContent = '继续探索';
  continueBtn.className = 'synthesis-button';
  continueBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 30px;
    font-size: 16px;
    background: rgba(100, 200, 255, 0.8);
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    z-index: 2001;
    transition: background 0.3s;
  `;
  continueBtn.addEventListener('mouseenter', () => {
    continueBtn.style.background = 'rgba(100, 200, 255, 1)';
  });
  continueBtn.addEventListener('mouseleave', () => {
    continueBtn.style.background = 'rgba(100, 200, 255, 0.8)';
  });
  continueBtn.addEventListener('click', () => {
    hideSynthesisResultPage();
    // 触发关闭事件
    window.dispatchEvent(new Event('synthesisPageClosed'));
  });
  resultPageElement.appendChild(continueBtn);
}

/**
 * 动画循环
 */
function animate() {
  animationId = requestAnimationFrame(animate);
  time += 0.01;
  
  // 更新点云shader时间
  if (creature) {
    creature.traverse((child) => {
      if (child.isPoints && child.material.uniforms && child.material.uniforms.time) {
        updatePointCloudTime(child, time);
      }
    });
    
    // 缓慢旋转模型
    creature.rotation.y += 0.005;
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

/**
 * 隐藏结果页面，返回主场景
 */
export function hideSynthesisResultPage() {
  if (resultPageElement) {
    resultPageElement.style.display = 'none';
  }
  
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // 清理模型
  if (creature && scene) {
    scene.remove(creature);
    creature.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    creature = null;
  }
}

