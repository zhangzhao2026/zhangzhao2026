(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Star {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 2;
            this.speedX = (Math.random() - 0.5) * 1.5;
            this.speedY = (Math.random() - 0.5) * 1.5;
            this.color = `hsl(${Math.random() * 60 + 200}, 100%, 75%)`; // 偏梦幻冰蓝/淡紫调
            this.alpha = 1;
            this.rotate = Math.random() * Math.PI;
            this.rotateSpeed = (Math.random() - 0.5) * 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= 0.02;
            this.rotate += this.rotateSpeed;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotate);
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            
            // 绘制标准的四角星
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.lineTo(0, -this.size);
                ctx.lineTo(this.size / 3, -this.size / 3);
                ctx.rotate(Math.PI / 2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    
    // 捕捉移动路径，只要移动就不断塞入星星
    window.addEventListener('mousemove', (e) => {
        // 控制一下生成频率，避免太密集
        if (Math.random() > 0.8) {
            stars.push(new Star(e.clientX, e.clientY));
        }
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = stars.length - 1; i >= 0; i--) {
            stars[i].update();
            if (stars[i].alpha <= 0) {
                stars.splice(i, 1);
            } else {
                stars[i].draw();
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
})();