(function () {
    // ==========================================
    // 1. 核心配置区：登记所有特工
    // ==========================================
    const EFFECTS = {
        Sakura: { globalName: 'EffectSakura', path: '/assets/js/background/sakura.js' },
        Ginkgo:  { globalName: 'EffectGinkgo',  path: '/assets/js/background/ginkgo.js' },
        IceCream: { globalName: 'EffectIceCream', path: '/assets/js/background/ice_cream.js' },
        Maple:  { globalName: 'EffectMaple',  path: '/assets/js/background/maple_leaf.js' },
        Snow:   { globalName: 'EffectSnow',   path: '/assets/js/background/snow.js' },
        Star:   { globalName: 'EffectStar',   path: '/assets/js/background/star_rain.js' },
        Firefly: { globalName: 'EffectFirefly', path: '/assets/js/background/firefly.js' }
    };

    // ==========================================
    // 2. 节气季节判断器
    // ==========================================
    function getSeason() {
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const ds = `${m}-${d}`;
        if (ds >= '2-4' && ds < '5-5') return 'spring';
        if (ds >= '5-5' && ds < '8-7') return 'summer';
        if (ds >= '8-7' && ds < '11-7') return 'autumn';
        return 'winter';
    }

    // ==========================================
    // 3. 强力清理区：一键拉闸（所有特效必须在此注册）
    // ==========================================
    function stopAllEffects() {
        const names = ['EffectSakura', 'EffectGinkgo', 'EffectIceCream', 'EffectMaple', 'EffectSnow', 'EffectStar', 'EffectFirefly'];
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
        script.onerror = () => console.error(`【大管家】特效加载失败: ${effect.path}`);
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

        // 判定逻辑：
        if (isNight) {
            // 所有夜晚必有星星雨
            loadAndStart('Star');
            
            // 如果是夏天，额外加派萤火虫特工
            if (season === 'summer') {
                loadAndStart('Firefly');
            }
            return;
        }

        // 白天根据节气调度
        switch (season) {
            case 'spring': loadAndStart('Sakura'); break;
            case 'summer': loadAndStart('Sakura'); break;    // IceCream，Ginkgo
            case 'autumn': loadAndStart('Maple');  break;
            case 'winter': loadAndStart('Snow');   break;
        }
    }



    // ==========================================
    // 6. 自动化监听
    // ==========================================
    if (document.readyState === 'complete') dispatchEffect();
    else window.addEventListener('load', dispatchEffect);
    document.addEventListener("DOMContentSwitch", dispatchEffect);
})();