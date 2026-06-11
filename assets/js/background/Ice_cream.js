// 🌟 注册为全局大管家可调用的特工：EffectIceCream
window.EffectIceCream = (function () {
    let canvas = null;
    let ctx = null;
    let items = [];
    let animationFrameId = null;

    // ========== 可配置参数（延续你优雅的下落物理参数） ==========
    const CONFIG = {
        maxItems: 10,                // 同时存在的冰激凌数量
        minSpeed: 0.6,               // 最小下落速度 (px/帧)
        maxSpeed: 1.5,               // 最大下落速度
        wind: 0.1,                   // 稍微降低一点水平风向，让冰激凌看起来更自然
        minSize: 20,                 // 冰激凌最小尺寸 (px)
        maxSize: 30,                 // 冰激凌最大尺寸 (px)
        opacityRange: [0.4, 0.75],   // 不透明度范围，保证色彩不过于刺眼
        rotationSpeed: 0.012,        // 旋转速度
    };

    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }

    // 路径探测：自动查找 ice_cream_1.svg
    // 关键：直接用 document.currentScript 锁定当前 ice_cream.js 自己的 src，
    // 避免依赖 DOM 顺序或脆弱的字符串 replace，在 GitHub Pages 子路径下也能稳定工作。
    const iceCreamImg = new Image();
    try {
        const currentScript = document.currentScript;
        if (currentScript && currentScript.src) {
            // 例：https://user.github.io/repo/assets/js/background/ice_cream.js
            //    -> https://user.github.io/repo/assets/svg/ice_cream_1.svg
            const scriptSrc = currentScript.src.split('?')[0];
            const baseUrl = scriptSrc.substring(0, scriptSrc.indexOf('assets/js/background/'));
            iceCreamImg.src = baseUrl + 'assets/svg/ice_cream_1.svg';
        } else {
            // 兜底：使用 querySelector 查找 background.js 再推算
            const bgScript = document.querySelector('script[src*="background.js"]');
            iceCreamImg.src = bgScript ? bgScript.src.replace('js/background.js', 'svg/ice_cream_1.svg') : 'assets/svg/ice_cream_1.svg';
        }
    } catch (e) {
        iceCreamImg.src = 'assets/svg/ice_cream_1.svg';
    }

    // 冰激凌粒子类
    class IceCream {
        constructor(initial = false) {
            this.reset(initial);
        }

        reset(initial = false) {
            if (!canvas) return;
            this.x = Math.random() * window.innerWidth;
            this.y = initial ? Math.random() * window.innerHeight : -Math.random() * 30;
            this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.wind = CONFIG.wind + (Math.random() - 0.5) * 0.2;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationDir = Math.random() < 0.5 ? -1 : 1;
            this.opacity = CONFIG.opacityRange[0] + Math.random() * (CONFIG.opacityRange[1] - CONFIG.opacityRange[0]);
            this.swingSpeed = 0.015 + Math.random() * 0.015;
            this.swingOffset = Math.random() * 100;
        }

        update() {
            this.y += this.speed;
            this.x += this.wind + Math.sin(this.y * this.swingSpeed + this.swingOffset) * 0.3;
            this.rotation += CONFIG.rotationSpeed * this.rotationDir;

            if (this.y > window.innerHeight + 30 || this.x < -30 || this.x > window.innerWidth + 30) {
                this.reset();
            }
        }

        draw(ctx) {
            if (!iceCreamImg.complete || iceCreamImg.naturalWidth === 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(iceCreamImg, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (const item of items) {
            item.update();
            item.draw(ctx);
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    function start() {
        if (document.getElementById('ice-cream-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'ice-cream-canvas';
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

        items = [];
        for (let i = 0; i < CONFIG.maxItems; i++) items.push(new IceCream(true));

        if (iceCreamImg.complete) animate();
        else iceCreamImg.onload = animate;
    }

    function stop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        window.removeEventListener('resize', resize);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
        items = [];
    }

    document.addEventListener("DOMNodeRemoved", function(e) {
        if (canvas && e.target === canvas) {
            window.removeEventListener('resize', resize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    });

    return { start, stop };
})();
