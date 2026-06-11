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

    // 1. 初始化 7 张冰激凌图片的素材池
    // 关键：完全照搬 sakura.js 的写法（sakura.js 是 const sakuraImg = new Image()），
    // 每个 SVG 一一对应一个独立的 Image 对象 + 独立的 src 赋值，
    // 这样任何一张图加载失败都不会影响其他图，路径探测也跟 sakura.js 一模一样。
    const ice_cream_1 = new Image();
    const ice_cream_2 = new Image();
    const ice_cream_3 = new Image();
    const ice_cream_4 = new Image();
    const ice_cream_5 = new Image();
    const ice_cream_6 = new Image();
    const ice_cream_7 = new Image();

    // 鲁棒路径：完全照搬 sakura.js 的写法
    // 关键：用 document.currentScript 锁定当前 ice_cream.js 自己的 src，
    // 避免依赖 DOM 顺序或脆弱的字符串 replace，在 GitHub Pages 子路径下也能稳定工作。
    // 防缓存：加 ?v= 时间戳，确保云端部署后浏览器能拉到最新资源。
    const cacheBuster = '?v=' + Date.now();
    try {
        const currentScript = document.currentScript;
        if (currentScript && currentScript.src) {
            // 例：https://user.github.io/repo/assets/js/background/ice_cream.js
            //    -> https://user.github.io/repo/assets/svg/ice_cream_X.svg
            const scriptSrc = currentScript.src.split('?')[0];
            const baseUrl = scriptSrc.substring(0, scriptSrc.indexOf('assets/js/background/'));
            ice_cream_1.src = baseUrl + 'assets/svg/ice_cream_1.svg' + cacheBuster;
            ice_cream_2.src = baseUrl + 'assets/svg/ice_cream_2.svg' + cacheBuster;
            ice_cream_3.src = baseUrl + 'assets/svg/ice_cream_3.svg' + cacheBuster;
            ice_cream_4.src = baseUrl + 'assets/svg/ice_cream_4.svg' + cacheBuster;
            ice_cream_5.src = baseUrl + 'assets/svg/ice_cream_5.svg' + cacheBuster;
            ice_cream_6.src = baseUrl + 'assets/svg/ice_cream_6.svg' + cacheBuster;
            ice_cream_7.src = baseUrl + 'assets/svg/ice_cream_7.svg' + cacheBuster;
        } else {
            // 兜底：使用 querySelector 查找 background.js 再推算
            const bgScript = document.querySelector('script[src*="background.js"]');
            const baseUrl = bgScript ? bgScript.src.replace('js/background.js', 'svg/') : 'assets/svg/';
            ice_cream_1.src = baseUrl + 'ice_cream_1.svg' + cacheBuster;
            ice_cream_2.src = baseUrl + 'ice_cream_2.svg' + cacheBuster;
            ice_cream_3.src = baseUrl + 'ice_cream_3.svg' + cacheBuster;
            ice_cream_4.src = baseUrl + 'ice_cream_4.svg' + cacheBuster;
            ice_cream_5.src = baseUrl + 'ice_cream_5.svg' + cacheBuster;
            ice_cream_6.src = baseUrl + 'ice_cream_6.svg' + cacheBuster;
            ice_cream_7.src = baseUrl + 'ice_cream_7.svg' + cacheBuster;
        }
    } catch (e) {
        // 兜底：相对路径（依赖当前页面的 base href，理论上不优，但绝不会让动画卡死）
        ice_cream_1.src = 'assets/svg/ice_cream_1.svg' + cacheBuster;
        ice_cream_2.src = 'assets/svg/ice_cream_2.svg' + cacheBuster;
        ice_cream_3.src = 'assets/svg/ice_cream_3.svg' + cacheBuster;
        ice_cream_4.src = 'assets/svg/ice_cream_4.svg' + cacheBuster;
        ice_cream_5.src = 'assets/svg/ice_cream_5.svg' + cacheBuster;
        ice_cream_6.src = 'assets/svg/ice_cream_6.svg' + cacheBuster;
        ice_cream_7.src = 'assets/svg/ice_cream_7.svg' + cacheBuster;
    }

    // 把所有图片打包成数组，方便在 reset() 中随机抽取
    const iceCreamImages = [
        ice_cream_1, ice_cream_2, ice_cream_3, ice_cream_4,
        ice_cream_5, ice_cream_6, ice_cream_7
    ];

    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
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
            
            // 核心：每次重置时，随机从5张图片中抽取一张绑定给当前粒子
            const randomIndex = Math.floor(Math.random() * iceCreamImages.length);
            this.img = iceCreamImages[randomIndex];
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
            // 确保图片加载完成且素材有效
            if (!this.img || !this.img.complete || this.img.naturalWidth === 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
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

    // ==========================================
    // 遥控器：启动
    // ==========================================
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
        for (let i = 0; i < CONFIG.maxItems; i++) {
            items.push(new IceCream(true));
        }

        // 关键修复：必须等所有冰激凌图片都"落定"（加载成功 OR 失败）后再启播动画。
        // 原本只等第一张图，但粒子在 reset() 里是随机从池中抽图的（1~7 号都可能拿到）；
        // 本地 HTTP 几乎瞬时同到没问题，云端 HTTPS/HTTP2 下多图到达时间差被拉开，
        // 会出现"动画在跑但 80% 粒子抽到的图都还在 loading，于是集体隐身"的窘境。
        const totalImages = iceCreamImages.length;
        if (totalImages === 0) {
            animate();
        } else {
            let settledCount = 0;
            const tryStart = () => {
                if (settledCount >= totalImages) animate();
            };
            iceCreamImages.forEach(img => {
                if (img.complete) {
                    settledCount++;
                } else {
                    const onSettle = () => {
                        settledCount++;
                        img.onload = null;
                        img.onerror = null;
                        tryStart();
                    };
                    img.onload = onSettle;
                    img.onerror = onSettle;
                }
            });
            tryStart();
        }
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
        
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        
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

    window.iceCreamConfig = CONFIG;

    return {
        start: start,
        stop: stop
    };

})();