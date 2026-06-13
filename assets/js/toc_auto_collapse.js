document.addEventListener("DOMContentLoaded", function() {
  const tocItems = document.querySelectorAll(".md-nav--secondary .md-nav__item");

  // =================【间距控制核心工具函数】=================
  // 通过该函数控制子菜单的显示与隐藏，并完美锁死折叠时的原生间距
  function toggleSubListVisibility(subList, shouldShow) {
    if (shouldShow) {
      subList.style.display = "block";
      subList.style.paddingBottom = ""; // 展开时清除 JS 强制干预，由原生主题样式控制间距
    } else {
      subList.style.display = "none";
      
      // 【关键修复】当折叠时，找到该子列表的直系父级 <li>
      const parentLi = subList.closest(".md-nav__item");
      if (parentLi) {
        // 找到该级目录下紧邻的下一个同级不可折叠标题项
        const nextSibling = parentLi.nextElementSibling;
        
        // 如果下方存在同级标题（例如从“标题1”到“标题2”），则动态对 subList 进行间距补偿
        // 这样可以确保 subList 即使内部隐藏，也能通过 display: block + 高度/内边距 重新把下方标题顶开
        if (nextSibling && nextSibling.classList.contains("md-nav__item")) {
          subList.style.display = "block";            // 重新进入文档流参与排版
          subList.style.height = "0px";               // 自身内容高度归零（隐藏标题1.1）
          subList.style.overflow = "hidden";          // 确保不溢出显示
          subList.style.paddingBottom = "0.5rem";     // 【核心补偿】用 0.5rem 的底部内边距优雅地顶开“标题2”
        }
      }
    }
  }

  tocItems.forEach(item => {
    const subList = item.querySelector(".md-nav__list");
    const link = item.querySelector(".md-nav__link");
    
    if (subList && link) {
      // 初始化：默认隐藏并应用间距补丁
      toggleSubListVisibility(subList, false);
      
      // 全新位置修正逻辑
      link.style.position = "relative";
      link.style.paddingRight = "24px"; 
      
      const toggleBtn = document.createElement("span");
      toggleBtn.className = "md-nav__icon";
      toggleBtn.style.transition = "transform 0.25s ease";
      
      toggleBtn.style.setProperty("position", "absolute", "important");
      toggleBtn.style.setProperty("right", "0", "important");
      toggleBtn.style.setProperty("margin", "0", "important");
      toggleBtn.style.setProperty("padding", "0", "important");
      toggleBtn.style.setProperty("top", "2px", "important");
      
      link.appendChild(toggleBtn); 

      // 【手动交互】
      link.addEventListener("click", function(e) {
        e.preventDefault(); 
        // 检查是否处于折叠状态（包含我们为了补丁而设置的 height: 0px 情况）
        const isCollapsed = subList.style.display === "none" || subList.style.height === "0px";
        if (isCollapsed) {
          collapseAllExcept(item);
          // 清除折叠状态的补丁样式
          subList.style.height = "";
          subList.style.overflow = "";
          toggleSubListVisibility(subList, true);
          toggleBtn.style.transform = "rotate(90deg)";
        } else {
          toggleSubListVisibility(subList, false);
          toggleBtn.style.transform = "rotate(0deg)";
        }
      });
    }
  });

  // =================【辅助函数：强行折叠其他所有目录】=================
  function collapseAllExcept(currentActiveItem) {
    const ancestors = [];
    let parent = currentActiveItem ? currentActiveItem.parentElement.closest(".md-nav__item") : null;
    while (parent) {
      ancestors.push(parent);
      parent = parent.parentElement.closest(".md-nav__item");
    }

    tocItems.forEach(item => {
      if (item !== currentActiveItem && !ancestors.includes(item)) {
        const subList = item.querySelector(".md-nav__list");
        const toggleBtn = item.querySelector(".md-nav__link .md-nav__icon");
        if (subList) {
          toggleSubListVisibility(subList, false);
        }
        if (toggleBtn) {
          toggleBtn.style.transform = "rotate(0deg)";
        }
      }
    });
  }

  // =================【核心修复：独占式自动联动】=================
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        const targetLink = mutation.target;
        
        if (targetLink.classList.contains("md-nav__link--active")) {
          const parentItem = targetLink.closest(".md-nav__item");
          if (!parentItem) return;

          collapseAllExcept(parentItem);

          const subList = parentItem.querySelector(".md-nav__list");
          const toggleBtn = targetLink.querySelector(".md-nav__icon");
          if (subList) {
            subList.style.height = "";
            subList.style.overflow = "";
            toggleSubListVisibility(subList, true);
            if (toggleBtn) toggleBtn.style.transform = "rotate(90deg)";
          }
          
          let ancestor = parentItem.parentElement.closest(".md-nav__item");
          while (ancestor) {
            const ancestorSub = ancestor.querySelector(".md-nav__list");
            const ancestorBtn = ancestor.querySelector(".md-nav__link .md-nav__icon");
            if (ancestorSub) {
              ancestorSub.style.height = "";
              ancestorSub.style.overflow = "";
              toggleSubListVisibility(ancestorSub, true);
            }
            if (ancestorBtn) {
              ancestorBtn.style.transform = "rotate(90deg)";
            }
            ancestor = ancestor.parentElement.closest(".md-nav__item");
          }
        }
      }
    });
  });

  const allToclLinks = document.querySelectorAll(".md-nav--secondary .md-nav__link");
  allToclLinks.forEach(link => {
    observer.observe(link, { attributes: true, attributeFilter: ["class"] });
  });
});