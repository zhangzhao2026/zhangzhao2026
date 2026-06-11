// 🌟 注册为全局大管家可调用的特工：EffectMaple
window.EffectMaple = (function () {
    
    // 将核心控制变量提取到顶部，供 start 和 stop 共享管理
    let canvas = null;
    let ctx = null;
    let leaves = [];
    let animationFrameId = null; 

    // ========== 可配置参数（保留你完美的枫叶参数） ==========
    const CONFIG = {
        maxLeaves: 10,               // 同时存在的枫叶数量（保持优雅，不宜过多）
        minSpeed: 0.6,               // 最小下落速度 (px/帧)
        maxSpeed: 1.5,               // 最大下落速度
        wind: 0.2,                   // 基础水平风向（正值向右飘，负值向左）
        minSize: 10,                 // 枫叶最小尺寸 (px)
        maxSize: 22,                 // 枫叶最大尺寸 (px)
        opacityRange: [0.3, 0.7],    // 不透明度范围 [最小, 最大]，避免喧宾夺主
        rotationSpeed: 0.015,        // 自转速度
    };

    // 解决高清屏模糊的核心逻辑
    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr); // 缩放绘图上下文以匹配物理像素
    }

    // 鲁棒路径：如果探测失败，回退到当前页面相对路径而不是绝对根路径
    const leafImg = new Image();
    try {
        const currentScript = document.querySelector('script[src*="background.js"]');
        if (currentScript) {
            leafImg.src = currentScript.src.replace('js/background.js', 'svg/maple_leaf.svg');
        } else {
            leafImg.src = 'assets/svg/maple_leaf.svg'; 
        }
    } catch (e) {
        leafImg.src = 'assets/svg/maple_leaf.svg';
    }

    // 枫叶粒子类
    class Leaf {
        constructor(initial = false) {
            this.reset(initial);
        }

        reset(initial = false) {
            if (!canvas) return;
            // 因为 context 缩放了，这里的坐标逻辑依然使用 innerWidth/Height 的逻辑空间
            this.x = Math.random() * window.innerWidth;
            this.y = initial ? Math.random() * window.innerHeight : -Math.random() * 30;
            this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.wind = CONFIG.wind + (Math.random() - 0.5) * 0.2; 
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationDir = Math.random() < 0.5 ? -1 : 1;
            this.opacity = CONFIG.opacityRange[0] + Math.random() * (CONFIG.opacityRange[1] - CONFIG.opacityRange[0]);
            this.swingSpeed = 0.02 + Math.random() * 0.02;
            this.swingOffset = Math.random() * 100;
        }

        update() {
            this.y += this.speed;
            this.x += this.wind + Math.sin(this.y * this.swingSpeed + this.swingOffset) * 0.4;
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

    // 动画主循环
    function animate() {
        if (!ctx) return; 
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (const leaf of leaves) {
            leaf.update();
            leaf.draw(ctx);
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // ==========================================
    // 遥控器按键一：大管家用来“启动”枫叶下落的开关
    // ==========================================
    function start() {
        // 如果网页上已经有了，就不重复创建
        if (document.getElementById('maple-leaves-canvas')) return;

        // 1. 动态组装画布
        canvas = document.createElement('canvas');
        canvas.id = 'maple-leaves-canvas';
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

        // 4. 装填枫叶粒子池
        leaves = [];
        for (let i = 0; i < CONFIG.maxLeaves; i++) {
            leaves.push(new Leaf(true));
        }

        // 5. 启动动画循环
        if (leafImg.complete) {
            animate();
        } else {
            leafImg.onload = animate;
        }
    }

    // ==========================================
    // 遥控器按键二：大管家用来“关闭并抹除”枫叶的开关
    // ==========================================
    function stop() {
        // 1. 停掉后台动画刷新循环，节约显卡性能
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // 2. 解绑缩放监听器，防止内存泄漏
        window.removeEventListener('resize', resize);
        
        // 3. 彻底将 HTML 里的画布从 DOM 树中移除
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        
        // 4. 清空内存变量
        canvas = null;
        ctx = null;
        leaves = [];
    }

    // 针对 MkDocs Material 瞬时加载模式的额外安全防御
    document.addEventListener("DOMNodeRemoved", function(e) {
        if (canvas && e.target === canvas) {
            window.removeEventListener('resize', resize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    });

    // 挂载配置以便调试
    window.mapleLeavesConfig = CONFIG;

    // ==========================================
    // 核心出厂：把这两个按键上交给 window 供大管家调度
    // ==========================================
    return {
        start: start,
        stop: stop
    };

})();