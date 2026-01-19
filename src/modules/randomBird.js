import * as THREE from 'three';
import { createPointCloudSkin } from './pointCloudShader';
import birdComponentLibrary from './birdComponentLibrary.js';

// 随机伪鸟生物生成器
export async function createRandomBird(options = {}) {
  const { usePointCloudSkin = true, useGLBComponents = true } = options;

  // 确保组件库已加载
  if (useGLBComponents && !birdComponentLibrary.isLoaded()) {
    await birdComponentLibrary.initialize();
  }

  const group = new THREE.Group();

  // 根据组件库生成鸟类
  if (useGLBComponents && birdComponentLibrary.isLoaded()) {
    await createBirdFromComponents(group, options);
  } else {
    // 回退到原始几何体生成
    createBirdFromGeometry(group, options);
  }

  return group;
}

/**
 * 从GLB组件生成鸟类
 */
async function createBirdFromComponents(group, options) {
  const { usePointCloudSkin = true } = options;

  console.log('开始从GLB组件生成鸟类...');

  // 1. 胸部（必须）
  let chestModel = null;
  const chestComponent = birdComponentLibrary.getRandomComponent('chest');
  if (chestComponent) {
    chestModel = chestComponent.model;
    chestModel.userData.partType = 'chest';
    chestModel.userData.componentId = chestComponent.id;
    group.add(chestModel);
    console.log(`添加胸部组件: ${chestComponent.fileName}`);
  } else {
    console.warn('No chest component found, using fallback geometry');
    const bodyRadius = 0.6 + Math.random() * 0.5;
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.4,
      flatShading: true
    });
    chestModel = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius, 28, 28), bodyMaterial);
    chestModel.userData.partType = 'chest';
    chestModel.userData.componentId = 'fallback_chest';
    group.add(chestModel);
  }

  // 2. 头部（可选）
  if (Math.random() < 0.8) {
    const headComponent = birdComponentLibrary.getRandomComponent('head');
    if (headComponent) {
      // 简单定位：头部在胸部正上方
      headComponent.model.position.y = 1.0;
      headComponent.model.position.z = 0.2;

      headComponent.model.userData.partType = 'head';
      headComponent.model.userData.componentId = headComponent.id;
      group.add(headComponent.model);
      console.log(`添加头部组件: ${headComponent.fileName}`);
    }
  }

  // 3. 腹部（可选）
  if (Math.random() < 0.6) {
    const bellyComponent = birdComponentLibrary.getRandomComponent('belly');
    if (bellyComponent) {
      // 简单定位：腹部在胸部正下方
      bellyComponent.model.position.y = -0.8;

      bellyComponent.model.userData.partType = 'belly';
      bellyComponent.model.userData.componentId = bellyComponent.id;
      group.add(bellyComponent.model);
      console.log(`添加腹部组件: ${bellyComponent.fileName}`);
    }
  }

  // 4. 翅膀（左右各一个）
  // 左翅膀
  const leftWingComponent = birdComponentLibrary.getRandomComponent('wing');
  if (leftWingComponent) {
    leftWingComponent.model.position.x = -1.2; // 左边
    leftWingComponent.model.position.y = 0;
    leftWingComponent.model.position.z = 0.1;
    leftWingComponent.model.rotation.z = -0.3; // 稍微向下倾斜

    leftWingComponent.model.userData.partType = 'wing';
    leftWingComponent.model.userData.componentId = leftWingComponent.id;
    group.add(leftWingComponent.model);
    console.log(`添加左翅膀组件: ${leftWingComponent.fileName}`);
  }

  // 右翅膀
  const rightWingComponent = birdComponentLibrary.getRandomComponent('wing');
  if (rightWingComponent) {
    rightWingComponent.model.position.x = 1.2; // 右边
    rightWingComponent.model.position.y = 0;
    rightWingComponent.model.position.z = 0.1;
    rightWingComponent.model.rotation.z = 0.3; // 稍微向上倾斜

    rightWingComponent.model.userData.partType = 'wing';
    rightWingComponent.model.userData.componentId = rightWingComponent.id;
    group.add(rightWingComponent.model);
    console.log(`添加右翅膀组件: ${rightWingComponent.fileName}`);
  }

  // 5. 尾部（可选）
  if (Math.random() < 0.5) {
    const tailComponent = birdComponentLibrary.getRandomComponent('tail');
    if (tailComponent) {
      // 简单定位：尾部在后方
      tailComponent.model.position.z = -1.0;
      tailComponent.model.position.y = -0.2;
      tailComponent.model.rotation.x = 0.2; // 稍微向下倾斜

      tailComponent.model.userData.partType = 'tail';
      tailComponent.model.userData.componentId = tailComponent.id;
      group.add(tailComponent.model);
      console.log(`添加尾部组件: ${tailComponent.fileName}`);
    }
  }

  // 6. 足部（可选）
  if (Math.random() < 0.7) {
    // 左足
    const leftFootComponent = birdComponentLibrary.getRandomComponent('foot');
    if (leftFootComponent) {
      leftFootComponent.model.position.x = -0.3;
      leftFootComponent.model.position.y = -1.2;
      leftFootComponent.model.position.z = 0.2;

      leftFootComponent.model.userData.partType = 'foot';
      leftFootComponent.model.userData.componentId = leftFootComponent.id;
      group.add(leftFootComponent.model);
      console.log(`添加左足组件: ${leftFootComponent.fileName}`);
    }

    // 右足
    const rightFootComponent = birdComponentLibrary.getRandomComponent('foot');
    if (rightFootComponent) {
      rightFootComponent.model.position.x = 0.3;
      rightFootComponent.model.position.y = -1.2;
      rightFootComponent.model.position.z = 0.2;

      rightFootComponent.model.userData.partType = 'foot';
      rightFootComponent.model.userData.componentId = rightFootComponent.id;
      group.add(rightFootComponent.model);
      console.log(`添加右足组件: ${rightFootComponent.fileName}`);
    }
  }

  // 应用随机缩放和颜色变体
  applyRandomVariations(group);

  // 设置用户数据
  group.userData = {
    seed: Math.random().toString(36).slice(2, 10),
    generatedFrom: 'glb_components'
  };

  // 应用点云蒙皮
  if (usePointCloudSkin) {
    const pointCloudSkin = createPointCloudSkin(group, {
      pointCount: 1500 + Math.floor(Math.random() * 2000),
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
}

/**
 * 应用随机变体（缩放、颜色等）
 */
function applyRandomVariations(group) {
  const scale = 0.8 + Math.random() * 0.4; // 0.8-1.2倍缩放
  group.scale.set(scale, scale, scale);

  // 为不同组件应用轻微的颜色变体
  group.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => applyColorVariation(mat));
      } else {
        applyColorVariation(child.material);
      }
    }
  });
}

/**
 * 应用颜色变体
 */
function applyColorVariation(material) {
  if (material.color) {
    const hsl = material.color.getHSL({ h: 0, s: 0, l: 0 });
    // 轻微调整色相和饱和度
    material.color.setHSL(
      hsl.h + (Math.random() - 0.5) * 0.1,
      Math.max(0, Math.min(1, hsl.s + (Math.random() - 0.5) * 0.2)),
      hsl.l
    );
  }
}

/**
 * 回退到几何体生成的鸟类（原始实现）
 */
function createBirdFromGeometry(group, options) {
  const { usePointCloudSkin = true } = options;

  // 主体球体（胸部）
  const bodyRadius = 0.6 + Math.random() * 0.5;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, roughness: 0.4, flatShading: true });
  const body = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius, 28, 28), bodyMaterial);
  body.userData.partType = 'chest'; // 标记为胸部
  group.add(body);

  // 随机翅膀（随机数量，位置、造型、颜色）
  const wingCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < wingCount; i++) {
    const wingGeom = new THREE.SphereGeometry(0.3 + Math.random() * 0.15, 18, 15, 0, Math.PI);
    const wingMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, flatShading: true, transparent: true, opacity: 0.7 + 0.3*Math.random() });
    const wing = new THREE.Mesh(wingGeom, wingMat);
    wing.position.set(Math.sin(i * Math.PI * 2 / wingCount) * (bodyRadius + 0.25), 0, Math.cos(i * Math.PI * 2 / wingCount) * (bodyRadius + 0.1));
    wing.rotation.z = (Math.random() - 0.4) * 1.1;
    wing.rotation.y = Math.random() * Math.PI * 2;
    wing.userData.partType = 'wing'; // 标记为翅膀
    group.add(wing);
  }

  // 「头部」特征：球体装饰
  const headGeo = new THREE.SphereGeometry(bodyRadius * (0.37 + Math.random()*0.13), 13, 11);
  const headMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, roughness: 0.33 + Math.random()*0.16, flatShading: true });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, bodyRadius + 0.28 + Math.random()*0.09, 0.1-bodyRadius*0.1);
  head.rotation.x = Math.random() * 0.2;
  head.userData.partType = 'head'; // 标记为头部
  group.add(head);

  // 偶尔加独眼（属于头部的一部分）
  if(Math.random() < 0.6) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.15, 10, 10), new THREE.MeshStandardMaterial({ color: 0x1f2220 }));
    eye.position.set(0.15-Math.random()*0.12, bodyRadius + 0.41, bodyRadius*0.90-Math.random()*0.08);
    eye.userData.partType = 'head'; // 眼睛也属于头部
    group.add(eye);
  }

  // 随机点缀/尾部
  if (Math.random() < 0.4) {
    const deco = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.09, 0.29), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, opacity: 0.7 + 0.3*Math.random(), transparent: true }));
    deco.position.set((Math.random()-0.5)*bodyRadius, -bodyRadius - 0.25, Math.random()*0.45);
    deco.rotation.x = Math.random()*Math.PI;
    deco.rotation.y = Math.random()*Math.PI;
    deco.userData.partType = 'tail'; // 标记为尾部
    group.add(deco);
  }

  group.userData = { seed: Math.random().toString(36).slice(2, 10) };

  // 如果启用点云蒙皮，创建点云版本
  if (usePointCloudSkin) {
    const pointCloudSkin = createPointCloudSkin(group, {
      pointCount: 1500 + Math.floor(Math.random() * 2000), // 1500-3500个点，鸟类较小
      pointSize: 0.04 + Math.random() * 0.06, // 0.04-0.10
      skinThickness: 0.008 + Math.random() * 0.015, // 0.008-0.023，更薄的蒙皮
      opacity: 0.75 + Math.random() * 0.2 // 0.75-0.95
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
}
