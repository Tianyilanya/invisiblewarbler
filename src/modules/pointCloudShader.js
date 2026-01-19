import * as THREE from 'three';

/**
 * 将Mesh的几何体转换为点云几何体
 * @param {THREE.BufferGeometry} geometry - 原始几何体
 * @param {number} pointDensity - 点密度（0-1），控制采样率，1表示使用所有顶点
 * @returns {THREE.BufferGeometry} 点云几何体
 */
export function geometryToPointCloud(geometry, pointDensity = 1.0) {
  // 确保几何体有位置属性
  if (!geometry.attributes.position) {
    console.warn('Geometry has no position attribute');
    return null;
  }

  const positions = geometry.attributes.position;
  const vertexCount = positions.count;
  
  // 根据密度计算采样数量
  const sampleCount = Math.max(1, Math.floor(vertexCount * pointDensity));
  
  // 创建新的BufferGeometry用于点云
  const pointGeometry = new THREE.BufferGeometry();
  const pointPositions = new Float32Array(sampleCount * 3);
  const pointColors = new Float32Array(sampleCount * 3);
  const pointSizes = new Float32Array(sampleCount);
  
  // 如果有颜色属性，使用它；否则使用默认颜色
  const hasColors = geometry.attributes.color !== undefined;
  const colors = hasColors ? geometry.attributes.color : null;
  
  // 如果有法线，可以用于计算点的大小（根据视角）
  const hasNormals = geometry.attributes.normal !== undefined;
  const normals = hasNormals ? geometry.attributes.normal : null;
  
  // 采样顶点
  const step = Math.max(1, Math.floor(vertexCount / sampleCount));
  for (let i = 0; i < sampleCount; i++) {
    const idx = Math.min(i * step, vertexCount - 1);
    const i3 = i * 3;
    
    // 复制位置
    pointPositions[i3] = positions.getX(idx);
    pointPositions[i3 + 1] = positions.getY(idx);
    pointPositions[i3 + 2] = positions.getZ(idx);
    
    // 复制颜色或使用默认
    if (hasColors && colors) {
      pointColors[i3] = colors.getX(idx);
      pointColors[i3 + 1] = colors.getY(idx);
      pointColors[i3 + 2] = colors.getZ(idx);
    } else {
      // 默认棕色系（树干颜色）
      pointColors[i3] = 0.4 + Math.random() * 0.2;
      pointColors[i3 + 1] = 0.25 + Math.random() * 0.15;
      pointColors[i3 + 2] = 0.15 + Math.random() * 0.1;
    }
    
    // 随机点大小，增加自然感
    pointSizes[i] = 0.8 + Math.random() * 0.4;
  }
  
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
  pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));
  pointGeometry.setAttribute('size', new THREE.BufferAttribute(pointSizes, 1));
  
  return pointGeometry;
}

/**
 * 创建点云shader材质
 * @param {Object} options - 配置选项
 * @param {THREE.Color} options.color - 基础颜色
 * @param {number} options.size - 点的基础大小
 * @param {boolean} options.sizeAttenuation - 是否根据距离衰减点大小
 * @param {number} options.opacity - 透明度
 * @returns {THREE.ShaderMaterial} 点云shader材质
 */
export function createPointCloudMaterial(options = {}) {
  const {
    color = new THREE.Color(0x8B4513), // 棕色
    size = 0.15,
    sizeAttenuation = true,
    opacity = 1.0,
    transparent = true
  } = options;

  // 使用PointsMaterial作为基础，然后通过onBeforeCompile自定义shader
  const material = new THREE.PointsMaterial({
    color: color,
    size: size,
    sizeAttenuation: sizeAttenuation,
    transparent: transparent,
    opacity: opacity,
    vertexColors: true
  });

  // 存储自定义uniforms
  material.userData.customUniforms = {
    time: { value: 0.0 }
  };

  // 通过onBeforeCompile修改shader
  material.onBeforeCompile = (shader) => {
    // 添加自定义uniforms
    shader.uniforms.time = material.userData.customUniforms.time;

    // 在vertex shader开头添加time uniform声明
    shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;

    // 修改vertex shader中的点大小计算
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        
        // 自定义点大小计算（在原有的size计算之后）
      `
    );

    // 替换gl_PointSize的计算
    shader.vertexShader = shader.vertexShader.replace(
      /gl_PointSize = size;/g,
      `
        float customSize = size;
        // 脉动效果
        customSize *= (1.0 + sin(time * 2.0 + transformed.y * 10.0) * 0.05);
        gl_PointSize = customSize;
      `
    );

    // 修改fragment shader - 创建圆形点
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
        #include <color_fragment>
        
        // 创建圆形点
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        
        // 中心亮度渐变
        float brightness = 1.0 - dist * 0.5;
        diffuseColor.rgb *= brightness;
        diffuseColor.a *= alpha;
        
        if (diffuseColor.a < 0.01) {
          discard;
        }
      `
    );
  };

  // 添加时间更新方法
  material.updateTime = function(time) {
    if (this.userData.customUniforms && this.userData.customUniforms.time) {
      this.userData.customUniforms.time.value = time;
    }
  };

  return material;
}

/**
 * 将Mesh转换为点云对象
 * @param {THREE.Mesh} mesh - 原始Mesh对象
 * @param {Object} options - 转换选项
 * @returns {THREE.Points} 点云对象
 */
export function meshToPointCloud(mesh, options = {}) {
  const {
    pointDensity = 0.8, // 使用80%的顶点
    materialOptions = {}
  } = options;
  
  // 克隆几何体以避免修改原始对象
  const geometry = mesh.geometry.clone();
  
  // 更新mesh的矩阵（如果还没有更新）
  mesh.updateMatrixWorld(true);
  
  // 创建变换矩阵（位置、旋转、缩放）
  const matrix = new THREE.Matrix4();
  matrix.compose(mesh.position, new THREE.Quaternion().setFromEuler(mesh.rotation), mesh.scale);
  
  // 应用mesh的变换到几何体
  geometry.applyMatrix4(matrix);
  
  // 转换为点云几何体
  const pointGeometry = geometryToPointCloud(geometry, pointDensity);
  
  if (!pointGeometry) {
    return null;
  }
  
  // 创建材质
  const material = createPointCloudMaterial({
    color: mesh.material.color || new THREE.Color(0x8B4513),
    ...materialOptions
  });
  
  // 创建点云对象（位置已经在几何体中应用了）
  const points = new THREE.Points(pointGeometry, material);
  
  // 重置位置，因为变换已经应用到几何体
  points.position.set(0, 0, 0);
  points.rotation.set(0, 0, 0);
  points.scale.set(1, 1, 1);
  
  return points;
}

/**
 * 更新点云材质的时间uniform（用于动画）
 * @param {THREE.Points} points - 点云对象
 * @param {number} time - 时间值
 */
export function updatePointCloudTime(points, time) {
  if (points.material) {
    if (points.material.updateTime) {
      points.material.updateTime(time);
    } else if (points.material.uniforms && points.material.uniforms.time) {
      points.material.uniforms.time.value = time;
    }
  }
}

/**
 * 在模型表面生成密集点云蒙皮（不是基于顶点，而是在表面采样生成点）
 * @param {THREE.Mesh|THREE.Group} meshOrGroup - 要包裹的Mesh或Group对象
 * @param {Object} options - 配置选项
 * @param {number} options.pointCount - 点的数量（默认2000-5000）
 * @param {number} options.pointSize - 点的大小（默认0.03-0.08）
 * @param {number} options.skinThickness - 蒙皮厚度（点可以稍微偏移表面，默认0.01-0.03）
 * @param {THREE.Color} options.color - 基础颜色（如果不提供，使用mesh的颜色）
 * @param {number} options.opacity - 透明度（默认0.7-0.9）
 * @returns {THREE.Points|null} 点云对象
 */
export function createPointCloudSkin(meshOrGroup, options = {}) {
  const {
    pointCount = 2000 + Math.floor(Math.random() * 3000), // 2000-5000个点
    pointSize = 0.03 + Math.random() * 0.05, // 0.03-0.08
    skinThickness = 0.01 + Math.random() * 0.02, // 0.01-0.03
    color = null,
    opacity = 0.7 + Math.random() * 0.2 // 0.7-0.9
  } = options;

  // 收集所有mesh
  const meshes = [];
  meshOrGroup.traverse((child) => {
    if (child.isMesh) {
      meshes.push(child);
    }
  });

  if (meshes.length === 0) {
    console.warn('No meshes found in the object');
    return null;
  }

  // 计算总表面积，用于分配点数
  let totalArea = 0;
  const meshAreas = [];
  
  meshes.forEach((mesh) => {
    mesh.updateMatrixWorld(true);
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    
    // 计算包围盒体积作为面积的近似
    const box = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
    const size = box.getSize(new THREE.Vector3());
    const area = size.x * size.y + size.y * size.z + size.x * size.z;
    totalArea += area;
    meshAreas.push({ mesh, geometry, area });
  });

  // 生成点云几何体
  const pointPositions = new Float32Array(pointCount * 3);
  const pointColors = new Float32Array(pointCount * 3);
  const pointSizes = new Float32Array(pointCount);
  const pointNormals = new Float32Array(pointCount * 3);

  const raycaster = new THREE.Raycaster();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  let pointIndex = 0;

  // 为每个mesh生成点
  meshAreas.forEach(({ mesh, geometry, area }) => {
    const pointsForMesh = Math.floor((area / totalArea) * pointCount);
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const indices = geometry.index;
    
    // 获取mesh的颜色
    let meshColor = color;
    if (!meshColor && mesh.material) {
      if (mesh.material.color) {
        meshColor = mesh.material.color;
      } else if (Array.isArray(mesh.material) && mesh.material[0]?.color) {
        meshColor = mesh.material[0].color;
      }
    }
    if (!meshColor) {
      meshColor = new THREE.Color(0xffffff);
    }

    // 在mesh的包围盒内随机生成点，然后投影到表面
    const box = new THREE.Box3().setFromBufferAttribute(positions);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    // 使用Raycaster进行更高效的表面采样
    const tempMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    const meshForRaycast = new THREE.Group();
    meshForRaycast.add(tempMesh);

    // 采样策略：混合使用顶点采样和表面投影
    const vertexSampleRatio = 0.3; // 30%从顶点采样，70%从表面投影
    const vertexSampleCount = Math.floor(pointsForMesh * vertexSampleRatio);
    const surfaceSampleCount = pointsForMesh - vertexSampleCount;

    // 方法1：从顶点采样（快速）
    if (positions && vertexSampleCount > 0) {
      const step = Math.max(1, Math.floor(positions.count / vertexSampleCount));
      for (let i = 0; i < vertexSampleCount && pointIndex < pointCount; i++) {
        const idx = Math.min(i * step, positions.count - 1);
        const i3 = pointIndex * 3;
        
        pointPositions[i3] = positions.getX(idx);
        pointPositions[i3 + 1] = positions.getY(idx);
        pointPositions[i3 + 2] = positions.getZ(idx);

        // 沿着法线稍微偏移
        if (normals) {
          const normalVec = new THREE.Vector3(normals.getX(idx), normals.getY(idx), normals.getZ(idx));
          const offset = normalVec.multiplyScalar((Math.random() - 0.5) * skinThickness);
          pointPositions[i3] += offset.x;
          pointPositions[i3 + 1] += offset.y;
          pointPositions[i3 + 2] += offset.z;
        }

        const colorVariation = 0.8 + Math.random() * 0.4;
        pointColors[i3] = meshColor.r * colorVariation;
        pointColors[i3 + 1] = meshColor.g * colorVariation;
        pointColors[i3 + 2] = meshColor.b * colorVariation;

        pointSizes[pointIndex] = pointSize * (0.7 + Math.random() * 0.6);

        if (normals) {
          pointNormals[i3] = normals.getX(idx);
          pointNormals[i3 + 1] = normals.getY(idx);
          pointNormals[i3 + 2] = normals.getZ(idx);
        } else {
          pointNormals[i3] = (Math.random() - 0.5) * 2;
          pointNormals[i3 + 1] = Math.abs(Math.random() - 0.5) * 2;
          pointNormals[i3 + 2] = (Math.random() - 0.5) * 2;
        }

        pointIndex++;
      }
    }

    // 方法2：表面投影（更精确但较慢，使用简化算法）
    for (let i = 0; i < surfaceSampleCount && pointIndex < pointCount; i++) {
      // 在包围盒内随机生成点
      point.set(
        center.x + (Math.random() - 0.5) * size.x * 1.1,
        center.y + (Math.random() - 0.5) * size.y * 1.1,
        center.z + (Math.random() - 0.5) * size.z * 1.1
      );

      // 使用Raycaster找到表面点（更高效）
      const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
      ];

      let surfacePoint = null;
      let surfaceNormal = new THREE.Vector3(0, 1, 0);
      let minDist = Infinity;

      // 从多个方向投射射线，找到最近的交点
      for (const dir of directions) {
        raycaster.set(point, dir);
        const intersects = raycaster.intersectObject(tempMesh, false);
        
        if (intersects.length > 0) {
          const dist = intersects[0].distance;
          if (dist < minDist && dist < maxSize) {
            minDist = dist;
            surfacePoint = intersects[0].point.clone();
            surfaceNormal = intersects[0].face.normal.clone();
          }
        }
      }

      // 如果没找到交点，使用简化的最近顶点方法
      if (!surfacePoint && positions) {
        let closestIdx = 0;
        let closestDist = Infinity;
        for (let j = 0; j < Math.min(positions.count, 100); j++) { // 只检查前100个顶点
          const vx = positions.getX(j);
          const vy = positions.getY(j);
          const vz = positions.getZ(j);
          const dist = point.distanceTo(new THREE.Vector3(vx, vy, vz));
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = j;
          }
        }
        surfacePoint = new THREE.Vector3(
          positions.getX(closestIdx),
          positions.getY(closestIdx),
          positions.getZ(closestIdx)
        );
        if (normals) {
          surfaceNormal.set(normals.getX(closestIdx), normals.getY(closestIdx), normals.getZ(closestIdx));
        }
      }

      if (surfacePoint) {
        // 沿着法线稍微偏移，形成蒙皮厚度
        const offset = surfaceNormal.clone().multiplyScalar(
          (Math.random() - 0.5) * skinThickness
        );
        surfacePoint.add(offset);

        const idx = pointIndex * 3;
        pointPositions[idx] = surfacePoint.x;
        pointPositions[idx + 1] = surfacePoint.y;
        pointPositions[idx + 2] = surfacePoint.z;

        const colorVariation = 0.8 + Math.random() * 0.4;
        pointColors[idx] = meshColor.r * colorVariation;
        pointColors[idx + 1] = meshColor.g * colorVariation;
        pointColors[idx + 2] = meshColor.b * colorVariation;

        pointSizes[pointIndex] = pointSize * (0.7 + Math.random() * 0.6);

        pointNormals[idx] = surfaceNormal.x;
        pointNormals[idx + 1] = surfaceNormal.y;
        pointNormals[idx + 2] = surfaceNormal.z;

        pointIndex++;
      }
    }
  });

  // 如果生成的点不够，用随机点填充
  while (pointIndex < pointCount) {
    const idx = pointIndex * 3;
    const meshData = meshAreas[Math.floor(Math.random() * meshAreas.length)];
    const box = new THREE.Box3().setFromBufferAttribute(meshData.geometry.attributes.position);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    pointPositions[idx] = center.x + (Math.random() - 0.5) * size.x;
    pointPositions[idx + 1] = center.y + (Math.random() - 0.5) * size.y;
    pointPositions[idx + 2] = center.z + (Math.random() - 0.5) * size.z;

    const meshColor = color || (meshData.mesh.material?.color || new THREE.Color(0xffffff));
    const colorVariation = 0.8 + Math.random() * 0.4;
    pointColors[idx] = meshColor.r * colorVariation;
    pointColors[idx + 1] = meshColor.g * colorVariation;
    pointColors[idx + 2] = meshColor.b * colorVariation;

    pointSizes[pointIndex] = pointSize * (0.7 + Math.random() * 0.6);
    pointNormals[idx] = (Math.random() - 0.5) * 2;
    pointNormals[idx + 1] = (Math.random() - 0.5) * 2;
    pointNormals[idx + 2] = (Math.random() - 0.5) * 2;
    pointNormals[idx + 1] = Math.abs(pointNormals[idx + 1]); // 确保向上

    pointIndex++;
  }

  // 创建点云几何体
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
  pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));
  pointGeometry.setAttribute('size', new THREE.BufferAttribute(pointSizes, 1));
  pointGeometry.setAttribute('normal', new THREE.BufferAttribute(pointNormals, 3));

  // 创建材质
  const baseColor = color || (meshes[0]?.material?.color || new THREE.Color(0xffffff));
  const material = createPointCloudMaterial({
    color: baseColor,
    size: pointSize,
    sizeAttenuation: true,
    opacity: opacity,
    transparent: true
  });

  // 创建点云对象
  const points = new THREE.Points(pointGeometry, material);
  
  // 继承原始对象的位置和旋转
  points.position.copy(meshOrGroup.position);
  points.rotation.copy(meshOrGroup.rotation);
  points.scale.copy(meshOrGroup.scale);

  return points;
}

