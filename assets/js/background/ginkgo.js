// 🌟 注册为全局大管家可调用的特工：EffectGinkgo
window.EffectGinkgo = (function () {
    let canvas = null;
    let ctx = null;
    let leaves = [];
    let animationFrameId = null;

    // ========== 可配置参数 ==========
    const CONFIG = {
        maxLeaves: 10,               // 银杏叶较大，数量稍微减少，避免遮挡内容
        minSpeed: 0.5,
        maxSpeed: 1.2,
        wind: 0.1,
        minSize: 15,                 // 银杏叶通常比枫叶稍大
        maxSize: 26,
        opacityRange: [0.4, 0.8],
        rotationSpeed: 0.01,
    };

    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }

    // 路径探测：自动查找 ice_cream_1.svg
    // 关键：直接用 document.currentScript 锁定当前 ginkgo.js 自己的 src，
    // 避免依赖 DOM 顺序或脆弱的字符串 replace，在 GitHub Pages 子路径下也能稳定工作。
    const leafImg = new Image();
    try {
        const currentScript = document.currentScript;
        if (currentScript && currentScript.src) {
            // 例：https://user.github.io/repo/assets/js/background/ginkgo.js
            //    -> https://user.github.io/repo/assets/svg/ice_cream_1.svg
            const scriptSrc = currentScript.src.split('?')[0];
            const baseUrl = scriptSrc.substring(0, scriptSrc.indexOf('assets/js/background/'));
            leafImg.src = baseUrl + 'assets/svg/ice_cream_1.svg';
        } else {
            // 兜底：使用 querySelector 查找 background.js 再推算
            const bgScript = document.querySelector('script[src*="background.js"]');
            leafImg.src = bgScript ? bgScript.src.replace('js/background.js', 'svg/ice_cream_1.svg') : 'assets/svg/ice_cream_1.svg';
        }
    } catch (e) {
        leafImg.src = 'assets/svg/ice_cream_1.svg';
    }

    class Ginkgo {
        constructor(initial = false) { this.reset(initial); }

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
            this.swingSpeed = 0.015 + Math.random() * 0.01;
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
            if (!leafImg.complete || leafImg.naturalWidth === 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(leafImg, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (const leaf of leaves) {
            leaf.update();
            leaf.draw(ctx);
        }
        animationFrameId = requestAnimationFrame(animate);
    }

    function start() {
        // 关键点：ID 必须唯一，这里改为 'ginkgo-leaves-canvas'
        if (document.getElementById('ginkgo-leaves-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'ginkgo-leaves-canvas';
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

        leaves = [];
        for (let i = 0; i < CONFIG.maxLeaves; i++) leaves.push(new Ginkgo(true));

        if (leafImg.complete) animate();
        else leafImg.onload = animate;
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
        leaves = [];
    }

    document.addEventListener("DOMNodeRemoved", function(e) {
        if (canvas && e.target === canvas) {
            window.removeEventListener('resize', resize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    });

    return { start, stop };
})();