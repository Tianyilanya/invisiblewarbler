# 模型替换说明文档

## ⚠️ **重要：GLB压缩兼容性警告**

### 🚨 **鸟类组件GLB文件已使用高级压缩**

所有 `bird_components/` 文件夹中的GLB文件已使用 `gltf-transform` 进行高级优化，包含以下**必需扩展**：

- 🗜️ **`EXT_meshopt_compression`** - Meshopt几何压缩（必需）
- 🖼️ **`EXT_texture_webp`** - WebP纹理压缩（必需）
- 📐 **`KHR_mesh_quantization`** - 网格量化（必需）

#### **Blender兼容性**:
❌ **Blender无法直接打开这些压缩后的GLB文件**

#### **Three.js加载要求**:
需要配置Meshopt解码器才能正确加载：

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// 配置Meshopt解码器（必需！）
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

// 现在可以加载压缩后的GLB文件
loader.load('bird_components/belly/belly (2).glb', (gltf) => {
    scene.add(gltf.scene);
});
```

#### **优化效果**:
- ✅ **压缩率**: 86.4%（44.99MB → 6.11MB）
- ✅ **加载速度**: 大幅提升
- ✅ **视觉质量**: 保持不变

#### **如果不想使用压缩**:
可以重新导出原始GLB文件（不使用gltf-transform优化），然后它们就能在Blender中正常打开。

---

## 📁 文件夹说明

此文件夹用于存放丛林场景中使用的3D模型文件（OBJ格式）。

## 🔄 替换模型的步骤

### 第一步：准备模型文件

1. **模型格式要求**
   - 支持格式：`.obj` 文件
   - 建议模型大小：每个模型文件不超过 2MB
   - 模型尺寸：建议单个模型在 0.1 - 0.5 米范围内（可在代码中缩放）

2. **模型命名建议**
   - 使用有意义的名称，如：`debris1.obj`, `debris2.obj`, `wood_pile.obj` 等
   - 避免使用中文或特殊字符

3. **将模型文件放入此文件夹**
   ```
   public/models/
   ├── debris1.obj
   ├── debris2.obj
   ├── debris3.obj
   └── ...
   ```

### 第二步：修改代码配置

打开 `src/index.js` 文件，找到创建丛林场景的代码（约第38-46行），修改配置：

**修改前：**
```javascript
const jungle = createJungleSceneGroup({
  usePointCloud: true,
  clusterCount: 10,
  // modelPaths: ['models/debris1.obj', 'models/debris2.obj', ...], // 后期添加模型路径
  modelsFolder: 'models/' // 模型文件夹路径
});
```

**修改后：**
```javascript
const jungle = createJungleSceneGroup({
  usePointCloud: true,
  clusterCount: 10, // 灌木丛数量（8-15个）
  modelPaths: [
    'models/debris1.obj',
    'models/debris2.obj',
    'models/debris3.obj',
    // 添加更多模型路径...
  ],
  modelsFolder: 'models/' // 模型文件夹路径
});
```

### 第三步：修改模型加载函数

打开 `src/modules/jungleScene.js` 文件，找到 `loadModel()` 函数（约第12-36行），将立方体生成代码替换为OBJ加载代码：

**修改前（使用立方体占位）：**
```javascript
function loadModel(modelPath = null) {
  // TODO: 后期替换为OBJ加载
  // import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
  // const loader = new OBJLoader();
  // const object = await loader.loadAsync(modelPath);
  // return object;
  
  // 目前使用随机立方体代替
  const size = 0.15 + Math.random() * 0.25;
  const geometry = new THREE.BoxGeometry(size, size, size);
  // ... 立方体生成代码
}
```

**修改后（使用OBJ加载）：**
```javascript
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

async function loadModel(modelPath = null) {
  if (!modelPath) {
    // 如果没有提供路径，使用默认立方体
    const size = 0.15 + Math.random() * 0.25;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${20 + Math.random() * 30}, ${30 + Math.random() * 30}%, ${15 + Math.random() * 20}%)`),
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    });
    return new THREE.Mesh(geometry, material);
  }
  
  // 加载OBJ模型
  const loader = new OBJLoader();
  try {
    const object = await loader.loadAsync(modelPath);
    
    // 遍历模型中的所有网格，应用材质
    object.traverse((child) => {
      if (child.isMesh) {
        // 应用材质（可以根据需要调整）
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(`hsl(${20 + Math.random() * 30}, ${30 + Math.random() * 30}%, ${15 + Math.random() * 20}%)`),
          roughness: 0.85,
          metalness: 0.05,
          flatShading: true
        });
      }
    });
    
    // 可选：缩放模型到合适大小
    const scale = 0.2 + Math.random() * 0.3; // 根据实际模型大小调整
    object.scale.set(scale, scale, scale);
    
    return object;
  } catch (error) {
    console.error('加载模型失败:', modelPath, error);
    // 加载失败时返回默认立方体
    const size = 0.15 + Math.random() * 0.25;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.85,
      metalness: 0.05
    });
    return new THREE.Mesh(geometry, material);
  }
}
```

**注意：** 由于 `loadModel()` 现在是异步函数，需要修改调用它的地方。在 `createDebrisPile()` 函数中（约第50-100行），需要将同步调用改为异步：

```javascript
// 修改前
const piece = loadModel(modelPath);

// 修改后
const piece = await loadModel(modelPath);
```

同时，`createDebrisPile()` 和 `createBushCluster()` 函数也需要改为 `async` 函数。

### 第四步：处理异步加载

由于模型加载是异步的，需要修改以下函数：

1. **`createDebrisPile()`** - 改为 `async function createDebrisPile(...)`
2. **`createBushCluster()`** - 改为 `async function createBushCluster(...)`
3. **`createJungleSceneGroup()`** - 改为 `async function createJungleSceneGroup(...)`

在 `createJungleSceneGroup()` 中调用 `createBushCluster()` 时使用 `await`：

```javascript
for (let i = 0; i < clusterCount; i++) {
  const cluster = await createBushCluster({
    // ... 参数
  });
  // ...
}
```

在 `src/index.js` 中调用时也需要使用 `await`：

```javascript
const jungle = await createJungleSceneGroup({
  // ... 配置
});
```

## 📝 完整示例代码

### `src/modules/jungleScene.js` 修改示例

```javascript
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { meshToPointCloud } from './pointCloudShader';

// 模型加载函数（异步）
async function loadModel(modelPath = null) {
  if (!modelPath) {
    // 默认立方体
    const size = 0.15 + Math.random() * 0.25;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${20 + Math.random() * 30}, ${30 + Math.random() * 30}%, ${15 + Math.random() * 20}%)`),
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    });
    return new THREE.Mesh(geometry, material);
  }
  
  const loader = new OBJLoader();
  try {
    const object = await loader.loadAsync(modelPath);
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(`hsl(${20 + Math.random() * 30}, ${30 + Math.random() * 30}%, ${15 + Math.random() * 20}%)`),
          roughness: 0.85,
          metalness: 0.05,
          flatShading: true
        });
      }
    });
    const scale = 0.2 + Math.random() * 0.3;
    object.scale.set(scale, scale, scale);
    return object;
  } catch (error) {
    console.error('加载模型失败:', modelPath, error);
    // 返回默认立方体
    const size = 0.15 + Math.random() * 0.25;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.85 });
    return new THREE.Mesh(geometry, material);
  }
}

// 杂物堆生成函数（异步）
async function createDebrisPile({ pieceCount = 5, modelPaths = [], usePointCloud = true } = {}) {
  const pile = new THREE.Group();
  const pieces = [];
  
  for (let i = 0; i < pieceCount; i++) {
    const modelPath = getRandomModelPath(modelPaths);
    const piece = await loadModel(modelPath); // 使用 await
    
    // ... 其余代码保持不变
  }
  
  // ... 其余代码
}

// 灌木丛生成函数（异步）
async function createBushCluster({ pileCount = 6, width = 2, depth = 2, modelPaths = [], usePointCloud = true } = {}) {
  const cluster = new THREE.Group();
  const piles = [];
  
  for (let i = 0; i < pileCount; i++) {
    const pile = await createDebrisPile({ // 使用 await
      pieceCount: 3 + Math.floor(Math.random() * 6),
      modelPaths: modelPaths,
      usePointCloud: usePointCloud
    });
    // ... 其余代码
  }
  
  // ... 其余代码
}

// 主函数（异步）
export async function createJungleSceneGroup(options = {}) {
  // ... 配置代码
  
  for (let i = 0; i < clusterCount; i++) {
    const cluster = await createBushCluster({ // 使用 await
      pileCount: 4 + Math.floor(Math.random() * 7),
      width: 1.5 + Math.random() * 2.5,
      depth: 1.5 + Math.random() * 2.5,
      modelPaths: modelPaths,
      usePointCloud: usePointCloud
    });
    // ... 其余代码
  }
  
  // ... 其余代码
}
```

### `src/index.js` 修改示例

```javascript
// 创建场景（异步）
const jungle = await createJungleSceneGroup({
  usePointCloud: true,
  clusterCount: 10,
  modelPaths: [
    'models/debris1.obj',
    'models/debris2.obj',
    'models/debris3.obj',
  ],
  modelsFolder: 'models/'
});
scene.add(jungle);
```

## ⚠️ 注意事项

1. **模型路径**：路径相对于 `public` 目录，所以 `models/debris1.obj` 对应 `public/models/debris1.obj`

2. **材质处理**：OBJ文件可能包含材质信息（.mtl文件），当前代码会覆盖为统一材质。如需保留原始材质，需要额外加载MTL文件

3. **性能优化**：
   - 模型文件不要太大
   - 模型面数建议控制在 1000-5000 面以内
   - 如果模型很多，考虑使用模型实例化（InstancedMesh）

4. **错误处理**：代码中已包含错误处理，加载失败时会使用默认立方体，不会导致程序崩溃

5. **异步加载**：确保所有相关函数都正确处理异步操作，避免出现未加载完成就使用模型的情况

## 🎨 材质自定义

如果需要为不同模型应用不同材质，可以修改 `loadModel()` 函数中的材质设置部分，或者根据模型路径选择不同的材质配置。

## 📚 相关资源

- Three.js OBJLoader 文档：https://threejs.org/docs/#examples/en/loaders/OBJLoader
- OBJ文件格式说明：https://en.wikipedia.org/wiki/Wavefront_.obj_file

---

## 🎯 地面圆环模型

除了丛林场景中的杂物模型，还可以为地面圆环添加自定义模型。

### 使用方式

地面圆环模型的管理逻辑位于 `src/modules/groundRingModel.js` 模块中。

#### 方式1：直接传入 THREE.Object3D

```javascript
import { createGroundRingConfig, addGroundRingModel } from './modules/groundRingModel';

// 创建你的自定义模型
const customRingModel = new THREE.Mesh(/* ... */);

// 配置并添加
const groundRingConfig = createGroundRingConfig({
  customModel: customRingModel,
  innerRadius: INNER_RADIUS,
  outerRadius: OUTER_RADIUS
});
addGroundRingModel(scene, groundRingConfig);
```

#### 方式2：分别提供内圆和外圆模型

```javascript
const innerRingModel = new THREE.Mesh(/* 内圆模型 */);
const outerRingModel = new THREE.Mesh(/* 外圆模型 */);

const groundRingConfig = createGroundRingConfig({
  customModel: {
    innerRing: innerRingModel,
    outerRing: outerRingModel
  },
  innerRadius: INNER_RADIUS,
  outerRadius: OUTER_RADIUS
});
addGroundRingModel(scene, groundRingConfig);
```

#### 方式3：从文件加载（待实现）

未来版本将支持从 `public/models/` 目录加载圆环模型文件：

```javascript
import { loadGroundRingModel, createGroundRingConfig, addGroundRingModel } from './modules/groundRingModel';

// 加载模型（待实现）
const ringModel = await loadGroundRingModel('models/ring.obj', {
  innerRadius: INNER_RADIUS,
  outerRadius: OUTER_RADIUS
});

const groundRingConfig = createGroundRingConfig({
  customModel: ringModel,
  innerRadius: INNER_RADIUS,
  outerRadius: OUTER_RADIUS
});
addGroundRingModel(scene, groundRingConfig);
```

### 配置说明

- `customModel`: 自定义圆环模型（可选）
  - 可以是 `THREE.Object3D` 对象
  - 可以是 `{ model: THREE.Object3D }` 对象
  - 可以是 `{ innerRing: THREE.Object3D, outerRing: THREE.Object3D }` 对象
- `showDefaultRings`: 是否显示默认圆环（已隐藏色彩，仅用于调试）
- `innerRadius`: 内圆半径（用于默认圆环）
- `outerRadius`: 外圆半径（用于默认圆环）

---

**提示**：如果遇到任何问题，请检查浏览器控制台的错误信息，大多数问题都会有相应的错误提示。

---

## 🐦 鸟类组件系统（GLB格式）

### 概述
除了丛林场景的OBJ模型，系统还支持GLB格式的鸟类身体组件。这些组件用于生成更真实的鸟类模型和碎片。

### 文件夹结构
```
public/models/bird_components/
├── head/            # 头部组件文件夹
│   ├── head_01.glb
│   └── head_02.glb
├── chest/           # 胸部组件文件夹
│   ├── chest_01.glb
│   └── chest_02.glb
├── belly/           # 腹部组件文件夹
│   └── belly_01.glb
├── wing/            # 翅膀组件文件夹
│   ├── wing_01.glb
│   └── wing_02.glb
├── tail/            # 尾部组件文件夹
│   └── tail_01.glb
└── foot/            # 足部组件文件夹
    ├── foot_01.glb
    └── foot_02.glb
```

### GLB模型要求
- **格式**：`.glb` 文件（GLTF 2.0二进制格式）
- **尺寸**：建议单个组件在 0.1 - 0.3 米范围内
- **朝向**：Z轴向前，Y轴向上（系统会自动居中）
- **材质**：支持PBR材质，自动转换为MeshStandardMaterial

### 智能命名识别
系统支持多种命名方式，无需严格按照标准格式。系统会根据文件名中的关键词自动识别组件类型：

**头部关键词**：`head`, `头部`, `头`, `脑袋`, `brain`, `skull`
**胸部关键词**：`chest`, `胸部`, `胸`, `身体`, `body`, `torso`, `躯干`
**腹部关键词**：`belly`, `腹部`, `腹`, `肚子`, `abdomen`, `stomach`
**翅膀关键词**：`wing`, `翅膀`, `翼`, `翅`, `feather`, `羽毛`
**尾巴关键词**：`tail`, `尾巴`, `尾`, `尾部`
**足部关键词**：`foot`, `足`, `脚`, `爪`, `feet`, `paw`, `leg`, `腿`

### 使用方法
1. **准备GLB模型**：使用Blender等工具创建鸟类部位模型，导出为GLB格式
2. **创建文件夹**：在 `public/models/bird_components/` 下创建对应部位文件夹
3. **放置文件**：将各部位模型放入对应的文件夹中
   - 头部模型 → `head/` 文件夹
   - 胸部模型 → `chest/` 文件夹
   - 其他部位类似
4. **命名自由**：文件名任意，无需遵循特定格式
5. **自动识别**：重启应用后，系统会自动扫描各文件夹并加载模型
6. **生成鸟类**：鸟类生成时会从各部位文件夹中随机选择组件组合

### 文件组织说明
现在系统使用文件夹组织方式，无需重命名工具：

- **文件夹即分类**：每个文件夹代表一个部位类型
- **文件名自由**：文件夹内的文件名可以任意命名
- **自动识别**：系统会自动扫描各文件夹并加载所有GLB文件
- **随机选择**：每个部位会从对应文件夹中随机选择一个模型

**示例**：
```
bird_components/
├── head/
│   ├── cute_head.glb
│   ├── scary_head.glb
│   └── normal_head.glb
└── wing/
    ├── left_wing.glb
    ├── right_wing.glb
    └── small_wing.glb
```

所有这些文件都会被正确识别和使用。

### 组件合成规则
系统按以下优先级合成鸟类：
1. **胸部**（必须）：作为核心参考点
2. **头部**（可选）：位于胸部上方
3. **腹部**（可选）：位于胸部下方
4. **翅膀**（随机数量）：对称分布在胸部两侧
5. **尾部**（可选）：位于后方
6. **足部**（可选）：位于底部

### 技术特性
- **异步加载**：模型加载是异步的，不会阻塞页面
- **智能缓存**：已加载的模型会被缓存，避免重复加载
- **材质继承**：碎片会继承原始鸟类的材质信息
- **回退机制**：如果GLB组件不可用，自动回退到几何体生成
- **点云渲染**：支持点云蒙皮效果，保持视觉一致性

### 注意事项
1. **性能优化**：GLB文件建议控制在1MB以内
2. **模型质量**：面数建议在500-2000面之间
3. **兼容性**：确保GLB文件在目标浏览器中正常加载
4. **错误处理**：加载失败时会输出详细错误信息到控制台
