// Path Utilities Module
// 提供路径生成和插值工具，用于鸟类的平滑飞行路径

import * as THREE from 'three';

/**
 * 贝塞尔曲线工具类
 */
export class BezierCurve {
  /**
   * 创建二次贝塞尔曲线
   * @param {THREE.Vector3} start - 起点
   * @param {THREE.Vector3} control - 控制点
   * @param {THREE.Vector3} end - 终点
   * @returns {Function} 曲线函数 (t) => THREE.Vector3
   */
  static quadratic(start, control, end) {
    return function(t) {
      // B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;

      const point = new THREE.Vector3();
      point.x = uu * start.x + 2 * u * t * control.x + tt * end.x;
      point.y = uu * start.y + 2 * u * t * control.y + tt * end.y;
      point.z = uu * start.z + 2 * u * t * control.z + tt * end.z;

      return point;
    };
  }

  /**
   * 创建三次贝塞尔曲线
   * @param {THREE.Vector3} start - 起点
   * @param {THREE.Vector3} control1 - 第一个控制点
   * @param {THREE.Vector3} control2 - 第二个控制点
   * @param {THREE.Vector3} end - 终点
   * @returns {Function} 曲线函数 (t) => THREE.Vector3
   */
  static cubic(start, control1, control2, end) {
    return function(t) {
      // B(t) = (1-t)^3 * P0 + 3*(1-t)^2*t * P1 + 3*(1-t)*t^2 * P2 + t^3 * P3
      const u = 1 - t;
      const tt = t * t;
      const ttt = tt * t;
      const uu = u * u;
      const uuu = uu * u;

      const point = new THREE.Vector3();
      point.x = uuu * start.x + 3 * uu * t * control1.x + 3 * u * tt * control2.x + ttt * end.x;
      point.y = uuu * start.y + 3 * uu * t * control1.y + 3 * u * tt * control2.y + ttt * end.y;
      point.z = uuu * start.z + 3 * uu * t * control1.z + 3 * u * tt * control2.z + ttt * end.z;

      return point;
    };
  }

  /**
   * 创建弧形路径（用于鸟类穿梭）
   * @param {THREE.Vector3} start - 起点
   * @param {THREE.Vector3} end - 终点
   * @param {number} arcHeight - 弧线高度
   * @returns {Function} 曲线函数 (t) => THREE.Vector3
   */
  static createArcPath(start, end, arcHeight = null) {
    // 计算距离和方向
    const distance = start.distanceTo(end);
    const direction = end.clone().sub(start).normalize();

    // 如果没有指定弧高，使用距离的30%
    if (arcHeight === null) {
      arcHeight = distance * 0.3;
    }

    // 计算控制点（弧线中点向上偏移）
    const midPoint = start.clone().add(direction.clone().multiplyScalar(distance * 0.5));
    const upVector = new THREE.Vector3(0, 1, 0);

    // 计算垂直于飞行方向的向量
    const perpendicular = new THREE.Vector3().crossVectors(direction, upVector);
    if (perpendicular.lengthSq() < 0.01) {
      perpendicular.set(1, 0, 0); // fallback
    }
    perpendicular.normalize();

    const controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(arcHeight));

    return BezierCurve.quadratic(start, controlPoint, end);
  }
}

/**
 * 样条曲线工具类
 */
export class SplineUtils {
  /**
   * 创建Catmull-Rom样条路径
   * @param {Array<THREE.Vector3>} points - 控制点数组
   * @returns {Function} 曲线函数 (t) => THREE.Vector3
   */
  static catmullRom(points) {
    // 简化实现：使用Three.js的CatmullRomCurve3
    const curve = new THREE.CatmullRomCurve3(points);

    return function(t) {
      return curve.getPoint(t);
    };
  }

  /**
   * 创建平滑的巡逻路径（椭圆形）
   * @param {THREE.Vector3} center - 中心点
   * @param {number} radiusX - X轴半径
   * @param {number} radiusZ - Z轴半径
   * @param {number} height - 高度
   * @returns {Function} 曲线函数 (t) => THREE.Vector3
   */
  static createEllipsePath(center, radiusX = 3, radiusZ = 3, height = 5) {
    return function(t) {
      const angle = t * Math.PI * 2; // 0-2π
      const x = center.x + Math.cos(angle) * radiusX;
      const z = center.z + Math.sin(angle) * radiusZ;
      const y = center.y + height + Math.sin(t * Math.PI * 4) * 0.5; // 轻微高度变化

      return new THREE.Vector3(x, y, z);
    };
  }

  /**
   * 创建花朵形路径（更复杂的巡逻路径）
   * @param {THREE.Vector3} center - 中心点
   * @param {number} radius - 基础半径
   * @param {number} petals - 花瓣数量
   * @param {number} height - 高度
   * @returns {Function} 曲线函数 (t) => THREE.Vector3
   */
  static createFlowerPath(center, radius = 3, petals = 5, height = 5) {
    return function(t) {
      const angle = t * Math.PI * 2;
      const petalOffset = Math.sin(angle * petals) * 0.5;
      const currentRadius = radius * (1 + petalOffset);

      const x = center.x + Math.cos(angle) * currentRadius;
      const z = center.z + Math.sin(angle) * currentRadius;
      const y = center.y + height + Math.sin(t * Math.PI * 6) * 0.3;

      return new THREE.Vector3(x, y, z);
    };
  }
}

/**
 * 路径跟随工具
 */
export class PathFollower {
  constructor(pathFunction) {
    this.pathFunction = pathFunction;
    this.currentT = 0;
    this.speed = 0.001; // t变化速度
    this.loop = true; // 是否循环
  }

  /**
   * 获取当前参考点
   * @returns {THREE.Vector3} 当前参考点
   */
  getCurrentPoint() {
    return this.pathFunction(this.currentT);
  }

  /**
   * 获取下一个参考点（用于steering）
   * @param {number} dt - 时间增量
   * @returns {THREE.Vector3} 下一个参考点
   */
  getNextPoint(dt = 0.016) { // 默认16ms一帧
    let nextT = this.currentT + this.speed * dt;
    if (this.loop) {
      nextT = nextT % 1; // 循环0-1
    } else {
      nextT = Math.min(nextT, 1); // 限制在0-1
    }
    return this.pathFunction(nextT);
  }

  /**
   * 更新路径进度
   * @param {number} dt - 时间增量
   */
  update(dt = 0.016) {
    this.currentT += this.speed * dt;
    if (this.loop) {
      this.currentT = this.currentT % 1;
    } else {
      this.currentT = Math.min(this.currentT, 1);
    }
  }

  /**
   * 设置速度
   * @param {number} speed - 新速度
   */
  setSpeed(speed) {
    this.speed = speed;
  }

  /**
   * 重置到起点
   */
  reset() {
    this.currentT = 0;
  }

  /**
   * 检查是否到达终点（非循环路径）
   * @returns {boolean} 是否到达终点
   */
  isFinished() {
    return !this.loop && this.currentT >= 1;
  }
}

/**
 * 路径生成器 - 便捷函数
 */
export class PathGenerator {
  /**
   * 生成鸟类穿梭路径
   * @param {THREE.Vector3} start - 起点
   * @param {THREE.Vector3} end - 终点
   * @param {Object} options - 选项
   * @returns {Function} 路径函数
   */
  static createBirdTravelPath(start, end, options = {}) {
    const arcHeight = options.arcHeight || null;
    const useCubic = options.useCubic || false;

    if (useCubic) {
      // 计算两个控制点创建S形路径
      const distance = start.distanceTo(end);
      const direction = end.clone().sub(start).normalize();

      const perpendicular = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0));
      perpendicular.normalize();

      const control1 = start.clone().add(direction.clone().multiplyScalar(distance * 0.3))
        .add(perpendicular.clone().multiplyScalar(distance * 0.2));
      const control2 = start.clone().add(direction.clone().multiplyScalar(distance * 0.7))
        .add(perpendicular.clone().multiplyScalar(-distance * 0.2));

      return BezierCurve.cubic(start, control1, control2, end);
    } else {
      return BezierCurve.createArcPath(start, end, arcHeight);
    }
  }

  /**
   * 生成巡逻路径
   * @param {THREE.Vector3} center - 中心点
   * @param {string} type - 路径类型 ('ellipse' | 'flower' | 'circle')
   * @param {Object} params - 参数
   * @returns {Function} 路径函数
   */
  static createPatrolPath(center, type = 'ellipse', params = {}) {
    switch (type) {
      case 'ellipse':
        return SplineUtils.createEllipsePath(
          center,
          params.radiusX || 3,
          params.radiusZ || 3,
          params.height || 5
        );
      case 'flower':
        return SplineUtils.createFlowerPath(
          center,
          params.radius || 3,
          params.petals || 5,
          params.height || 5
        );
      case 'circle':
      default:
        return SplineUtils.createEllipsePath(center, params.radius || 3, params.radius || 3, params.height || 5);
    }
  }
}

// 导出默认对象
export default {
  BezierCurve,
  SplineUtils,
  PathFollower,
  PathGenerator
};