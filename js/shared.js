// ============================================================
// GAME ARCADE - Shared Engine
// SaveData, ChipAudio, Texture Gen, UI Helpers
// ============================================================

const GAME_W = 270;
const GAME_H = 480;
const LANE_X = [50, 92, 135, 178, 220];
const PLAYER_Y = 390;
const SPAWN_Y = -60;
const BASE_SPEED = 80;
const PED_TEXTURES = ['pedestrian', 'pedestrian_blue', 'pedestrian_green'];

// ============================================================
// DIFFICULTY MODES
// ============================================================
const DIFFICULTY_MODES = [
    { key: 'easy',       label: 'EASY',       color: '#44CC44', speedMult: 0.8, spawnStart: 2.5, spawnMin: 0.8, patternPhase: 3, scoreMult: 0.5 },
    { key: 'normal',     label: 'NORMAL',     color: '#4499FF', speedMult: 1.0, spawnStart: 2.0, spawnMin: 0.6, patternPhase: 0, scoreMult: 1.0 },
    { key: 'hard',       label: 'HARD',       color: '#FF8844', speedMult: 1.3, spawnStart: 1.5, spawnMin: 0.5, patternPhase: -2, scoreMult: 1.5 },
    { key: 'impossible', label: 'IMPOSSIBLE', color: '#FF3333', speedMult: 1.8, spawnStart: 1.0, spawnMin: 0.3, patternPhase: -4, scoreMult: 3.0 },
];

// ============================================================
// SAVE DATA - Persistent game state
// ============================================================
const SaveData = {
    _d: null,
    _defaults: {
        highscore: 0, totalCoins: 0, selectedChar: 0, selectedBoard: 0,
        selectedOutfit: 0, musicTrack: 0, unlockedChars: [0], unlockedBoards: [0],
        unlockedOutfits: [0], raceWins: 0, racesPlayed: 0,
        unlockedTricks: [],
        selectedHat: 0, selectedTop: 0, selectedBottom: 0,
        unlockedHats: [0,1], unlockedTops: [0], unlockedBottoms: [0],
        jttHighscore: 0, jttGamesPlayed: 0, jttMusicTrack: 0,
        playerName: '', selectedDifficulty: 1,
        highscoreEasy: 0, highscoreNormal: 0, highscoreHard: 0, highscoreImpossible: 0
    },
    load() {
        try { this._d = JSON.parse(localStorage.getItem('sk8_save')) || {}; } catch(e) { this._d = {}; }
        for (const k in this._defaults) { if (this._d[k] === undefined) this._d[k] = JSON.parse(JSON.stringify(this._defaults[k])); }
    },
    save() { localStorage.setItem('sk8_save', JSON.stringify(this._d)); },
    get(k) { if (!this._d) this.load(); return this._d[k]; },
    set(k, v) { if (!this._d) this.load(); this._d[k] = v; this.save(); },
};
SaveData.load();

// ============================================================
// LEADERBOARD - Firebase Firestore backend
// ============================================================
// Backed by the "worldcup-bet-2026" Firebase project, collection `arcade_scores`
// (public read + validated create; see firestore.rules in the worldcup-bet repo).
// Uses the Firestore REST API directly — no SDK, so shared.js stays a plain script.
// The web apiKey is a public client identifier (safe to embed); write access is
// gated by the security rules, not the key.
const FB_PROJECT = 'worldcup-bet-2026';
const FB_API_KEY = 'AIzaSyCNwMFWLo2WP6la9bx2rdwIoeEsv-6uNEM';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;
const FS_COLLECTION = 'arcade_scores';

const Leaderboard = {
    _cache: null,
    async fetch() {
        try {
            const body = { structuredQuery: {
                from: [{ collectionId: FS_COLLECTION }],
                orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
                limit: 20
            }};
            const r = await fetch(`${FS_BASE}:runQuery?key=${FB_API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!r.ok) throw new Error('fetch failed');
            const rows = await r.json();
            const scores = (rows || []).filter(x => x.document).map(x => {
                const f = x.document.fields || {};
                return {
                    name: (f.name && f.name.stringValue) || '???',
                    score: parseInt((f.score && (f.score.integerValue || f.score.doubleValue)) || 0, 10),
                    game: (f.game && f.game.stringValue) || '',
                    difficulty: (f.difficulty && f.difficulty.stringValue) || ''
                };
            });
            this._cache = scores;
            return scores;
        } catch (e) {
            return this._cache || [];
        }
    },
    async submit(name, score, game, extra) {
        try {
            const fields = {
                name: { stringValue: String(name || '???').slice(0, 12) },
                score: { integerValue: String(Math.max(0, Math.floor(Number(score) || 0))) },
                game: { stringValue: String(game || '') },
                difficulty: { stringValue: String((extra && extra.difficulty) || '') },
                ts: { timestampValue: new Date().toISOString() }
            };
            const r = await fetch(`${FS_BASE}/${FS_COLLECTION}?key=${FB_API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields })
            });
            if (!r.ok) throw new Error('submit failed');
            await this.fetch();   // refresh cache with the new standings
            return true;
        } catch (e) {
            return false;
        }
    }
};

// ============================================================
// NAME INPUT HELPER - In-game name entry for leaderboard
// ============================================================
function showNameInput(scene, x, y, depth, onSubmit, opts) {
    const sf = (opts && opts.scrollFactor !== undefined) ? opts.scrollFactor : undefined;
    const applyScroll = (obj) => { if (sf !== undefined && obj.setScrollFactor) obj.setScrollFactor(sf); return obj; };
    const savedName = SaveData.get('playerName') || '';
    const maxLen = 10;
    let currentName = savedName.toUpperCase();
    const group = [];

    // Name display box
    const nameBox = scene.add.graphics().setDepth(depth);
    nameBox.fillStyle(0x111133, 0.9);
    nameBox.fillRect(x - 80, y - 12, 160, 22);
    nameBox.lineStyle(1, 0x6666aa, 0.8);
    nameBox.strokeRect(x - 80, y - 12, 160, 22);
    applyScroll(nameBox);
    group.push(nameBox);

    const nameDisplay = applyScroll(scene.add.text(x, y, currentName || 'TAP TO TYPE', {
        fontSize: '10px', fontFamily: 'monospace', color: currentName ? '#fff' : '#555'
    }).setOrigin(0.5).setDepth(depth + 1));
    group.push(nameDisplay);

    const cursor = applyScroll(scene.add.text(x + 1, y, '_', {
        fontSize: '10px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0, 0.5).setDepth(depth + 1));
    group.push(cursor);
    scene.tweens.add({ targets: cursor, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    function updateDisplay() {
        nameDisplay.setText(currentName || 'TAP TO TYPE');
        nameDisplay.setColor(currentName ? '#fff' : '#555');
        const tw = nameDisplay.width;
        cursor.setX(x + tw / 2 + 2);
        cursor.setVisible(currentName.length < maxLen);
    }

    // Virtual keyboard - 3 rows
    const kbRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const kbStartY = y + 18;
    const keySize = 16;
    const keyGap = 2;

    kbRows.forEach((row, ri) => {
        const rowW = row.length * (keySize + keyGap) - keyGap;
        const startX = x - rowW / 2;
        for (let ci = 0; ci < row.length; ci++) {
            const ch = row[ci];
            const kx = startX + ci * (keySize + keyGap) + keySize / 2;
            const ky = kbStartY + ri * (keySize + keyGap);

            const keyBg = applyScroll(scene.add.rectangle(kx, ky, keySize, keySize, 0x333355, 0.9)
                .setDepth(depth + 1).setStrokeStyle(1, 0x5555aa).setInteractive());
            const keyTxt = applyScroll(scene.add.text(kx, ky, ch, {
                fontSize: '8px', fontFamily: 'monospace', color: '#ddd'
            }).setOrigin(0.5).setDepth(depth + 2));
            group.push(keyBg, keyTxt);

            keyBg.on('pointerdown', () => {
                if (currentName.length < maxLen) {
                    currentName += ch;
                    updateDisplay();
                    audio.playClick();
                }
            });
        }
    });

    // Bottom row: DEL + numbers + OK
    const bottomY = kbStartY + 3 * (keySize + keyGap);

    // DEL button
    const delBg = applyScroll(scene.add.rectangle(x - 75, bottomY, 30, keySize, 0x663333, 0.9)
        .setDepth(depth + 1).setStrokeStyle(1, 0xaa5555).setInteractive());
    const delTxt = applyScroll(scene.add.text(x - 75, bottomY, 'DEL', {
        fontSize: '7px', fontFamily: 'monospace', color: '#ff8888'
    }).setOrigin(0.5).setDepth(depth + 2));
    group.push(delBg, delTxt);

    delBg.on('pointerdown', () => {
        if (currentName.length > 0) {
            currentName = currentName.slice(0, -1);
            updateDisplay();
            audio.playClick();
        }
    });

    // Number keys (0-9) in a compact row
    const nums = '0123456789';
    const numRowW = nums.length * (keySize + keyGap) - keyGap - 70;
    const numStartX = x - numRowW / 2 + 5;
    for (let ni = 0; ni < nums.length; ni++) {
        const ch = nums[ni];
        const nx = numStartX + ni * 14;
        const nBg = applyScroll(scene.add.rectangle(nx, bottomY, 12, keySize, 0x333355, 0.9)
            .setDepth(depth + 1).setStrokeStyle(1, 0x5555aa).setInteractive());
        const nTxt = applyScroll(scene.add.text(nx, bottomY, ch, {
            fontSize: '7px', fontFamily: 'monospace', color: '#aaa'
        }).setOrigin(0.5).setDepth(depth + 2));
        group.push(nBg, nTxt);
        nBg.on('pointerdown', () => {
            if (currentName.length < maxLen) {
                currentName += ch;
                updateDisplay();
                audio.playClick();
            }
        });
    }

    // SUBMIT button
    const subBg = applyScroll(scene.add.rectangle(x, bottomY + keySize + 6, 100, 20, 0x336633, 0.9)
        .setDepth(depth + 1).setStrokeStyle(1, 0x55aa55).setInteractive());
    const subTxt = applyScroll(scene.add.text(x, bottomY + keySize + 6, 'SUBMIT SCORE', {
        fontSize: '8px', fontFamily: 'monospace', color: '#88FF88'
    }).setOrigin(0.5).setDepth(depth + 2));
    group.push(subBg, subTxt);

    // SKIP button
    const skipBg = applyScroll(scene.add.rectangle(x, bottomY + keySize + 28, 60, 16, 0x444444, 0.7)
        .setDepth(depth + 1).setStrokeStyle(1, 0x666666).setInteractive());
    const skipTxt = applyScroll(scene.add.text(x, bottomY + keySize + 28, 'SKIP', {
        fontSize: '7px', fontFamily: 'monospace', color: '#888'
    }).setOrigin(0.5).setDepth(depth + 2));
    group.push(skipBg, skipTxt);

    subBg.on('pointerdown', () => {
        audio.playClick();
        const name = currentName.trim();
        if (name.length > 0) {
            SaveData.set('playerName', name);
            subTxt.setText('SAVING...');
            subBg.disableInteractive();
            skipBg.disableInteractive();
            onSubmit(name, group);
        }
    });

    skipBg.on('pointerdown', () => {
        audio.playClick();
        group.forEach(o => o.destroy());
        onSubmit(null, []);
    });

    updateDisplay();
    return group;
}

// ============================================================
// CHARACTER / BOARD / OUTFIT DATA
// ============================================================
const CHARACTERS = [
    { name: 'Jake', skin: 0xFFCC99, shirt: 0x3366CC, pants: 0x2a2a50, cap: 0xCC3333, hair: null, cost: 0 },
    { name: 'Luna', skin: 0xE8B88A, shirt: 0xCC33AA, pants: 0x332255, cap: null, hair: 0x442200, cost: 50 },
    { name: 'Blaze', skin: 0xC68642, shirt: 0xFF4400, pants: 0x222222, cap: 0x111111, hair: null, cost: 100 },
    { name: 'Frost', skin: 0xDDDDEE, shirt: 0x44AADD, pants: 0x334455, cap: 0x2288BB, hair: null, cost: 150 },
    { name: 'Shadow', skin: 0x555555, shirt: 0x222222, pants: 0x111111, cap: 0x000000, hair: null, cost: 250 },
    { name: 'Goldie', skin: 0xFFCC99, shirt: 0xFFAA00, pants: 0xCC8800, cap: 0xFFDD00, hair: null, cost: 500 },
];
const BOARDS = [
    { name: 'Classic', deck: 0x8B4513, stripe: 0xA0522D, wheels: 0x444444, cost: 0 },
    { name: 'Neon', deck: 0x00FF88, stripe: 0x00CCAA, wheels: 0x00FF00, cost: 60 },
    { name: 'Fire', deck: 0xFF3300, stripe: 0xFF6600, wheels: 0xFF0000, cost: 80 },
    { name: 'Ice', deck: 0x44CCFF, stripe: 0x88DDFF, wheels: 0x2299CC, cost: 100 },
    { name: 'Galaxy', deck: 0x6600CC, stripe: 0x9933FF, wheels: 0xCC00FF, cost: 200 },
    { name: 'Gold', deck: 0xFFAA00, stripe: 0xFFDD00, wheels: 0xFFCC00, cost: 400 },
];
const OUTFITS = [
    { name: 'Default', mod: null, cost: 0 },
    { name: 'Hoodie', mod: { shirtH: 15, hood: true }, cost: 40 },
    { name: 'Tank Top', mod: { noSleeves: true }, cost: 30 },
    { name: 'Suit', mod: { shirt: 0x222233, pants: 0x222233, tie: true }, cost: 120 },
    { name: 'Hawaiian', mod: { shirt: 0x22AA55, floral: true }, cost: 80 },
    { name: 'Ninja', mod: { shirt: 0x111111, pants: 0x111111, mask: true }, cost: 200 },
];

// Mix-and-match wardrobe parts
const HATS = [
    { name: 'None', cost: 0 },
    { name: 'Cap', color: 0xCC3333, cost: 0 },
    { name: 'Beanie', color: 0x4466AA, cost: 30 },
    { name: 'Crown', color: 0xFFDD00, cost: 200 },
    { name: 'Headband', color: 0xFF4444, cost: 40 },
    { name: 'Mask', color: 0x111111, cost: 80 },
];
const TOPS = [
    { name: 'Default', cost: 0 },
    { name: 'Hoodie', color: 0x555577, cost: 40 },
    { name: 'Tank Top', noSleeves: true, cost: 30 },
    { name: 'Suit Jacket', color: 0x222233, tie: true, cost: 120 },
    { name: 'Hawaiian', color: 0x22AA55, floral: true, cost: 80 },
    { name: 'Ninja Gi', color: 0x111111, cost: 100 },
];
const BOTTOMS = [
    { name: 'Default', cost: 0 },
    { name: 'Jeans', color: 0x335588, cost: 25 },
    { name: 'Suit Pants', color: 0x222233, cost: 60 },
    { name: 'Shorts', short: true, cost: 35 },
    { name: 'Cargo Pants', color: 0x556633, cost: 50 },
];

const MUSIC_TRACKS = [
    { name: 'Chill Ride', melody: [262,294,330,392,440,392,330,294, 330,392,440,523,440,392,330,392, 440,392,330,262,294,330,392,330, 294,262,294,330,294,262,220,262], bass: [131,131,165,165,196,196,220,220, 175,175,196,196,220,220,262,262, 220,220,196,196,165,165,131,131, 147,147,165,165,147,147,110,131], tempo: 0.18 },
    { name: 'Speed Rush', melody: [330,330,440,440,523,523,440,330, 392,523,660,523,440,392,330,392, 523,660,784,660,523,440,392,440, 330,392,440,523,440,392,330,262], bass: [165,165,220,220,262,262,220,165, 196,262,330,262,220,196,165,196, 262,330,392,330,262,220,196,220, 165,196,220,262,220,196,165,131], tempo: 0.13 },
    { name: 'Night Grind', melody: [220,262,330,262,220,175,220,262, 330,392,330,262,220,262,330,392, 440,392,330,262,220,262,330,262, 220,175,147,175,220,262,220,175], bass: [110,110,131,131,165,165,131,131, 110,110,131,131,165,165,196,196, 220,220,196,196,165,165,131,131, 110,110,88,88,110,110,131,110], tempo: 0.22 },
    { name: 'Pixel Punk', melody: [392,392,523,523,660,523,392,523, 660,784,660,523,392,330,392,523, 330,392,523,660,784,660,523,392, 523,660,523,392,330,262,330,392], bass: [196,196,262,262,330,262,196,262, 330,392,330,262,196,165,196,262, 165,196,262,330,392,330,262,196, 262,330,262,196,165,131,165,196], tempo: 0.12 },
];

// ============================================================
// AUDIO
// ============================================================
class ChipAudio {
    constructor() { this.ctx = null; this.enabled = true; this.musicGain = null; this.musicPlaying = false; this._musicTimer = null; this.currentTrack = 0; }
    init() { if (this.ctx) return; this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.12; this.musicGain.connect(this.ctx.destination); }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    _beep(freq, dur, type, vol, delay) {
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime + (delay || 0);
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur);
    }
    playJump() { this._beep(300,0.08,'square',0.15); this._beep(500,0.1,'square',0.12,0.05); }
    playLand() { this._beep(150,0.06,'triangle',0.1); }
    playCoin() { this._beep(800,0.05,'square',0.1); this._beep(1200,0.08,'square',0.1,0.05); }
    playCrash() { for(let i=0;i<5;i++) this._beep(100+Math.random()*200,0.15,'sawtooth',0.12,i*0.03); }
    playSwoosh() { this._beep(400,0.06,'sine',0.08); this._beep(600,0.04,'sine',0.06,0.03); }
    playPowerup() { [400,500,600,800].forEach((f,i)=>this._beep(f,0.1,'square',0.1,i*0.06)); }
    playGameOver() { [400,350,300,200].forEach((f,i)=>this._beep(f,0.2,'triangle',0.12,i*0.15)); }
    playClick() { this._beep(600,0.04,'square',0.08); }
    playWin() { [523,659,784,1047].forEach((f,i)=>this._beep(f,0.15,'square',0.12,i*0.1)); }
    playBounce() { this._beep(200,0.06,'sine',0.12); this._beep(400,0.08,'sine',0.1,0.04); }
    playBreak() { for(let i=0;i<4;i++) this._beep(80+Math.random()*150,0.1,'sawtooth',0.1,i*0.02); this._beep(60,0.2,'triangle',0.08,0.1); }

    startMusic(trackIdx, customTracks) {
        if (!this.ctx) return;
        this.stopMusic();
        this._customTracks = customTracks || null;
        this.currentTrack = trackIdx !== undefined ? trackIdx : SaveData.get('musicTrack');
        this.musicPlaying = true;
        this._playLoop();
    }
    _playLoop() {
        if (!this.musicPlaying || !this.ctx) return;
        const trackList = this._customTracks || MUSIC_TRACKS;
        const track = trackList[this.currentTrack] || trackList[0];
        const t0 = this.ctx.currentTime + 0.05;
        track.melody.forEach((freq, i) => {
            const t = t0 + i * track.tempo;
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = 'square'; o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + track.tempo * 0.9);
            o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + track.tempo);
        });
        track.bass.forEach((freq, i) => {
            const t = t0 + i * track.tempo;
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = 'triangle'; o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + track.tempo * 0.9);
            o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + track.tempo);
        });
        this._musicTimer = setTimeout(() => this._playLoop(), track.melody.length * track.tempo * 1000 - 50);
    }
    stopMusic() { this.musicPlaying = false; if (this._musicTimer) { clearTimeout(this._musicTimer); this._musicTimer = null; } }
}
const audio = new ChipAudio();

// ============================================================
// TEXTURE GENERATION
// ============================================================
function createPixelTexture(scene, key, w, h, drawFn) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ add: false }); drawFn(g, w, h); g.generateTexture(key, w, h); g.destroy();
}

function drawSkater(g, char, board, outfit) {
    const c = CHARACTERS[char] || CHARACTERS[0];
    const b = BOARDS[board] || BOARDS[0];
    const o = OUTFITS[outfit] || OUTFITS[0];
    const shirt = (o.mod && o.mod.shirt) || c.shirt;
    const pants = (o.mod && o.mod.pants) || c.pants;

    g.fillStyle(0x000000, 0.15); g.fillEllipse(12, 30, 22, 6);
    g.fillStyle(b.deck); g.fillRect(2, 26, 20, 4);
    g.fillStyle(b.stripe); g.fillRect(3, 27, 18, 2);
    g.fillStyle(b.wheels); g.fillRect(4, 30, 3, 3); g.fillRect(17, 30, 3, 3);
    g.fillStyle(pants); g.fillRect(7, 18, 4, 9); g.fillRect(13, 18, 4, 9);
    g.fillStyle(shirt); g.fillRect(6, 6, 12, 13);
    if (o.mod && o.mod.tie) { g.fillStyle(0xCC0000); g.fillRect(11, 8, 2, 10); }
    if (o.mod && o.mod.floral) { g.fillStyle(0xFFFF00); g.fillRect(8,8,2,2); g.fillRect(14,10,2,2); g.fillRect(10,14,2,2); }
    if (!(o.mod && o.mod.noSleeves)) { const armC = (o.mod && o.mod.shirt) || (c.shirt - 0x060606); g.fillStyle(shirt); g.fillRect(3, 8, 4, 8); g.fillRect(17, 8, 4, 8); }
    if (o.mod && o.mod.hood) { g.fillStyle(shirt); g.fillRect(6, 0, 12, 8); }
    g.fillStyle(c.skin); g.fillRect(8, 0, 8, 7);
    if (o.mod && o.mod.mask) { g.fillStyle(0x111111); g.fillRect(8, 2, 8, 5); g.fillStyle(c.skin); g.fillRect(9, 3, 2, 2); g.fillRect(13, 3, 2, 2); }
    if (c.cap) { g.fillStyle(c.cap); g.fillRect(7, 0, 10, 3); }
    if (c.hair) { g.fillStyle(c.hair); g.fillRect(7, 0, 10, 2); g.fillRect(6, 2, 2, 4); g.fillRect(16, 2, 2, 4); }
    g.fillStyle(0x222222); g.fillRect(9, 3, 2, 2); g.fillRect(13, 3, 2, 2);
}

// Mix-and-match wardrobe draw function
function drawSkaterMix(g, charIdx, boardIdx, hatIdx, topIdx, bottomIdx) {
    const c = CHARACTERS[charIdx] || CHARACTERS[0];
    const b = BOARDS[boardIdx] || BOARDS[0];
    const hat = HATS[hatIdx] || HATS[0];
    const top = TOPS[topIdx] || TOPS[0];
    const bot = BOTTOMS[bottomIdx] || BOTTOMS[0];
    const shirtColor = top.color || c.shirt;
    const pantsColor = bot.color || c.pants;

    // Shadow
    g.fillStyle(0x000000, 0.15); g.fillEllipse(12, 30, 22, 6);
    // Board
    g.fillStyle(b.deck); g.fillRect(2, 26, 20, 4);
    g.fillStyle(b.stripe); g.fillRect(3, 27, 18, 2);
    g.fillStyle(b.wheels); g.fillRect(4, 30, 3, 3); g.fillRect(17, 30, 3, 3);
    // Legs / bottoms
    if (bot.short) {
        g.fillStyle(pantsColor); g.fillRect(7, 18, 4, 5); g.fillRect(13, 18, 4, 5);
        g.fillStyle(c.skin); g.fillRect(7, 23, 4, 4); g.fillRect(13, 23, 4, 4);
    } else {
        g.fillStyle(pantsColor); g.fillRect(7, 18, 4, 9); g.fillRect(13, 18, 4, 9);
    }
    // Torso
    g.fillStyle(shirtColor); g.fillRect(6, 6, 12, 13);
    // Tie
    if (top.tie) { g.fillStyle(0xCC0000); g.fillRect(11, 8, 2, 10); }
    // Floral pattern
    if (top.floral) { g.fillStyle(0xFFFF00); g.fillRect(8,8,2,2); g.fillRect(14,10,2,2); g.fillRect(10,14,2,2); }
    // Arms/sleeves
    if (!top.noSleeves) { g.fillStyle(shirtColor); g.fillRect(3, 8, 4, 8); g.fillRect(17, 8, 4, 8); }
    // Hood (for hoodie top)
    if (topIdx === 1) { g.fillStyle(shirtColor); g.fillRect(6, 0, 12, 8); }
    // Skin (face)
    g.fillStyle(c.skin); g.fillRect(8, 0, 8, 7);
    // Hat
    if (hat.name === 'Mask') { g.fillStyle(hat.color); g.fillRect(8, 2, 8, 5); g.fillStyle(c.skin); g.fillRect(9, 3, 2, 2); g.fillRect(13, 3, 2, 2); }
    else if (hat.name === 'Cap') { g.fillStyle(hat.color); g.fillRect(7, 0, 10, 3); }
    else if (hat.name === 'Beanie') { g.fillStyle(hat.color); g.fillRect(7, -1, 10, 4); g.fillStyle(hat.color+0x111111); g.fillRect(8, -2, 8, 2); }
    else if (hat.name === 'Crown') { g.fillStyle(hat.color); g.fillRect(7, -1, 10, 3); g.fillStyle(0xFFAA00); g.fillRect(7,-3,2,3); g.fillRect(11,-3,2,3); g.fillRect(15,-3,2,3); }
    else if (hat.name === 'Headband') { g.fillStyle(hat.color); g.fillRect(7, 1, 10, 2); }
    // Default character hair/cap if no hat selected
    if (hat.name === 'None') {
        if (c.cap) { g.fillStyle(c.cap); g.fillRect(7, 0, 10, 3); }
        if (c.hair) { g.fillStyle(c.hair); g.fillRect(7, 0, 10, 2); g.fillRect(6, 2, 2, 4); g.fillRect(16, 2, 2, 4); }
    }
    // Eyes
    g.fillStyle(0x222222); g.fillRect(9, 3, 2, 2); g.fillRect(13, 3, 2, 2);
}

// On-demand wardrobe texture with caching
function getWardrobeKey(charIdx, boardIdx, hatIdx, topIdx, bottomIdx) {
    return `ward_${charIdx}_${boardIdx}_${hatIdx}_${topIdx}_${bottomIdx}`;
}
function ensureWardrobeTexture(scene, charIdx, boardIdx, hatIdx, topIdx, bottomIdx) {
    const key = getWardrobeKey(charIdx, boardIdx, hatIdx, topIdx, bottomIdx);
    if (!scene.textures.exists(key)) {
        createPixelTexture(scene, key, 24, 34, (g) => drawSkaterMix(g, charIdx, boardIdx, hatIdx, topIdx, bottomIdx));
    }
    return key;
}

function generateAllTextures(scene) {
    createPixelTexture(scene, 'road', GAME_W, 160, (g, w, h) => {
        // Motorway asphalt
        g.fillStyle(0x333340); g.fillRect(0, 0, w, h);
        // Hard shoulder (left & right)
        g.fillStyle(0x2a2a35); g.fillRect(0, 0, 28, h); g.fillRect(242, 0, 28, h);
        // Metal crash barriers
        g.fillStyle(0x667788); g.fillRect(0, 0, 4, h); g.fillRect(266, 0, 4, h);
        g.fillStyle(0x556677); g.fillRect(1, 0, 2, h); g.fillRect(267, 0, 2, h);
        // Barrier posts
        g.fillStyle(0x445566); for (let y = 0; y < h; y += 30) { g.fillRect(0, y, 4, 4); g.fillRect(266, y, 4, 4); }
        // Solid white edge lines
        g.fillStyle(0xDDDDDD); g.fillRect(27, 0, 2, h); g.fillRect(241, 0, 2, h);
        // Dashed white lane markings (4 dividers for 5 lanes)
        g.fillStyle(0xCCCCCC);
        for (let y = 0; y < h; y += 20) { g.fillRect(70, y, 2, 10); g.fillRect(113, y, 2, 10); g.fillRect(156, y, 2, 10); g.fillRect(198, y, 2, 10); }
        // Road surface texture variation
        g.fillStyle(0x383845); g.fillRect(60, 0, 1, h); g.fillRect(135, 0, 1, h); g.fillRect(210, 0, 1, h);
        // Reflective cat's eyes between lanes (4 sets)
        g.fillStyle(0xFFFF44); for (let y = 4; y < h; y += 20) { g.fillRect(71, y, 1, 2); g.fillRect(114, y, 1, 2); g.fillRect(157, y, 1, 2); g.fillRect(199, y, 1, 2); }
        // Red cat's eyes on edge
        g.fillStyle(0xFF4444); for (let y = 4; y < h; y += 20) { g.fillRect(28, y, 1, 2); g.fillRect(242, y, 1, 2); }
    });
    createPixelTexture(scene, 'shadow', 20, 8, (g) => { g.fillStyle(0x000000, 0.3); g.fillEllipse(10, 4, 20, 8); });
    createPixelTexture(scene, 'cone', 14, 20, (g) => {
        g.fillStyle(0xFF6600); g.fillRect(5,0,4,4); g.fillRect(3,4,8,6); g.fillRect(1,10,12,6);
        g.fillStyle(0xFFFFFF); g.fillRect(3,6,8,2); g.fillRect(1,12,12,2);
        g.fillStyle(0xCCCCCC); g.fillRect(0,16,14,4);
    });
    createPixelTexture(scene, 'trash_can', 18, 24, (g) => {
        g.fillStyle(0x666670); g.fillRect(2,4,14,18); g.fillStyle(0x777780); g.fillRect(1,2,16,4);
        g.fillStyle(0x888890); g.fillRect(0,0,18,3); g.fillStyle(0x555560); g.fillRect(2,22,14,2);
        g.fillStyle(0x999999); g.fillRect(7,0,4,1); g.fillStyle(0x8888a0); g.fillRect(3,6,2,14);
    });
    createPixelTexture(scene, 'pothole', 24, 12, (g) => { g.fillStyle(0x1a1a22); g.fillEllipse(12,6,24,12); g.fillStyle(0x222230); g.fillEllipse(12,5,20,9); });
    // Pedestrian walking across road
    createPixelTexture(scene, 'pedestrian', 14, 24, (g) => {
        // Head
        g.fillStyle(0xFFCC99); g.fillRect(5, 0, 5, 5);
        // Hair
        g.fillStyle(0x553311); g.fillRect(5, 0, 5, 2);
        // Eyes
        g.fillStyle(0x222222); g.fillRect(6, 2, 1, 1); g.fillRect(8, 2, 1, 1);
        // Body/jacket
        g.fillStyle(0xCC4444); g.fillRect(3, 5, 9, 9);
        // Arms
        g.fillStyle(0xCC4444); g.fillRect(1, 6, 3, 7); g.fillRect(11, 6, 3, 7);
        // Hands
        g.fillStyle(0xFFCC99); g.fillRect(1, 12, 2, 2); g.fillRect(12, 12, 2, 2);
        // Legs (walking pose)
        g.fillStyle(0x333355); g.fillRect(4, 14, 3, 7); g.fillRect(8, 14, 3, 7);
        // Shoes
        g.fillStyle(0x444444); g.fillRect(3, 20, 4, 3); g.fillRect(8, 20, 4, 3);
    });
    // Pedestrian variant 2 - blue jacket
    createPixelTexture(scene, 'pedestrian_blue', 14, 24, (g) => {
        g.fillStyle(0xFFCC99); g.fillRect(5, 0, 5, 5);
        g.fillStyle(0x443322); g.fillRect(5, 0, 5, 2);
        g.fillStyle(0x222222); g.fillRect(6, 2, 1, 1); g.fillRect(8, 2, 1, 1);
        g.fillStyle(0x3355AA); g.fillRect(3, 5, 9, 9);
        g.fillStyle(0x3355AA); g.fillRect(1, 6, 3, 7); g.fillRect(11, 6, 3, 7);
        g.fillStyle(0xFFCC99); g.fillRect(1, 12, 2, 2); g.fillRect(12, 12, 2, 2);
        g.fillStyle(0x222244); g.fillRect(4, 14, 3, 7); g.fillRect(8, 14, 3, 7);
        g.fillStyle(0x555555); g.fillRect(3, 20, 4, 3); g.fillRect(8, 20, 4, 3);
    });
    // Pedestrian variant 3 - green hoodie
    createPixelTexture(scene, 'pedestrian_green', 14, 24, (g) => {
        g.fillStyle(0xDDBB99); g.fillRect(5, 0, 5, 5);
        g.fillStyle(0x338833); g.fillRect(5, 0, 5, 3);
        g.fillStyle(0x222222); g.fillRect(6, 3, 1, 1); g.fillRect(8, 3, 1, 1);
        g.fillStyle(0x338833); g.fillRect(3, 5, 9, 9);
        g.fillStyle(0x338833); g.fillRect(1, 6, 3, 7); g.fillRect(11, 6, 3, 7);
        g.fillStyle(0xDDBB99); g.fillRect(1, 12, 2, 2); g.fillRect(12, 12, 2, 2);
        g.fillStyle(0x333333); g.fillRect(4, 14, 3, 7); g.fillRect(8, 14, 3, 7);
        g.fillStyle(0x444444); g.fillRect(3, 20, 4, 3); g.fillRect(8, 20, 4, 3);
    });
    createPixelTexture(scene, 'coin', 12, 12, (g) => { g.fillStyle(0xFFD700); g.fillEllipse(6,6,12,12); g.fillStyle(0xFFE44D); g.fillEllipse(5,5,8,8); g.fillStyle(0xCC9900); g.fillRect(5,4,2,4); });
    const puC = { shield:0x4499FF, magnet:0xFF4444, speed_boost:0xFFFF44, slow_motion:0xAA44FF };
    Object.entries(puC).forEach(([k,c]) => createPixelTexture(scene,'pu_'+k,16,16,(g)=>{ g.fillStyle(c,0.3); g.fillEllipse(8,8,16,16); g.fillStyle(c); g.fillEllipse(8,8,12,12); g.fillStyle(0xFFFFFF,0.5); g.fillEllipse(6,6,5,5); }));
    createPixelTexture(scene, 'bg_sky', GAME_W, GAME_H, (g) => { for(let y=0;y<GAME_H;y++){const t=y/GAME_H; g.fillStyle(Phaser.Display.Color.GetColor(Math.floor(20+t*15),Math.floor(20+t*25),Math.floor(50+t*30))); g.fillRect(0,y,GAME_W,1);} });
    createPixelTexture(scene, 'bg_buildings', GAME_W, 120, (g) => {
        const bw=[30,20,25,35,22,28,18,32,24,20,30,26]; let x=0;
        bw.forEach(w=>{const h=40+Math.floor(Math.random()*60); g.fillStyle(0x222235+Math.floor(Math.random()*0x101010)); g.fillRect(x,120-h,w-1,h);
        for(let wy=120-h+5;wy<115;wy+=10) for(let wx=x+3;wx<x+w-4;wx+=7) if(Math.random()>0.3){g.fillStyle(Math.random()>0.5?0x667799:0x445566); g.fillRect(wx,wy,3,4);} x+=w;});
    });
    // Roadside buildings - various types
    // Small shop (left side)
    createPixelTexture(scene, 'bld_shop', 28, 40, (g) => {
        g.fillStyle(0x553322); g.fillRect(0, 8, 28, 32); // walls
        g.fillStyle(0x664433); g.fillRect(1, 9, 26, 30);
        g.fillStyle(0x443322); g.fillRect(0, 0, 28, 10); // roof
        g.fillStyle(0x332211); g.fillRect(2, 1, 24, 8);
        g.fillStyle(0x88CCFF); g.fillRect(4, 18, 9, 10); // window
        g.fillStyle(0x66AADD); g.fillRect(5, 19, 7, 8);
        g.fillStyle(0x554422); g.fillRect(16, 20, 8, 20); // door
        g.fillStyle(0x665533); g.fillRect(17, 21, 6, 18);
        g.fillStyle(0xFFDD44); g.fillRect(3, 12, 22, 3); // sign
    });
    // Tall building
    createPixelTexture(scene, 'bld_tall', 26, 70, (g) => {
        g.fillStyle(0x334455); g.fillRect(0, 0, 26, 70);
        g.fillStyle(0x3a4a5a); g.fillRect(1, 1, 24, 68);
        // windows grid
        for (let wy = 4; wy < 65; wy += 10) {
            for (let wx = 3; wx < 22; wx += 8) {
                const lit = Math.random() > 0.3;
                g.fillStyle(lit ? 0xFFDD88 : 0x223344);
                g.fillRect(wx, wy, 5, 6);
            }
        }
        g.fillStyle(0x2a3a4a); g.fillRect(0, 0, 26, 3); // roof edge
    });
    // House
    createPixelTexture(scene, 'bld_house', 28, 36, (g) => {
        g.fillStyle(0x886644); g.fillRect(0, 12, 28, 24); // walls
        g.fillStyle(0x997755); g.fillRect(1, 13, 26, 22);
        // roof triangle
        g.fillStyle(0xCC4444);
        for (let i = 0; i < 12; i++) { g.fillRect(14 - i, i, i * 2, 2); }
        g.fillStyle(0x88CCFF); g.fillRect(4, 20, 7, 7); // window
        g.fillStyle(0x88CCFF); g.fillRect(17, 20, 7, 7); // window
        g.fillStyle(0x554422); g.fillRect(10, 24, 7, 12); // door
    });
    // Apartment block
    createPixelTexture(scene, 'bld_apt', 30, 55, (g) => {
        g.fillStyle(0x556666); g.fillRect(0, 0, 30, 55);
        g.fillStyle(0x5a7070); g.fillRect(1, 1, 28, 53);
        for (let wy = 4; wy < 50; wy += 8) {
            for (let wx = 3; wx < 26; wx += 7) {
                const lit = Math.random() > 0.4;
                g.fillStyle(lit ? 0xFFEE99 : 0x334444);
                g.fillRect(wx, wy, 4, 5);
            }
        }
        g.fillStyle(0x445555); g.fillRect(11, 42, 8, 13); // entrance
        g.fillStyle(0x667777); g.fillRect(12, 43, 6, 11);
    });
    // Small tree
    createPixelTexture(scene, 'bld_tree', 14, 24, (g) => {
        g.fillStyle(0x553311); g.fillRect(5, 14, 4, 10); // trunk
        g.fillStyle(0x227733); g.fillEllipse(7, 8, 14, 16); // leaves
        g.fillStyle(0x33AA44); g.fillEllipse(6, 7, 10, 12);
    });
    // Lamp post
    createPixelTexture(scene, 'bld_lamp', 8, 30, (g) => {
        g.fillStyle(0x555555); g.fillRect(3, 6, 2, 24); // pole
        g.fillStyle(0x666666); g.fillRect(1, 0, 6, 6); // top
        g.fillStyle(0xFFFF88); g.fillRect(2, 2, 4, 3); // light
        g.fillStyle(0x444444); g.fillRect(1, 28, 6, 2); // base
    });

    // Grass patch
    createPixelTexture(scene, 'bld_grass', 28, 14, (g) => {
        g.fillStyle(0x2a5a20); g.fillRect(0, 4, 28, 10);
        g.fillStyle(0x3a7a30); g.fillRect(2, 2, 24, 10);
        g.fillStyle(0x44882a); g.fillRect(3, 6, 5, 3); g.fillRect(12, 4, 6, 3); g.fillRect(21, 7, 5, 3);
        // Blades
        g.fillStyle(0x55AA44); g.fillRect(5,0,2,5); g.fillRect(10,1,2,4); g.fillRect(16,0,2,5); g.fillRect(22,2,2,3); g.fillRect(1,3,1,3);
    });
    // Grass strip (longer)
    createPixelTexture(scene, 'bld_grasslong', 30, 20, (g) => {
        g.fillStyle(0x2a5a20); g.fillRect(0, 6, 30, 14);
        g.fillStyle(0x337728); g.fillRect(1, 4, 28, 14);
        g.fillStyle(0x44882a); g.fillRect(3, 8, 7, 4); g.fillRect(14, 6, 8, 4); g.fillRect(22, 10, 6, 4);
        // Blades and flowers
        g.fillStyle(0x55AA44); g.fillRect(4,0,2,6); g.fillRect(9,2,2,5); g.fillRect(15,0,2,6); g.fillRect(21,1,2,5); g.fillRect(26,3,2,4);
        g.fillStyle(0x66CC55); g.fillRect(7,1,1,3); g.fillRect(18,2,1,3); g.fillRect(24,0,1,4);
        // Tiny flowers
        g.fillStyle(0xFFFF55); g.fillRect(6,2,2,2);
        g.fillStyle(0xFF6688); g.fillRect(19,1,2,2);
        g.fillStyle(0xFFFFFF); g.fillRect(12,3,2,2);
    });
    // Bush
    createPixelTexture(scene, 'bld_bush', 18, 14, (g) => {
        g.fillStyle(0x225518); g.fillEllipse(9, 8, 18, 12);
        g.fillStyle(0x337722); g.fillEllipse(9, 7, 14, 10);
        g.fillStyle(0x44AA33); g.fillEllipse(7, 6, 8, 6);
        g.fillStyle(0x44AA33); g.fillEllipse(12, 6, 8, 6);
    });

    // Generate all character textures
    for (let ci = 0; ci < CHARACTERS.length; ci++) {
        for (let bi = 0; bi < BOARDS.length; bi++) {
            for (let oi = 0; oi < OUTFITS.length; oi++) {
                createPixelTexture(scene, `skater_${ci}_${bi}_${oi}`, 24, 34, (g) => drawSkater(g, ci, bi, oi));
            }
        }
    }
    // AI racer colors
    const aiColors = [0xFF4444, 0x44FF44, 0x4444FF, 0xFFFF44, 0xFF44FF, 0xFF8800, 0x00FFFF, 0xAAFF44, 0xCC44CC, 0xFFAAAA, 0x44AAFF, 0xFFCC44, 0x88FF88, 0xAA66FF, 0xFF6688];
    aiColors.forEach((c, i) => createPixelTexture(scene, 'ai_racer_'+i, 24, 34, (g) => {
        g.fillStyle(0x000000,0.15); g.fillEllipse(12,30,22,6);
        g.fillStyle(0x664422); g.fillRect(2,26,20,4); g.fillStyle(0x553311); g.fillRect(3,27,18,2);
        g.fillStyle(0x333333); g.fillRect(4,30,3,3); g.fillRect(17,30,3,3);
        g.fillStyle(0x333344); g.fillRect(7,18,4,9); g.fillRect(13,18,4,9);
        g.fillStyle(c); g.fillRect(6,6,12,13); g.fillRect(3,8,4,8); g.fillRect(17,8,4,8);
        g.fillStyle(0xDDBB99); g.fillRect(8,0,8,7);
        g.fillStyle(0x222222); g.fillRect(9,3,2,2); g.fillRect(13,3,2,2);
    }));
}

function getSkaterKey(scene) {
    const ci = SaveData.get('selectedChar');
    const bi = SaveData.get('selectedBoard');
    // If wardrobe is being used (any non-default part selected), use mix system
    const hi = SaveData.get('selectedHat') || 0;
    const ti = SaveData.get('selectedTop') || 0;
    const bti = SaveData.get('selectedBottom') || 0;
    if ((hi > 0 || ti > 0 || bti > 0) && scene) {
        return ensureWardrobeTexture(scene, ci, bi, hi, ti, bti);
    }
    return `skater_${ci}_${bi}_${SaveData.get('selectedOutfit')}`;
}

// ============================================================
// UI HELPERS
// ============================================================
function makeBtn(scene, x, y, text, color, cb) {
    const btn = scene.add.text(x, y, text, { fontSize:'11px', fontFamily:'monospace', color:'#fff', backgroundColor:color||'#3366CC', padding:{x:14,y:6}, align:'center' }).setOrigin(0.5).setInteractive();
    btn.on('pointerdown', () => { audio.playClick(); cb(); });
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    return btn;
}
function makeTitle(scene, text) { return scene.add.text(GAME_W/2, 30, text, { fontSize:'14px', fontFamily:'monospace', color:'#FFD700', stroke:'#000', strokeThickness:2 }).setOrigin(0.5); }
function coinDisplay(scene, y) {
    return scene.add.text(GAME_W/2, y, 'Coins: $'+SaveData.get('totalCoins'), { fontSize:'10px', fontFamily:'monospace', color:'#FFD700' }).setOrigin(0.5);
}

