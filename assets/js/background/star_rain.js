// 🌟 注册为全局大管家可调用的特工：EffectStar
window.EffectStar = (function () {
    
    // 将核心控制变量提取到顶部，供 start 和 stop 共享管理
    let canvas = null;
    let ctx = null;
    let stars = [];
    let cachedStars = {}; // 用于存储离屏缓存的星星位图
    let animationFrameId = null; 
    let resizeTimeout = null;

    // ========== 可配置参数（保留你完美的星星参数） ==========
    const CONFIG = {
        maxStars: 80,               // 同时存在的星星数量
        minSpeed: 0.3,              // 最小下落速度 (px/帧)
        maxSpeed: 1.2,              // 最大下落速度
        wind: -0.2,                 // 水平飘移
        minSize: 2,                 // 星星最小尺寸
        maxSize: 7,                 // 星星最大尺寸
        opacity: 0.8,               // 星星基础不透明度
        shadowBlur: 6,              // 发光模糊半径
        hueRange: [200, 260],       // 色相范围（冰蓝到淡紫）
        saturation: '80%',
        lightness: '75%',
        rotationSpeed: 0.02,        // 自转速度
    };

    // ==========================================
    // 💡 核心优化：离屏 Canvas 缓存生成器
    // ==========================================
    function createOffscreenStar(size, color) {
        const cacheKey = `${size}_${color}`;
        if (cachedStars[cacheKey]) return cachedStars[cacheKey]; 

        const offscreenCanvas = document.createElement('canvas');
        const offCtx = offscreenCanvas.getContext('2d');
        
        const padding = CONFIG.shadowBlur * 2;
        const totalSize = size * 2 + padding;

        offscreenCanvas.width = totalSize;
        offscreenCanvas.height = totalSize;

        offCtx.shadowBlur = CONFIG.shadowBlur;
        offCtx.shadowColor = color;
        offCtx.fillStyle = color;

        const cx = totalSize / 2;
        const cy = totalSize / 2;
        const inner = size * 0.4;

        offCtx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angleOuter = (i * Math.PI) / 2 - Math.PI / 2;
            const angleInner = angleOuter + Math.PI / 4;
            const outerX = cx + Math.cos(angleOuter) * size;
            const outerY = cy + Math.sin(angleOuter) * size;
            const innerX = cx + Math.cos(angleInner) * inner;
            const innerY = cy + Math.sin(angleInner) * inner;
            if (i === 0) {
                offCtx.moveTo(outerX, outerY);
            } else {
                offCtx.lineTo(outerX, outerY);
            }
            offCtx.lineTo(innerX, innerY);
        }
        offCtx.closePath();
        offCtx.fill();

        cachedStars[cacheKey] = {
            canvas: offscreenCanvas,
            offsetX: -totalSize / 2,
            offsetY: -totalSize / 2
        };
        return cachedStars[cacheKey];
    }

    // 窗口尺寸调整（带轻量防抖）
    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // 包装防抖的监听函数，方便后续解绑
    function onResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 150);
    }

    // ==========================================
    // 🌟 星星类 (面向对象)
    // ==========================================
    class Star {
        constructor(initial = false) {
            this.reset(initial);
        }

        reset(initial = false) {
            if (!canvas) return;
            this.x = Math.random() * canvas.width;
            this.y = initial ? Math.random() * canvas.height : -Math.random() * 30;
            
            this.size = Math.round(CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize));
            this.speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.wind = CONFIG.wind + (Math.random() - 0.5) * 0.3; 
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationDir = Math.random() < 0.5 ? -1 : 1; 

            const hue = Math.round(CONFIG.hueRange[0] + Math.random() * (CONFIG.hueRange[1] - CONFIG.hueRange[0]));
            this.color = `hsl(${hue}, ${CONFIG.saturation}, ${CONFIG.lightness})`;
            this.opacity = CONFIG.opacity * (0.7 + Math.random() * 0.3);

            this.starCache = createOffscreenStar(this.size, this.color);
        }

        update() {
            if (!canvas) return;
            this.y += this.speed;
            this.x += this.wind;
            this.rotation += CONFIG.rotationSpeed * this.rotationDir;

            if (this.y > canvas.height + 20 || this.x < -30 || this.x > canvas.width + 30) {
                this.reset();
            }
        }

        draw(ctx) {
            if (!this.starCache) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            
            ctx.drawImage(
                this.starCache.canvas, 
                this.starCache.offsetX, 
                this.starCache.offsetY
            );
            
            ctx.restore();
        }
    }

    // 动画主循环
    function animate() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < stars.length; i++) {
            stars[i].update();
            stars[i].draw(ctx);
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // ==========================================
    // 遥控器按键一：大管家用来“启动”星星雨的开关
    // ==========================================
    function start() {
        if (document.getElementById('star-rain-canvas')) return;

        // 1. 创建并组装画布
        canvas = document.createElement('canvas');
        canvas.id = 'star-rain-canvas';
        ctx = canvas.getContext('2d');

        // 2. 注入样式与硬件加速
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.margin = '0';
        canvas.style.padding = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999997'; 
        canvas.style.transform = 'translateZ(0)'; 
        canvas.style.willChange = 'transform';    
        document.body.appendChild(canvas);

        // 3. 绑定窗口缩放
        window.addEventListener('resize', onResize);
        resize();

        // 4. 初始化并装填星星粒子池
        stars = [];
        for (let i = 0; i < CONFIG.maxStars; i++) {
            stars.push(new Star(true));
        }

        // 5. 开启循环动画
        animate();
    }

    // ==========================================
    // 遥控器按键二：大管家用来“关闭并抹除”星星雨的开关
    // ==========================================
    function stop() {
        // 1. 停止动画帧循环，不占 GPU 和显卡
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // 2. 解绑窗口缩放监听器，清除定时器防抖
        window.removeEventListener('resize', onResize);
        clearTimeout(resizeTimeout);

        // 3. 将 HTML 里的画布彻底移除
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }

        // 4. 清空内存，释放离屏 Canvas 的缓存和粒子数组
        canvas = null;
        ctx = null;
        stars = [];
        cachedStars = {}; // 释放占用的内存图片位图
    }

    // 顺便把配置挂载出去以便调试
    window.starRainConfig = CONFIG;

    // ==========================================
    // 核心出厂：将开关上交给 window，供大管家随意调用
    // ==========================================
    return {
        start: start,
        stop: stop
    };

})();