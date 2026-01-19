import * as THREE from 'three';
import { createPointCloudSkin } from './pointCloudShader';
import birdComponentLibrary from './birdComponentLibrary.js';

/**
 * 从材质中提取颜色信息
 * @param {THREE.Material} material - Three.js材质对象
 * @returns {number} 颜色值（十六进制）
 */
function extractColorFromMaterial(material) {
  if (!material) return Math.random() * 0xffffff;
  
  if (material.color) {
    return material.color.getHex();
  }
  
  return Math.random() * 0xffffff;
}

/**
 * 从材质中提取其他属性
 * @param {THREE.Material} material - Three.js材质对象
 * @returns {Object} 材质属性 {roughness, opacity, transparent, flatShading}
 */
function extractMaterialProperties(material) {
  if (!material) {
    return {
      roughness: 0.4,
      opacity: 1.0,
      transparent: false,
      flatShading: true
    };
  }
  
  return {
    roughness: material.roughness !== undefined ? material.roughness : 0.4,
    opacity: material.opacity !== undefined ? material.opacity : 1.0,
    transparent: material.transparent !== undefined ? material.transparent : false,
    flatShading: material.flatShading !== undefined ? material.flatShading : true
  };
}

/**
 * 生成单一身体部位碎片
 * @param {string} partType - 部位类型: 'head' | 'chest' | 'belly' | 'wing' | 'tail' | 'foot'
 * @param {Object} options - 配置选项
 * @param {THREE.Material} options.material - 原始材质（用于提取颜色和属性）
 * @param {number} options.color - 颜色值（如果提供，优先使用）
 * @param {Object} options.materialProps - 材质属性（如果提供，优先使用）
 * @returns {THREE.Group} 碎片3D对象
 */
export async function createBirdFragment(partType, options = {}) {
  const {
    usePointCloudSkin = true,
    material = null,
    color = null,
    materialProps = null,
    useGLBComponents = true
  } = options;
  
  const group = new THREE.Group();

  // 尝试使用GLB组件
  if (useGLBComponents && birdComponentLibrary.isLoaded()) {
    const component = birdComponentLibrary.getRandomComponent(partType);
    if (component) {
      const fragmentModel = component.model.clone();

      // 应用材质信息（如果提供）
      if (material || color || materialProps) {
        const extractedColor = color !== null ? color : extractColorFromMaterial(material);
        const extractedProps = materialProps !== null ? materialProps : extractMaterialProperties(material);

        applyMaterialToModel(fragmentModel, extractedColor, extractedProps);
      }

      // 设置用户数据
      fragmentModel.userData.partType = partType;
      fragmentModel.userData.componentId = component.id;
      fragmentModel.userData.seed = Math.random().toString(36).slice(2, 10);

      group.add(fragmentModel);

      // 应用点云蒙皮
      if (usePointCloudSkin) {
        const pointCloudSkin = createPointCloudSkin(group, {
          pointCount: 800 + Math.floor(Math.random() * 1200),
          pointSize: 0.04 + Math.random() * 0.06,
          skinThickness: 0.008 + Math.random() * 0.015,
          opacity: 0.75 + Math.random() * 0.2
        });

        if (pointCloudSkin) {
          group.traverse((child) => {
            if (child.isMesh) {
              child.visible = false;
            }
          });

          group.add(pointCloudSkin);
          group.userData.pointCloud = pointCloudSkin;
        }
      }

      return group;
    }
  }

  // 回退到几何体生成
  return createFragmentFromGeometry(partType, options);
}

/**
 * 从几何体生成碎片（保留原始实现作为回退）
 */
function createFragmentFromGeometry(partType, options) {
  const {
    usePointCloudSkin = true,
    material = null,
    color = null,
    materialProps = null
  } = options;

  const group = new THREE.Group();

  // 提取材质信息
  const extractedColor = color !== null ? color : extractColorFromMaterial(material);
  const extractedProps = materialProps !== null ? materialProps : extractMaterialProperties(material);

  // 基础尺寸参考
  const baseSize = 0.5 + Math.random() * 0.3;

  switch (partType) {
    case 'head': {
      // 头部：球体 + 可选眼睛
      const headRadius = baseSize * (0.37 + Math.random() * 0.13);
      const headMaterial = new THREE.MeshStandardMaterial({
        color: extractedColor,
        roughness: extractedProps.roughness || (0.33 + Math.random() * 0.16),
        flatShading: extractedProps.flatShading
      });
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(headRadius, 13, 11),
        headMaterial
      );
      head.position.set(0, 0, 0);
      head.rotation.x = Math.random() * 0.2;
      group.add(head);
      
      // 偶尔加眼睛
      if (Math.random() < 0.6) {
        const eye = new THREE.Mesh(
          new THREE.SphereGeometry(headRadius * 0.15, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x1f2220 })
        );
        eye.position.set(0.15 - Math.random() * 0.12, 0.1, headRadius * 0.9 - Math.random() * 0.08);
        group.add(eye);
      }
      break;
    }
    
    case 'chest': {
      // 胸部：主体球体（较大）
      const chestRadius = baseSize * (0.8 + Math.random() * 0.4);
      const chestMaterial = new THREE.MeshStandardMaterial({
        color: extractedColor,
        roughness: extractedProps.roughness || 0.4,
        flatShading: extractedProps.flatShading
      });
      const chest = new THREE.Mesh(
        new THREE.SphereGeometry(chestRadius, 28, 28),
        chestMaterial
      );
      chest.position.set(0, 0, 0);
      group.add(chest);
      break;
    }
    
    case 'belly': {
      // 腹部：主体球体（稍小）
      const bellyRadius = baseSize * (0.6 + Math.random() * 0.3);
      const bellyMaterial = new THREE.MeshStandardMaterial({
        color: extractedColor,
        roughness: extractedProps.roughness || 0.4,
        flatShading: extractedProps.flatShading
      });
      const belly = new THREE.Mesh(
        new THREE.SphereGeometry(bellyRadius, 28, 28),
        bellyMaterial
      );
      belly.position.set(0, 0, 0);
      group.add(belly);
      break;
    }
    
    case 'wing': {
      // 翅膀：半圆球，1-2个
      const wingCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < wingCount; i++) {
        const wingRadius = baseSize * (0.3 + Math.random() * 0.15);
        const wingGeom = new THREE.SphereGeometry(wingRadius, 18, 15, 0, Math.PI);
        const wingMat = new THREE.MeshStandardMaterial({
          color: extractedColor,
          flatShading: extractedProps.flatShading,
          transparent: extractedProps.transparent !== undefined ? extractedProps.transparent : true,
          opacity: extractedProps.opacity !== undefined ? extractedProps.opacity : (0.7 + 0.3 * Math.random())
        });
        const wing = new THREE.Mesh(wingGeom, wingMat);
        wing.position.set(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.2
        );
        wing.rotation.z = (Math.random() - 0.4) * 1.1;
        wing.rotation.y = Math.random() * Math.PI * 2;
        group.add(wing);
      }
      break;
    }
    
    case 'tail': {
      // 尾部：盒子/装饰几何体
      const tailSize = baseSize * 0.4;
      const tailGeom = new THREE.BoxGeometry(
        tailSize * 0.5,
        tailSize * 0.3,
        tailSize * 0.7
      );
      const tailMat = new THREE.MeshStandardMaterial({
        color: extractedColor,
        opacity: extractedProps.opacity !== undefined ? extractedProps.opacity : (0.7 + 0.3 * Math.random()),
        transparent: extractedProps.transparent !== undefined ? extractedProps.transparent : true
      });
      const tail = new THREE.Mesh(tailGeom, tailMat);
      tail.position.set(0, 0, 0);
      tail.rotation.x = Math.random() * Math.PI;
      tail.rotation.y = Math.random() * Math.PI;
      group.add(tail);
      break;
    }
    
    case 'foot': {
      // 足部：小几何体（圆柱/球体）
      const footType = Math.random() < 0.5 ? 'cylinder' : 'sphere';
      if (footType === 'cylinder') {
        const footRadius = baseSize * 0.1;
        const footHeight = baseSize * 0.3;
        const footGeom = new THREE.CylinderGeometry(footRadius, footRadius, footHeight, 8);
        const footMat = new THREE.MeshStandardMaterial({
          color: extractedColor,
          flatShading: extractedProps.flatShading
        });
        const foot = new THREE.Mesh(footGeom, footMat);
        foot.position.set(0, 0, 0);
        foot.rotation.x = Math.random() * Math.PI * 2;
        group.add(foot);
      } else {
        const footRadius = baseSize * 0.15;
        const footGeom = new THREE.SphereGeometry(footRadius, 10, 10);
        const footMat = new THREE.MeshStandardMaterial({
          color: extractedColor,
          flatShading: extractedProps.flatShading
        });
        const foot = new THREE.Mesh(footGeom, footMat);
        foot.position.set(0, 0, 0);
        group.add(foot);
      }
      break;
    }
    
    default:
      console.warn(`Unknown part type: ${partType}`);
      return group;
  }
  
  // 设置用户数据
  group.userData.partType = partType;
  group.userData.seed = Math.random().toString(36).slice(2, 10);
  
  // 如果启用点云蒙皮，创建点云版本
  if (usePointCloudSkin) {
    // 使用提取的颜色创建点云
    const pointCloudColor = new THREE.Color(extractedColor);
    const pointCloudSkin = createPointCloudSkin(group, {
      pointCount: 800 + Math.floor(Math.random() * 1200), // 碎片较小，点数也少一些
      pointSize: 0.04 + Math.random() * 0.06,
      skinThickness: 0.008 + Math.random() * 0.015,
      opacity: extractedProps.opacity !== undefined ? extractedProps.opacity * 0.9 : (0.75 + Math.random() * 0.2),
      color: pointCloudColor
    });
    
    if (pointCloudSkin) {
      // 隐藏原始mesh，只显示点云
      group.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
        }
      });
      
      // 将点云添加到组中
      group.add(pointCloudSkin);
      group.userData.pointCloud = pointCloudSkin;
    }
  }
  
  return group;
}

/**
 * 为GLB模型应用材质
 */
function applyMaterialToModel(model, color, materialProps) {
  model.traverse((child) => {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => {
          if (color !== undefined) mat.color.set(color);
          if (materialProps) {
            Object.assign(mat, materialProps);
          }
        });
      } else {
        if (color !== undefined) child.material.color.set(color);
        if (materialProps) {
          Object.assign(child.material, materialProps);
        }
      }
    }
  });
}
