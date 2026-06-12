// 🌟 注册为全局大管家可调用的特工：EffectIceCream
window.EffectIceCream = (function () {
    let canvas = null;
    let ctx = null;
    let items = [];
    let animationFrameId = null;

    // ========== 可配置参数 ==========
    const CONFIG = {
        maxItems: 10,                // 同时存在的冰激凌数量
        minSpeed: 0.6,               // 最小下落速度 (px/帧)
        maxSpeed: 1.5,               // 最大下落速度
        wind: 0.1,                   // 稍微降低一点水平风向，让冰激凌看起来更自然
        minSize: 20,                 // 冰激凌最小尺寸 (px)
        maxSize: 30,                 // 冰激凌最大尺寸 (px)
        opacityRange: [0.4, 0.75],   // 不透明度范围，保证色彩不过于刺眼
        rotationSpeed: 0.012,        // 旋转速度
        // 🌟 自定义图片文件名列表：支持任意命名格式，直接在这里追加或修改文件名即可！
        svgFiles: [
            'ice_cream_1.svg',
            'ice_cream_3.svg',
            'ice_cream_4.svg',
            'ice_cream_5.svg',
            'ice_cream_7.svg'
        ]
    };

    // 🌟 可用图片池：网络好的时候塞入多个，网络差时只塞入成功加载的
    let loadedImages = [];

    // ========== 路径探测与多图预加载 (完美保留原路径逻辑) ==========
    function initImages() {
        let baseUrl = 'assets/';
        try {
            const currentScript = document.currentScript;
            if (currentScript && currentScript.src) {
                // 例：https://user.github.io/repo/assets/js/background/ice_cream.js
                //    -> https://user.github.io/repo/assets/
                const scriptSrc = currentScript.src.split('?')[0];
                baseUrl = scriptSrc.substring(0, scriptSrc.indexOf('assets/js/background/')) + 'assets/';
            } else {
                // 兜底：使用 querySelector 查找 background.js 再推算
                const bgScript = document.querySelector('script[src*="background.js"]');
                baseUrl = bgScript ? bgScript.src.replace('js/background.js', '') : 'assets/';
            }
        } catch (e) {
            baseUrl = 'assets/';
        }

        // 🌟 遍历配置中的文件名数组进行加载
        CONFIG.svgFiles.forEach(fileName => {
            const img = new Image();
            img.onload = function() {
                // 加载成功，放入可用池
                if (!loadedImages.includes(img)) {
                    loadedImages.push(img);
                }
            };
            img.onerror = function() {
                console.warn(`[EffectIceCream] 无法加载图片，可能网络较差或文件不存在: ${fileName}`);
            };
            // 拼接路径，依然是 原逻辑的 baseUrl + 'svg/' + 自定义文件名
            img.src = baseUrl + 'svg/' + fileName;
        });
    }

    // 执行图片初始化
    initImages();

    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }

    class IceCream {
        constructor(initial = false) { 
            this.img = null; // 🌟 当前粒子绑定的图片对象
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
            this.swingSpeed = 0.015 + Math.random() * 0.01;
            this.swingOffset = Math.random() * 100;

            // 🌟 核心容错：每次重生时，从当前“已下载完成”的图片池中随机选一张
            if (loadedImages.length > 0) {
                const randomIndex = Math.floor(Math.random() * loadedImages.length);
                this.img = loadedImages[randomIndex];
            } else {
                this.img = null; // 网络极差还没加载好时，先不绑定
            }
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
            // 🌟 如果网络不好没分配到图片，或者分配到的图片未准备好，则跳过绘制不报错
            if (!this.img || !this.img.complete || this.img.naturalWidth === 0) {
                // 如果之前没分配到图片，但现在图片池有图片了，尝试重新获取一次
                if (!this.img && loadedImages.length > 0) {
                    this.img = loadedImages[Math.floor(Math.random() * loadedImages.length)];
                }
                return;
            }
            
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

        // 🌟 无论图片有没有加载完，直接启动动画循环。
        // 这样即使网络卡顿，代码也不会被 onload 卡住，图片好了会自动显现。
        animate();
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