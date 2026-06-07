// docs/js/cursor-trail.js – 终极自定义光影版
(function () {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 配置项：所有视觉核心参数已全部暴露
  const config = {
    trailLength: 28,            // 历史点数，控制线条长度
    lineWidthBase: 0.5,         // 线条最粗处的（头部）基础直径
    widthDecay: 0.85,           // 宽度沿轨迹向尾部的衰减指数（越小尾部越尖）
    fadeOutTime: 700,           // 轨迹整体淡出时间(ms)
    maxSparkles: 50,            // 最大粒子数限制
    idleSparkles: true,         // 静止时环绕粒子
    clickBurst: true,           // 点击爆发

    // 1. 粒子大小自定义
    sparkleSizeBase: 1.8,       // 粒子基础大小
    sparkleSizeRandom: 3.0,     // 粒子大小随机浮动范围值（实际大小 = 基础 + 0~随机值）

    // 2. 发光半径自定义 (采用 Canvas 高性能 Filter 模糊)
    glowRadius: 10,             // 霓虹发光半径(px)，值越大光晕越散、越柔和
    glowAlpha: 0.28,            // 发光层视觉亮度(0~1)

    // 3. 线宽随速度变化的系数自定义
    lineWidthSpeedFactor: 0.15, // 速度感应系数，数值越大，鼠标移动越快线条就越粗
    lineWidthSpeedCap: 8,      // 速度带来的线宽加粗上限(px)，避免极端视觉崩坏
  };

  let trail = [];
  let sparkles = [];
  let mouseX = 0, mouseY = 0;
  let prevMouseX = 0, prevMouseY = 0;
  let lastMoveTime = 0;
  let globalHue = 0;

  // 画布设置
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // 粒子类
  class Sparkle {
    constructor(x, y, hueOffset = 0) {
      this.x = x; 
      this.y = y;
      const hue = (globalHue + hueOffset) % 360;
      
      this.color = `hsl(${hue}, 100%, 58%)`;
      // 【动态应用】粒子大小配置
      this.size = config.sparkleSizeBase + Math.random() * config.sparkleSizeRandom;
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 0.6 + Math.random() * 2.5;
      this.speedX = Math.cos(angle) * velocity;
      this.speedY = Math.sin(angle) * velocity;
      
      this.life = 1;
      this.decay = 0.012 + Math.random() * 0.025; 
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.12;
      this.shape = Math.floor(Math.random() * 4);
    }

    update() {
      this.speedX *= 0.95; 
      this.speedY *= 0.95; 
      this.speedY += 0.04; 
      this.x += this.speedX; 
      this.y += this.speedY;
      this.life -= this.decay; 
      this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.life * 0.9; 
      
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color; 
      ctx.lineWidth = 1.5;
      
      const s = this.size;
      ctx.beginPath();
      
      switch (this.shape) {
        case 0: 
          ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s); ctx.closePath(); ctx.fill();
          break;
        case 1: 
          ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.fill();
          break; 
        case 2: 
          for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6 - Math.PI / 2;
            const r = i % 2 === 0 ? s : s * 0.35; 
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath(); ctx.fill();
          break;
        case 3: 
          ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.stroke();
          break; 
      }
      ctx.restore();
    }
  }

  // 计算带状多边形的顶点
  function calculateStripPoints(points) {
    if (points.length < 3) return null;
    const verticesLeft = [];
    const verticesRight = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let dx, dy;

      if (i === 0) {
        dx = points[i+1].x - p.x; dy = points[i+1].y - p.y;
      } else if (i === points.length - 1) {
        dx = p.x - points[i-1].x; dy = p.y - points[i-1].y;
      } else {
        const dx1 = p.x - points[i-1].x; const dy1 = p.y - points[i-1].y;
        const dx2 = points[i+1].x - p.x; const dy2 = points[i+1].y - p.y;
        dx = (dx1 + dx2) / 2; dy = (dy1 + dy2) / 2;
      }

      const len = Math.hypot(dx, dy);
      if (len < 0.1) continue;

      const nx = -dy / len;
      const ny = dx / len;

      verticesLeft.push({ x: p.x + nx * p.width, y: p.y + ny * p.width });
      verticesRight.push({ x: p.x - nx * p.width, y: p.y - ny * p.width });
    }

    if (verticesLeft.length < 2) return null;
    return verticesLeft.concat(verticesRight.reverse());
  }

  // 线条绘制主函数
  function drawTrail() {
    if (trail.length < 3) return;
    const now = performance.now();

    const trailDataForRendering = [];
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const lifeRatio = i / (trail.length - 1); 
      const age = now - p.timestamp;
      const timeAlpha = Math.max(0, 1 - age / config.fadeOutTime);
      if (timeAlpha <= 0) continue;

      // 【动态应用】速度响应系数与限制上限
      const headWidthFactor = config.lineWidthBase + Math.min(config.lineWidthSpeedCap, p.speed * config.lineWidthSpeedFactor);
      const width = headWidthFactor * Math.pow(lifeRatio, config.widthDecay);

      trailDataForRendering.push({
        x: p.x, y: p.y,
        width: Math.max(0.1, width),
        timeAlpha: timeAlpha,
        hue: p.hue
      });
    }

    if (trailDataForRendering.length < 3) return;

    const stripPolygons = calculateStripPoints(trailDataForRendering);
    if (!stripPolygons) return;

    ctx.save();
    
    // 层1: 宽幅漫射光晕 (Neon Glow Layer) —— 【已引入 Filter 发光半径控制】
    if (config.glowRadius > 0) {
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = `blur(${config.glowRadius}px)`; // 完美的高级高斯模糊发光
      ctx.beginPath();
      stripPolygons.forEach((v, idx) => ctx[idx === 0 ? 'moveTo' : 'lineTo'](v.x, v.y));
      ctx.closePath();
      const headHue = trailDataForRendering[trailDataForRendering.length - 1].hue;
      ctx.fillStyle = `hsla(${headHue}, 100%, 55%, ${config.glowAlpha})`;
      ctx.fill();
      ctx.filter = 'none'; // 立即清除滤镜，保证后两层线条边缘依然锐利丝滑
    }

    // 层2: 高饱和度流体主体 (Flow Body Layer)
    ctx.globalCompositeOperation = 'screen';
    const flowGradient = ctx.createLinearGradient(
        trailDataForRendering[0].x, trailDataForRendering[0].y,
        trailDataForRendering[trailDataForRendering.length-1].x, trailDataForRendering[trailDataForRendering.length-1].y
    );
    for (let i = 0; i < trailDataForRendering.length; i++){
        const p = trailDataForRendering[i];
        flowGradient.addColorStop(i / (trailDataForRendering.length - 1), 
            `hsla(${p.hue}, 100%, 62%, ${p.timeAlpha * (i / (trailDataForRendering.length - 1)) * 0.85})`);
    }
    ctx.fillStyle = flowGradient;
    ctx.beginPath();
    stripPolygons.forEach((v, idx) => ctx[idx === 0 ? 'moveTo' : 'lineTo'](v.x, v.y));
    ctx.closePath();
    ctx.fill();

    // 层3: 高亮凝练白芯 (Highlight Core Layer)
    ctx.globalCompositeOperation = 'source-over';
    const coreGradient = ctx.createLinearGradient(
        trailDataForRendering[0].x, trailDataForRendering[0].y,
        trailDataForRendering[trailDataForRendering.length-1].x, trailDataForRendering[trailDataForRendering.length-1].y
    );
    for (let i = 0; i < trailDataForRendering.length; i++){
        const p = trailDataForRendering[i];
        const alpha = Math.pow(i / (trailDataForRendering.length - 1), 1.5) * p.timeAlpha;
        coreGradient.addColorStop(i / (trailDataForRendering.length - 1), `hsla(${p.hue}, 100%, 95%, ${alpha * 0.9})`);
    }
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    stripPolygons.forEach((v, idx) => ctx[idx === 0 ? 'moveTo' : 'lineTo'](v.x, v.y));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();
    globalHue = (globalHue + 0.4) % 360;

    for (let i = sparkles.length - 1; i >= 0; i--) {
      sparkles[i].update(); 
      sparkles[i].draw(ctx);
      if (sparkles[i].life <= 0) sparkles.splice(i, 1);
    }

    drawTrail();

    if (config.idleSparkles && trail.length > 0 && now - lastMoveTime > 150) {
      const last = trail[trail.length - 1];
      if (Math.random() < 0.2) {
        const angle = Math.random() * Math.PI * 2; 
        const dist = 4 + Math.random() * 14;
        sparkles.push(new Sparkle(last.x + Math.cos(angle) * dist, last.y + Math.sin(angle) * dist, Math.random() * 40 - 20));
        if (sparkles.length > config.maxSparkles) sparkles.shift();
      }
    }
    requestAnimationFrame(animate);
  }

  // 监听鼠标移动
  document.addEventListener('mousemove', (e) => {
    prevMouseX = mouseX; prevMouseY = mouseY;
    mouseX = e.clientX; mouseY = e.clientY;
    if (prevMouseX === 0 && prevMouseY === 0) { lastMoveTime = performance.now(); return; }
    
    const speed = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
    lastMoveTime = performance.now();
    const hue = (globalHue + speed * 0.2) % 360;
    
    trail.push({ x: mouseX, y: mouseY, hue: hue, speed: speed, timestamp: performance.now() });
    while (trail.length > config.trailLength) trail.shift();

    const sparkCount = Math.min(2, Math.floor(speed / 9) + 1);
    for (let i = 0; i < sparkCount; i++) {
      sparkles.push(new Sparkle(mouseX + (Math.random() - 0.5) * 8, mouseY + (Math.random() - 0.5) * 8, Math.random() * 30 - 15));
      if (sparkles.length > config.maxSparkles) sparkles.shift();
    }
  });

  // 点击爆发
  document.addEventListener('click', (e) => {
    if (!config.clickBurst) return;
    const burstCount = 14; 
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const s = new Sparkle(e.clientX, e.clientY, i * (360 / burstCount));
      const force = 1.2 + Math.random() * 3.8; 
      s.speedX = Math.cos(angle) * force; 
      s.speedY = Math.sin(angle) * force;
      sparkles.push(s);
    }
  });

  document.addEventListener('mouseleave', () => { trail.length = 0; sparkles.length = 0; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { trail.length = 0; sparkles.length = 0; } });

  window.cursorTrailConfig = config;
  animate();
})();