(function () {
    // ==========================================
    // 0. 路径大侦探：自动识别本地还是 GitHub 环境
    // ==========================================
    let assetRoot = "";
    try {
        const currentScript = document.currentScript || document.querySelector('script[src*="background.js"]');
        if (currentScript) {
            const src = currentScript.src.split('?')[0];
            // 抓取到 assets/ 之前的所有动态完整路径
            assetRoot = src.substring(0, src.indexOf('assets/'));
        }
    } catch (e) {
        assetRoot = "/"; // 兜底
    }

    // ==========================================
    // 1. 核心配置区：登记所有特工（去掉了死板的开头斜杠）
    // ==========================================
    const EFFECTS = {
        Sakura:   { globalName: 'EffectSakura',   path: 'assets/js/background/sakura.js' },
        Ginkgo:   { globalName: 'EffectGinkgo',   path: 'assets/js/background/ginkgo.js' },
        IceCream: { globalName: 'EffectIceCream', path: 'assets/js/background/ice_cream.js' },
        Maple:    { globalName: 'EffectMaple',    path: 'assets/js/background/maple_leaf.js' },
        Snow:     { globalName: 'EffectSnow',     path: 'assets/js/background/snow.js' },
        Star:     { globalName: 'EffectStar',     path: 'assets/js/background/star_rain.js' },
        Firefly:  { globalName: 'EffectFirefly',  path: 'assets/js/background/firefly.js' }
    };

    // ==========================================
    // 2. 节气季节判断器（修复 10 月份对比失效的 Bug）
    // ==========================================
    function getSeason() {
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const score = m * 100 + d; // 变成纯数字，例如 6月11日 变成 611

        // 立春(204)、立夏(505)、立秋(807)、立冬(1107)
        if (score >= 204 && score < 505) return 'spring';
        if (score >= 505 && score < 807) return 'summer';
        if (score >= 807 && score < 1107) return 'autumn';
        return 'winter';
    }

    // ==========================================
    // 3. 强力清理区：一键拉闸
    // ==========================================
    function stopAllEffects() {
        const names = ['EffectSakura', 'EffectGinkgo', 'EffectIceCream', 'EffectMaple', 'EffectSnow', 'EffectStar', 'EffectFirefly'];
        names.forEach(name => {
            if (window[name] && window[name].stop) window[name].stop();
        });
    }

    // ==========================================
    // 4. 动态加载与启动引擎（融入动态路径）
    // ==========================================
    function loadAndStart(effectKey) {
        const effect = EFFECTS[effectKey];
        if (!effect) return;
        const globalObj = window[effect.globalName];

        if (globalObj && globalObj.start) {
            globalObj.start();
            return;
        }

        // 拼接出绝对安全的完整 URL
        const realPath = assetRoot + effect.path;

        const script = document.createElement('script');
        script.src = realPath;
        script.onload = () => {
            if (window[effect.globalName] && window[effect.globalName].start) {
                window[effect.globalName].start();
            }
        };
        script.onerror = () => console.error(`【大管家】特效脚本加载失败: ${realPath}`);
        document.head.appendChild(script);
    }

    // ==========================================
    // 5. 总指挥部：时令 + 时间调度
    // ==========================================
    function dispatchEffect() {
        stopAllEffects(); // 先把所有在跑的特效强制下班

        const hour = new Date().getHours();
        const isNight = (hour < 6 || hour >= 18);
        const season = getSeason();

        if (isNight) {
            loadAndStart('Star');
            if (season === 'summer') {
                loadAndStart('Firefly');
            }
            return;
        }

        // 白天根据节气调度
        switch (season) {
            case 'spring': loadAndStart('Sakura'); break;
            case 'summer': loadAndStart('Maple'); break;         // Ginkgo ， IceCream
            case 'autumn': loadAndStart('Maple');  break;
            case 'winter': loadAndStart('Snow');   break;
        }
    }

    // ==========================================
    // 6. 自动化监听（完美适配 MkDocs Material 换页）
    // ==========================================
    // 首次进入页面时启动
    if (document.readyState === 'complete') dispatchEffect();
    else window.addEventListener('load', dispatchEffect);

    // 关键：针对 MkDocs Material 异步换页的官方专用监听
    if (typeof document.page$ !== "undefined") {
        document.page$.subscribe(function() {
            dispatchEffect(); 
        });
    }
})();