// 自动切换网站模式（浅色/深色）
(function() {
    const STORAGE_KEY = "__md_color_scheme_meta";
    const THIRTY_MINUTES = 30 * 60 * 1000; // 30分钟的毫秒数
    const now = new Date().getTime();
    
    // 获取当前时间应该处于的模式
    const hour = new Date().getHours();
    const targetScheme = (hour >= 6 && hour < 18) ? "default" : "slate";

    // 读取上次保存的状态
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    // 判断逻辑：
    // 1. 如果没有记录，或者距离上次记录超过 30 分钟，则执行自动切换
    // 2. 如果在 30 分钟内，则保持用户手动选择的状态
    const isExpired = !saved || (now - saved.timestamp > THIRTY_MINUTES);

    if (isExpired) {
        // 使用官方方法设置主题，确保图标和颜色同步
        __md_set("__md_color_scheme", { scheme: targetScheme });
        
        // 更新记录时间
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            scheme: targetScheme,
            timestamp: now
        }));
    }
})();