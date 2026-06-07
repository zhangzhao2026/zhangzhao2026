(function () {
    // 动态创建画布（和原来一样）
    const canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let stars = [];

    // ========== 可调整参数 ==========
    const CONFIG = {
        maxStars: 50,               // 最大星星数量
        spawnChance: 0.6,           // 每次移动生成概率（0-1）
        minSpeed: 2,                // 需要的最小移动距离（px）
        baseSize: 3,                // 星星基础大小
        sizeVariation: 2,           // 大小随机浮动范围
        alphaDecay: 0.018,          // 透明度衰减速度
        shadowBlur: 8,              // 发光模糊半径
        hueRange: [200, 260],       // 色相范围（冰蓝到淡紫）
        saturation: '80%',
        lightness: '75%',
    };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 绘制标准四角星（修复旋转错误）
    function drawStar(ctx, size) {
        const inner = size * 0.4;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angleOuter = (i * Math.PI) / 2 - Math.PI / 2; // 向上开始
            const angleInner = angleOuter + Math.PI / 4;
            const outerX = Math.cos(angleOuter) * size;
            const outerY = Math.sin(angleOuter) * size;
            const innerX = Math.cos(angleInner) * inner;
            const innerY = Math.sin(angleInner) * inner;
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
    }

    class Star {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const base = CONFIG.baseSize;
            const varSize = CONFIG.sizeVariation;
            this.size = base + Math.random() * varSize * 2 - varSize;
            this.speedX = (Math.random() - 0.5) * 1.8;
            this.speedY = (Math.random() - 0.5) * 1.8;
            const hue = CONFIG.hueRange[0] + Math.random() * (CONFIG.hueRange[1] - CONFIG.hueRange[0]);
            this.color = `hsl(${hue}, ${CONFIG.saturation}, ${CONFIG.lightness})`;
            this.alpha = 1;
            this.rotate = Math.random() * Math.PI * 2;
            this.rotateSpeed = (Math.random() - 0.5) * 0.12;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= CONFIG.alphaDecay;
            this.rotate += this.rotateSpeed;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotate);
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = CONFIG.shadowBlur;
            ctx.shadowColor = this.color;
            drawStar(ctx, this.size);
            ctx.restore();
        }
    }

    // 鼠标位置记录
    let lastMouseX = 0, lastMouseY = 0;
    let hasMoved = false;

    window.addEventListener('mousemove', (e) => {
        if (!hasMoved) {
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            hasMoved = true;
            return;
        }

        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const dist = Math.hypot(dx, dy);

        // 移动太短不生成，避免抖动
        if (dist < CONFIG.minSpeed) {
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            return;
        }

        // 根据距离动态决定生成数量（最多3个）
        const generateCount = Math.min(3, Math.floor(dist / 10) + 1);
        for (let i = 0; i < generateCount; i++) {
            if (Math.random() < CONFIG.spawnChance && stars.length < CONFIG.maxStars) {
                const offsetX = (Math.random() - 0.5) * 6;
                const offsetY = (Math.random() - 0.5) * 6;
                stars.push(new Star(e.clientX + offsetX, e.clientY + offsetY));
            }
        }

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    // 鼠标离开窗口时清空
    window.addEventListener('mouseleave', () => {
        stars.length = 0;
        hasMoved = false;
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = stars.length - 1; i >= 0; i--) {
            stars[i].update();
            if (stars[i].alpha <= 0) {
                stars.splice(i, 1);
            } else {
                stars[i].draw(ctx);
            }
        }
        requestAnimationFrame(animate);
    }

    animate();
})();


