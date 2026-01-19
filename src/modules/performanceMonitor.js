/**
 * 性能监控工具
 */
class PerformanceMonitor {
  constructor() {
    this.stats = {
      fps: 0,
      frameTime: 0,
      memory: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0
    };

    this.history = [];
    this.maxHistoryLength = 60; // 保存60帧的数据

    this.renderer = null;
    this.scene = null;

    this.ui = null;
    this.visible = false;
  }

  /**
   * 初始化性能监控
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Scene} scene
   */
  init(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;

    // 创建性能UI
    this.createUI();

    console.log('Performance monitor initialized');
  }

  /**
   * 创建性能显示UI
   */
  createUI() {
    this.ui = document.createElement('div');
    this.ui.id = 'performance-monitor';
    this.ui.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
      min-width: 200px;
      pointer-events: auto;
      cursor: pointer;
    `;

    this.ui.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Performance Monitor</div>
      <div>FPS: <span id="fps">--</span></div>
      <div>Frame Time: <span id="frame-time">--</span>ms</div>
      <div>Memory: <span id="memory">--</span>MB</div>
      <div>Draw Calls: <span id="draw-calls">--</span></div>
      <div>Triangles: <span id="triangles">--</span></div>
      <div>Geometries: <span id="geometries">--</span></div>
      <div>Textures: <span id="textures">--</span></div>
      <div style="margin-top: 5px; font-size: 10px; color: #ccc;">Click to toggle</div>
    `;

    // 点击切换显示/隐藏
    this.ui.addEventListener('click', () => {
      this.visible = !this.visible;
      this.updateVisibility();
    });

    document.body.appendChild(this.ui);
    this.updateVisibility();
  }

  /**
   * 更新UI可见性
   */
  updateVisibility() {
    this.ui.style.display = this.visible ? 'block' : 'none';
  }

  /**
   * 开始帧监控
   */
  beginFrame() {
    this.frameStartTime = performance.now();
  }

  /**
   * 结束帧监控并更新统计信息
   */
  endFrame() {
    const now = performance.now();
    this.frameTime = now - this.frameStartTime;

    // 计算FPS
    this.history.push(this.frameTime);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    const avgFrameTime = this.history.reduce((a, b) => a + b, 0) / this.history.length;
    this.stats.fps = Math.round(1000 / avgFrameTime);
    this.stats.frameTime = Math.round(this.frameTime * 100) / 100;

    // 获取内存信息
    if (performance.memory) {
      this.stats.memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }

    // 获取渲染统计信息
    if (this.renderer && this.renderer.info) {
      const info = this.renderer.info;
      this.stats.drawCalls = info.render.calls;
      this.stats.triangles = info.render.triangles;
      this.stats.geometries = info.memory.geometries;
      this.stats.textures = info.memory.textures;
    }

    // 更新UI
    if (this.visible) {
      this.updateUI();
    }
  }

  /**
   * 更新UI显示
   */
  updateUI() {
    if (!this.ui) return;

    const elements = {
      fps: document.getElementById('fps'),
      'frame-time': document.getElementById('frame-time'),
      memory: document.getElementById('memory'),
      'draw-calls': document.getElementById('draw-calls'),
      triangles: document.getElementById('triangles'),
      geometries: document.getElementById('geometries'),
      textures: document.getElementById('textures')
    };

    Object.entries(elements).forEach(([key, element]) => {
      if (element && this.stats[key] !== undefined) {
        element.textContent = this.stats[key];

        // 添加颜色提示
        if (key === 'fps') {
          element.style.color = this.stats.fps >= 50 ? '#0f0' : this.stats.fps >= 30 ? '#ff0' : '#f00';
        } else if (key === 'frame-time') {
          element.style.color = this.stats.frameTime <= 16.67 ? '#0f0' : this.stats.frameTime <= 33.33 ? '#ff0' : '#f00';
        }
      }
    });
  }

  /**
   * 获取当前统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 输出性能报告
   */
  logReport() {
    console.group('🚀 Performance Report');
    console.log(`FPS: ${this.stats.fps}`);
    console.log(`Frame Time: ${this.stats.frameTime}ms`);
    console.log(`Memory: ${this.stats.memory}MB`);
    console.log(`Draw Calls: ${this.stats.drawCalls}`);
    console.log(`Triangles: ${this.stats.triangles}`);
    console.log(`Geometries: ${this.stats.geometries}`);
    console.log(`Textures: ${this.stats.textures}`);
    console.groupEnd();
  }

  /**
   * 销毁性能监控
   */
  dispose() {
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui);
    }
    this.ui = null;
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;