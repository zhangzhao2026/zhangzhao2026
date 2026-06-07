(function () {
    // 检查是否已经存在，防止 MkDocs 异步刷新重复创建
    if (document.getElementById('snow-flakes-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'snow-flakes-canvas';
    const ctx = canvas.getContext('2d');
    let flakes = [];
    let animationFrameId = null;

    // ========== 可配置参数 ==========
    const CONFIG = {
        maxFlakes: 40,               // 同时存在的雪花数量
        minSize: 10,                 // 雪花最小尺寸 (px)
        maxSize: 28,                 // 雪花最大尺寸 (px)
        minSpeed: 0.4,               // 最小下落速度 (px/帧)
        maxSpeed: 1.5,               // 最大下落速度
        baseWind: 0.1,               // 基础水平风向
        opacityRange: [0.3, 0.85],   // 不透明度范围 [最小, 最大]
    };

    // 样式设置
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999996';
    canvas.style.willChange = 'transform';
    document.body.appendChild(canvas);

    // 解决高清屏模糊的核心逻辑
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    // 自动匹配目录并加载同级目录下的 snow.svg
    const snowImg = new Image();
    try {
        snowImg.src = '/assets/svg/snow.svg';
    } catch (e) {
        snowImg.src = 'assets/svg/snow.svg';
    }

    class SnowFlake {
        constructor(initial = false) {
            this.reset(initial);
        }

        reset(initial = false) {
            this.x = Math.random() * window.innerWidth;
            this.y = initial ? Math.random() * window.innerHeight : -Math.random() * 30;
            
            // 景深绑定：大雪花重 -> 下落快 -> 在前景（较清晰）；小雪花轻 -> 下落慢 -> 在背景（较透明）
            const sizeProgress = Math.random();
            this.size = CONFIG.minSize + sizeProgress * (CONFIG.maxSize - CONFIG.minSize);
            this.speed = CONFIG.minSpeed + sizeProgress * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.opacity = CONFIG.opacityRange[0] + sizeProgress * (CONFIG.opacityRange[1] - CONFIG.opacityRange[0]);
            
            // 左右摇摆物理参数
            this.swingSpeed = 0.01 + Math.random() * 0.015; // 摆动频率
            this.swingRadius = 0.3 + Math.random() * 0.8;   // 左右摆动幅度
            this.swingOffset = Math.random() * Math.PI * 2; // 随机初始相位
        }

        update() {
            this.y += this.speed;
            this.swingOffset += this.swingSpeed;
            
            // 计算当前帧的摆动偏移量
            const currentSwing = Math.sin(this.swingOffset);
            this.x += CONFIG.baseWind + currentSwing * this.swingRadius;
            
            // 让雪花随摆动方向产生极其轻微的左右倾斜（角度随正弦波交替，非持续自转）
            this.rotation = currentSwing * 0.08; 

            if (this.y > window.innerHeight + 30 || this.x < -30 || this.x > window.innerWidth + 30) {
                this.reset();
            }
        }

        draw(ctx) {
            if (!snowImg.complete || snowImg.naturalWidth === 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            
            // 将 SVG 图片居中绘制
            ctx.drawImage(snowImg, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    // 初始化雪花池
    for (let i = 0; i < CONFIG.maxFlakes; i++) {
        flakes.push(new SnowFlake(true));
    }

    // 动画主循环
    function animate() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (const flake of flakes) {
            flake.update();
            flake.draw(ctx);
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // 确保图片加载完成后再启动，避免初次加载时白屏或报错
    if (snowImg.complete) {
        animate();
    } else {
        snowImg.onload = animate;
    }

    // 针对 MkDocs Material 异步刷新的卸载防御
    document.addEventListener("DOMNodeRemoved", function(e) {
        if (e.target === canvas) {
            window.removeEventListener('resize', resize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    });

    window.snowConfig = CONFIG;
})();