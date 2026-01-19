# GLB模型压缩指南

## 🎯 最终有效的压缩方法

### 使用 gltf-transform 进行综合优化

这是**唯一有效的压缩方法**，能够实现86.4%的压缩率。

#### 安装工具
```bash
npm install -g @gltf-transform/cli
```

#### 运行压缩
```bash
node optimize-gltf-transform.js
```

#### 优化特性
- 🗜️ **Meshopt几何压缩** - EXT_meshopt_compression
- 🖼️ **WebP纹理压缩** - EXT_texture_webp
- 📐 **网格简化50%** - 减少面数
- 📦 **通用压缩** - 优化文件结构

#### 压缩效果
- 📊 **压缩率**: 86.4% (44.99MB → 6.11MB)
- ⚡ **加载速度**: 大幅提升
- 🎨 **视觉质量**: 保持高质量

### Three.js 配置要求

#### 必须配置 MeshoptDecoder
```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

// 现在可以加载压缩后的GLB文件
loader.load('compressed-model.glb', (gltf) => {
    scene.add(gltf.scene);
});
```

### Blender 兼容性

❌ **压缩后的GLB文件无法在Blender中打开**

如果需要编辑，请使用解压版本或重新导出GLB文件。

### 测试验证

运行测试页面验证压缩文件加载：
```
http://localhost:8080/test-compressed-glb.html
```

### 文件说明

- `optimize-gltf-transform.js` - **主要的压缩脚本** ⭐
- `test-compressed-glb.html` - 压缩文件加载测试页面

---

**注意**: 其他所有压缩脚本都已删除，只保留这个最终有效的压缩方法。