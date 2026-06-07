(function () {
    // ==========================================
    // 1. 核心配置区：登记特工档案
    // ==========================================
    const EFFECTS = {
        Sakura: { globalName: 'EffectSakura', path: '/assets/js/background/sakura.js' },
        Star:   { globalName: 'EffectStar',   path: '/assets/js/background/star_rain.js' },
        Maple:  { globalName: 'EffectMaple',  path: '/assets/js/background/maple_leaf.js' }
    };

    // ==========================================
    // 2. 节气季节判断器（核心算法）
    // ==========================================
    function getSeason() {
        const now = new Date();
        const m = now.getMonth() + 1; // 1-12
        const d = now.getDate();
        // 简化版核心日期对齐（立春2.4，立夏5.5，立秋8.7，立冬11.7）
        const ds = `${m}-${d}`;
        if (ds >= '2-4' && ds < '5-5') return 'spring';
        if (ds >= '5-5' && ds < '8-7') return 'summer';
        if (ds >= '8-7' && ds < '11-7') return 'autumn';
        return 'winter';
    }

    // ==========================================
    // 3. 强力清理区：一键拉闸
    // ==========================================
    function stopAllEffects() {
        const names = ['EffectSakura', 'EffectStar', 'EffectMaple'];
        names.forEach(name => {
            if (window[name] && window[name].stop) window[name].stop();
        });
    }

    // ==========================================
    // 4. 动态加载与启动引擎
    // ==========================================
    function loadAndStart(effectKey) {
        const effect = EFFECTS[effectKey];
        if (!effect) return;
        const globalObj = window[effect.globalName];

        if (globalObj && globalObj.start) {
            globalObj.start();
            return;
        }

        const script = document.createElement('script');
        script.src = effect.path;
        script.onload = () => {
            if (window[effect.globalName] && window[effect.globalName].start) {
                window[effect.globalName].start();
            }
        };
        document.head.appendChild(script);
    }

    // ==========================================
    // 5. 总指挥部：时令 + 时间调度
    // ==========================================
    function dispatchEffect() {
        stopAllEffects();

        const hour = new Date().getHours();
        const isNight = (hour < 6 || hour >= 18);

        // 如果是夜晚，无条件星星雨
        if (isNight) {
            loadAndStart('Star');
            return;
        }

        // 白天根据节气调度
        const season = getSeason();
        switch (season) {
            case 'spring': loadAndStart('Sakura'); break;
            case 'summer': loadAndStart('Sakura'); break; // 暂用樱花代替
            case 'autumn': loadAndStart('Maple');  break;
            case 'winter': loadAndStart('Maple');  break; // 暂用枫叶代替
        }
    }

    // ==========================================
    // 6. 自动化监听
    // ==========================================
    if (document.readyState === 'complete') dispatchEffect();
    else window.addEventListener('load', dispatchEffect);
    document.addEventListener("DOMContentSwitch", dispatchEffect);

})();