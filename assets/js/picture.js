

// 点击图片放大-计算-开始

document.addEventListener("DOMContentLoaded", function () {
  // 1. 动态生成全局遮罩层
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  document.body.appendChild(overlay);

  let currentZoomedImg = null;
  
  // 核心状态管理
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  
  // 拖拽状态
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false; // 用于区分“点击”和“拖拽”

  // 关闭放大的函数
  function closeLightbox() {
    if (currentZoomedImg) {
      currentZoomedImg.style.transition = "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease"; 
      currentZoomedImg.style.transform = "";
      currentZoomedImg.classList.remove("zoomed");
      overlay.classList.remove("active");
      currentZoomedImg = null;
      isDragging = false;
    }
  }

  // 更新图片位置的封装函数
  function updateTransform() {
    if (currentZoomedImg) {
      currentZoomedImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
  }

  // 2. 监听图片点击（初始化放大）
  document.querySelectorAll(".md-content img").forEach((img) => {
    // 阻止浏览器默认的图片拖动生成虚影的行为
    img.addEventListener("dragstart", (e) => e.preventDefault());

    img.addEventListener("click", function (e) {
      e.stopPropagation();

      // 如果当前已经是放大状态，且刚才只是单纯点击（没拖拽），则关闭
      if (this.classList.contains("zoomed")) {
        if (!hasMoved) closeLightbox();
        return;
      }

      closeLightbox();

      // 计算初始居中位置
      const rect = this.getBoundingClientRect();
      const imgCenterX = rect.left + rect.width / 2;
      const imgCenterY = rect.top + rect.height / 2;
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      
      translateX = viewportCenterX - imgCenterX;
      translateY = viewportCenterY - imgCenterY;

      // 计算初始缩放比例
      const scaleX = (window.innerWidth * 0.9) / rect.width;
      const scaleY = (window.innerHeight * 0.9) / rect.height;
      scale = Math.min(scaleX, scaleY); 
      if (scale > 2.5) scale = 2.5; 

      this.classList.add("zoomed");
      overlay.classList.add("active");
      currentZoomedImg = this;

      // 首次打开给一个顺滑的过渡
      this.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease";
      updateTransform();
    });
  });

  // 3. 鼠标滚轮无限缩放
  window.addEventListener("wheel", function (e) {
    if (!currentZoomedImg) return;
    e.preventDefault(); 

    const zoomFactor = 0.15;
    if (e.deltaY < 0) {
      scale += scale * zoomFactor;
    } else {
      scale -= scale * zoomFactor;
    }
    // 安全边界：最小 0.4 倍，最大 15 倍
    scale = Math.max(0.4, Math.min(scale, 15));

    // 滚轮缩放时降低 transition 延迟，保证跟手
    currentZoomedImg.style.transition = "transform 0.01s linear, box-shadow 0.4s ease";
    updateTransform();
  }, { passive: false });

  // 4. 核心优化：鼠标拖拽平移图片
  window.addEventListener("mousedown", function (e) {
    if (!currentZoomedImg || e.target !== currentZoomedImg) return;
    e.preventDefault();
    
    isDragging = true;
    hasMoved = false;
    // 记录鼠标按下时的初始坐标
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    
    currentZoomedImg.style.transition = "transform 0.01s linear, box-shadow 0.4s ease";
  });

  window.addEventListener("mousemove", function (e) {
    if (!isDragging || !currentZoomedImg) return;
    e.preventDefault();
    
    hasMoved = true; // 证明用户在拖拽，而不是单纯点击
    // 计算新位移
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    
    updateTransform();
  });

  window.addEventListener("mouseup", function () {
    isDragging = false;
  });

  // 5. 其他关闭交互
  overlay.addEventListener("click", closeLightbox);
  
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) closeLightbox();
  });

  window.addEventListener("scroll", function() {
    if (currentZoomedImg) closeLightbox();
  }, { passive: true });
});

// 点击图片放大-计算-结束
