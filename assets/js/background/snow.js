// 🌟 注册为全局大管家可调用的特工：EffectSnow
window.EffectSnow = (function () {

    let canvas = null;
    let ctx = null;
    let flakes = [];
    let animationFrameId = null;

    // ========== 可配置参数 ==========
    const CONFIG = {
        maxFlakes: 40,
        minSize: 10,
        maxSize: 28,
        minSpeed: 0.4,
        maxSpeed: 1.5,
        baseWind: 0.1,
        opacityRange: [0.3, 0.85],
    };

    // 路径探测
    const snowImg = new Image();
    try {
        const currentScript = document.querySelector('script[src*="background.js"]');
        snowImg.src = currentScript ? currentScript.src.replace('js/background.js', 'svg/snow.svg') : 'assets/svg/snow.svg';
    } catch (e) {
        snowImg.src = 'assets/svg/snow.svg';
    }

    function resize() {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }

    class SnowFlake {
        constructor(initial = false) { this.reset(initial); }
        reset(initial = false) {
            this.x = Math.random() * window.innerWidth;
            this.y = initial ? Math.random() * window.innerHeight : -Math.random() * 30;
            const sizeProgress = Math.random();
            this.size = CONFIG.minSize + sizeProgress * (CONFIG.maxSize - CONFIG.minSize);
            this.speed = CONFIG.minSpeed + sizeProgress * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.opacity = CONFIG.opacityRange[0] + sizeProgress * (CONFIG.opacityRange[1] - CONFIG.opacityRange[0]);
            this.swingSpeed = 0.01 + Math.random() * 0.015;
            this.swingRadius = 0.3 + Math.random() * 0.8;
            this.swingOffset = Math.random() * Math.PI * 2;
        }
        update() {
            this.y += this.speed;
            this.swingOffset += this.swingSpeed;
            const currentSwing = Math.sin(this.swingOffset);
            this.x += CONFIG.baseWind + currentSwing * this.swingRadius;
            this.rotation = currentSwing * 0.08;
            if (this.y > window.innerHeight + 30 || this.x < -30 || this.x > window.innerWidth + 30) this.reset();
        }
        draw(ctx) {
            if (!snowImg.complete) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(snowImg, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (const flake of flakes) {
            flake.update();
            flake.draw(ctx);
        }
        animationFrameId = requestAnimationFrame(animate);
    }

    // ==========================================
    // 遥控器：启动
    // ==========================================
    function start() {
        if (document.getElementById('snow-flakes-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'snow-flakes-canvas';
        ctx = canvas.getContext('2d');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999996';
        canvas.style.willChange = 'transform';
        document.body.appendChild(canvas);

        window.addEventListener('resize', resize);
        resize();

        flakes = [];
        for (let i = 0; i < CONFIG.maxFlakes; i++) flakes.push(new SnowFlake(true));

        if (snowImg.complete) animate();
        else snowImg.onload = animate;
    }

    // ==========================================
    // 遥控器：停止
    // ==========================================
    function stop() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
        flakes = [];
    }

    return { start, stop };
})();