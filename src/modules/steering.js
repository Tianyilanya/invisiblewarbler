// Steering Behaviors Module
// 实现各种转向行为（steering behaviors），用于自然化的鸟类运动

import * as THREE from 'three';

/**
 * 向量工具函数
 */
export class VectorUtils {
  /**
   * 限制向量长度
   * @param {THREE.Vector3} vector - 要限制的向量
   * @param {number} max - 最大长度
   * @returns {THREE.Vector3} 限制后的向量
   */
  static limit(vector, max) {
    if (vector.lengthSq() > max * max) {
      vector.normalize().multiplyScalar(max);
    }
    return vector;
  }

  /**
   * 设置向量长度
   * @param {THREE.Vector3} vector - 要设置的向量
   * @param {number} length - 目标长度
   * @returns {THREE.Vector3} 设置后的向量
   */
  static setLength(vector, length) {
    return vector.clone().normalize().multiplyScalar(length);
  }

  /**
   * 计算两个向量之间的角度（弧度）
   * @param {THREE.Vector3} a - 向量A
   * @param {THREE.Vector3} b - 向量B
   * @returns {number} 夹角（弧度）
   */
  static angleBetween(a, b) {
    return Math.acos(Math.max(-1, Math.min(1, a.dot(b) / (a.length() * b.length()))));
  }

  /**
   * 计算向量到目标的距离
   * @param {THREE.Vector3} current - 当前位置
   * @param {THREE.Vector3} target - 目标位置
   * @returns {number} 距离
   */
  static distance(current, target) {
    return current.distanceTo(target);
  }

  /**
   * 计算向量到目标的方向（标准化）
   * @param {THREE.Vector3} current - 当前位置
   * @param {THREE.Vector3} target - 目标位置
   * @returns {THREE.Vector3} 方向向量
   */
  static direction(current, target) {
    return target.clone().sub(current).normalize();
  }
}

/**
 * Steering Behaviors 类
 * 实现各种转向行为，返回加速度向量
 */
export class SteeringBehaviors {
  constructor(entity) {
    this.entity = entity; // 拥有此行为的实体（鸟类）
  }

  /**
   * Seek - 直接朝目标移动
   * @param {THREE.Vector3} target - 目标位置
   * @param {Object} params - 参数
   * @returns {THREE.Vector3} 加速度向量
   */
  seek(target, params = {}) {
    const maxSpeed = params.maxSpeed || this.entity.maxSpeed;
    const maxForce = params.maxForce || this.entity.maxForce;

    // 计算期望速度（朝向目标的最大速度）
    const desired = VectorUtils.direction(this.entity.mesh.position, target);
    desired.multiplyScalar(maxSpeed);

    // 计算转向力（期望速度 - 当前速度）
    const steer = desired.sub(this.entity.velocity);
    VectorUtils.limit(steer, maxForce);

    return steer;
  }

  /**
   * Arrive - 平滑到达目标（到达时减速）
   * @param {THREE.Vector3} target - 目标位置
   * @param {Object} params - 参数
   * @returns {THREE.Vector3} 加速度向量
   */
  arrive(target, params = {}) {
    const maxSpeed = params.maxSpeed || this.entity.maxSpeed;
    const maxForce = params.maxForce || this.entity.maxForce;
    const arrivalRadius = params.arrivalRadius || 1.0;

    const distance = VectorUtils.distance(this.entity.mesh.position, target);

    // 计算期望速度
    let desired = VectorUtils.direction(this.entity.mesh.position, target);

    if (distance < arrivalRadius) {
      // 在到达半径内，逐渐减速到0
      const speed = (distance / arrivalRadius) * maxSpeed;
      desired.multiplyScalar(speed);
    } else {
      // 正常最大速度
      desired.multiplyScalar(maxSpeed);
    }

    // 计算转向力
    const steer = desired.sub(this.entity.velocity);
    VectorUtils.limit(steer, maxForce);

    return steer;
  }

  /**
   * Wander - 随机游走
   * @param {Object} params - 参数
   * @returns {THREE.Vector3} 加速度向量
   */
  wander(params = {}) {
    const maxSpeed = params.maxSpeed || this.entity.maxSpeed;
    const maxForce = params.maxForce || this.entity.maxForce;
    const wanderStrength = params.wanderStrength || 0.5;
    const wanderRadius = params.wanderRadius || 1.0;

    // 初始化或更新游走角度（如果不存在）
    if (this.wanderAngle === undefined) {
      this.wanderAngle = Math.random() * Math.PI * 2;
    }

    // 随机改变游走角度
    this.wanderAngle += (Math.random() - 0.5) * wanderStrength;

    // 计算游走圆圈上的点（基于当前速度方向）
    const velocityDir = this.entity.velocity.clone().normalize();
    if (velocityDir.lengthSq() < 0.01) {
      velocityDir.set(1, 0, 0); // 默认向前
    }

    // 创建游走目标
    const wanderTarget = velocityDir.clone()
      .multiplyScalar(wanderRadius)
      .add(new THREE.Vector3(
        Math.cos(this.wanderAngle) * wanderRadius,
        0,
        Math.sin(this.wanderAngle) * wanderRadius
      ));

    // 转换为世界坐标
    wanderTarget.add(this.entity.mesh.position);

    // 使用seek到达游走目标
    return this.seek(wanderTarget, { maxSpeed: maxSpeed * 0.5, maxForce: maxForce * 0.3 });
  }

  /**
   * Repel/Avoid - 避开障碍物
   * @param {Array} obstacles - 障碍物位置数组
   * @param {Object} params - 参数
   * @returns {THREE.Vector3} 加速度向量
   */
  avoid(obstacles, params = {}) {
    const maxForce = params.maxForce || this.entity.maxForce;
    const avoidRadius = params.avoidRadius || 2.0;
    const lookahead = params.lookahead || 1.0;

    const position = this.entity.mesh.position;
    const velocity = this.entity.velocity;
    let steer = new THREE.Vector3();

    for (const obstacle of obstacles) {
      const distance = VectorUtils.distance(position, obstacle);

      if (distance < avoidRadius) {
        // 计算预测位置
        const predictPos = position.clone().add(velocity.clone().multiplyScalar(lookahead));

        // 如果预测位置会撞到障碍物
        if (VectorUtils.distance(predictPos, obstacle) < avoidRadius) {
          // 计算避开方向
          const avoidDir = position.clone().sub(obstacle).normalize();
          const force = avoidDir.multiplyScalar(maxForce / Math.max(distance, 0.1));
          steer.add(force);
        }
      }
    }

    VectorUtils.limit(steer, maxForce);
    return steer;
  }

  /**
   * Flee - 逃离目标
   * @param {THREE.Vector3} target - 要逃离的目标
   * @param {Object} params - 参数
   * @returns {THREE.Vector3} 加速度向量
   */
  flee(target, params = {}) {
    const maxSpeed = params.maxSpeed || this.entity.maxSpeed;
    const maxForce = params.maxForce || this.entity.maxForce;

    // 计算期望速度（远离目标的最大速度）
    const desired = VectorUtils.direction(target, this.entity.mesh.position);
    desired.multiplyScalar(maxSpeed);

    // 计算转向力
    const steer = desired.sub(this.entity.velocity);
    VectorUtils.limit(steer, maxForce);

    return steer;
  }

  /**
   * Pursuit - 追逐移动目标
   * @param {Object} target - 目标对象（需要有position和velocity）
   * @param {Object} params - 参数
   * @returns {THREE.Vector3} 加速度向量
   */
  pursuit(target, params = {}) {
    if (!target.velocity) {
      // 如果目标没有速度，使用普通seek
      return this.seek(target.position || target, params);
    }

    const distance = VectorUtils.distance(this.entity.mesh.position, target.position);
    const T = distance / this.entity.maxSpeed; // 预测时间

    // 预测目标未来位置
    const futurePos = target.position.clone().add(target.velocity.clone().multiplyScalar(T));

    return this.seek(futurePos, params);
  }
}

// 导出便捷函数
export function createSteering(entity) {
  return new SteeringBehaviors(entity);
}

// 导出默认对象
export default {
  VectorUtils,
  SteeringBehaviors,
  createSteering
};