# 艺术主义数据文件说明

## 文件位置
`src/data/artMovements.json`

## 数据结构

每个艺术主义包含以下字段：

```javascript
{
  "id": "唯一标识符（英文）",
  "name": "中文名称",
  "nameEn": "英文名称",
  "period": "时期（中文描述）",
  "year": 起始年份（数字，用于排序）,
  "field": "场域 - 艺术活动的主要地域或文化背景（200字以内）",
  "ontology": "本体 - 艺术运动的核心理念或哲学基础（200字以内）",
  "phenomenon": "现象 - 艺术运动的主要表现形式或特征（200字以内）",
  "form": "形式 - 艺术作品的风格或技术特征（200字以内）"
}
```

## 四个维度说明

### 1. 场域 (field)
描述艺术主义产生和发展的地理、历史和文化背景，包括：
- 时间范围
- 主要地域
- 历史背景
- 文化环境

### 2. 本体 (ontology)
描述艺术主义的核心理念和哲学基础，包括：
- 艺术理念
- 哲学思想
- 价值追求
- 对传统艺术的态度

### 3. 现象 (phenomenon)
描述艺术主义在现实中的表现形式和特征，包括：
- 作品主题
- 表现内容
- 社会影响
- 艺术家的创作方式

### 4. 形式 (form)
描述艺术作品的具体风格和技术特征，包括：
- 构图方式
- 色彩运用
- 线条处理
- 材料和技术

## 使用示例

### JavaScript 中使用

```javascript
import artMovements from './data/artMovements.json';

// 获取所有艺术主义（已按时间排序）
const allMovements = artMovements;

// 按年份排序
const sortedByYear = [...artMovements].sort((a, b) => a.year - b.year);

// 查找特定艺术主义
const cubism = artMovements.find(m => m.id === 'cubism');

// 获取特定时期的艺术主义
const modernArt = artMovements.filter(m => m.year >= 1900 && m.year < 2000);

// 随机选择一个艺术主义
const randomMovement = artMovements[Math.floor(Math.random() * artMovements.length)];
```

### 在风格分析中使用

```javascript
// 根据模型属性分析风格
function analyzeStyle(modelAttributes) {
  // 计算颜色丰富度、形状复杂度等
  const colorRichness = calculateColorRichness(modelAttributes);
  const shapeComplexity = calculateShapeComplexity(modelAttributes);
  
  // 根据规则匹配艺术主义
  let matchedMovement;
  if (colorRichness > 0.7 && shapeComplexity > 0.6) {
    matchedMovement = artMovements.find(m => m.id === 'fauvism'); // 野兽派
  } else if (shapeComplexity > 0.8) {
    matchedMovement = artMovements.find(m => m.id === 'cubism'); // 立体主义
  }
  // ... 更多规则
  
  return matchedMovement;
}
```

## 艺术主义列表（按时间顺序）

1. **文艺复兴** (Renaissance) - 14-16世纪
2. **样式主义** (Mannerism) - 16世纪中后期
3. **巴洛克** (Baroque) - 17世纪
4. **洛可可** (Rococo) - 18世纪前期
5. **新古典主义** (Neoclassicism) - 18世纪中后期
6. **浪漫主义** (Romanticism) - 18世纪末至19世纪中叶
7. **现实主义** (Realism) - 19世纪中期
8. **印象主义** (Impressionism) - 19世纪后期
9. **后印象主义** (Post-Impressionism) - 19世纪末至20世纪初
10. **象征主义** (Symbolism) - 19世纪末至20世纪初
11. **表现主义** (Expressionism) - 20世纪初
12. **野兽派** (Fauvism) - 20世纪初
13. **立体主义** (Cubism) - 20世纪初
14. **未来主义** (Futurism) - 20世纪初
15. **构成主义** (Constructivism) - 20世纪10-20年代
16. **达达主义** (Dadaism) - 20世纪10-20年代
17. **风格派** (De Stijl) - 20世纪10-20年代
18. **超现实主义** (Surrealism) - 20世纪20-30年代
19. **抽象表现主义** (Abstract Expressionism) - 20世纪40-50年代
20. **波普艺术** (Pop Art) - 20世纪50-60年代
21. **极简主义** (Minimalism) - 20世纪60年代
22. **观念艺术** (Conceptual Art) - 20世纪60-70年代
23. **后现代主义** (Postmodernism) - 20世纪70年代至今
24. **当代艺术** (Contemporary Art) - 21世纪

## 注意事项

- 所有介绍文本均控制在200字以内
- 数据按时间顺序排列（`year` 字段）
- 每个艺术主义的四个维度（场域、本体、现象、形式）都已完整填写
- 可以根据项目需要扩展或修改数据

## 扩展建议

如果需要添加更多艺术主义或修改现有内容：

1. 保持数据结构一致
2. 确保四个维度都有内容
3. 控制每个维度在200字以内
4. 按时间顺序添加（使用 `year` 字段排序）

