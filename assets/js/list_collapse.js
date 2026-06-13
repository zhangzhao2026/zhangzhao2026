document.addEventListener("DOMContentLoaded", function () {
  const mdContent = document.querySelector(".md-content");
  if (!mdContent) return;

  // 识别所有含有子列表的 li
  const parentItems = mdContent.querySelectorAll("li > ul, li > ol");

  parentItems.forEach((subList) => {
    const parentLi = subList.parentElement;

    if (parentLi.classList.contains("collapsible-item")) return;
    parentLi.classList.add("collapsible-item");

    // 默认折叠
    subList.style.display = "none";

    // 创建 SVG 展开箭头
    const toggleIcon = document.createElement("span");
    toggleIcon.className = "list-toggle-icon";
    toggleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42Z"/></svg>`;

    // 插入到 li 的最前端（由于 CSS 绝对定位，它会自动浮动到左侧）
    parentLi.insertBefore(toggleIcon, parentLi.firstChild);

    // 定义切换状态的函数
    const toggleCollapse = function (e) {
      e.stopPropagation(); // 阻止事件冒泡
      const isCollapsed = subList.style.display === "none";
      if (isCollapsed) {
        subList.style.display = "block";
        parentLi.classList.add("is-expanded");
      } else {
        subList.style.display = "none";
        parentLi.classList.remove("is-expanded");
      }
    };

    // 绑定点击事件：点击箭头或点击父列表项文本均可折叠/展开
    toggleIcon.addEventListener("click", toggleCollapse);
    
    // 可选：允许点击文字本身也触发折叠（排除点击子列表的情况）
    parentLi.addEventListener("click", function (e) {
      if (e.target === parentLi || parentLi.replaceChild) {
        // 确保点击的是父级节点本身，而非子列表内部
        if (!subList.contains(e.target)) {
          toggleCollapse(e);
        }
      }
    });
  });
});