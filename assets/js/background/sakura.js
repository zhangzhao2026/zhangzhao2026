// 🌟 注册为全局大管家可调用的特工：EffectSakura
window.EffectSakura = (function () {
    
    // 将核心控制变量提取到顶部，方便 start 和 stop 共享管理
    let canvas = null;
    let ctx = null;
    let petals = [];
    let animationFrameId = null; 

    // ========== 可配置参数（保留你完美的樱花参数） ==========
    const CONFIG = {
        maxPetals: 25,               // 同时存在的樱花数量
        minSpeed: 0.4,               // 最小下落速度
        maxSpeed: 1.2,               // 最大下落速度
        wind: 0.3,                   // 基础水平风向
        minSize: 8,                  // 樱花瓣最小尺寸
        maxSize: 24,                 // 樱花瓣最大尺寸
        opacityRange: [0.4, 0.8],    // 不透明度范围
        rotationSpeed: 0.01,         // 自转速度
    };

    // 解决高清屏模糊的核心逻辑
    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr); 
    }

    // 鲁棒路径：自动匹配目录并加载 sakura.svg（保留你的智能路径资产匹配）
    const sakuraImg = new Image();
    try {
        const currentScript = document.querySelector('script[src*="background.js"]');
        if (currentScript) {
            sakuraImg.src = currentScript.src.replace('js/background.js', 'svg/sakura.svg');
        } else {
            sakuraImg.src = 'assets/svg/sakura.svg'; 
        }
    } catch (e) {
        sakuraImg.src = 'assets/svg/sakura.svg';
    }

    // 樱花花瓣粒子类
    class SakuraPetal {
        constructor(initial = false) {
            this.reset(initial);
        }

        reset(initial = false) {
            this.x = Math.random() * window.innerWidth;
            this.y = initial ? Math.random() * window.innerHeight : -Math.random() * 30;
            this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.wind = CONFIG.wind + (Math.random() - 0.5) * 0.15; 
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationDir = Math.random() < 0.5 ? -1 : 1;
            this.opacity = CONFIG.opacityRange[0] + Math.random() * (CONFIG.opacityRange[1] - CONFIG.opacityRange[0]);
            this.swingSpeed = 0.015 + Math.random() * 0.02; 
            this.swingOffset = Math.random() * 100;
        }

        update() {
            this.y += this.speed;
            this.x += this.wind + Math.sin(this.y * this.swingSpeed + this.swingOffset) * 0.6;
            this.rotation += CONFIG.rotationSpeed * this.rotationDir;

            if (this.y > window.innerHeight + 30 || this.x < -30 || this.x > window.innerWidth + 30) {
                this.reset();
            }
        }

        draw(ctx) {
            if (!sakuraImg.complete || sakuraImg.naturalWidth === 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(sakuraImg, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    // 动画主循环
    function animate() {
        if (!ctx) return; // 安全防御
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (const petal of petals) {
            petal.update();
            petal.draw(ctx);
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // ==========================================
    // 遥控器按键一：大管家用来“启动”樱花的开关
    // ==========================================
    function start() {
        // 如果网页上已经有了，就不重复创建
        if (document.getElementById('sakura-petals-canvas')) return;

        // 1. 动态组装画布
        canvas = document.createElement('canvas');
        canvas.id = 'sakura-petals-canvas';
        ctx = canvas.getContext('2d');

        // 2. 注入样式
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999996';
        canvas.style.willChange = 'transform';
        document.body.appendChild(canvas);

        // 3. 绑定视口缩放
        window.addEventListener('resize', resize);
        resize();

        // 4. 重新装填樱花花瓣池
        petals = [];
        for (let i = 0; i < CONFIG.maxPetals; i++) {
            petals.push(new SakuraPetal(true));
        }

        // 5. 启动动画
        if (sakuraImg.complete) {
            animate();
        } else {
            sakuraImg.onload = animate;
        }
    }

    // ==========================================
    // 遥控器按键二：大管家用来“关闭并抹除”樱花的开关
    // ==========================================
    function stop() {
        // 1. 停掉后台的疯狂刷新的渲染器（不占显卡）
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // 2. 解绑缩放监听器（防止内存泄漏）
        window.removeEventListener('resize', resize);
        
        // 3. 彻底将 HTML 里的画布连根拔除
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        
        // 4. 彻底清空内存变量，回归婴儿般纯洁
        canvas = null;
        ctx = null;
        petals = [];
    }

    // 针对 MkDocs Material 瞬时加载模式的额外安全防御
    document.addEventListener("DOMNodeRemoved", function(e) {
        if (canvas && e.target === canvas) {
            window.removeEventListener('resize', resize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    });

    // 顺便把配置挂载出去以便调试
    window.sakuraConfig = CONFIG;

    // ==========================================
    // 核心出厂：把这两个按键上交给 window 大大，供大管家随意点名
    // ==========================================
    return {
        start: start,
        stop: stop
    };

})();