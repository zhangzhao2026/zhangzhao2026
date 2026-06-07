// 自动切换网站模式（浅色/深色）
document$.subscribe(function() {
    const LOCK_KEY = "__custom_theme_lock";
    const THIRTY_MINUTES = 30 * 60 * 1000; // 30分钟毫秒数
    const now = Date.now();
    
    // 1. 计算当前时间应该处于的模式
    const hour = new Date().getHours();
    const targetScheme = (hour >= 6 && hour < 18) ? "default" : "slate";

    // 2. 读取用户手动锁定的状态
    const savedLock = JSON.parse(localStorage.getItem(LOCK_KEY));
    const isExpired = !savedLock || (now - savedLock.timestamp > THIRTY_MINUTES);

    let isAutomaticSwitching = false;

    // 3. 监听用户的手动切换行为（用来刷新或创建 30 分钟的“防打扰锁定”）
    const paletteContainer = document.querySelector("[data-md-component=palette]");
    if (paletteContainer && !paletteContainer.dataset.autoSwitchListened) {
        paletteContainer.dataset.autoSwitchListened = "true"; // 防止 Instant loading 重复绑定监听器
        
        paletteContainer.addEventListener("change", function() {
            // 如果不是脚本自动触发的，说明是用户自己点的，立刻开启/顺延 30 分钟锁定
            if (!isAutomaticSwitching) {
                localStorage.setItem(LOCK_KEY, JSON.stringify({
                    timestamp: Date.now()
                }));
            }
        });
    }

    // 4. 执行自动切换逻辑
    if (isExpired) {
        // 寻找到目标模式对应的隐藏 input 节点
        const targetInput = document.querySelector(
            `[data-md-component=palette] input[data-md-color-scheme="${targetScheme}"]`
        );
        
        // 如果找到了节点，且它当前处于“未选中”状态，则触发原生点击切换
        if (targetInput && !targetInput.checked) {
            isAutomaticSwitching = true; 
            targetInput.click(); // 触发点击，让 MkDocs 官方引擎接管换肤和写缓存的工作
            isAutomaticSwitching = false;
        }
    }
});