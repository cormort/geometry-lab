const appContainer = document.getElementById('app');
const modal = document.getElementById('infoModal');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const favFilterBtn = document.getElementById('favFilterBtn');
let currentBoard = null;
let showFavoritesOnly = false;

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered!', reg))
            .catch(err => console.log('SW Failed', err));
    });
}

// Theme Logic
const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if(!themeToggle) return;
    themeToggle.innerHTML = theme === 'light' ? sunIcon : moonIcon;
}

if(themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Favorites Logic
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function toggleFavorite(id, btn) {
    const favorites = getFavorites();
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
        btn.classList.add('active');
    } else {
        favorites.splice(index, 1);
        btn.classList.remove('active');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Refresh if in filter mode
    if(showFavoritesOnly) renderCards();
}

// Search & Filter Logic
if(searchInput) {
    searchInput.addEventListener('input', renderCards);
}
if(favFilterBtn) {
    favFilterBtn.addEventListener('click', () => {
        showFavoritesOnly = !showFavoritesOnly;
        favFilterBtn.classList.toggle('active');
        renderCards();
    });
}

// Initialize Theme immediately
initTheme();

// Geometry Data Source
let geometryData = [
    {
        id: 1,
        name: "等高模型 (Equal Height)",
        shortDesc: "相同高的三角形，面積比等於底邊比。",
        fullDesc: "兩個三角形的高相等時，面積比例直接取決於底邊長度。請拖曳頂點 A 改變高，或拖曳 D 改變底邊比例，觀察面積比值的變化。",
        formula: "$$ \\frac{S_{\\triangle ABD}}{S_{\\triangle ADC}} = \\frac{BD}{DC} $$",
        tips: "拖曳紅色的點 A 和藍色的點 D。只要 D 在底邊上移動，面積比永遠等於底邊比。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="100,20 20,130 180,130" fill="#fff" stroke="#4f46e5" stroke-width="2"/><line x1="100" y1="20" x2="70" y2="130" stroke="#4f46e5" stroke-width="2"/><polygon points="100,20 20,130 70,130" fill="rgba(79, 70, 229, 0.1)" stroke="none"/><polygon points="100,20 70,130 180,130" fill="rgba(139, 92, 246, 0.1)" stroke="none"/><text x="95" y="15" font-size="12" fill="#333">A</text><text x="10" y="140" font-size="12" fill="#333">B</text><text x="185" y="140" font-size="12" fill="#333">C</text><text x="65" y="145" font-size="12" fill="#333">D</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 8, 12, -2], axis:false, grid:false, showCopyright:false});
            var pB = board.create('point', [0, 0], {name:'B', size:3, fixed:true, color:'#333'});
            var pC = board.create('point', [10, 0], {name:'C', size:3, fixed:true, color:'#333'});
            var lineBC = board.create('line', [pB,pC], {visible:false});
            var pA = board.create('point', [3, 6], {name:'A', size:5, color:'#ef4444'});
            var pD = board.create('glider', [4, 0, lineBC], {name:'D', size:5, color:'#3b82f6'});
            board.create('polygon', [pA, pB, pC], {fillColor:'none', strokeColor:'#333'});
            var polyL = board.create('polygon', [pA, pB, pD], {fillColor:'#facc15', fillOpacity:0.5});
            var polyR = board.create('polygon', [pA, pD, pC], {fillColor:'#f87171', fillOpacity:0.4});
            board.create('text', [0, 7, function(){ return "S(左) / S(右) = " + (polyL.Area()/polyR.Area()).toFixed(2); }], {fontSize:16});
            board.create('text', [5, 7, function(){ return "BD / DC = " + (pB.Dist(pD)/pD.Dist(pC)).toFixed(2); }], {fontSize:16, color:'#2563eb'});
            return board;
        }
    },
    {
        id: 2,
        name: "一半模型 (Half Area)",
        shortDesc: "三角形頂點在矩形邊上，面積為矩形一半。",
        fullDesc: "在平行四邊形或矩形內，若三角形底邊與矩形一邊重合，頂點在對邊上，則三角形面積必為矩形的一半。",
        formula: "$$ S_{\\triangle} = \\frac{1}{2} S_{\\square ABCD} $$",
        tips: "嘗試左右拖曳頂點 E。你會發現不管 E 移動到哪裡（只要還在邊上），綠色三角形的面積永遠是矩形面積的一半。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect x="30" y="30" width="140" height="90" fill="white" stroke="#4f46e5" stroke-width="2"/><polygon points="30,120 170,120 100,30" fill="rgba(16, 185, 129, 0.2)" stroke="#4f46e5" stroke-width="1"/><text x="20" y="25" font-size="12">A</text><text x="175" y="25" font-size="12">D</text><text x="20" y="135" font-size="12">B</text><text x="175" y="135" font-size="12">C</text><text x="95" y="25" font-size="12">E</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 8, 12, -2], axis:false, showCopyright:false});
            var pA = board.create('point', [0, 5], {name:'A', fixed:true, size:3, color:'#333'});
            var pB = board.create('point', [0, 0], {name:'B', fixed:true, size:3, color:'#333'});
            var pC = board.create('point', [8, 0], {name:'C', fixed:true, size:3, color:'#333'});
            var pD = board.create('point', [8, 5], {name:'D', fixed:true, size:3, color:'#333'});
            var lineAD = board.create('segment', [pA, pD], {strokeColor:'#333'});
            board.create('polygon', [pA, pB, pC, pD], {fillColor:'none', strokeColor:'#333'});
            var pE = board.create('glider', [4, 5, lineAD], {name:'E', size:6, color:'#ef4444'});
            var tri = board.create('polygon', [pE, pB, pC], {fillColor:'#22c55e', fillOpacity:0.5});
            board.create('text', [0.5, 6.5, function(){ return "矩形面積 = " + (8*5); }], {fontSize:14});
            board.create('text', [4.5, 6.5, function(){ return "三角形面積 = " + tri.Area().toFixed(1); }], {fontSize:14, color:'#16a34a', fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 3,
        name: "蝴蝶模型 (Butterfly)",
        shortDesc: "對角線分割出的面積乘積關係。",
        fullDesc: "任意四邊形對角線將其分為四塊。性質一：上下積等於左右積。性質二：若是梯形，則左右兩塊面積相等（蝴蝶翅膀）。",
        formula: "$$ S_{上} \\times S_{下} = S_{左} \\times S_{右} $$",
        tips: "修正後的圖形保證了對角線的完美交點。請拖曳頂點改變形狀，驗證公式。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
            <polygon points="50,20 150,20 180,130 20,130" fill="none" stroke="#2c3e50" stroke-width="2"/>
            <polygon points="50,20 150,20 100,62.3" fill="rgba(241, 196, 15, 0.4)" stroke="none"/>
            <polygon points="20,130 180,130 100,62.3" fill="rgba(230, 126, 34, 0.4)" stroke="none"/>
            <polygon points="20,130 50,20 100,62.3" fill="rgba(52, 152, 219, 0.3)" stroke="none"/>
            <polygon points="180,130 150,20 100,62.3" fill="rgba(52, 152, 219, 0.3)" stroke="none"/>
            <line x1="50" y1="20" x2="180" y2="130" stroke="#2c3e50" stroke-width="1"/>
            <line x1="150" y1="20" x2="20" y2="130" stroke="#2c3e50" stroke-width="1"/>
            <text x="40" y="15" font-size="12">A</text><text x="155" y="15" font-size="12">D</text>
            <text x="10" y="145" font-size="12">B</text><text x="185" y="145" font-size="12">C</text>
        </svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 8, 12, -2], axis:false, showCopyright:false});
            var pB = board.create('point', [0, 0], {name:'B', fixed:true, size:3, color:'#333'});
            var pC = board.create('point', [10, 0], {name:'C', fixed:true, size:3, color:'#333'});
            var pA = board.create('point', [2, 6], {name:'A', size:5, color:'#3b82f6'});
            var pD = board.create('point', [8, 6], {name:'D', size:5, color:'#3b82f6'});
            board.create('polygon', [pA, pB, pC, pD], {fillColor:'none', strokeColor:'#999'});
            var segAC = board.create('segment', [pA, pC], {strokeColor:'#333'});
            var segBD = board.create('segment', [pB, pD], {strokeColor:'#333'});
            var pInt = board.create('intersection', [segAC, segBD, 0], {name:'I', size:2, color:'#333'});
            var sUp = board.create('polygon', [pA, pD, pInt], {fillColor:'yellow', fillOpacity:0.5}); // Fixed Color
            var sDown = board.create('polygon', [pB, pC, pInt], {fillColor:'orange', fillOpacity:0.5}); // Fixed Color
            var sLeft = board.create('polygon', [pA, pB, pInt], {fillColor:'#3b82f6', fillOpacity:0.3});
            var sRight = board.create('polygon', [pD, pC, pInt], {fillColor:'#3b82f6', fillOpacity:0.3});
            board.create('text', [-1, 7.5, function(){ return "上 × 下 = " + (sUp.Area()*sDown.Area()).toFixed(1); }], {color:'#f97316'});
            board.create('text', [6, 7.5, function(){ return "左 × 右 = " + (sLeft.Area()*sRight.Area()).toFixed(1); }], {color:'#3b82f6'});
            return board;
        }
    },
    {
        id: 4,
        name: "鳥頭模型 (Bird's Head)",
        shortDesc: "共角三角形，面積比等於夾邊乘積比。",
        fullDesc: "兩個三角形共用角 A。小三角形 ADE 面積與大三角形 ABC 面積的比，等於 (AD×AE) / (AB×AC)。",
        formula: "$$ \\frac{S_{\\triangle ADE}}{S_{\\triangle ABC}} = \\frac{AD \\times AE}{AB \\times AC} $$",
        tips: "拖曳點 D 和 E 沿著邊移動。觀察面積比例是否總是等於邊長比例的乘積。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="100,20 30,130 170,130" fill="rgba(241, 245, 249, 1)" stroke="#4f46e5" stroke-width="2"/><polygon points="100,20 60,83 125,59" fill="rgba(250, 204, 21, 0.5)" stroke="#4f46e5" stroke-width="1.5"/><text x="95" y="15" font-size="12">A</text><text x="20" y="140" font-size="12">B</text><text x="175" y="140" font-size="12">C</text><text x="45" y="85" font-size="12">D</text><text x="130" y="60" font-size="12">E</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 10, 12, -2], axis:false, showCopyright:false});
            var pA = board.create('point', [5, 9], {name:'A', fixed:true, size:3, color:'#333'});
            var pB = board.create('point', [1, 1], {name:'B', fixed:true, size:3, color:'#333'});
            var pC = board.create('point', [9, 1], {name:'C', fixed:true, size:3, color:'#333'});
            var lAB = board.create('segment', [pA, pB], {strokeColor:'#333'});
            var lAC = board.create('segment', [pA, pC], {strokeColor:'#333'});
            board.create('segment', [pB, pC], {strokeColor:'#333'});
            var pD = board.create('glider', [3, 5, lAB], {name:'D', size:5, color:'#ef4444'});
            var pE = board.create('glider', [7, 5, lAC], {name:'E', size:5, color:'#ef4444'});
            var polyBig = board.create('polygon', [pA, pB, pC], {fillOpacity:0});
            var polySmall = board.create('polygon', [pA, pD, pE], {fillColor:'#facc15', fillOpacity:0.6});
            board.create('text', [0, 0, function(){ 
                var ratioSide = (pA.Dist(pD)/pA.Dist(pB)) * (pA.Dist(pE)/pA.Dist(pC));
                var ratioArea = polySmall.Area() / polyBig.Area();
                return "邊長乘積比: " + ratioSide.toFixed(3) + "<br>面積比例: " + ratioArea.toFixed(3);
            }], {fontSize:14});
            return board;
        }
    },
    {
        id: 5,
        name: "沙漏模型 (Hourglass)",
        shortDesc: "平行線間的相似三角形。",
        fullDesc: "平行線間形成的對頂三角形（相似）。面積比等於對應邊長比的平方。",
        formula: "$$ \\frac{S_{上}}{S_{下}} = (\\frac{a}{b})^2 $$",
        tips: "拖曳 A 或 B 改變上底長度，注意面積比是邊長比的「平方」。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
            <line x1="50" y1="20" x2="150" y2="20" stroke="#2c3e50" stroke-width="2"/>
            <line x1="20" y1="130" x2="180" y2="130" stroke="#2c3e50" stroke-width="2"/>
            <polygon points="50,20 150,20 100,62.3" fill="rgba(231, 76, 60, 0.4)" stroke="none"/>
            <polygon points="20,130 180,130 100,62.3" fill="rgba(52, 152, 219, 0.4)" stroke="none"/>
            <line x1="50" y1="20" x2="180" y2="130" stroke="#2c3e50" stroke-width="1.5"/>
            <line x1="150" y1="20" x2="20" y2="130" stroke="#2c3e50" stroke-width="1.5"/>
            <text x="40" y="15" font-size="12">A</text><text x="155" y="15" font-size="12">B</text>
            <text x="10" y="145" font-size="12">C</text><text x="185" y="145" font-size="12">D</text>
        </svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 8, 12, -2], axis:false, showCopyright:false});
            var lTop = board.create('line', [[0,6], [10,6]], {visible:false});
            var lBot = board.create('line', [[0,1], [10,1]], {visible:false});
            board.create('line', [[0,6], [10,6]], {strokeColor:'#ccc', dash:2});
            board.create('line', [[0,1], [10,1]], {strokeColor:'#ccc', dash:2});
            var pA = board.create('glider', [3, 6, lTop], {name:'A', size:4});
            var pB = board.create('glider', [7, 6, lTop], {name:'B', size:4});
            var pC = board.create('glider', [1, 1, lBot], {name:'C', size:3, fixed:true});
            var pD = board.create('glider', [9, 1, lBot], {name:'D', size:3, fixed:true});
            var lAC = board.create('segment', [pA, pD], {strokeColor:'#333'});
            var lBD = board.create('segment', [pB, pC], {strokeColor:'#333'});
            var pInt = board.create('intersection', [lAC, lBD, 0], {name:'', size:1});
            var tUp = board.create('polygon', [pA, pB, pInt], {fillColor:'#e74c3c', fillOpacity:0.5}); // Reference Red
            var tDown = board.create('polygon', [pC, pD, pInt], {fillColor:'#3498db', fillOpacity:0.5}); // Reference Blue
            board.create('text', [0, 7.2, function(){ 
                var sideRatio = pA.Dist(pB) / pC.Dist(pD);
                return "上邊 / 下邊 = " + sideRatio.toFixed(2); 
            }]);
            board.create('text', [5.5, 7.2, function(){ 
                var areaRatio = tUp.Area() / tDown.Area();
                return "上面積 / 下面積 = " + areaRatio.toFixed(2); 
            }]);
            return board;
        }
    },
    {
        id: 6,
        name: "燕尾模型 (Swallowtail)",
        shortDesc: "三角形內部一點與頂點連線。",
        fullDesc: "三角形內部一點 P。兩側三角形面積比等於底邊被分割的線段比。",
        formula: "$$ \\frac{S_{\\triangle AB P}}{S_{\\triangle AC P}} = \\frac{BD}{CD} $$",
        tips: "拖曳 P 點在三角形內部移動，觀察左右側面積比與底邊分割比的關係。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="100,20 20,130 180,130" fill="none" stroke="#4f46e5" stroke-width="2"/><line x1="100" y1="20" x2="100" y2="130" stroke="#ccc" stroke-dasharray="4"/><polygon points="20,130 100,130 100,90" fill="rgba(20, 184, 166, 0.4)" stroke="none"/><polygon points="180,130 100,130 100,90" fill="rgba(245, 158, 11, 0.4)" stroke="none"/><line x1="100" y1="20" x2="100" y2="90" stroke="#4f46e5" stroke-width="1.5"/><line x1="20" y1="130" x2="100" y2="90" stroke="#4f46e5" stroke-width="1.5"/><line x1="180" y1="130" x2="100" y2="90" stroke="#4f46e5" stroke-width="1.5"/><text x="95" y="15" font-size="12">A</text><text x="10" y="140" font-size="12">B</text><text x="185" y="140" font-size="12">C</text><text x="95" y="85" font-size="12">P</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 8, 12, -2], axis:false, showCopyright:false});
            var pA = board.create('point', [5, 7], {name:'A', fixed:true});
            var pB = board.create('point', [1, 1], {name:'B', fixed:true});
            var pC = board.create('point', [9, 1], {name:'C', fixed:true});
            var poly = board.create('polygon', [pA, pB, pC], {fillColor:'none'});
            var pP = board.create('glider', [5, 3, poly], {name:'P', color:'#f59e0b'});
            var sL = board.create('polygon', [pA, pB, pP], {fillColor:'#14b8a6', fillOpacity:0.4});
            var sR = board.create('polygon', [pA, pC, pP], {fillColor:'#f59e0b', fillOpacity:0.4});
            var lAP = board.create('line', [pA, pP], {visible:false});
            var lBC = board.create('line', [pB, pC], {visible:false});
            var pD = board.create('intersection', [lAP, lBC, 0], {name:'D', size:2, color:'#999', visible:true});
            board.create('segment', [pA, pD], {dash:2, strokeColor:'#999'});
            board.create('text', [0, 7.5, function(){ return "S(左) / S(右) = " + (sL.Area()/sR.Area()).toFixed(2); }]);
            board.create('text', [6, 7.5, function(){ return "BD / CD = " + (pB.Dist(pD)/pD.Dist(pC)).toFixed(2); }]);
            return board;
        }
    },
    {
        id: 7,
        name: "等量代換 (Area Shift)",
        shortDesc: "透過割補、平移，將不規則變規則。",
        fullDesc: "利用平行線間距離相等特性。嘗試拖曳頂點 A 沿著虛線移動，綠色三角形的面積保持不變（同底等高原理）。",
        formula: "$$ S_{新圖形} = S_{原圖形} $$",
        tips: "這是一個「同底等高」的動態展示。只要頂點在平行線上移動，面積就不會改變。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
            <line x1="20" y1="30" x2="180" y2="30" stroke="#999" stroke-dasharray="4"/>
            <line x1="20" y1="120" x2="180" y2="120" stroke="#333" stroke-width="2"/>
            <polygon points="50,120 120,120 70,30" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e"/>
            <polygon points="50,120 120,120 130,30" fill="none" stroke="#22c55e" stroke-dasharray="2"/>
            <text x="45" y="25" font-size="12">L1</text><text x="45" y="115" font-size="12">L2</text>
            <text x="90" y="80" font-size="12" fill="#22c55e">面積相等</text>
        </svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 8, 12, -2], axis:false, showCopyright:false});
            var lineTop = board.create('line', [[0,6], [10,6]], {dash:2, strokeColor:'#999'});
            var lineBot = board.create('line', [[0,1], [10,1]], {fixed:true, visible:false});
            board.create('line', [[0,1], [10,1]], {strokeColor:'#333'});
            var pB = board.create('point', [3, 1], {name:'B', fixed:true});
            var pC = board.create('point', [7, 1], {name:'C', fixed:true});
            var pA = board.create('glider', [4, 6, lineTop], {name:'A', size:5, color:'#ef4444'});
            var poly = board.create('polygon', [pA, pB, pC], {fillColor:'#22c55e', fillOpacity:0.5});
            board.create('text', [3.5, 3.5, function(){ return "Area = " + poly.Area().toFixed(2); }], {fontSize:18, color:'#2c3e50'});
            board.create('text', [0, 6.5, "拖曳 A 點平移"], {color:'#ef4444'});
            return board;
        }
    },
    {
        id: 8,
        name: "曲線模型 (Curved Shapes)",
        shortDesc: "正方形中的葉形面積（割補法）。",
        fullDesc: "正方形內的扇形交疊。試著拖曳正方形的大小，觀察葉形面積的變化。",
        formula: "$$ S_{葉形} = \\frac{\\pi}{2}r^2 - r^2 $$",
        tips: "計算核心：兩個扇形面積相加，減去一個正方形面積，即為重疊的葉形部分。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
            <rect x="50" y="25" width="100" height="100" fill="none" stroke="#4f46e5"/>
            <path d="M 50 125 A 100 100 0 0 1 150 25 A 100 100 0 0 1 50 125" fill="rgba(34, 197, 94, 0.5)" stroke="none"/>
            <path d="M 50 125 A 100 100 0 0 1 150 25" fill="none" stroke="#4f46e5" stroke-width="1.5"/>
            <path d="M 50 25 A 100 100 0 0 0 150 125" fill="none" stroke="#4f46e5" stroke-width="1.5"/>
        </svg>`,
        initBoard: function(id) {
            // Fixed scaling behavior
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-5, 15, 15, -5], axis:false, showCopyright:false});
            
            // Base square points (A is fixed at origin/corner)
            var pA = board.create('point', [0, 0], {name:'A', fixed:true});
            
            // B is movable on X axis to define size
            var pB = board.create('point', [8, 0], {name:'B', size:4, color:'blue'});
            
            // D and C depend on B's distance from A (square constraint)
            var pD = board.create('point', [0, function(){ return pB.X(); }], {name:'D', size:3, color:'gray', fixed:true});
            var pC = board.create('point', [function(){ return pB.X(); }, function(){ return pB.X(); }], {name:'C', size:3, color:'gray', fixed:true});
            
            board.create('polygon', [pA, pB, pC, pD], {fillColor:'white', strokeColor:'#333'});
            
            // Arcs depending on dynamic points
            board.create('arc', [pD, pA, pC], {strokeWidth:2, strokeColor:'#22c55e', strokeOpacity:0.8, fillColor:'#22c55e', fillOpacity:0.3});
            board.create('arc', [pB, pC, pA], {strokeWidth:2, strokeColor:'#22c55e', strokeOpacity:0.8, fillColor:'#22c55e', fillOpacity:0.3});
            
            board.create('text', [function(){ return pB.X()/2; }, -1, "拖曳 B 點縮放"], {fontSize:14, color:'blue'});
            
            return board;
        }
    },
    {
        id: 9,
        name: "立體模型 (3D Solid)",
        shortDesc: "空間幾何的切割與展開。",
        fullDesc: "這是一個四面體（三角錐）的投影展示。拖曳頂點 Top 可以改變視角，觀察立體圖形的結構。",
        formula: "$$ V = \\frac{1}{3} S_{底} \\times h $$",
        tips: "這是一個簡易的 3D 投影展示。觀察虛線部分，了解立體圖形的透視關係。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
            <polygon points="50,120 150,120 100,20" fill="rgba(59, 130, 246, 0.2)" stroke="#4f46e5" stroke-width="2"/>
            <line x1="50" y1="120" x2="100" y2="90" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="4"/>
            <line x1="150" y1="120" x2="100" y2="90" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="4"/>
            <line x1="100" y1="20" x2="100" y2="90" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="4"/>
            <text x="105" y="60" font-size="12" fill="#666">h</text>
        </svg>`,
        initBoard: function(id) {
            // Updated 3D-like logic
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-8, 8, 8, -8], axis:false, showCopyright:false});
            
            // 3D View configuration
            var view = board.create('view3d',
                [[-6, -3], [8, 8],
                [[-5, 5], [-5, 5], [-5, 5]]],
                {
                    xPlaneRear: {visible: false},
                    yPlaneRear: {visible: false},
                    zPlaneRear: {visible: false},
                    numberOfMainGrids: 0
                });

            // Tetrahedron points
            var p1 = view.create('point3d', [1, 1, -2], {size: 3, name: 'A'});
            var p2 = view.create('point3d', [3, -2, -2], {size: 3, name: 'B'});
            var p3 = view.create('point3d', [-2, -2, -2], {size: 3, name: 'C'});
            var p4 = view.create('point3d', [0, 0, 3], {size: 3, name: 'D'}); // Top vertex

            // Faces
            view.create('polygon3d', [p1, p2, p3], {fillColor: 'blue', fillOpacity: 0.1, strokeColor: 'grey'});
            view.create('polygon3d', [p1, p2, p4], {fillColor: 'red', fillOpacity: 0.2, strokeColor: 'grey'});
            view.create('polygon3d', [p2, p3, p4], {fillColor: 'orange', fillOpacity: 0.2, strokeColor: 'grey'});
            view.create('polygon3d', [p3, p1, p4], {fillColor: 'yellow', fillOpacity: 0.2, strokeColor: 'grey'});

            return board;
        }
    },
    {
        id: 10,
        level: "國小",
        name: "三角形內角和 (Angle Sum)",
        shortDesc: "任意三角形的三個內角，加起來永遠是 180°。",
        fullDesc: "不論三角形怎麼變形（銳角、直角、鈍角），三個內角的度數總和恆為 180°。這是因為過一個頂點作對邊的平行線，三個角剛好拼成一條直線。",
        formula: "$$ \\angle A + \\angle B + \\angle C = 180^\\circ $$",
        tips: "拖曳三個紅色頂點任意變形，盯著右上角的總和——它永遠是 180.0°。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="100,25 25,125 175,125" fill="none" stroke="#4f46e5" stroke-width="2"/><path d="M 85 45 A 25 25 0 0 0 115 45" fill="rgba(239,68,68,0.35)"/><path d="M 45 125 A 25 25 0 0 0 40 105" fill="rgba(59,130,246,0.35)"/><path d="M 155 125 A 25 25 0 0 1 160 105" fill="rgba(34,197,94,0.35)"/><text x="70" y="80" font-size="20" fill="#4f46e5" font-weight="bold">180°</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 9, 12, -2], axis:false, showCopyright:false});
            var pA = board.create('point', [5, 7], {name:'A', size:5, color:'#ef4444'});
            var pB = board.create('point', [1, 1], {name:'B', size:5, color:'#ef4444'});
            var pC = board.create('point', [9, 1], {name:'C', size:5, color:'#ef4444'});
            board.create('polygon', [pA, pB, pC], {fillColor:'#6366f1', fillOpacity:0.12, strokeColor:'#4f46e5'});
            var aA = board.create('angle', [pB, pA, pC], {radius:1, fillColor:'#ef4444', name:''});
            var aB = board.create('angle', [pC, pB, pA], {radius:1, fillColor:'#3b82f6', name:''});
            var aC = board.create('angle', [pA, pC, pB], {radius:1, fillColor:'#22c55e', name:''});
            var deg = function(a){ return a.Value() * 180 / Math.PI; };
            board.create('text', [-1.5, 8.5, function(){
                return "∠A = " + deg(aA).toFixed(1) + "°　∠B = " + deg(aB).toFixed(1) + "°　∠C = " + deg(aC).toFixed(1) + "°";
            }], {fontSize:14});
            board.create('text', [-1.5, 7.6, function(){
                return "總和 = " + (deg(aA)+deg(aB)+deg(aC)).toFixed(1) + "°";
            }], {fontSize:18, color:'#4f46e5', fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 11,
        level: "國中",
        name: "畢氏定理 (Pythagorean)",
        shortDesc: "直角三角形：兩股平方和等於斜邊平方。",
        fullDesc: "在直角三角形中，以三邊各作一個正方形，兩股上的正方形面積相加，恰好等於斜邊上正方形的面積。這是面積形式的畢氏定理。",
        formula: "$$ a^2 + b^2 = c^2 $$",
        tips: "拖曳 A（上下）與 B（左右）改變兩股長度。無論怎麼拖，黃 + 藍 永遠等於綠。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="70,100 70,60 100,100" fill="rgba(79,70,229,0.15)" stroke="#4f46e5" stroke-width="2"/><rect x="70" y="100" width="30" height="30" fill="rgba(250,204,21,0.5)" stroke="#4f46e5"/><rect x="30" y="60" width="40" height="40" fill="rgba(59,130,246,0.4)" stroke="#4f46e5"/><polygon points="70,60 100,100 140,70 110,30" fill="rgba(34,197,94,0.4)" stroke="#4f46e5"/><text x="40" y="145" font-size="16" fill="#4f46e5" font-weight="bold">a²+b²=c²</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-7, 9, 11, -7], axis:false, showCopyright:false});
            var pO = board.create('point', [0, 0], {name:'C', size:3, fixed:true, color:'#333'});
            var yAxis = board.create('line', [[0,0],[0,1]], {visible:false});
            var xAxis = board.create('line', [[0,0],[1,0]], {visible:false});
            var pA = board.create('glider', [0, 3, yAxis], {name:'A', size:5, color:'#ef4444'});
            var pB = board.create('glider', [4, 0, xAxis], {name:'B', size:5, color:'#ef4444'});
            var a = function(){ return pA.Y(); };   // 股 CA
            var b = function(){ return pB.X(); };   // 股 CB
            board.create('polygon', [pO, pB, pA], {fillColor:'#6366f1', fillOpacity:0.15, strokeColor:'#4f46e5'});
            // 股 b 上的正方形（往下）
            var q1 = board.create('point', [b, function(){ return -b(); }], {visible:false});
            var q2 = board.create('point', [0, function(){ return -b(); }], {visible:false});
            var sqB = board.create('polygon', [pO, pB, q1, q2], {fillColor:'#facc15', fillOpacity:0.5, strokeColor:'#eab308', vertices:{visible:false}});
            // 股 a 上的正方形（往左）
            var q3 = board.create('point', [function(){ return -a(); }, a], {visible:false});
            var q4 = board.create('point', [function(){ return -a(); }, 0], {visible:false});
            var sqA = board.create('polygon', [pO, pA, q3, q4], {fillColor:'#3b82f6', fillOpacity:0.4, strokeColor:'#2563eb', vertices:{visible:false}});
            // 斜邊上的正方形（往外）
            var q5 = board.create('point', [function(){ return b() + a(); }, function(){ return b(); }], {visible:false});
            var q6 = board.create('point', [function(){ return a(); }, function(){ return a() + b(); }], {visible:false});
            var sqC = board.create('polygon', [pB, q5, q6, pA], {fillColor:'#22c55e', fillOpacity:0.4, strokeColor:'#16a34a', vertices:{visible:false}});
            board.create('text', [-6.5, 8.5, function(){
                return "a² = " + sqA.Area().toFixed(1) + "　+　b² = " + sqB.Area().toFixed(1) + "　=　" + (sqA.Area()+sqB.Area()).toFixed(1);
            }], {fontSize:14, color:'#2563eb'});
            board.create('text', [-6.5, 7.6, function(){ return "c² = " + sqC.Area().toFixed(1); }], {fontSize:18, color:'#16a34a', fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 12,
        level: "國小",
        name: "圓周率與圓面積 (Circle)",
        shortDesc: "周長 = 2πr，面積 = πr²。",
        fullDesc: "圓的周長與直徑的比值固定為圓周率 π ≈ 3.14159。把圓切成很多小扇形再交錯拼起來，會接近一個底為半周長、高為半徑的長方形，於是面積 = πr²。",
        formula: "$$ C = 2\\pi r,\\quad S = \\pi r^2 $$",
        tips: "拖曳 P 點改變半徑，觀察「周長 ÷ 直徑」這個比值：不管圓多大，它永遠是 3.14…。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><circle cx="100" cy="75" r="55" fill="rgba(79,70,229,0.12)" stroke="#4f46e5" stroke-width="2"/><line x1="100" y1="75" x2="155" y2="75" stroke="#ef4444" stroke-width="2"/><circle cx="100" cy="75" r="3" fill="#333"/><text x="120" y="68" font-size="14" fill="#ef4444">r</text><text x="60" y="145" font-size="16" fill="#4f46e5" font-weight="bold">C÷d = π</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-8, 8, 8, -8], axis:false, showCopyright:false});
            var pO = board.create('point', [0, 0], {name:'O', size:3, fixed:true, color:'#333'});
            var pP = board.create('point', [4, 0], {name:'P', size:5, color:'#ef4444'});
            var circ = board.create('circle', [pO, pP], {strokeColor:'#4f46e5', strokeWidth:2, fillColor:'#6366f1', fillOpacity:0.12});
            board.create('segment', [pO, pP], {strokeColor:'#ef4444', strokeWidth:2, name:'r', withLabel:true});
            board.create('text', [-7.5, 7.2, function(){ var r = circ.Radius(); return "半徑 r = " + r.toFixed(2); }], {fontSize:15});
            board.create('text', [-7.5, 6.3, function(){ var r = circ.Radius(); return "周長 C = 2πr = " + (2*Math.PI*r).toFixed(2); }], {fontSize:15, color:'#4f46e5'});
            board.create('text', [-7.5, 5.4, function(){ var r = circ.Radius(); return "面積 S = πr² = " + (Math.PI*r*r).toFixed(2); }], {fontSize:15, color:'#16a34a'});
            board.create('text', [-7.5, -7, function(){ var r = circ.Radius(); return "C ÷ 直徑 = " + (2*Math.PI*r/(2*r)).toFixed(5) + " （永遠是 π）"; }], {fontSize:15, color:'#ef4444', fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 13,
        level: "國小",
        name: "平行四邊形面積 (Shear)",
        shortDesc: "剪一刀移過去，就變成長方形：底 × 高。",
        fullDesc: "把平行四邊形左邊的直角三角形剪下、平移到右邊，就拼成一個長方形。所以平行四邊形面積 = 底 × 高，與傾斜程度完全無關。",
        formula: "$$ S = b \\times h $$",
        tips: "拖曳頂點 D 左右滑動來改變傾斜度（高不變）。面積數字完全不動——這就是「等積變形」。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="30,120 130,120 170,40 70,40" fill="rgba(139,92,246,0.25)" stroke="#4f46e5" stroke-width="2"/><line x1="70" y1="40" x2="70" y2="120" stroke="#ef4444" stroke-dasharray="4"/><text x="76" y="85" font-size="14" fill="#ef4444">h</text><text x="75" y="138" font-size="14" fill="#4f46e5">b</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-3, 8, 13, -2], axis:false, showCopyright:false});
            var pA = board.create('point', [0, 0], {name:'A', size:3, fixed:true, color:'#333'});
            var pB = board.create('point', [6, 0], {name:'B', size:3, fixed:true, color:'#333'});
            var topLine = board.create('line', [[0,4],[1,4]], {strokeColor:'#cbd5e1', dash:2});
            var pD = board.create('glider', [2, 4, topLine], {name:'D', size:6, color:'#ef4444'});
            var pC = board.create('point', [function(){ return pD.X() + 6; }, 4], {name:'C', size:3, color:'#94a3b8', fixed:true});
            var poly = board.create('polygon', [pA, pB, pC, pD], {fillColor:'#8b5cf6', fillOpacity:0.3, strokeColor:'#4f46e5'});
            board.create('segment', [pD, [function(){ return pD.X(); }, 0]], {strokeColor:'#ef4444', dash:2});
            board.create('text', [-2.5, 7, function(){ return "底 b = 6　高 h = 4"; }], {fontSize:15});
            board.create('text', [-2.5, 6.1, function(){ return "面積 = b × h = " + poly.Area().toFixed(2); }], {fontSize:18, color:'#4f46e5', fontWeight:'bold'});
            board.create('text', [-2.5, -1.2, "拖曳 D 改變傾斜——面積不變"], {fontSize:14, color:'#ef4444'});
            return board;
        }
    },
    {
        id: 14,
        level: "國小",
        name: "梯形面積 (Trapezoid)",
        shortDesc: "(上底 + 下底) × 高 ÷ 2。",
        fullDesc: "兩個全等的梯形倒過來拼在一起，會變成一個底為 (上底 + 下底)、高為 h 的平行四邊形，所以一個梯形的面積是它的一半。",
        formula: "$$ S = \\frac{(a + b) \\times h}{2} $$",
        tips: "拖曳上底的兩個端點改變 a，或拖曳右下角改變 b。核對公式算出來的值與實際面積是否一致。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="20,120 180,120 140,40 60,40" fill="rgba(20,184,166,0.25)" stroke="#4f46e5" stroke-width="2"/><line x1="60" y1="40" x2="60" y2="120" stroke="#ef4444" stroke-dasharray="4"/><text x="66" y="85" font-size="14" fill="#ef4444">h</text><text x="95" y="35" font-size="14" fill="#4f46e5">a</text><text x="95" y="138" font-size="14" fill="#4f46e5">b</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-3, 8, 13, -2], axis:false, showCopyright:false});
            var topLine = board.create('line', [[0,4],[1,4]], {strokeColor:'#cbd5e1', dash:2});
            var botLine = board.create('line', [[0,0],[1,0]], {strokeColor:'#cbd5e1', dash:2});
            var pA = board.create('point', [0, 0], {name:'A', size:3, fixed:true, color:'#333'});
            var pB = board.create('glider', [10, 0, botLine], {name:'B', size:5, color:'#ef4444'});
            var pC = board.create('glider', [8, 4, topLine], {name:'C', size:5, color:'#ef4444'});
            var pD = board.create('glider', [3, 4, topLine], {name:'D', size:5, color:'#ef4444'});
            var poly = board.create('polygon', [pA, pB, pC, pD], {fillColor:'#14b8a6', fillOpacity:0.3, strokeColor:'#0d9488'});
            board.create('text', [-2.5, 7.2, function(){
                return "上底 a = " + pD.Dist(pC).toFixed(2) + "　下底 b = " + pA.Dist(pB).toFixed(2) + "　高 h = 4";
            }], {fontSize:14});
            board.create('text', [-2.5, 6.3, function(){
                var a = pD.Dist(pC), b = pA.Dist(pB);
                return "(a+b)×h÷2 = " + ((a+b)*4/2).toFixed(2) + "　｜　實際面積 = " + poly.Area().toFixed(2);
            }], {fontSize:16, color:'#0d9488', fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 15,
        level: "國中",
        name: "圓周角定理 (Inscribed Angle)",
        shortDesc: "同弧所對的圓周角，是圓心角的一半。",
        fullDesc: "在同一個圓上，弧 AB 所對的圓心角 ∠AOB 恆為圓周角 ∠APB 的兩倍。因此不管 P 在優弧上怎麼移動，圓周角都一樣大（同弧圓周角相等）。",
        formula: "$$ \\angle APB = \\frac{1}{2}\\angle AOB $$",
        tips: "沿著圓拖曳 P 點：圓周角的度數紋風不動。再拖曳 A 或 B 改變弧長，看兩個角是否維持 2 倍關係。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><circle cx="100" cy="75" r="58" fill="none" stroke="#4f46e5" stroke-width="2"/><circle cx="100" cy="75" r="3" fill="#333"/><line x1="100" y1="75" x2="52" y2="108" stroke="#ef4444" stroke-width="2"/><line x1="100" y1="75" x2="148" y2="108" stroke="#ef4444" stroke-width="2"/><line x1="100" y1="17" x2="52" y2="108" stroke="#3b82f6" stroke-width="2"/><line x1="100" y1="17" x2="148" y2="108" stroke="#3b82f6" stroke-width="2"/><text x="88" y="70" font-size="13" fill="#ef4444">2θ</text><text x="92" y="40" font-size="13" fill="#3b82f6">θ</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-8, 8, 8, -8], axis:false, showCopyright:false});
            var pO = board.create('point', [0, 0], {name:'O', size:3, fixed:true, color:'#333'});
            var circ = board.create('circle', [pO, 5], {strokeColor:'#4f46e5', strokeWidth:2});
            var pA = board.create('glider', [-4.33, -2.5, circ], {name:'A', size:5, color:'#ef4444'});
            var pB = board.create('glider', [4.33, -2.5, circ], {name:'B', size:5, color:'#ef4444'});
            var pP = board.create('glider', [0, 5, circ], {name:'P', size:6, color:'#3b82f6'});
            board.create('segment', [pO, pA], {strokeColor:'#ef4444'});
            board.create('segment', [pO, pB], {strokeColor:'#ef4444'});
            board.create('segment', [pP, pA], {strokeColor:'#3b82f6'});
            board.create('segment', [pP, pB], {strokeColor:'#3b82f6'});
            var aCenter = board.create('angle', [pA, pO, pB], {radius:1.2, fillColor:'#ef4444', name:''});
            var aInsc = board.create('angle', [pA, pP, pB], {radius:1.2, fillColor:'#3b82f6', name:''});
            var deg = function(a){ var d = a.Value() * 180 / Math.PI; return d > 180 ? 360 - d : d; };
            board.create('text', [-7.5, 7.2, function(){ return "圓心角 ∠AOB = " + deg(aCenter).toFixed(1) + "°"; }], {fontSize:15, color:'#ef4444'});
            board.create('text', [-7.5, 6.3, function(){ return "圓周角 ∠APB = " + deg(aInsc).toFixed(1) + "°"; }], {fontSize:15, color:'#3b82f6'});
            board.create('text', [-7.5, -7, function(){ return "圓心角 ÷ 圓周角 = " + (deg(aCenter)/deg(aInsc)).toFixed(2); }], {fontSize:16, fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 16,
        level: "國中",
        name: "三角形外角 (Exterior Angle)",
        shortDesc: "一個外角等於不相鄰的兩個內角和。",
        fullDesc: "延長三角形的一邊所形成的外角，等於另外兩個「不相鄰內角」的和。這是內角和 180° 的直接推論：外角 = 180° − 鄰角 = 其餘兩內角和。",
        formula: "$$ \\angle ACD = \\angle A + \\angle B $$",
        tips: "拖曳 A、B 讓三角形變形，比較「外角」與「∠A + ∠B」這兩個數字。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="80,30 20,120 130,120" fill="rgba(79,70,229,0.12)" stroke="#4f46e5" stroke-width="2"/><line x1="130" y1="120" x2="190" y2="120" stroke="#4f46e5" stroke-width="2" stroke-dasharray="4"/><path d="M 155 120 A 25 25 0 0 0 140 98" fill="rgba(245,158,11,0.5)"/><text x="150" y="112" font-size="13" fill="#d97706">外角</text><text x="72" y="26" font-size="12">A</text><text x="10" y="132" font-size="12">B</text><text x="128" y="135" font-size="12">C</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 9, 13, -2], axis:false, showCopyright:false});
            var pB = board.create('point', [1, 1], {name:'B', size:5, color:'#ef4444'});
            var pC = board.create('point', [8, 1], {name:'C', size:3, fixed:true, color:'#333'});
            var pA = board.create('point', [4, 6], {name:'A', size:5, color:'#ef4444'});
            board.create('polygon', [pA, pB, pC], {fillColor:'#6366f1', fillOpacity:0.12, strokeColor:'#4f46e5'});
            var pD = board.create('point', [function(){ return pC.X() + (pC.X()-pB.X())*0.5; }, function(){ return pC.Y() + (pC.Y()-pB.Y())*0.5; }],
                {name:'D', size:2, color:'#94a3b8', fixed:true});
            board.create('segment', [pC, pD], {strokeColor:'#94a3b8', dash:2});
            var aA = board.create('angle', [pB, pA, pC], {radius:1, fillColor:'#3b82f6', name:''});
            var aB = board.create('angle', [pC, pB, pA], {radius:1, fillColor:'#22c55e', name:''});
            var aExt = board.create('angle', [pA, pC, pD], {radius:1.2, fillColor:'#f59e0b', name:''});
            var deg = function(a){ return a.Value() * 180 / Math.PI; };
            board.create('text', [-1.5, 8.5, function(){
                return "∠A = " + deg(aA).toFixed(1) + "°　+　∠B = " + deg(aB).toFixed(1) + "°　=　" + (deg(aA)+deg(aB)).toFixed(1) + "°";
            }], {fontSize:15, color:'#2563eb'});
            board.create('text', [-1.5, 7.6, function(){ return "外角 ∠ACD = " + deg(aExt).toFixed(1) + "°"; }], {fontSize:18, color:'#d97706', fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 17,
        level: "國中",
        name: "相似與縮放 (Similarity)",
        shortDesc: "邊長放大 k 倍，面積會放大 k² 倍。",
        fullDesc: "把圖形以一點為中心放大 k 倍（位似變換），對應邊長都變 k 倍，但面積變成 k² 倍。這也是為什麼比例尺 1:2 的地圖，面積只有實際的四分之一。",
        formula: "$$ \\frac{S'}{S} = k^2 $$",
        tips: "拖曳滑桿改變倍率 k，特別留意 k = 2 時面積變 4 倍、k = 3 時變 9 倍。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="40,110 80,110 60,80" fill="rgba(59,130,246,0.4)" stroke="#2563eb" stroke-width="2"/><polygon points="40,110 120,110 80,50" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4"/><circle cx="40" cy="110" r="4" fill="#333"/><text x="110" y="40" font-size="16" fill="#ef4444" font-weight="bold">k² 倍</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-2, 11, 13, -3], axis:false, showCopyright:false});
            var k = board.create('slider', [[0, -2], [8, -2], [0.5, 2, 3]], {name:'k', snapWidth:0.1, precision:1});
            var pO = board.create('point', [0, 0], {name:'O', size:4, fixed:true, color:'#333'});
            var pA = board.create('point', [3, 1], {name:'A', size:4, color:'#3b82f6'});
            var pB = board.create('point', [4, 4], {name:'B', size:4, color:'#3b82f6'});
            var small = board.create('polygon', [pO, pA, pB], {fillColor:'#3b82f6', fillOpacity:0.4, strokeColor:'#2563eb'});
            var scale = function(p){
                return board.create('point',
                    [function(){ return pO.X() + (p.X()-pO.X())*k.Value(); },
                     function(){ return pO.Y() + (p.Y()-pO.Y())*k.Value(); }],
                    {visible:false});
            };
            var big = board.create('polygon', [pO, scale(pA), scale(pB)],
                {fillColor:'#ef4444', fillOpacity:0.15, strokeColor:'#ef4444', dash:2, vertices:{visible:false}});
            board.create('text', [-1.5, 10.3, function(){ return "倍率 k = " + k.Value().toFixed(1); }], {fontSize:16, fontWeight:'bold'});
            board.create('text', [-1.5, 9.4, function(){
                return "面積比 = " + (big.Area()/small.Area()).toFixed(2) + "　｜　k² = " + (k.Value()*k.Value()).toFixed(2);
            }], {fontSize:16, color:'#ef4444', fontWeight:'bold'});
            return board;
        }
    },
    {
        id: 18,
        level: "國小",
        name: "線對稱 (Reflection)",
        shortDesc: "沿對稱軸對摺，兩邊完全重合。",
        fullDesc: "線對稱圖形沿著對稱軸對摺後兩半完全重合。對稱點與原點到對稱軸的距離相等，且連線垂直於對稱軸。",
        formula: "$$ \\overline{PM} = \\overline{P'M},\\quad \\overline{PP'} \\perp \\ell $$",
        tips: "拖曳左邊藍色圖形的任一頂點，右邊紅色的鏡像會同步變化。注意對應點到虛線的距離永遠相等。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><line x1="100" y1="10" x2="100" y2="140" stroke="#94a3b8" stroke-dasharray="5" stroke-width="2"/><polygon points="30,120 80,120 45,50" fill="rgba(59,130,246,0.4)" stroke="#2563eb" stroke-width="2"/><polygon points="170,120 120,120 155,50" fill="rgba(239,68,68,0.3)" stroke="#ef4444" stroke-width="2"/></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-7, 8, 7, -4], axis:false, showCopyright:false});
            var axis = board.create('line', [[0,-3],[0,7]], {strokeColor:'#94a3b8', dash:2, strokeWidth:2, fixed:true, name:'ℓ', withLabel:true});
            var p1 = board.create('point', [-5, 0], {name:'A', size:5, color:'#3b82f6'});
            var p2 = board.create('point', [-1, 0], {name:'B', size:5, color:'#3b82f6'});
            var p3 = board.create('point', [-4, 5], {name:'C', size:5, color:'#3b82f6'});
            board.create('polygon', [p1, p2, p3], {fillColor:'#3b82f6', fillOpacity:0.4, strokeColor:'#2563eb'});
            var r1 = board.create('reflection', [p1, axis], {name:"A'", size:4, color:'#ef4444'});
            var r2 = board.create('reflection', [p2, axis], {name:"B'", size:4, color:'#ef4444'});
            var r3 = board.create('reflection', [p3, axis], {name:"C'", size:4, color:'#ef4444'});
            board.create('polygon', [r1, r2, r3], {fillColor:'#ef4444', fillOpacity:0.3, strokeColor:'#ef4444'});
            board.create('segment', [p3, r3], {strokeColor:'#cbd5e1', dash:1});
            board.create('text', [-6.5, 7.3, function(){
                return "C 到軸距離 = " + Math.abs(p3.X()).toFixed(2) + "　C' 到軸距離 = " + Math.abs(r3.X()).toFixed(2);
            }], {fontSize:14});
            return board;
        }
    },
    {
        id: 19,
        level: "國中",
        name: "柱體體積 (Prism Volume)",
        shortDesc: "體積 = 底面積 × 高。",
        fullDesc: "任何柱體（長方體、圓柱、三角柱）都可以想成把底面「疊高」而成，所以體積等於底面積乘以高。錐體則只有同底同高柱體的三分之一。",
        formula: "$$ V_{柱} = S_{底} \\times h,\\quad V_{錐} = \\frac{1}{3} S_{底} \\times h $$",
        tips: "拖曳滑桿改變高度 h，觀察體積如何隨 h 成正比增加。可用滑鼠拖曳圖形旋轉視角。",
        thumbnailSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><polygon points="40,50 110,30 160,55 90,78" fill="rgba(99,102,241,0.35)" stroke="#4f46e5" stroke-width="2"/><polygon points="40,50 40,110 90,138 90,78" fill="rgba(79,70,229,0.25)" stroke="#4f46e5" stroke-width="2"/><polygon points="90,78 160,55 160,115 90,138" fill="rgba(139,92,246,0.25)" stroke="#4f46e5" stroke-width="2"/><text x="165" y="95" font-size="13" fill="#4f46e5">h</text></svg>`,
        initBoard: function(id) {
            const board = JXG.JSXGraph.initBoard(id, {boundingbox: [-8, 8, 8, -8], axis:false, showCopyright:false});
            var h = board.create('slider', [[-7, -6.5], [1, -6.5], [1, 4, 6]], {name:'h', snapWidth:0.5, precision:1});
            var view = board.create('view3d', [[-6, -3], [8, 8], [[-5, 5], [-5, 5], [0, 7]]], {
                xPlaneRear: {visible:false}, yPlaneRear: {visible:false}, zPlaneRear: {visible:false},
                numberOfMainGrids: 0
            });
            var W = 3, D = 2;  // 底面 3 × 2
            var base = [[0,0],[W,0],[W,D],[0,D]];
            var bot = base.map(function(p){ return view.create('point3d', [p[0], p[1], 0], {size:2, name:'', withLabel:false}); });
            var top = base.map(function(p){ return view.create('point3d', [p[0], p[1], function(){ return h.Value(); }], {size:2, name:'', withLabel:false}); });
            view.create('polygon3d', bot, {fillColor:'#4f46e5', fillOpacity:0.25, strokeColor:'#4f46e5'});
            view.create('polygon3d', top, {fillColor:'#8b5cf6', fillOpacity:0.35, strokeColor:'#4f46e5'});
            for (var i = 0; i < 4; i++) {
                var j = (i + 1) % 4;
                view.create('polygon3d', [bot[i], bot[j], top[j], top[i]], {fillColor:'#6366f1', fillOpacity:0.2, strokeColor:'#4f46e5'});
            }
            board.create('text', [-7, 7.2, function(){
                return "底面積 = " + (W*D) + "　高 h = " + h.Value().toFixed(1);
            }], {fontSize:15});
            board.create('text', [-7, 6.3, function(){
                return "V(柱) = " + (W*D*h.Value()).toFixed(2) + "　V(錐) = " + (W*D*h.Value()/3).toFixed(2);
            }], {fontSize:16, color:'#4f46e5', fontWeight:'bold'});
            return board;
        }
    }
];

function renderCards() {
    appContainer.innerHTML = "";
    
    const favorites = getFavorites();
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    const filteredData = geometryData.filter(item => {
        const level = item.level || '國中';
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                              item.shortDesc.toLowerCase().includes(searchTerm) ||
                              level.includes(searchTerm);
        const matchesFav = showFavoritesOnly ? favorites.includes(item.id) : true;
        return matchesSearch && matchesFav;
    });

    if(filteredData.length === 0) {
        appContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">找不到符合的模型...</div>`;
        return;
    }

    filteredData.forEach((item, index) => {
        const isFav = favorites.includes(item.id);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('draggable', true);
        
        // Find original index in full dataset
        const originalIndex = geometryData.findIndex(d => d.id === item.id);
        card.setAttribute('data-index', originalIndex);
        
        card.onclick = (e) => {
            if(!e.target.closest('.fav-btn') && !card.classList.contains('dragging')) {
                openModal(geometryData[originalIndex]);
            }
        };

        card.innerHTML = `
            <div class="card-img-container">${item.thumbnailSvg}</div>
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h3 class="card-title"><span class="level-badge ${(item.level || '國中') === '國小' ? 'elem' : ''}">${item.level || '國中'}</span>${item.name}</h3>
                    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${item.id}, this)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                </div>
                <p class="card-desc">${item.shortDesc}</p>
                <button class="btn-more" onclick="event.stopPropagation(); openModal(geometryData[${originalIndex}])">進入實驗室 &rarr;</button>
            </div>
        `;
        
        addDragEvents(card);
        addTiltEffect(card);
        appContainer.appendChild(card);
    });
}

function openModal(data) {
    document.getElementById('mTitle').innerText = data.name;
    document.getElementById('mDesc').innerText = data.fullDesc;
    document.getElementById('mFormula').innerHTML = data.formula;
    document.getElementById('mTips').innerText = data.tips;

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    if (window.MathJax) MathJax.typesetPromise();

    if (currentBoard) JXG.JSXGraph.freeBoard(currentBoard);
    document.getElementById('jxgbox').innerHTML = "";

    setTimeout(() => {
        if (typeof data.initBoard === 'function') {
            try {
                currentBoard = data.initBoard('jxgbox');
            } catch(e) {
                console.error("Board init error:", e);
            }
        }
    }, 150);
}

function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        if (currentBoard) {
            JXG.JSXGraph.freeBoard(currentBoard);
            currentBoard = null;
        }
    }, 300); 
}

// 3D Tilt Effect
function addTiltEffect(card) {
    card.addEventListener('mousemove', (e) => {
        if (card.classList.contains('dragging')) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation based on cursor position
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
}

// Drag functionality
let dragStartIndex;
function addDragEvents(card) {
    card.addEventListener('dragstart', function(e) {
        if(showFavoritesOnly || searchInput.value) {
            e.preventDefault(); 
            return;
        }
        dragStartIndex = +this.getAttribute('data-index');
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragover', e => {
        if(showFavoritesOnly || searchInput.value) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    card.addEventListener('dragenter', function() { if(!showFavoritesOnly && !searchInput.value) this.classList.add('drag-over'); });
    card.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
    card.addEventListener('drop', function() {
        if(showFavoritesOnly || searchInput.value) return;
        const dragEndIndex = +this.getAttribute('data-index');
        swapItems(dragStartIndex, dragEndIndex);
        this.classList.remove('drag-over');
        document.querySelectorAll('.card').forEach(c => c.classList.remove('dragging'));
    });
    card.addEventListener('dragend', function() { 
        this.classList.remove('dragging'); 
        document.querySelectorAll('.card').forEach(c => c.classList.remove('drag-over'));
    });
}

function swapItems(fromIndex, toIndex) {
    if (fromIndex === undefined || toIndex === undefined || fromIndex === toIndex) return;
    const itemOne = geometryData[fromIndex];
    const itemTwo = geometryData[toIndex];
    geometryData[fromIndex] = itemTwo;
    geometryData[toIndex] = itemOne;
    renderCards();
}

// Listeners
document.querySelector('.close-btn').addEventListener('click', closeModal);
window.onclick = function(event) { if (event.target == modal) closeModal(); }
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
});

// Render initial cards
renderCards();
