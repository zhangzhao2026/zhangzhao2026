document.addEventListener("DOMContentLoaded", function () {
  // 1. 图标 SVG 源码
  const copyIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  `;

  const searchIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  `;

  // 2. 创建并添加悬浮工具栏（扩充子菜单节点，并分为两组以实现双列）
  const toolbar = document.createElement("div");
  toolbar.className = "selection-toolbar";
  toolbar.innerHTML = `
    <button class="selection-toolbar-btn" data-tooltip="复制" id="tb-copy-btn">
      ${copyIconSvg}
    </button>
    
    <div class="selection-toolbar-search-wrapper">
      <button class="selection-toolbar-btn">
        ${searchIconSvg}
      </button>
      <div class="search-sub-menu">
        <div class="search-sub-item" id="search-google">Google</div>
        <div class="search-sub-item" id="search-bing">Bing</div>
        <div class="search-sub-item" id="search-weixin">微信</div>
        <div class="search-sub-item" id="search-duckduckgo">DuckDuckGo</div>
        <div class="search-sub-item" id="search-zhihu">知乎</div>
        <div class="search-sub-item" id="search-bilibili">Bilibili</div>
        <div class="search-sub-item" id="search-youtube">YouTube</div>
        <div class="search-sub-item" id="search-wikipedia">维基百科</div>
        <div class="search-sub-item" id="search-sogou">搜狗</div>
        <div class="search-sub-item" id="search-baidu">百度</div>
        <div class="search-sub-item" id="search-toutiao">今日头条</div>
      </div>
    </div>
  `;
  document.body.appendChild(toolbar);

  // 3. 创建右上角通知容器
  const toastContainer = document.createElement("div");
  toastContainer.className = "toast-notification-container";
  document.body.appendChild(toastContainer);

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add("show"); });
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => { toast.remove(); }, 300);
    }, 1500);
  }

  let selectedText = "";

  // 4. 监听选中文本事件
  document.addEventListener("mouseup", function (e) {
    setTimeout(() => {
      const selection = window.getSelection();
      selectedText = selection.toString().trim();

      if (!selectedText || toolbar.contains(e.target)) {
        if (!toolbar.contains(e.target)) {
          toolbar.classList.remove("active");
        }
        return;
      }

      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();

      if (rects.length > 0) {
        const firstRect = rects[0];
        const top = firstRect.top + window.scrollY - toolbar.offsetHeight - 10; 
        const left = firstRect.left + window.scrollX + (firstRect.width / 2) - (toolbar.offsetWidth / 2);

        toolbar.style.top = `${top}px`;
        toolbar.style.left = `${left}px`;
        toolbar.classList.add("active");
      }
    }, 10);
  });

  // 5. 点击其他地方隐藏工具栏
  document.addEventListener("mousedown", function (e) {
    if (!toolbar.contains(e.target)) {
      toolbar.classList.remove("active");
    }
  });

  function closeToolbar() {
    toolbar.classList.remove("active");
    window.getSelection().removeAllRanges();
  }

  // 6. 功能一：点击复制
  const copyBtn = document.getElementById("tb-copy-btn");
  copyBtn.addEventListener("click", function () {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).then(() => {
        closeToolbar();
        showToast("📋 已复制到剪切板");
      }).catch(err => { console.error("复制失败: ", err); });
    }
  });

  // 7. 功能二：11大引擎多路搜索核心路由
  function handleSearch(engine) {
    if (!selectedText) return;
    const query = encodeURIComponent(selectedText);
    let url = "";

    switch (engine) {
      case "google":
        url = `https://www.google.com/search?q=${query}`;
        break;
      case "bing":
        url = `https://cn.bing.com/search?q=${query}`;
        break;
      case "duckduckgo":
        url = `https://duckduckgo.com/?q=${query}`;
        break;
      case "baidu":
        url = `https://www.baidu.com/s?wd=${query}`;
        break;
      case "toutiao":
        url = `https://so.toutiao.com/search?keyword=${query}`;
        break;
      case "sogou":
        url = `https://www.sogou.com/web?query=${query}`;
        break;
      case "zhihu":
        url = `https://www.zhihu.com/search?type=content&q=${query}`;
        break;
      case "bilibili":
        url = `https://search.bilibili.com/all?keyword=${query}`;
        break;
      case "youtube":
        url = `https://www.youtube.com/results?search_query=${query}`;
        break;
      case "weixin":
        url = `https://weixin.sogou.com/weixin?type=2&query=${query}`;
        break;
      case "wikipedia":
        url = `https://zh.wikipedia.org/wiki/Special:Search?search=${query}`;
        break;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      closeToolbar();
    }
  }

  // 批量高效绑定事件
  const engines = ["google", "bing", "duckduckgo", "baidu", "toutiao", "sogou", "zhihu", "bilibili", "youtube", "weixin", "wikipedia"];
  engines.forEach(id => {
    document.getElementById(`search-${id}`).addEventListener("click", () => handleSearch(id));
  });
});