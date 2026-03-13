document.addEventListener('DOMContentLoaded', () => {
    var canvas = document.getElementById('myCanvas');
    if (!canvas) return; // 不在 game 頁面時不執行
    var ctx = canvas.getContext('2d');
    var size = 500; // 畫布大小
    var colorLayerWidthCm = 0.5; // 彩色層的寬度（cm）
    var blackLayerWidthCm = 0.2; // 黑色間隔層的寬度（cm）
    var innerBlackCircleDiameterCm = 1.2; // 最內圈的黑色圓圈直徑（cm）
    var dpi = 96; // 假設屏幕分辨率為96 DPI
    var colorLayerWidthPx = colorLayerWidthCm * (dpi / 2.54); // 彩色層的寬度（像素）
    var blackLayerWidthPx = blackLayerWidthCm * (dpi / 2.54); // 黑色間隔層的寬度（像素）
    var innerBlackCircleRadiusPx = (innerBlackCircleDiameterCm * (dpi / 2.54)) / 2; // 最內圈的黑色圓圈半徑（像素）

    var char = new URLSearchParams(location.search).get('char') || 'dog';
    var baseName = char; // 預設值，animals.json 載入後更新

    var initialColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#1E90FF', '#004ff5', '#8A2BE2', '#FF007F'];
    var colors = initialColors.slice();
    var brightnessIncrease = 50;
    var outerBrightnessIncrease = 130;
    var DOUBLE_FLASH_GAP = 0.06;

    var pendingTimeouts = [];
    var schedule = [];

    // 使用 <audio> 元素播放，iOS 相容性最佳
    var audio = null;
    function initAudio(name) {
        audio = new Audio('/assets/sounds/' + name + '.mp3');
        audio.preload = 'auto';
        audio.addEventListener('ended', function () {
            colors = initialColors.slice();
            drawLayers();
        });
    }
    function playAudio() {
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    // 從 animals.json 取得 sound 欄位，再載入音訊與排程
    fetch('/animals.json')
        .then(r => r.json())
        .then(data => {
            var animal = data.animals.find(a => a.id === char);
            baseName = (animal && animal.sound) ? animal.sound : char;
            initAudio(baseName);
            return fetch('/assets/frequencies/' + baseName + '.json');
        })
        .then(r => r.json())
        .then(config => { schedule = buildSchedule(config.phrases, initialColors.length); })
        .catch(() => { if (!audio) initAudio(baseName); })
        .finally(() => { drawLayers(); });

    // 依 config phrases 建立動畫排程
    function buildSchedule(phrases, numLayers) {
        var events = [];

        phrases.forEach(phrase => {
            if (phrase.type === 'sweep') {
                // 同樣時間內由內到外閃爍兩次（聲波感）
                var duration = phrase.end - phrase.start;
                var halfDur = duration / 2;
                var step = halfDur / (numLayers - 1);
                var flashDur = Math.min(step * 2.5, 0.25);
                for (var pass = 0; pass < 2; pass++) {
                    for (var i = 0; i < numLayers; i++) {
                        events.push({
                            time: phrase.start + pass * halfDur + i * step,
                            layerIdx: i,
                            flashDuration: flashDur,
                            brightness: brightnessIncrease
                        });
                    }
                }
            } else { // outer：在 woof 中間點快速閃爍最外圈兩次
                var mid = (phrase.start + phrase.end) / 2;
                var outerIdx = numLayers - 1;
                events.push({ time: mid - DOUBLE_FLASH_GAP / 2, layerIdx: outerIdx, flashDuration: 0.12, brightness: outerBrightnessIncrease });
                events.push({ time: mid + DOUBLE_FLASH_GAP / 2, layerIdx: outerIdx, flashDuration: 0.12, brightness: outerBrightnessIncrease });
            }
        });

        return events;
    }

    function drawLayers() {
        var currentRadius = size / 2 - innerBlackCircleRadiusPx; // 从最外层开始绘制，留出最内圈的空间
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布

        // 使用临时数组来应用亮度调整，避免直接修改原始颜色数组
        var tempColors = colors.map(color => adjustBrightness(color, 0)); // 亮度不变，仅复制颜色

        // 绘制彩色层和黑色间隔
        for (var i = tempColors.length - 1; i >= 0; i--) {
            // 绘制彩色层
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, currentRadius, 0, Math.PI * 2, false);
            ctx.fillStyle = tempColors[i];
            ctx.fill();
            currentRadius -= colorLayerWidthPx; // 减少半径以绘制黑色间隔

            if (currentRadius <= 0) break;

            // 绘制黑色间隔
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, currentRadius, 0, Math.PI * 2, false);
            ctx.fillStyle = 'black';
            ctx.fill();
            currentRadius -= blackLayerWidthPx;

            if (currentRadius <= 0) break;
        }

        // 绘制最内圈的黑色圆圈
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, innerBlackCircleRadiusPx, 0, Math.PI * 2, false);
        ctx.fillStyle = 'black';
        ctx.fill();
    }

    function adjustBrightness(color, brightness) {
        var r = parseInt(color.slice(1, 3), 16);
        var g = parseInt(color.slice(3, 5), 16);
        var b = parseInt(color.slice(5, 7), 16);

        r = Math.max(0, Math.min(255, r + brightness));
        g = Math.max(0, Math.min(255, g + brightness));
        b = Math.max(0, Math.min(255, b + brightness));

        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function triggerAnimation() {
        pendingTimeouts.forEach(t => clearTimeout(t));
        pendingTimeouts = [];
        colors = initialColors.slice();

        var startTime = performance.now();

        // 動畫立即執行，不等待音訊
        schedule.forEach(({ time, layerIdx, flashDuration, brightness }) => {
            var elapsed = performance.now() - startTime;
            var delay = Math.max(0, time * 1000 - elapsed);

            var t1 = setTimeout(() => {
                colors[layerIdx] = adjustBrightness(initialColors[layerIdx], brightness);
                drawLayers();
            }, delay);

            var t2 = setTimeout(() => {
                colors[layerIdx] = initialColors[layerIdx];
                drawLayers();
            }, delay + flashDuration * 1000);

            pendingTimeouts.push(t1, t2);
        });

        // 無排程時顯示簡單閃爍
        if (schedule.length === 0) {
            colors = colors.map(c => adjustBrightness(c, 60));
            drawLayers();
            var t = setTimeout(() => {
                colors = initialColors.slice();
                drawLayers();
            }, 600);
            pendingTimeouts.push(t);
        }

        playAudio();
    }

    canvas.addEventListener('click', triggerAnimation);
    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault(); // 防止觸發 click 事件重複觸發
        triggerAnimation();
    }, { passive: false });
});
