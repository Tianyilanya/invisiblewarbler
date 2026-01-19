# 艺术主义数据结构规则

## 文件说明

本文档定义了 `artMovements.json` 数据文件的结构规则和验证标准。

## 数据结构

每个艺术主义对象必须包含以下字段：

### 必需字段

| 字段名 | 类型 | 说明 | 规则 |
|--------|------|------|------|
| `id` | string | 唯一标识符 | 英文小写，多个单词用下划线连接，如：`post_impressionism` |
| `name` | string | 中文名称 | 2-20个字符 |
| `nameEn` | string | 英文名称 | 首字母大写，多个单词用空格或连字符分隔，如：`Post-Impressionism` |
| `period` | string | 时期描述 | 中文描述，3-50个字符，如：`19世纪末至20世纪初` |
| `year` | integer | 起始年份 | 1000-2100之间的整数，用于排序 |
| `field` | string | 场域描述 | 10-200个字符，描述地理、历史和文化背景 |
| `ontology` | string | 本体描述 | 10-200个字符，描述核心理念和哲学基础 |
| `phenomenon` | string | 现象描述 | 10-200个字符，描述主要表现形式和特征 |
| `form` | string | 形式描述 | 10-200个字符，描述风格和技术特征 |

## 四个维度说明

### 1. 场域 (field)

**定义**：描述艺术主义产生和发展的地理、历史和文化背景。

**应包含内容**：
- 时间范围（精确到年代）
- 主要地域（国家、城市）
- 历史背景（社会、政治、文化环境）
- 传播范围（影响地区）

**示例**：
```
"field": "19世纪后期的法国，主要在巴黎，作为对学院派艺术和传统绘画方式的反叛，与摄影技术的发展相关。"
```

### 2. 本体 (ontology)

**定义**：描述艺术主义的核心理念和哲学基础。

**应包含内容**：
- 艺术理念（对艺术本质的理解）
- 哲学思想（理论基础）
- 价值追求（目标、理想）
- 对传统艺术的态度（继承、反叛、创新）

**示例**：
```
"ontology": "捕捉瞬间的光影和色彩变化，强调主观感受和视觉印象，反对传统的历史题材和室内创作方式。"
```

### 3. 现象 (phenomenon)

**定义**：描述艺术主义在现实中的表现形式和特征。

**应包含内容**：
- 作品主题（常见题材）
- 表现内容（描绘对象）
- 社会影响（对艺术界和社会的影响）
- 艺术家的创作方式（工作方法、创作环境）

**示例**：
```
"phenomenon": "画家在户外作画，关注自然光的变化，作品主题多为风景、日常生活场景和城市景观，表现现代生活。"
```

### 4. 形式 (form)

**定义**：描述艺术作品的具体风格和技术特征。

**应包含内容**：
- 构图方式（空间布局、透视方法）
- 色彩运用（色彩选择、色彩关系）
- 线条处理（线条风格、笔触特点）
- 材料和技术（使用的媒介、技法）

**示例**：
```
"form": "使用短促的笔触和明亮的色彩，弱化线条和细节，强调光影效果和色彩关系，构图松散，追求画面的整体氛围。"
```

## 数据验证规则

### 格式要求

1. **JSON格式**：文件必须是有效的JSON数组
2. **排序**：按 `year` 字段升序排列
3. **唯一性**：`id` 字段必须唯一
4. **字符限制**：四个维度字段（field, ontology, phenomenon, form）每个不超过200字

### 内容要求

1. **历史准确性**：
   - 时间必须准确（起始年份、时期描述）
   - 地点必须准确（国家、城市）
   - 历史背景必须真实

2. **学术准确性**：
   - 艺术特征描述必须符合艺术史共识
   - 核心理念表述必须准确
   - 代表艺术家和作品特征必须真实

3. **语言规范**：
   - 使用规范的中文表达
   - 术语使用准确
   - 避免主观判断和夸张表述

## 使用示例

### JavaScript 中使用

```javascript
import artMovements from './data/artMovements.json';

// 验证数据结构
function validateMovement(movement) {
  const required = ['id', 'name', 'nameEn', 'period', 'year', 'field', 'ontology', 'phenomenon', 'form'];
  return required.every(field => movement.hasOwnProperty(field));
}

// 检查字符限制
function checkLength(movement) {
  const fields = ['field', 'ontology', 'phenomenon', 'form'];
  return fields.every(field => movement[field].length <= 200);
}

// 验证所有数据
artMovements.forEach(movement => {
  if (!validateMovement(movement)) {
    console.error('缺少必需字段:', movement.id);
  }
  if (!checkLength(movement)) {
    console.error('字段超出长度限制:', movement.id);
  }
});
```

### TypeScript 类型定义

```typescript
interface ArtMovement {
  id: string;
  name: string;
  nameEn: string;
  period: string;
  year: number;
  field: string;      // 场域，≤200字
  ontology: string;  // 本体，≤200字
  phenomenon: string; // 现象，≤200字
  form: string;      // 形式，≤200字
}

type ArtMovements = ArtMovement[];
```

## 维护指南

### 添加新艺术主义

1. 确保 `id` 唯一且符合命名规范
2. 填写所有必需字段
3. 验证四个维度内容不超过200字
4. 确保历史信息准确
5. 按 `year` 字段插入到正确位置

### 修改现有数据

1. 保持数据结构不变
2. 更新内容时确保信息准确
3. 保持字符限制
4. 更新后验证JSON格式

### 数据校准

定期对数据进行校准：
- 验证历史时间准确性
- 检查地点信息
- 确认艺术特征描述
- 更新学术研究新发现

## 相关文件

- `artMovements.json` - 数据文件
- `schema.json` - JSON Schema验证文件
- `README.md` - 使用说明文档

