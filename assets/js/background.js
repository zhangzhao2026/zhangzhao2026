(function () {
    // ==========================================
    // 0. 智能根路径识别系统（利用主题特性，完美通杀本地/GitHub/Vercel）
    // ==========================================
    function getBaseUrl() {
        // 1. 优先从 MkDocs 的 Logo 链接获取项目根网址（自带项目名，完美解决多环境部署差异）
        const logo = document.querySelector('.md-logo') || document.querySelector('.md-header__button.md-logo') || document.querySelector('.md-header__link');
        if (logo && logo.href) {
            let url = logo.href;
            return url.endsWith('/') ? url : url + '/';
        }
        
        // 2. 备选方案：从当前脚本自身的绝对路径反推
        const currentScript = document.currentScript || document.querySelector('script[src*="background"]');
        if (currentScript && currentScript.src) {
            const src = currentScript.src.split('?')[0];
            const match = src.match(/(.*\/)(assets|js)\//);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // 3. 终极兜底
        let origin = window.location.origin;
        return origin.endsWith('/') ? origin : origin + '/';
    }

    const baseUrl = getBaseUrl();

    // ==========================================
    // 1. 核心配置区：登记所有特工
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
    // 2. 节气季节判断器
    // ==========================================
    function getSeason() {
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const score = m * 100 + d; 

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

        // 拼接出绝对安全的完整 URL
        const realPath = baseUrl + effect.path;

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
        stopAllEffects(); 

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

        switch (season) {
            case 'spring': loadAndStart('Sakura'); break;
            case 'summer': loadAndStart('Ginkgo'); break; 
            case 'autumn': loadAndStart('Maple');  break;
            case 'winter': loadAndStart('Snow');   break;
        }
    }

    // ==========================================
    // 6. 自动化监听
    // ==========================================
    if (document.readyState === 'complete') dispatchEffect();
    else window.addEventListener('load', dispatchEffect);

    if (typeof document.page$ !== "undefined") {
        document.page$.subscribe(function() {
            dispatchEffect(); 
        });
    }
})();