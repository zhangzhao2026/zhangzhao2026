// 🌟 注册为全局大管家可调用的特工：EffectFirefly
window.EffectFirefly = (function () {
    
    let canvas = null;
    let ctx = null;
    let fireflies = [];
    let animationFrameId = null;

    // ========== 可配置参数 ==========
    const CONFIG = {
        count: 15,
        minSpeed: 0.2,
        maxSpeed: 0.6,
        minSize: 2,
        maxSize: 6,
        flickerSpeed: 0.01,
    };

    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }

    class Firefly {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * window.innerHeight;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.opacity = Math.random();
            this.flickerDir = Math.random() > 0.5 ? 1 : -1;
        }

        update() {
            this.angle += (Math.random() - 0.5) * 0.1;
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            this.opacity += this.flickerDir * CONFIG.flickerSpeed;
            if (this.opacity > 1 || this.opacity < 0.2) this.flickerDir *= -1;
            if (this.x < 0 || this.x > window.innerWidth || this.y < 0 || this.y > window.innerHeight) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 150, ${this.opacity})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'yellow';
            ctx.fill();
            ctx.restore();
        }
    }

    // ==========================================
    // 遥控器：启动
    // ==========================================
    function start() {
        if (document.getElementById('firefly-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'firefly-canvas';
        ctx = canvas.getContext('2d');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999996';
        document.body.appendChild(canvas);

        window.addEventListener('resize', resize);
        resize();

        fireflies = [];
        for (let i = 0; i < CONFIG.count; i++) fireflies.push(new Firefly());

        function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (const fly of fireflies) {
                fly.update();
                fly.draw(ctx);
            }
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }

    // ==========================================
    // 遥控器：停止
    // ==========================================
    function stop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        window.removeEventListener('resize', resize);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
        fireflies = [];
    }

    return { start, stop };
})();