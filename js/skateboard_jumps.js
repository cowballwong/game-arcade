// ============================================================
// SKATEBOARD JUMPS - Endless Runner on a 5-Lane Motorway
// Scenes: Boot, MainMenu, Game, Race, Shop, Chat, etc.
// ============================================================

// ============================================================
// BOOT
// ============================================================
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    create() { generateAllTextures(this);
        // Boot straight into the game chosen on the HTML landing (index.html), e.g.
        // play.html?game=skateboard | jtt. No param → Launcher (which redirects to index.html).
        const g = new URLSearchParams(location.search).get('game');
        this.scene.start(g==='jtt' ? 'JTTBoot' : g==='skateboard' ? 'MainMenu' : 'Launcher');
    }
}

// ============================================================
// MAIN MENU - Updated with all new buttons
// ============================================================
class MainMenuScene extends Phaser.Scene {
    constructor() { super('MainMenu'); }
    create() {
        audio.init();
        this.cameras.main.setBackgroundColor('#1a1a2e');
        this.add.image(GAME_W/2, GAME_H/2, 'bg_sky');
        this.add.text(GAME_W/2, 55, 'SKATEBOARD\nJUMPS', { fontSize:'18px', fontFamily:'monospace', color:'#FFD700', align:'center', stroke:'#000', strokeThickness:3, lineSpacing:4 }).setOrigin(0.5);
        this.add.image(GAME_W/2, 125, getSkaterKey(this)).setScale(2.5);

        const bx = GAME_W / 2;
        let by = 175;
        const gap = 28;
        makeBtn(this, bx, by, '    PLAY    ', '#3366CC', () => this.scene.start('Game'));

        // Difficulty selector
        by += 20;
        const diffIdx = SaveData.get('selectedDifficulty') || 1;
        const dm = DIFFICULTY_MODES[diffIdx];
        const diffLabel = this.add.text(bx, by, dm.label, {
            fontSize: '9px', fontFamily: 'monospace', color: dm.color
        }).setOrigin(0.5);
        const diffLeft = this.add.text(bx - 55, by, '<', {
            fontSize: '12px', fontFamily: 'monospace', color: '#aaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const diffRight = this.add.text(bx + 55, by, '>', {
            fontSize: '12px', fontFamily: 'monospace', color: '#aaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const multLabel = this.add.text(bx, by + 12, 'x' + dm.scoreMult + ' score', {
            fontSize: '7px', fontFamily: 'monospace', color: '#888'
        }).setOrigin(0.5);

        let curDiff = diffIdx;
        const updateDiff = () => {
            const d = DIFFICULTY_MODES[curDiff];
            diffLabel.setText(d.label).setColor(d.color);
            multLabel.setText('x' + d.scoreMult + ' score');
            SaveData.set('selectedDifficulty', curDiff);
        };
        diffLeft.on('pointerdown', () => { audio.playClick(); curDiff = (curDiff - 1 + DIFFICULTY_MODES.length) % DIFFICULTY_MODES.length; updateDiff(); });
        diffRight.on('pointerdown', () => { audio.playClick(); curDiff = (curDiff + 1) % DIFFICULTY_MODES.length; updateDiff(); });

        by += 25;
        makeBtn(this, bx, by+=gap, '    RACE    ', '#CC6633', () => this.scene.start('Race'));
        makeBtn(this, bx, by+=gap, ' CHARACTERS ', '#336644', () => this.scene.start('CharSelect'));
        makeBtn(this, bx, by+=gap, '  WARDROBE  ', '#885588', () => this.scene.start('Wardrobe'));
        makeBtn(this, bx, by+=gap, '    SHOP    ', '#886622', () => this.scene.start('Shop'));
        makeBtn(this, bx, by+=gap, '    CHAT    ', '#664488', () => this.scene.start('Chat'));
        makeBtn(this, bx, by+=gap, 'INSTRUCTIONS', '#555566', () => this.scene.start('Instructions'));
        makeBtn(this, bx, by+=gap, '  SETTINGS  ', '#555566', () => this.scene.start('Settings'));
        makeBtn(this, bx, by+=gap, 'HIGH SCORES ', '#555566', () => this.scene.start('HighScores'));
        makeBtn(this, bx, by+=gap, 'BACK TO ARCADE', '#664444', () => { audio.stopMusic(); this.scene.start('Launcher'); });

        this.add.text(GAME_W/2, 465, 'BEST: '+(SaveData.get('highscore'))+'m  |  $'+SaveData.get('totalCoins'), { fontSize:'8px', fontFamily:'monospace', color:'#888' }).setOrigin(0.5);
    }
}

// ============================================================
// INSTRUCTIONS
// ============================================================
class InstructionsScene extends Phaser.Scene {
    constructor() { super('Instructions'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        makeTitle(this, 'HOW TO PLAY');
        const lines = [
            { t: 'CONTROLS', c: '#FFD700', y: 70 },
            { t: 'Swipe LEFT / RIGHT\nto switch lanes', c: '#ccc', y: 95 },
            { t: 'TAP or Swipe UP\nto JUMP over obstacles', c: '#ccc', y: 135 },
            { t: 'GOAL', c: '#FFD700', y: 180 },
            { t: 'Skate as far as you can!\nAvoid obstacles on the road.\nCollect coins for the shop.', c: '#ccc', y: 210 },
            { t: 'POWER-UPS', c: '#FFD700', y: 270 },
            { t: 'SHIELD (blue) - invincible\nMAGNET (red) - attract coins\nSPEED (yellow) - go fast!\nSLOW-MO (purple) - slow time', c: '#aaa', y: 305 },
            { t: 'RACE MODE', c: '#FFD700', y: 370 },
            { t: 'Race against 10 AI skaters!\nLast one standing wins.', c: '#ccc', y: 395 },
        ];
        lines.forEach(l => this.add.text(GAME_W/2, l.y, l.t, { fontSize:'9px', fontFamily:'monospace', color:l.c, align:'center', lineSpacing:3 }).setOrigin(0.5));
        makeBtn(this, GAME_W/2, 448, '  BACK  ', '#555566', () => this.scene.start('MainMenu'));
    }
}

// ============================================================
// CHARACTER SELECT
// ============================================================
class CharSelectScene extends Phaser.Scene {
    constructor() { super('CharSelect'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        makeTitle(this, 'CHARACTERS');
        coinDisplay(this, 50);

        const unlocked = SaveData.get('unlockedChars');
        const selected = SaveData.get('selectedChar');
        this.previewImg = this.add.image(GAME_W/2, 100, getSkaterKey(this)).setScale(3);
        this.nameLabel = this.add.text(GAME_W/2, 135, CHARACTERS[selected].name, { fontSize:'10px', fontFamily:'monospace', color:'#fff' }).setOrigin(0.5);

        const startY = 165;
        CHARACTERS.forEach((ch, i) => {
            const y = startY + i * 38;
            const owned = unlocked.includes(i);
            const isSel = i === selected;
            const key = `skater_${i}_${SaveData.get('selectedBoard')}_${SaveData.get('selectedOutfit')}`;
            this.add.image(30, y, key).setScale(1.2);
            this.add.text(55, y - 8, ch.name, { fontSize:'9px', fontFamily:'monospace', color: isSel ? '#FFD700' : '#fff' });

            if (!owned) {
                makeBtn(this, 210, y, '$'+ch.cost, '#886622', () => {
                    if (SaveData.get('totalCoins') >= ch.cost) {
                        SaveData.set('totalCoins', SaveData.get('totalCoins') - ch.cost);
                        const u = SaveData.get('unlockedChars'); u.push(i); SaveData.set('unlockedChars', u);
                        this.scene.restart();
                    }
                });
            } else if (!isSel) {
                makeBtn(this, 210, y, 'SELECT', '#336644', () => { SaveData.set('selectedChar', i); this.scene.restart(); });
            } else {
                this.add.text(210, y, 'EQUIPPED', { fontSize:'9px', fontFamily:'monospace', color:'#44FF44' }).setOrigin(0.5);
            }
        });
        makeBtn(this, GAME_W/2, 450, '  BACK  ', '#555566', () => this.scene.start('MainMenu'));
    }
}

// ============================================================
// SHOP - Boards, Outfits & Tricks
// ============================================================
// Tricks (Asher's idea): buy with coins; once owned, clearing an obstacle
// performs your BEST owned trick for a bonus. Pricier trick = bigger bonus.
const TRICKS = [
    { name: 'BACKFLIP',  cost: 3000, bonus: 30 },
    { name: 'FRONTFLIP', cost: 4000, bonus: 40 },
    { name: '360 SPIN',  cost: 6000, bonus: 60 },
];
class ShopScene extends Phaser.Scene {
    constructor() { super('Shop'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        makeTitle(this, 'SHOP');
        this.coinLabel = coinDisplay(this, 50);
        this.tab = this.tab || 'boards';

        // Tabs
        const tabBoard = makeBtn(this, 48, 70, 'BOARDS', this.tab==='boards'?'#886622':'#444', () => { this.tab='boards'; this.scene.restart(); });
        const tabOutfit = makeBtn(this, 135, 70, 'OUTFITS', this.tab==='outfits'?'#886622':'#444', () => { this.tab='outfits'; this.scene.restart(); });
        const tabTrick = makeBtn(this, 222, 70, 'TRICKS', this.tab==='tricks'?'#886622':'#444', () => { this.tab='tricks'; this.scene.restart(); });

        const isTricks = this.tab === 'tricks';
        const items = this.tab === 'boards' ? BOARDS : this.tab === 'outfits' ? OUTFITS : TRICKS;
        const unlockedKey = this.tab === 'boards' ? 'unlockedBoards' : this.tab === 'outfits' ? 'unlockedOutfits' : 'unlockedTricks';
        const selectedKey = this.tab === 'boards' ? 'selectedBoard' : this.tab === 'outfits' ? 'selectedOutfit' : null;
        const unlocked = SaveData.get(unlockedKey);
        const selected = selectedKey ? SaveData.get(selectedKey) : -1;

        const startY = 105;
        items.forEach((item, i) => {
            const y = startY + i * 36;
            const owned = unlocked.includes(i);
            const isSel = i === selected;

            if (this.tab === 'boards') {
                const g = this.add.graphics();
                g.fillStyle(item.deck); g.fillRect(15, y - 4, 24, 5);
                g.fillStyle(item.stripe); g.fillRect(16, y - 3, 22, 3);
                g.fillStyle(item.wheels); g.fillRect(17, y + 2, 4, 3); g.fillRect(33, y + 2, 4, 3);
            }
            this.add.text(55, y - 6, item.name, { fontSize:'9px', fontFamily:'monospace', color: isSel ? '#FFD700' : '#ddd' });
            if (isTricks) this.add.text(55, y + 5, '+'+item.bonus+' coins per trick jump!', { fontSize:'6px', fontFamily:'monospace', color:'#66aaff' });

            if (!owned) {
                makeBtn(this, 220, y, '$'+item.cost, '#886622', () => {
                    if (SaveData.get('totalCoins') >= item.cost) {
                        SaveData.set('totalCoins', SaveData.get('totalCoins') - item.cost);
                        const u = SaveData.get(unlockedKey); u.push(i); SaveData.set(unlockedKey, u);
                        this.scene.restart();
                    }
                });
            } else if (isTricks) {
                this.add.text(220, y, 'OWNED', { fontSize:'8px', fontFamily:'monospace', color:'#44FF44' }).setOrigin(0.5);
            } else if (!isSel) {
                makeBtn(this, 220, y, 'EQUIP', '#336644', () => { SaveData.set(selectedKey, i); this.scene.restart(); });
            } else {
                this.add.text(220, y, 'EQUIPPED', { fontSize:'8px', fontFamily:'monospace', color:'#44FF44' }).setOrigin(0.5);
            }
        });

        // Preview
        this.add.image(GAME_W/2, 430, getSkaterKey(this)).setScale(2.5);
        makeBtn(this, GAME_W/2, 460, '  BACK  ', '#555566', () => this.scene.start('MainMenu'));
    }
}

// ============================================================
// CHAT
// ============================================================
class ChatScene extends Phaser.Scene {
    constructor() { super('Chat'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        makeTitle(this, 'SKATER CHAT');

        const botNames = ['Sk8rBoi', 'OllieQueen', 'GrindMaster', 'FlipKid', 'RailRider'];
        const botMsgs = [
            'Just hit 5000m! New record!', 'Anyone unlocked the Gold board?', 'Race mode is so fun!',
            'The Ninja outfit is sick', 'Tips: save coins for Galaxy board', 'Who else loves Night Grind music?',
            'Shadow character is OP lol', 'I keep crashing at 3000m haha', 'Slow motion powerup is the best',
            'Frost gang where you at?', 'Just started playing, any tips?', 'The speed boost is insane!',
            'Made it to phase 5 difficulty!', 'Hawaiian outfit + Neon board = drip', 'GG everyone!',
        ];
        const quickReplies = ['GG!', 'Nice!', 'LOL', 'Same!', 'Lets go!', 'Tips?', 'Hello!', 'Race me!'];

        // Chat messages area
        const chatBg = this.add.rectangle(GAME_W/2, 230, 250, 300, 0x111122, 0.8).setStrokeStyle(1, 0x333355);
        this.chatTexts = [];

        // Generate random chat history
        const msgs = [];
        for (let i = 0; i < 8; i++) {
            const name = botNames[Math.floor(Math.random() * botNames.length)];
            const msg = botMsgs[Math.floor(Math.random() * botMsgs.length)];
            msgs.push({ name, msg, isPlayer: false });
        }
        this.allMsgs = msgs;
        this._renderChat();

        // Type your own message button
        makeBtn(this, GAME_W/2, 393, '  TYPE MESSAGE  ', '#336644', () => {
            const msg = prompt('Type your message:');
            if (msg && msg.trim()) {
                const cleaned = msg.trim().substring(0, 60);
                this.allMsgs.push({ name: 'You', msg: cleaned, isPlayer: true });
                this._renderChat();
                // Bot replies to your message
                this.time.delayedCall(800 + Math.random() * 1500, () => {
                    const rName = botNames[Math.floor(Math.random() * botNames.length)];
                    const smartReplies = [
                        'Thats cool!', 'I agree!', 'Haha nice one!', 'No way!', 'For real?',
                        'Same here lol', 'Lets gooo!', 'Yo thats sick!', 'GG!', '100% bro',
                        'Tell me more!', 'Lmaooo', 'Facts!', 'W take!', 'Bet!',
                    ];
                    this.allMsgs.push({ name: rName, msg: smartReplies[Math.floor(Math.random() * smartReplies.length)], isPlayer: false });
                    this._renderChat();
                    // Sometimes a second bot chimes in
                    if (Math.random() > 0.5) {
                        this.time.delayedCall(1000 + Math.random() * 2000, () => {
                            const rName2 = botNames[Math.floor(Math.random() * botNames.length)];
                            const followUps = ['^^^ what they said', 'Lol true', 'Ayy!', 'Yo!', 'Fr fr', 'W', 'Nah chill 😂'];
                            this.allMsgs.push({ name: rName2, msg: followUps[Math.floor(Math.random() * followUps.length)], isPlayer: false });
                            this._renderChat();
                        });
                    }
                });
            }
        });

        // Quick reply buttons
        const replyY = 418;
        this.add.text(GAME_W/2, replyY - 10, 'Quick Reply:', { fontSize:'7px', fontFamily:'monospace', color:'#666' }).setOrigin(0.5);
        for (let i = 0; i < quickReplies.length; i++) {
            const col = Math.floor(i / 2);
            const row = i % 2;
            const bx = 45 + col * 60;
            const by = replyY + 6 + row * 20;
            makeBtn(this, bx, by, quickReplies[i], '#334466', () => {
                this.allMsgs.push({ name: 'You', msg: quickReplies[i], isPlayer: true });
                this.time.delayedCall(500 + Math.random() * 1000, () => {
                    const rName = botNames[Math.floor(Math.random() * botNames.length)];
                    const responses = ['Haha nice!', 'For real!', 'Same here!', 'Lets gooo!', 'GG!', '100%!', 'Yo!', 'Ayy!'];
                    this.allMsgs.push({ name: rName, msg: responses[Math.floor(Math.random() * responses.length)], isPlayer: false });
                    this._renderChat();
                });
                this._renderChat();
            });
        }
        makeBtn(this, GAME_W/2, 466, '  BACK  ', '#555566', () => this.scene.start('MainMenu'));
    }
    _renderChat() {
        this.chatTexts.forEach(t => t.destroy());
        this.chatTexts = [];
        const visible = this.allMsgs.slice(-8);
        visible.forEach((m, i) => {
            const y = 95 + i * 34;
            const nameColor = m.isPlayer ? '#44FF44' : '#FFD700';
            const t1 = this.add.text(20, y, m.name + ':', { fontSize:'8px', fontFamily:'monospace', color: nameColor });
            const t2 = this.add.text(20, y + 12, m.msg, { fontSize:'8px', fontFamily:'monospace', color:'#ccc', wordWrap:{width:230} });
            this.chatTexts.push(t1, t2);
        });
    }
}

// ============================================================
// SETTINGS - with music options
// ============================================================
class SettingsScene extends Phaser.Scene {
    constructor() { super('Settings'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        makeTitle(this, 'SETTINGS');

        // Sound toggle
        const soundBtn = this.add.text(GAME_W/2, 80, 'SOUND: '+(audio.enabled?'ON':'OFF'), {
            fontSize:'11px', fontFamily:'monospace', color:'#fff',
            backgroundColor: audio.enabled?'#336633':'#663333', padding:{x:16,y:6}
        }).setOrigin(0.5).setInteractive();
        soundBtn.on('pointerdown', () => {
            audio.enabled = !audio.enabled; audio.playClick();
            soundBtn.setText('SOUND: '+(audio.enabled?'ON':'OFF'));
            soundBtn.setBackgroundColor(audio.enabled?'#336633':'#663333');
        });

        // Music track selection
        this.add.text(GAME_W/2, 120, 'MUSIC TRACK:', { fontSize:'10px', fontFamily:'monospace', color:'#FFD700' }).setOrigin(0.5);
        const currentTrack = SaveData.get('musicTrack');
        MUSIC_TRACKS.forEach((track, i) => {
            const y = 148 + i * 32;
            const isSel = i === currentTrack;
            const bg = isSel ? '#336644' : '#333344';
            const btn = this.add.text(GAME_W/2, y, (isSel ? '> ' : '  ') + track.name + (isSel ? ' <' : ''), {
                fontSize:'10px', fontFamily:'monospace', color: isSel ? '#44FF44' : '#aaa',
                backgroundColor: bg, padding: { x: 20, y: 5 }
            }).setOrigin(0.5).setInteractive();
            btn.on('pointerdown', () => {
                SaveData.set('musicTrack', i);
                audio.stopMusic(); audio.startMusic(i);
                audio.playClick();
                this.scene.restart();
            });
        });

        // Preview music button
        makeBtn(this, GAME_W/2, 290, 'PREVIEW MUSIC', '#554488', () => {
            audio.init(); audio.resume();
            audio.startMusic(SaveData.get('musicTrack'));
        });
        makeBtn(this, GAME_W/2, 318, 'STOP MUSIC', '#443355', () => audio.stopMusic());

        // Controls info
        this.add.text(GAME_W/2, 360, 'CONTROLS:', { fontSize:'10px', fontFamily:'monospace', color:'#FFD700' }).setOrigin(0.5);
        this.add.text(GAME_W/2, 385, 'Swipe L/R = change lane\nTap/Swipe Up = jump\nESC = pause', {
            fontSize:'8px', fontFamily:'monospace', color:'#aaa', align:'center', lineSpacing:3
        }).setOrigin(0.5);

        makeBtn(this, GAME_W/2, 440, '  BACK  ', '#555566', () => { audio.stopMusic(); this.scene.start('MainMenu'); });
    }
}

// ============================================================
// HIGH SCORES
// ============================================================
class HighScoresScene extends Phaser.Scene {
    constructor() { super('HighScores'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        makeTitle(this, 'HIGH SCORES');

        // Overall best
        this.add.text(GAME_W/2, 65, 'OVERALL BEST', { fontSize:'9px', fontFamily:'monospace', color:'#888' }).setOrigin(0.5);
        this.add.text(GAME_W/2, 82, '' + (SaveData.get('highscore') || 0), { fontSize:'16px', fontFamily:'monospace', color:'#fff' }).setOrigin(0.5);

        // Per-difficulty best scores
        this.add.text(GAME_W/2, 110, 'BY DIFFICULTY', { fontSize:'9px', fontFamily:'monospace', color:'#888' }).setOrigin(0.5);
        DIFFICULTY_MODES.forEach((dm, i) => {
            const y = 130 + i * 22;
            const key = 'highscore' + dm.key.charAt(0).toUpperCase() + dm.key.slice(1);
            const val = SaveData.get(key) || 0;
            this.add.text(50, y, dm.label, { fontSize: '9px', fontFamily: 'monospace', color: dm.color });
            this.add.text(165, y, '' + val, { fontSize: '9px', fontFamily: 'monospace', color: '#ddd' });
            this.add.text(220, y, 'x' + dm.scoreMult, { fontSize: '7px', fontFamily: 'monospace', color: '#666' });
        });

        // Stats
        const stats = [
            { label: 'Total Coins', value: '$' + SaveData.get('totalCoins'), color: '#FFD700' },
            { label: 'Races Played', value: '' + SaveData.get('racesPlayed'), color: '#ccc' },
            { label: 'Race Wins', value: '' + SaveData.get('raceWins'), color: '#44FF44' },
        ];
        stats.forEach((s, i) => {
            const y = 240 + i * 40;
            this.add.text(GAME_W/2, y, s.label, { fontSize:'9px', fontFamily:'monospace', color:'#888' }).setOrigin(0.5);
            this.add.text(GAME_W/2, y + 16, s.value, { fontSize:'14px', fontFamily:'monospace', color:s.color }).setOrigin(0.5);
        });

        // Unlocked items count
        this.add.text(GAME_W/2, 370, 'Unlocked', { fontSize:'9px', fontFamily:'monospace', color:'#888' }).setOrigin(0.5);
        const uChars = SaveData.get('unlockedChars').length + '/' + CHARACTERS.length + ' chars';
        const uBoards = SaveData.get('unlockedBoards').length + '/' + BOARDS.length + ' boards';
        const uOutfits = SaveData.get('unlockedOutfits').length + '/' + OUTFITS.length + ' outfits';
        this.add.text(GAME_W/2, 388, uChars + '  ' + uBoards + '\n' + uOutfits, {
            fontSize:'8px', fontFamily:'monospace', color:'#aaa', align:'center', lineSpacing:3
        }).setOrigin(0.5);
        makeBtn(this, GAME_W/2, 440, '  BACK  ', '#555566', () => this.scene.start('MainMenu'));
    }
}

// ============================================================
// WARDROBE - Mix and match hats, tops, bottoms
// ============================================================
class WardrobeScene extends Phaser.Scene {
    constructor() { super('Wardrobe'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        makeTitle(this, 'WARDROBE');

        this.curHat = SaveData.get('selectedHat') || 0;
        this.curTop = SaveData.get('selectedTop') || 0;
        this.curBottom = SaveData.get('selectedBottom') || 0;
        this.charIdx = SaveData.get('selectedChar');
        this.boardIdx = SaveData.get('selectedBoard');

        // Preview character
        const previewKey = ensureWardrobeTexture(this, this.charIdx, this.boardIdx, this.curHat, this.curTop, this.curBottom);
        this.preview = this.add.image(GAME_W / 2, 95, previewKey).setScale(3.5);

        // Tabs
        this.tab = 0; // 0=hats, 1=tops, 2=bottoms
        const tabY = 150;
        this.tabBtns = [];
        ['HATS', 'TOPS', 'BOTTOMS'].forEach((label, i) => {
            const tx = 45 + i * 70;
            const btn = this.add.text(tx, tabY, label, {
                fontSize: '9px', fontFamily: 'monospace', color: i === 0 ? '#FFD700' : '#888',
                backgroundColor: i === 0 ? '#333355' : '#222233', padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setInteractive();
            btn.on('pointerdown', () => { audio.playClick(); this.tab = i; this._refreshTab(); });
            this.tabBtns.push(btn);
        });

        // Coins display
        this.coinsText = this.add.text(GAME_W - 10, tabY, '$' + SaveData.get('totalCoins'), {
            fontSize: '9px', fontFamily: 'monospace', color: '#FFD700'
        }).setOrigin(1, 0.5);

        // Item list area
        this.itemGroup = [];
        this._refreshTab();

        makeBtn(this, GAME_W / 2, 440, '  BACK  ', '#555566', () => this.scene.start('MainMenu'));
    }

    _refreshTab() {
        // Update tab button colors
        this.tabBtns.forEach((btn, i) => {
            btn.setColor(i === this.tab ? '#FFD700' : '#888');
            btn.setBackgroundColor(i === this.tab ? '#333355' : '#222233');
        });

        // Clear old items
        this.itemGroup.forEach(o => o.destroy());
        this.itemGroup = [];

        const items = [HATS, TOPS, BOTTOMS][this.tab];
        const unlockKey = ['unlockedHats', 'unlockedTops', 'unlockedBottoms'][this.tab];
        const selectKey = ['selectedHat', 'selectedTop', 'selectedBottom'][this.tab];
        const curVal = [this.curHat, this.curTop, this.curBottom][this.tab];
        const unlocked = SaveData.get(unlockKey) || [0];

        items.forEach((item, i) => {
            const y = 178 + i * 40;
            const isUnlocked = unlocked.includes(i);
            const isSelected = curVal === i;

            // Item background
            const bg = this.add.rectangle(GAME_W / 2, y, GAME_W - 30, 34, isSelected ? 0x334466 : 0x222244, 0.8)
                .setStrokeStyle(1, isSelected ? 0x6688CC : 0x444466);
            this.itemGroup.push(bg);

            // Mini preview of this item
            const previewKey = ensureWardrobeTexture(this, this.charIdx, this.boardIdx,
                this.tab === 0 ? i : this.curHat,
                this.tab === 1 ? i : this.curTop,
                this.tab === 2 ? i : this.curBottom);
            const miniPrev = this.add.image(30, y, previewKey).setScale(1.5);
            this.itemGroup.push(miniPrev);

            // Item name
            const nameText = this.add.text(55, y - 8, item.name, {
                fontSize: '9px', fontFamily: 'monospace', color: isSelected ? '#FFD700' : (isUnlocked ? '#ddd' : '#666')
            });
            this.itemGroup.push(nameText);

            if (isSelected) {
                const eqText = this.add.text(55, y + 5, 'EQUIPPED', {
                    fontSize: '7px', fontFamily: 'monospace', color: '#44FF44'
                });
                this.itemGroup.push(eqText);
            } else if (isUnlocked) {
                const eqBtn = this.add.text(GAME_W - 28, y, 'EQUIP', {
                    fontSize: '8px', fontFamily: 'monospace', color: '#88CCFF',
                    backgroundColor: '#334455', padding: { x: 6, y: 3 }
                }).setOrigin(1, 0.5).setInteractive();
                eqBtn.on('pointerdown', () => {
                    audio.playClick();
                    this._selectItem(this.tab, i);
                });
                this.itemGroup.push(eqBtn);
            } else {
                const costText = this.add.text(55, y + 5, '$' + item.cost, {
                    fontSize: '7px', fontFamily: 'monospace', color: '#FFD700'
                });
                this.itemGroup.push(costText);

                const coins = SaveData.get('totalCoins') || 0;
                if (coins >= item.cost) {
                    const buyBtn = this.add.text(GAME_W - 28, y, 'BUY', {
                        fontSize: '8px', fontFamily: 'monospace', color: '#88FF88',
                        backgroundColor: '#336633', padding: { x: 8, y: 3 }
                    }).setOrigin(1, 0.5).setInteractive();
                    buyBtn.on('pointerdown', () => {
                        audio.playCoin();
                        SaveData.set('totalCoins', SaveData.get('totalCoins') - item.cost);
                        const ul = SaveData.get(unlockKey);
                        ul.push(i);
                        SaveData.set(unlockKey, ul);
                        this._selectItem(this.tab, i);
                    });
                    this.itemGroup.push(buyBtn);
                } else {
                    const lockText = this.add.text(GAME_W - 28, y, 'LOCKED', {
                        fontSize: '7px', fontFamily: 'monospace', color: '#FF4444'
                    }).setOrigin(1, 0.5);
                    this.itemGroup.push(lockText);
                }
            }
        });
    }

    _selectItem(tab, idx) {
        if (tab === 0) { this.curHat = idx; SaveData.set('selectedHat', idx); }
        else if (tab === 1) { this.curTop = idx; SaveData.set('selectedTop', idx); }
        else { this.curBottom = idx; SaveData.set('selectedBottom', idx); }
        // Update preview
        const key = ensureWardrobeTexture(this, this.charIdx, this.boardIdx, this.curHat, this.curTop, this.curBottom);
        this.preview.setTexture(key);
        this.coinsText.setText('$' + SaveData.get('totalCoins'));
        this._refreshTab();
    }
}

// ============================================================
// MAIN GAME SCENE
// ============================================================
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }
    create() {
        audio.init(); audio.resume();
        this.gameState = 'playing';
        this.distance = 0; this.coins = 0; this.currentLane = 2;
        this.isJumping = false; this.isCrashed = false;

        // Difficulty mode
        this.diffModeIdx = SaveData.get('selectedDifficulty') || 1;
        this.diffMode = DIFFICULTY_MODES[this.diffModeIdx];
        this.speed = BASE_SPEED * this.diffMode.speedMult; this.baseSpeed = this.speed;
        this.activePowerup = null; this.powerupTimer = 0;
        this.invincible = false; this.magnetActive = false;
        this.spawnTimer = 0; this.spawnInterval = this.diffMode.spawnStart; this.difficultyPhase = 0;
        this.safeCooldown = 0; this.safeActive = false; this.safeTimer = 0;

        this.add.image(GAME_W/2, GAME_H/2, 'bg_sky').setScrollFactor(0);
        this.bgB1 = this.add.tileSprite(GAME_W/2, 60, GAME_W, 120, 'bg_buildings').setScrollFactor(0);
        this.bgB2 = this.add.tileSprite(GAME_W/2, 60, GAME_W, 120, 'bg_buildings').setScrollFactor(0).setAlpha(0.5).setTint(0x8888aa);
        this.roadTiles = [];
        for (let i = 0; i < 5; i++) this.roadTiles.push(this.add.image(GAME_W/2, i*160-160, 'road').setOrigin(0.5, 0));

        // Roadside buildings
        this.buildings = this.add.group();
        this.bldTypes = ['bld_shop','bld_tall','bld_house','bld_apt','bld_tree','bld_lamp','bld_grass','bld_grasslong','bld_bush','bld_grass','bld_bush'];
        this.bldSpawnTimer = 0; this.bldSpawnInterval = 0.6;
        // Pre-fill buildings on screen
        for (let y = -80; y < GAME_H + 40; y += 70) { this._spawnBuilding(y); }

        this.obstacles = this.add.group(); this.coinSprites = this.add.group(); this.powerups = this.add.group();
        this.playerShadow = this.add.image(LANE_X[2], PLAYER_Y+14, 'shadow');
        this.player = this.add.image(LANE_X[2], PLAYER_Y, getSkaterKey(this));
        this.playerTargetX = LANE_X[2]; this.playerVisualOffsetY = 0;

        this.hud = {};
        this.hud.distance = this.add.text(8,6,'0m',{fontSize:'10px',fontFamily:'monospace',color:'#fff',stroke:'#000',strokeThickness:2}).setDepth(100);
        this.hud.coins = this.add.text(GAME_W/2,6,'$0',{fontSize:'10px',fontFamily:'monospace',color:'#FFD700',stroke:'#000',strokeThickness:2}).setOrigin(0.5,0).setDepth(100);
        if(this.diffModeIdx!==1)this.add.text(8,20,this.diffMode.label,{fontSize:'7px',fontFamily:'monospace',color:this.diffMode.color,stroke:'#000',strokeThickness:1}).setDepth(100);
        this.hud.powerup = this.add.text(GAME_W/2,GAME_H-30,'',{fontSize:'9px',fontFamily:'monospace',color:'#4499FF',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(100).setVisible(false);
        this.hud.jumpBonus = this.add.text(GAME_W/2, PLAYER_Y-50, '', {fontSize:'9px',fontFamily:'monospace',color:'#44FF44',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(100).setAlpha(0);

        // Pause button - large, visible, top-right corner
        const pauseBtn = this.add.text(GAME_W - 8, 6, ' || ', {
            fontSize:'14px', fontFamily:'monospace', color:'#fff',
            backgroundColor:'#00000088', padding:{x:6,y:4}, stroke:'#888', strokeThickness:1
        }).setOrigin(1, 0).setDepth(100).setInteractive();
        pauseBtn.on('pointerdown', () => { if (this.gameState === 'playing') { this.gameState = 'paused'; this._showPause(); } });

        // Safe button - bottom-left, grants temporary invincibility
        this.safeBtn = this.add.text(8, GAME_H - 8, 'SAFE', {
            fontSize:'10px', fontFamily:'monospace', color:'#fff',
            backgroundColor:'#22668888', padding:{x:8,y:5}, stroke:'#4499FF', strokeThickness:1
        }).setOrigin(0, 1).setDepth(100).setInteractive();
        this.safeCdText = this.add.text(8, GAME_H - 32, 'READY', {
            fontSize:'7px', fontFamily:'monospace', color:'#4499FF', stroke:'#000', strokeThickness:1
        }).setOrigin(0, 1).setDepth(100);
        this.safeBtn.on('pointerdown', () => { this._activateSafe(); });

        this._setupInput();
        audio.startMusic(SaveData.get('musicTrack'));
        this._initPatterns();
    }

    _setupInput() {
        this.touchStartX = 0; this.touchStartY = 0; this.touchStartTime = 0;
        this.input.on('pointerdown', (p) => { this.touchStartX=p.x; this.touchStartY=p.y; this.touchStartTime=this.time.now; });
        this.input.on('pointerup', (p) => {
            if (this.gameState !== 'playing') return;
            const dx=p.x-this.touchStartX, dy=p.y-this.touchStartY, dist=Math.sqrt(dx*dx+dy*dy);
            const elapsed=(this.time.now-this.touchStartTime)/1000;
            if (elapsed > 0.3) return;
            const s = this.scale.width / GAME_W;
            if (dist < 10*s) this.doJump();
            else if (dist >= 25*s) { if(Math.abs(dx)>Math.abs(dy)){dx<0?this.moveLeft():this.moveRight();}else if(dy<0)this.doJump(); }
        });
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-A', () => this.moveLeft());
        this.input.keyboard.on('keydown-D', () => this.moveRight());
        this.input.keyboard.on('keydown-SPACE', () => this.doJump());
        this.input.keyboard.on('keydown-ESC', () => { if(this.gameState==='playing'){this.gameState='paused';this._showPause();} });
    }
    _initPatterns() {
        this.easyP = [
            [{lane:0,type:'cone',yOff:0}],[{lane:1,type:'trash_can',yOff:0}],[{lane:2,type:'cone',yOff:0}],
            [{lane:3,type:'trash_can',yOff:0}],[{lane:4,type:'cone',yOff:0}],
            [{lane:2,type:'pedestrian',yOff:0}],[{lane:0,type:'pedestrian',yOff:0}],[{lane:4,type:'pedestrian',yOff:0}]
        ];
        this.medP = [
            [{lane:0,type:'cone',yOff:0},{lane:1,type:'trash_can',yOff:0}],
            [{lane:2,type:'cone',yOff:0},{lane:3,type:'trash_can',yOff:0}],
            [{lane:1,type:'trash_can',yOff:0},{lane:4,type:'cone',yOff:0}],
            [{lane:0,type:'cone',yOff:0},{lane:3,type:'cone',yOff:0}],
            [{lane:1,type:'pedestrian',yOff:0}],[{lane:3,type:'pedestrian',yOff:0}],
            [{lane:2,type:'pedestrian',yOff:0},{lane:4,type:'cone',yOff:0}],
            [{lane:0,type:'trash_can',yOff:0},{lane:3,type:'pedestrian',yOff:0}],
            [{lane:1,type:'pedestrian',yOff:0},{lane:2,type:'pedestrian',yOff:-20}]
        ];
        this.hardP = [
            [{lane:0,type:'cone',yOff:0},{lane:1,type:'trash_can',yOff:0},{lane:3,type:'pothole',yOff:-40}],
            [{lane:1,type:'trash_can',yOff:0},{lane:2,type:'cone',yOff:-50},{lane:4,type:'trash_can',yOff:0}],
            [{lane:0,type:'trash_can',yOff:0},{lane:2,type:'cone',yOff:0},{lane:3,type:'trash_can',yOff:0},{lane:4,type:'pothole',yOff:-30}],
            [{lane:2,type:'pedestrian',yOff:0},{lane:0,type:'cone',yOff:0}],
            [{lane:1,type:'pedestrian',yOff:0},{lane:4,type:'trash_can',yOff:0}],
            [{lane:1,type:'pedestrian',yOff:0},{lane:3,type:'pedestrian',yOff:0},{lane:0,type:'cone',yOff:-30}],
            [{lane:0,type:'pedestrian',yOff:0},{lane:2,type:'pedestrian',yOff:-15},{lane:4,type:'trash_can',yOff:0}],
            [{lane:2,type:'pedestrian',yOff:0},{lane:3,type:'pedestrian',yOff:-25},{lane:1,type:'pothole',yOff:-40}]
        ];
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;
        const dt = delta / 1000;
        if(Phaser.Input.Keyboard.JustDown(this.cursors.left))this.moveLeft();
        if(Phaser.Input.Keyboard.JustDown(this.cursors.right))this.moveRight();
        if(Phaser.Input.Keyboard.JustDown(this.cursors.up))this.doJump();

        this.distance += this.speed * dt;
        this._updateDifficulty();
        const phaseMult = [1,1.15,1.3,1.5,1.7,2][this.difficultyPhase]||1;
        this.baseSpeed = BASE_SPEED * this.diffMode.speedMult * phaseMult;
        if (this.activePowerup !== 'speed_boost' && this.activePowerup !== 'slow_motion') this.speed = this.baseSpeed;
        if (this.activePowerup) { this.powerupTimer-=dt; this.hud.powerup.setText(this.activePowerup.toUpperCase().replace('_',' ')+' '+Math.ceil(this.powerupTimer)+'s'); if(this.powerupTimer<=0)this._deactivatePU(); }

        this.roadTiles.forEach(t=>{t.y+=this.speed*dt;if(t.y>GAME_H+160){let m=Infinity;this.roadTiles.forEach(r=>{if(r.y<m)m=r.y;});t.y=m-160;}});
        this.bgB1.tilePositionY-=this.speed*dt*0.05; this.bgB2.tilePositionY-=this.speed*dt*0.02;
        // Scroll buildings
        this.buildings.getChildren().forEach(b=>{b.y+=this.speed*dt;if(b.y>GAME_H+80)b.destroy();});
        this.bldSpawnTimer+=dt;if(this.bldSpawnTimer>=this.bldSpawnInterval){this.bldSpawnTimer=0;this._spawnBuilding(SPAWN_Y-40);this.bldSpawnInterval=0.4+Math.random()*0.5;}
        const diff=this.playerTargetX-this.player.x;
        if(Math.abs(diff)>1){this.player.x+=Math.sign(diff)*300*dt;if(Math.abs(this.playerTargetX-this.player.x)<2)this.player.x=this.playerTargetX;}
        this.player.y=PLAYER_Y+this.playerVisualOffsetY; this.playerShadow.x=this.player.x; this.playerShadow.y=PLAYER_Y+14;

        this.spawnTimer+=dt; if(this.spawnTimer>=this.spawnInterval){this.spawnTimer=0;this._spawnPattern();this.spawnInterval=Math.max(this.diffMode.spawnMin,this.diffMode.spawnStart-this.difficultyPhase*0.25);}
        if(Math.random()<0.001*dt*60) this._spawnPU();
        this.obstacles.getChildren().forEach(o=>{o.y+=this.speed*dt;if(o.y>GAME_H+60)o.destroy();if(o.getData('type')==='pedestrian'){const pedSpd=40+this.difficultyPhase*5;o.x+=o.getData('walkDir')*pedSpd*dt;if(o.x<20||o.x>GAME_W-20)o.setData('walkDir',-o.getData('walkDir'));}});
        this.coinSprites.getChildren().forEach(c=>{if(c.getData('att')&&!this.isCrashed){const dx=this.player.x-c.x,dy=this.player.y-c.y,d=Math.sqrt(dx*dx+dy*dy);if(d>2){c.x+=dx/d*400*dt;c.y+=dy/d*400*dt;}}else c.y+=this.speed*dt;if(c.y>GAME_H+30)c.destroy();c.setScale(0.8+Math.sin(time/150+c.x)*0.2,1);});
        this.powerups.getChildren().forEach(p=>{p.y+=this.speed*dt;if(p.y>GAME_H+30)p.destroy();p.setScale(1+Math.sin(time/200)*0.15);});
        if(!this.isCrashed) this._checkCollisions();
        this.hud.distance.setText(Math.floor(this.distance)+'m'); this.hud.coins.setText('$'+this.coins);

        // Safe button cooldown
        if (this.safeActive) {
            this.safeTimer -= dt;
            this.safeCdText.setText(Math.ceil(this.safeTimer) + 's');
            this.safeBtn.setBackgroundColor('#226688');
            // Flash effect while safe
            this.player.setAlpha(0.5 + Math.sin(time / 60) * 0.5);
            if (this.safeTimer <= 0) { this.safeActive = false; this.invincible = false; this.player.clearTint(); this.player.setAlpha(1); this.safeCooldown = 15; this.safeCdText.setColor('#FF4444'); }
        } else if (this.safeCooldown > 0) {
            this.safeCooldown -= dt;
            this.safeCdText.setText(Math.ceil(this.safeCooldown) + 's');
            this.safeBtn.setAlpha(0.4);
            if (this.safeCooldown <= 0) { this.safeCooldown = 0; this.safeCdText.setText('READY'); this.safeCdText.setColor('#4499FF'); this.safeBtn.setAlpha(1); }
        }
    }

    moveLeft(){if(this.isCrashed||this.currentLane<=0)return;this.currentLane--;this.playerTargetX=LANE_X[this.currentLane];audio.playSwoosh();}
    moveRight(){if(this.isCrashed||this.currentLane>=4)return;this.currentLane++;this.playerTargetX=LANE_X[this.currentLane];audio.playSwoosh();}
    _activateSafe(){if(this.safeCooldown>0||this.safeActive||this.isCrashed||this.gameState!=='playing')return;this.safeActive=true;this.safeTimer=3;this.invincible=true;this.player.setTint(0x44FFFF);audio.playPowerup();this.cameras.main.flash(200,68,153,255,false,null,this);}

    doJump(){if(this.isJumping||this.isCrashed)return;this.isJumping=true;this.jumpedOver=false;audio.playJump();this.tweens.add({targets:this,playerVisualOffsetY:-30,duration:220,ease:'Quad.easeOut',yoyo:true,hold:160,onComplete:()=>{this.playerVisualOffsetY=0;this.isJumping=false;audio.playLand();if(this.jumpedOver){var _tk=SaveData.get('unlockedTricks')||[];var _bt=_tk.length?TRICKS[Math.max.apply(null,_tk)]:null;if(_bt){this.coins+=_bt.bonus;this.hud.jumpBonus.setText(_bt.name+'! +'+_bt.bonus);this.player.angle=0;this.tweens.add({targets:this.player,angle:360,duration:340});}else{this.hud.jumpBonus.setText('+JUMP!');}this.hud.jumpBonus.setAlpha(1);this.tweens.add({targets:this.hud.jumpBonus,alpha:0,y:PLAYER_Y-80,duration:600,onComplete:()=>{this.hud.jumpBonus.y=PLAYER_Y-50;}});}}});this.tweens.add({targets:this.playerShadow,scaleX:0.4,scaleY:0.4,duration:220,ease:'Quad.easeOut',yoyo:true,hold:160});}

    _updateDifficulty(){const th=[0,500,1500,3000,5000,8000];for(let i=th.length-1;i>=0;i--)if(this.distance>=th[i]){this.difficultyPhase=i;return;}}
    _getPattern(){const adj=this.difficultyPhase-this.diffMode.patternPhase;let p=[...this.easyP];if(adj<1)p=p.filter(pat=>!pat.some(i=>i.type==='pedestrian'));if(adj>=2)p.push(...this.medP);if(adj>=4)p.push(...this.hardP);return p[Math.floor(Math.random()*p.length)];}
    _spawnPattern(){const pat=this._getPattern();const bl=new Set();pat.forEach(p=>{const tex=p.type==='pedestrian'?PED_TEXTURES[Math.floor(Math.random()*PED_TEXTURES.length)]:p.type;const o=this.add.image(LANE_X[p.lane],SPAWN_Y+p.yOff,tex);o.setData('type',p.type);if(p.type==='pedestrian')o.setData('walkDir',Math.random()>0.5?1:-1);this.obstacles.add(o);bl.add(p.lane);});for(let l=0;l<5;l++)if(!bl.has(l)&&Math.random()>0.5){const c=this.add.image(LANE_X[l],SPAWN_Y-10,'coin');c.setData('att',false);this.coinSprites.add(c);}}
    _spawnPU(){const ts=['shield','magnet','speed_boost','slow_motion'];const t=ts[Math.floor(Math.random()*ts.length)];const l=Math.floor(Math.random()*5);const p=this.add.image(LANE_X[l],SPAWN_Y,'pu_'+t);p.setData('puType',t);this.powerups.add(p);}
    _spawnBuilding(y){const type=this.bldTypes[Math.floor(Math.random()*this.bldTypes.length)];const side=Math.random()>0.5;const x=side?255:15;const b=this.add.image(x,y,type).setDepth(1);this.buildings.add(b);if(Math.random()>0.4){const x2=side?15:255;const type2=this.bldTypes[Math.floor(Math.random()*this.bldTypes.length)];const b2=this.add.image(x2,y+(Math.random()*20-10),type2).setDepth(1);this.buildings.add(b2);}}

    _checkCollisions(){const px=this.player.x,py=this.player.y;
        this.obstacles.getChildren().forEach(o=>{if(!o.active)return;const inRange=Math.abs(px-o.x)<8+o.width*0.4&&Math.abs(py-o.y)<12+o.height*0.4;if(inRange){if(this.isJumping){if(!o.getData('jumped')){o.setData('jumped',true);this.jumpedOver=true;this.distance+=10;this.coins++;audio.playCoin();o.setTint(0x44FF44);}}else if(this.invincible){this.tweens.add({targets:o,alpha:0,scaleX:2,scaleY:2,duration:200,onComplete:()=>o.destroy()});}else{this._doCrash();}}});
        this.coinSprites.getChildren().forEach(c=>{if(!c.active)return;if(Math.abs(px-c.x)<14&&Math.abs(py-c.y)<14){this.coins++;audio.playCoin();this.tweens.add({targets:c,scaleX:0,scaleY:0,duration:100,onComplete:()=>c.destroy()});}else if(this.magnetActive&&!c.getData('att')&&Math.sqrt((px-c.x)**2+(py-c.y)**2)<80)c.setData('att',true);});
        this.powerups.getChildren().forEach(p=>{if(!p.active)return;if(Math.abs(px-p.x)<14&&Math.abs(py-p.y)<14){this._activatePU(p.getData('puType'));audio.playPowerup();this.tweens.add({targets:p,scaleX:2,scaleY:2,alpha:0,duration:200,onComplete:()=>p.destroy()});}});
    }

    _activatePU(type){if(this.activePowerup)this._deactivatePU();this.activePowerup=type;const dur={shield:5,magnet:8,speed_boost:5,slow_motion:6};this.powerupTimer=dur[type]||5;this.hud.powerup.setVisible(true);const cols={shield:'#4499FF',magnet:'#FF4444',speed_boost:'#FFFF44',slow_motion:'#AA44FF'};this.hud.powerup.setColor(cols[type]||'#fff');
        switch(type){case'shield':this.invincible=true;this.player.setTint(0x4499FF);break;case'magnet':this.magnetActive=true;this.player.setTint(0xFF4444);break;case'speed_boost':this.speed=this.baseSpeed*1.5;this.player.setTint(0xFFFF44);break;case'slow_motion':this.speed=this.baseSpeed*0.5;this.player.setTint(0xAA44FF);break;}}
    _deactivatePU(){switch(this.activePowerup){case'shield':if(!this.safeActive)this.invincible=false;break;case'magnet':this.magnetActive=false;break;case'speed_boost':case'slow_motion':this.speed=this.baseSpeed;break;}if(!this.safeActive)this.player.clearTint();else this.player.setTint(0x44FFFF);this.activePowerup=null;this.hud.powerup.setVisible(false);}

    _doCrash(){if(this.isCrashed)return;this.isCrashed=true;this.gameState='gameover';audio.stopMusic();audio.playCrash();
        this.player.setTint(0xFF3333);this.tweens.add({targets:this.player,angle:90,alpha:0.5,y:this.player.y+10,duration:400});this.cameras.main.shake(300,0.01);
        this.finalScore=Math.floor(this.distance*this.diffMode.scoreMult);
        const prev=SaveData.get('highscore');const isNew=this.finalScore>prev;if(isNew)SaveData.set('highscore',this.finalScore);
        const diffKey='highscore'+this.diffMode.key.charAt(0).toUpperCase()+this.diffMode.key.slice(1);
        const prevDiff=SaveData.get(diffKey)||0;if(this.finalScore>prevDiff)SaveData.set(diffKey,this.finalScore);
        SaveData.set('totalCoins',SaveData.get('totalCoins')+this.coins);
        this.time.delayedCall(800,()=>{audio.playGameOver();this._showGameOver(isNew);});}

    _showGameOver(isNew){
        this.add.rectangle(GAME_W/2,GAME_H/2,GAME_W,GAME_H,0x000000,0.7).setDepth(200);
        const py=80;
        this.add.rectangle(GAME_W/2,py,210,130,0x222244,0.9).setDepth(201).setStrokeStyle(2,0x4444aa);
        this.add.text(GAME_W/2,py-50,'GAME OVER',{fontSize:'14px',fontFamily:'monospace',color:'#FF4444',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(202);
        if(this.diffModeIdx!==1)this.add.text(GAME_W/2,py-33,this.diffMode.label+' (x'+this.diffMode.scoreMult+')',{fontSize:'8px',fontFamily:'monospace',color:this.diffMode.color}).setOrigin(0.5).setDepth(202);
        if(isNew)this.add.text(GAME_W/2,py-20,'NEW BEST!',{fontSize:'10px',fontFamily:'monospace',color:'#FFD700'}).setOrigin(0.5).setDepth(202);
        ['Distance: '+Math.floor(this.distance)+'m','Score: '+this.finalScore,'Coins: +$'+this.coins,'Best: '+SaveData.get('highscore')].forEach((s,i)=>this.add.text(GAME_W/2,py-4+i*16,s,{fontSize:'9px',fontFamily:'monospace',color:'#ddd'}).setOrigin(0.5).setDepth(202));

        // Name entry for leaderboard
        this.add.text(GAME_W/2,160,'ENTER YOUR NAME',{fontSize:'8px',fontFamily:'monospace',color:'#FFD700'}).setOrigin(0.5).setDepth(202);
        const score=this.finalScore;
        const self=this;
        showNameInput(this,GAME_W/2,177,202,(name,inputGroup)=>{
            if(name){
                Leaderboard.submit(name,score,'skateboard',{difficulty:self.diffMode.key}).then(()=>{
                    inputGroup.forEach(o=>o.destroy());
                    self._showPostSubmitButtons();
                });
            } else {
                self._showPostSubmitButtons();
            }
        });
    }
    _showPostSubmitButtons(){
        const retBtn=this.add.text(GAME_W/2,GAME_H-70,'  RETRY  ',{fontSize:'12px',fontFamily:'monospace',color:'#fff',backgroundColor:'#3366CC',padding:{x:20,y:8}}).setOrigin(0.5).setDepth(202).setInteractive();
        const menuBtn=this.add.text(GAME_W/2,GAME_H-35,'  MENU  ',{fontSize:'12px',fontFamily:'monospace',color:'#fff',backgroundColor:'#555566',padding:{x:20,y:8}}).setOrigin(0.5).setDepth(202).setInteractive();
        retBtn.on('pointerdown',()=>{audio.playClick();this.scene.restart();});
        menuBtn.on('pointerdown',()=>{audio.playClick();this.scene.start('MainMenu');});
    }
    _showPause(){
        this.pauseGroup=[];
        const overlay=this.add.rectangle(GAME_W/2,GAME_H/2,GAME_W,GAME_H,0x000000,0.6).setDepth(300);
        const title=this.add.text(GAME_W/2,GAME_H/2-30,'PAUSED',{fontSize:'16px',fontFamily:'monospace',color:'#fff'}).setOrigin(0.5).setDepth(301);
        const resumeBtn=this.add.text(GAME_W/2,GAME_H/2+10,'RESUME',{fontSize:'12px',fontFamily:'monospace',color:'#fff',backgroundColor:'#3366CC',padding:{x:20,y:8}}).setOrigin(0.5).setDepth(301).setInteractive();
        const quitBtn=this.add.text(GAME_W/2,GAME_H/2+50,'QUIT',{fontSize:'12px',fontFamily:'monospace',color:'#fff',backgroundColor:'#663333',padding:{x:20,y:8}}).setOrigin(0.5).setDepth(301).setInteractive();
        this.pauseGroup.push(overlay,title,resumeBtn,quitBtn);
        resumeBtn.on('pointerdown',()=>{audio.playClick();this.pauseGroup.forEach(o=>o.destroy());this.gameState='playing';});
        quitBtn.on('pointerdown',()=>{audio.playClick();audio.stopMusic();this.scene.start('MainMenu');});
    }
}

// ============================================================
// RACE MODE
// ============================================================
class RaceScene extends Phaser.Scene {
    constructor() { super('Race'); }
    create() {
        audio.init(); audio.resume();
        this.gameState = 'playing'; this.distance = 0; this.coins = 0;
        this.currentLane = 2; this.isJumping = false; this.isCrashed = false;
        this.speed = BASE_SPEED * 1.2; this.baseSpeed = BASE_SPEED * 1.2;
        this.activePowerup = null; this.powerupTimer = 0;
        this.invincible = false; this.magnetActive = false;
        this.spawnTimer = 0; this.spawnInterval = 1.8; this.difficultyPhase = 0;
        this.playerVisualOffsetY = 0;
        this.safeCooldown = 0; this.safeActive = false; this.safeTimer = 0;

        // BG
        this.add.image(GAME_W/2, GAME_H/2, 'bg_sky');
        this.bgB1 = this.add.tileSprite(GAME_W/2,60,GAME_W,120,'bg_buildings');
        this.roadTiles = [];
        for(let i=0;i<5;i++) this.roadTiles.push(this.add.image(GAME_W/2,i*160-160,'road').setOrigin(0.5,0));

        // Roadside buildings
        this.buildings = this.add.group();
        this.bldTypes = ['bld_shop','bld_tall','bld_house','bld_apt','bld_tree','bld_lamp','bld_grass','bld_grasslong','bld_bush','bld_grass','bld_bush'];
        this.bldSpawnTimer = 0; this.bldSpawnInterval = 0.6;
        for (let y = -80; y < GAME_H + 40; y += 70) { this._spawnBuilding(y); }

        this.obstacles = this.add.group(); this.coinSprites = this.add.group(); this.powerups = this.add.group();

        // AI Racers - 15 opponents, each has different skill level
        this.aiRacers = [];
        const aiSkills = [
            { name:'Red', reaction:130, dodgeChance:0.80, jumpChance:0.75, lookAhead:130 },
            { name:'Green', reaction:110, dodgeChance:0.88, jumpChance:0.82, lookAhead:150 },
            { name:'Blue', reaction:100, dodgeChance:0.85, jumpChance:0.85, lookAhead:145 },
            { name:'Yellow', reaction:85, dodgeChance:0.93, jumpChance:0.90, lookAhead:170 },
            { name:'Pink', reaction:120, dodgeChance:0.82, jumpChance:0.78, lookAhead:135 },
            { name:'Orange', reaction:95, dodgeChance:0.90, jumpChance:0.88, lookAhead:160 },
            { name:'Cyan', reaction:90, dodgeChance:0.91, jumpChance:0.87, lookAhead:155 },
            { name:'Lime', reaction:75, dodgeChance:0.95, jumpChance:0.93, lookAhead:185 },
            { name:'Purple', reaction:105, dodgeChance:0.86, jumpChance:0.83, lookAhead:148 },
            { name:'Peach', reaction:115, dodgeChance:0.84, jumpChance:0.80, lookAhead:140 },
            { name:'Sky', reaction:98, dodgeChance:0.89, jumpChance:0.86, lookAhead:152 },
            { name:'Gold', reaction:80, dodgeChance:0.94, jumpChance:0.91, lookAhead:175 },
            { name:'Mint', reaction:112, dodgeChance:0.87, jumpChance:0.81, lookAhead:142 },
            { name:'Violet', reaction:88, dodgeChance:0.92, jumpChance:0.89, lookAhead:165 },
            { name:'Rose', reaction:108, dodgeChance:0.85, jumpChance:0.82, lookAhead:146 },
        ];
        for (let i = 0; i < 15; i++) {
            const sk = aiSkills[i];
            const startLane = i % 5;
            const startY = PLAYER_Y - 50 - i * 18;
            const ai = {
                sprite: this.add.image(LANE_X[startLane], startY, 'ai_racer_' + i),
                lane: startLane, targetX: LANE_X[startLane], alive: true,
                moveTimer: 0.3 + Math.random() * 0.8, jumpTimer: 0,
                isJumping: false, visualOffsetY: 0, name: sk.name,
                shadow: this.add.image(LANE_X[startLane], startY+14, 'shadow').setAlpha(0.3),
                reaction: sk.reaction, dodgeChance: sk.dodgeChance,
                jumpChance: sk.jumpChance, lookAhead: sk.lookAhead,
                lastDodgeTime: 0, dodgeCooldown: 0.3,
            };
            this.aiRacers.push(ai);
        }

        // Player
        this.playerShadow = this.add.image(LANE_X[2], PLAYER_Y+14, 'shadow');
        this.player = this.add.image(LANE_X[2], PLAYER_Y, getSkaterKey(this));
        this.playerTargetX = LANE_X[2];

        // HUD
        this.hud = {};
        this.hud.distance = this.add.text(8,6,'0m',{fontSize:'10px',fontFamily:'monospace',color:'#fff',stroke:'#000',strokeThickness:2}).setDepth(100);
        this.hud.position = this.add.text(GAME_W/2,6,'#1',{fontSize:'12px',fontFamily:'monospace',color:'#FFD700',stroke:'#000',strokeThickness:2}).setOrigin(0.5,0).setDepth(100);
        this.hud.alive = this.add.text(GAME_W/2,22,'',{fontSize:'8px',fontFamily:'monospace',color:'#aaa',stroke:'#000',strokeThickness:1}).setOrigin(0.5).setDepth(100);

        // Pause button
        const pauseBtn = this.add.text(GAME_W - 8, 6, ' || ', {
            fontSize:'14px', fontFamily:'monospace', color:'#fff',
            backgroundColor:'#00000088', padding:{x:6,y:4}, stroke:'#888', strokeThickness:1
        }).setOrigin(1, 0).setDepth(100).setInteractive();
        pauseBtn.on('pointerdown', () => { if (this.gameState === 'playing') { this.gameState = 'paused'; this._showPause(); } });

        // Safe button
        this.safeBtn = this.add.text(8, GAME_H - 8, 'SAFE', {
            fontSize:'10px', fontFamily:'monospace', color:'#fff',
            backgroundColor:'#22668888', padding:{x:8,y:5}, stroke:'#4499FF', strokeThickness:1
        }).setOrigin(0, 1).setDepth(100).setInteractive();
        this.safeCdText = this.add.text(8, GAME_H - 32, 'READY', {
            fontSize:'7px', fontFamily:'monospace', color:'#4499FF', stroke:'#000', strokeThickness:1
        }).setOrigin(0, 1).setDepth(100);
        this.safeBtn.on('pointerdown', () => { this._activateSafe(); });

        // Input
        this.touchStartX=0;this.touchStartY=0;this.touchStartTime=0;
        this.input.on('pointerdown',(p)=>{this.touchStartX=p.x;this.touchStartY=p.y;this.touchStartTime=this.time.now;});
        this.input.on('pointerup',(p)=>{if(this.gameState!=='playing')return;const dx=p.x-this.touchStartX,dy=p.y-this.touchStartY,dist=Math.sqrt(dx*dx+dy*dy),elapsed=(this.time.now-this.touchStartTime)/1000;if(elapsed>0.3)return;const s=this.scale.width/GAME_W;if(dist<10*s)this.doJump();else if(dist>=25*s){if(Math.abs(dx)>Math.abs(dy)){dx<0?this.moveLeft():this.moveRight();}else if(dy<0)this.doJump();}});
        this.cursors=this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-A',()=>this.moveLeft());
        this.input.keyboard.on('keydown-D',()=>this.moveRight());
        this.input.keyboard.on('keydown-SPACE',()=>this.doJump());
        this.input.keyboard.on('keydown-ESC', () => { if(this.gameState==='playing'){this.gameState='paused';this._showPause();} });

        audio.startMusic(SaveData.get('musicTrack'));

        this.easyP=[[{lane:0,type:'cone',yOff:0}],[{lane:1,type:'trash_can',yOff:0}],[{lane:2,type:'cone',yOff:0}],[{lane:3,type:'trash_can',yOff:0}],[{lane:4,type:'cone',yOff:0}],[{lane:2,type:'pedestrian',yOff:0}]];
        this.medP=[[{lane:0,type:'cone',yOff:0},{lane:2,type:'trash_can',yOff:0}],[{lane:1,type:'cone',yOff:0},{lane:3,type:'trash_can',yOff:0}],[{lane:0,type:'trash_can',yOff:0},{lane:4,type:'cone',yOff:0}],[{lane:1,type:'cone',yOff:0},{lane:2,type:'trash_can',yOff:0},{lane:4,type:'cone',yOff:0}],[{lane:1,type:'pedestrian',yOff:0},{lane:3,type:'pedestrian',yOff:0}]];
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;
        const dt = delta / 1000;
        if(Phaser.Input.Keyboard.JustDown(this.cursors.left))this.moveLeft();
        if(Phaser.Input.Keyboard.JustDown(this.cursors.right))this.moveRight();
        if(Phaser.Input.Keyboard.JustDown(this.cursors.up))this.doJump();

        this.distance += this.speed * dt;
        this.difficultyPhase = Math.min(5, Math.floor(this.distance / 800));
        this.baseSpeed = BASE_SPEED * 1.2 + this.difficultyPhase * 8;
        this.speed = this.baseSpeed;

        // Scroll
        this.roadTiles.forEach(t=>{t.y+=this.speed*dt;if(t.y>GAME_H+160){let m=Infinity;this.roadTiles.forEach(r=>{if(r.y<m)m=r.y;});t.y=m-160;}});
        this.bgB1.tilePositionY -= this.speed * dt * 0.05;
        // Scroll buildings
        this.buildings.getChildren().forEach(b=>{b.y+=this.speed*dt;if(b.y>GAME_H+80)b.destroy();});
        this.bldSpawnTimer+=dt;if(this.bldSpawnTimer>=this.bldSpawnInterval){this.bldSpawnTimer=0;this._spawnBuilding(SPAWN_Y-40);this.bldSpawnInterval=0.4+Math.random()*0.5;}

        // Player movement
        const diff=this.playerTargetX-this.player.x;
        if(Math.abs(diff)>1)this.player.x+=Math.sign(diff)*300*dt;
        this.player.y = PLAYER_Y + this.playerVisualOffsetY;
        this.playerShadow.x=this.player.x; this.playerShadow.y=PLAYER_Y+14;

        // AI movement - smart obstacle avoidance
        this.aiRacers.forEach((ai, idx) => {
            if (!ai.alive) return;
            ai.moveTimer -= dt;
            ai.lastDodgeTime += dt;
            const baseY = ai.sprite.getData('baseY') || (PLAYER_Y - 80 - idx * 30);
            if (!ai.sprite.getData('baseY')) ai.sprite.setData('baseY', baseY);

            // Scan for obstacles ahead of this AI
            const myX = ai.sprite.x;
            let threatInLane = false;
            let nearestThreatDist = 999;
            let threatLanes = [false, false, false, false, false]; // which lanes have obstacles nearby
            this.obstacles.getChildren().forEach(o => {
                if (!o.active) return;
                const oy = o.y;
                const distY = baseY - oy; // positive = obstacle above (coming toward AI)
                if (distY > 0 && distY < ai.lookAhead) {
                    // Figure out which lane this obstacle is in
                    for (let l = 0; l < 5; l++) {
                        if (Math.abs(o.x - LANE_X[l]) < 20) { threatLanes[l] = true; }
                    }
                    // Is it in MY lane?
                    if (Math.abs(o.x - LANE_X[ai.lane]) < 20 && distY < nearestThreatDist) {
                        threatInLane = true;
                        nearestThreatDist = distY;
                    }
                }
            });

            // Decision: dodge or jump when obstacle is close
            if (threatInLane && ai.lastDodgeTime > ai.dodgeCooldown && ai.moveTimer <= 0) {
                // Obstacle in my lane! React based on distance
                const reactDist = ai.reaction; // closer = harder to react
                if (nearestThreatDist < reactDist) {
                    // Try to dodge to a safe lane
                    if (Math.random() < ai.dodgeChance) {
                        // Find safe lanes
                        const safeLanes = [];
                        for (let l = 0; l < 5; l++) {
                            if (!threatLanes[l]) safeLanes.push(l);
                        }
                        if (safeLanes.length > 0) {
                            // Pick closest safe lane
                            safeLanes.sort((a, b) => Math.abs(a - ai.lane) - Math.abs(b - ai.lane));
                            ai.lane = safeLanes[0];
                            ai.targetX = LANE_X[ai.lane];
                            ai.lastDodgeTime = 0;
                            ai.moveTimer = 0.2 + Math.random() * 0.3;
                        } else if (!ai.isJumping && Math.random() < ai.jumpChance) {
                            // All lanes blocked - jump!
                            ai.isJumping = true;
                            this.tweens.add({ targets: ai, visualOffsetY: -25, duration: 200, ease:'Quad.easeOut', yoyo:true, hold:140, onComplete:()=>{ai.isJumping=false;ai.visualOffsetY=0;} });
                            ai.moveTimer = 0.3;
                        }
                    } else if (!ai.isJumping && Math.random() < ai.jumpChance * 0.5) {
                        // Failed dodge check but might jump anyway
                        ai.isJumping = true;
                        this.tweens.add({ targets: ai, visualOffsetY: -25, duration: 200, ease:'Quad.easeOut', yoyo:true, hold:140, onComplete:()=>{ai.isJumping=false;ai.visualOffsetY=0;} });
                    }
                }
            }

            // Occasional random lane drift to look more natural
            if (ai.moveTimer <= 0 && !threatInLane && Math.random() < 0.15) {
                ai.moveTimer = 1.0 + Math.random() * 1.5;
                const adj = ai.lane + (Math.random() > 0.5 ? 1 : -1);
                if (adj >= 0 && adj <= 4 && !threatLanes[adj]) {
                    ai.lane = adj;
                    ai.targetX = LANE_X[ai.lane];
                }
            }

            const adiff = ai.targetX - ai.sprite.x;
            if (Math.abs(adiff) > 1) ai.sprite.x += Math.sign(adiff) * 300 * dt;
            ai.sprite.y = baseY + ai.visualOffsetY;
            ai.shadow.x = ai.sprite.x;
            ai.shadow.y = baseY + 14;
        });

        // Spawn obstacles
        this.spawnTimer+=dt;
        if(this.spawnTimer>=this.spawnInterval){
            this.spawnTimer=0;
            let pool=[...this.easyP];if(this.difficultyPhase>=2)pool.push(...this.medP);
            const pat=pool[Math.floor(Math.random()*pool.length)];
            const bl=new Set();
            pat.forEach(p=>{const tex=p.type==='pedestrian'?PED_TEXTURES[Math.floor(Math.random()*PED_TEXTURES.length)]:p.type;const o=this.add.image(LANE_X[p.lane],SPAWN_Y+p.yOff,tex);o.setData('type',p.type);if(p.type==='pedestrian')o.setData('walkDir',Math.random()>0.5?1:-1);this.obstacles.add(o);bl.add(p.lane);});
            this.spawnInterval=Math.max(0.8, 1.8-this.difficultyPhase*0.15);
        }

        // Move obstacles
        this.obstacles.getChildren().forEach(o=>{
            o.y+=this.speed*dt;
            // Check AI collision
            this.aiRacers.forEach(ai => {
                if (!ai.alive || ai.isJumping) return;
                if (Math.abs(ai.sprite.x - o.x) < 15 && Math.abs(ai.sprite.y - o.y) < 18) {
                    ai.alive = false;
                    ai.sprite.setTint(0xFF3333);
                    this.tweens.add({ targets: ai.sprite, alpha: 0.3, angle: 90, duration: 400 });
                    ai.shadow.setAlpha(0);
                }
            });
            if(o.y>GAME_H+60)o.destroy();
            if(o.getData('type')==='pedestrian'){const pedSpd=40+this.difficultyPhase*5;o.x+=o.getData('walkDir')*pedSpd*dt;if(o.x<20||o.x>GAME_W-20)o.setData('walkDir',-o.getData('walkDir'));}
        });

        // Check player collision
        if (!this.isCrashed && !this.isJumping) {
            this.obstacles.getChildren().forEach(o=>{
                if(!o.active)return;
                if(Math.abs(this.player.x-o.x)<8+o.width*0.4&&Math.abs(this.player.y-o.y)<12+o.height*0.4){
                    if(this.safeActive){this.tweens.add({targets:o,alpha:0,scaleX:2,scaleY:2,duration:200,onComplete:()=>o.destroy()});}
                    else{this._doCrash();}
                }
            });
        }

        // Safe button cooldown
        if (this.safeActive) {
            this.safeTimer -= dt;
            this.safeCdText.setText(Math.ceil(this.safeTimer) + 's');
            this.safeBtn.setBackgroundColor('#226688');
            this.player.setAlpha(0.5 + Math.sin(time / 60) * 0.5);
            if (this.safeTimer <= 0) { this.safeActive = false; this.player.clearTint(); this.player.setAlpha(1); this.safeCooldown = 15; this.safeCdText.setColor('#FF4444'); }
        } else if (this.safeCooldown > 0) {
            this.safeCooldown -= dt;
            this.safeCdText.setText(Math.ceil(this.safeCooldown) + 's');
            this.safeBtn.setAlpha(0.4);
            if (this.safeCooldown <= 0) { this.safeCooldown = 0; this.safeCdText.setText('READY'); this.safeCdText.setColor('#4499FF'); this.safeBtn.setAlpha(1); }
        }

        // Count alive
        const aliveAI = this.aiRacers.filter(a => a.alive).length;
        const totalRacers = 16;
        const crashed = totalRacers - aliveAI - (this.isCrashed ? 0 : 1);
        this.hud.distance.setText(Math.floor(this.distance)+'m');
        this.hud.position.setText('#' + Math.max(1, totalRacers - crashed - aliveAI + (this.isCrashed ? 0 : 1)));
        this.hud.alive.setText('Racers: ' + (aliveAI + (this.isCrashed ? 0 : 1)) + '/' + totalRacers);

        // Check win condition
        if (aliveAI === 0 && !this.isCrashed) {
            this.gameState = 'won';
            audio.stopMusic(); audio.playWin();
            SaveData.set('racesPlayed', SaveData.get('racesPlayed') + 1);
            SaveData.set('raceWins', SaveData.get('raceWins') + 1);
            SaveData.set('totalCoins', SaveData.get('totalCoins') + 50);
            this.time.delayedCall(500, () => this._showRaceEnd(true));
        }
    }

    moveLeft(){if(this.isCrashed||this.currentLane<=0)return;this.currentLane--;this.playerTargetX=LANE_X[this.currentLane];audio.playSwoosh();}
    moveRight(){if(this.isCrashed||this.currentLane>=4)return;this.currentLane++;this.playerTargetX=LANE_X[this.currentLane];audio.playSwoosh();}
    doJump(){if(this.isJumping||this.isCrashed)return;this.isJumping=true;audio.playJump();this.tweens.add({targets:this,playerVisualOffsetY:-30,duration:220,ease:'Quad.easeOut',yoyo:true,hold:160,onComplete:()=>{this.playerVisualOffsetY=0;this.isJumping=false;audio.playLand();}});this.tweens.add({targets:this.playerShadow,scaleX:0.4,scaleY:0.4,duration:220,yoyo:true,hold:160});}

    _activateSafe(){if(this.safeCooldown>0||this.safeActive||this.isCrashed||this.gameState!=='playing')return;this.safeActive=true;this.safeTimer=3;this.player.setTint(0x44FFFF);audio.playPowerup();this.cameras.main.flash(200,68,153,255,false,null,this);}
    _spawnBuilding(y){const type=this.bldTypes[Math.floor(Math.random()*this.bldTypes.length)];const side=Math.random()>0.5;const x=side?255:15;const b=this.add.image(x,y,type).setDepth(1);this.buildings.add(b);if(Math.random()>0.4){const x2=side?15:255;const type2=this.bldTypes[Math.floor(Math.random()*this.bldTypes.length)];const b2=this.add.image(x2,y+(Math.random()*20-10),type2).setDepth(1);this.buildings.add(b2);}}

    _doCrash(){if(this.isCrashed)return;this.isCrashed=true;this.gameState='gameover';audio.stopMusic();audio.playCrash();
        this.player.setTint(0xFF3333);this.tweens.add({targets:this.player,angle:90,alpha:0.5,duration:400});this.cameras.main.shake(300,0.01);
        SaveData.set('racesPlayed',SaveData.get('racesPlayed')+1);
        this.time.delayedCall(800,()=>{audio.playGameOver();this._showRaceEnd(false);});}

    _showPause(){
        this.pauseGroup=[];
        const overlay=this.add.rectangle(GAME_W/2,GAME_H/2,GAME_W,GAME_H,0x000000,0.6).setDepth(300);
        const title=this.add.text(GAME_W/2,GAME_H/2-30,'PAUSED',{fontSize:'16px',fontFamily:'monospace',color:'#fff'}).setOrigin(0.5).setDepth(301);
        const resumeBtn=this.add.text(GAME_W/2,GAME_H/2+10,'RESUME',{fontSize:'12px',fontFamily:'monospace',color:'#fff',backgroundColor:'#3366CC',padding:{x:20,y:8}}).setOrigin(0.5).setDepth(301).setInteractive();
        const quitBtn=this.add.text(GAME_W/2,GAME_H/2+50,'QUIT',{fontSize:'12px',fontFamily:'monospace',color:'#fff',backgroundColor:'#663333',padding:{x:20,y:8}}).setOrigin(0.5).setDepth(301).setInteractive();
        this.pauseGroup.push(overlay,title,resumeBtn,quitBtn);
        resumeBtn.on('pointerdown',()=>{audio.playClick();this.pauseGroup.forEach(o=>o.destroy());this.gameState='playing';});
        quitBtn.on('pointerdown',()=>{audio.playClick();audio.stopMusic();this.scene.start('MainMenu');});
    }

    _showRaceEnd(won) {
        this.add.rectangle(GAME_W/2,GAME_H/2,GAME_W,GAME_H,0x000000,0.7).setDepth(200);
        const py=70;
        this.add.rectangle(GAME_W/2,py,210,100,0x222244,0.9).setDepth(201).setStrokeStyle(2,won?0x44aa44:0x4444aa);
        this.add.text(GAME_W/2,py-35,won?'YOU WIN!':'CRASHED!',{fontSize:'16px',fontFamily:'monospace',color:won?'#44FF44':'#FF4444',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(202);
        this.add.text(GAME_W/2,py-10,'Distance: '+Math.floor(this.distance)+'m',{fontSize:'10px',fontFamily:'monospace',color:'#ddd'}).setOrigin(0.5).setDepth(202);
        if(won) this.add.text(GAME_W/2,py+8,'+40 coins!',{fontSize:'10px',fontFamily:'monospace',color:'#FFD700'}).setOrigin(0.5).setDepth(202);
        const aliveAI=this.aiRacers.filter(a=>a.alive).length;
        const deadAI=10-aliveAI;
        this.add.text(GAME_W/2,py+25,'Position: #'+(won?1:Math.max(2,11-deadAI)),{fontSize:'10px',fontFamily:'monospace',color:'#aaa'}).setOrigin(0.5).setDepth(202);

        // Name entry for leaderboard
        this.add.text(GAME_W/2,140,'ENTER YOUR NAME',{fontSize:'8px',fontFamily:'monospace',color:'#FFD700'}).setOrigin(0.5).setDepth(202);
        const score=Math.floor(this.distance);
        const self=this;
        showNameInput(this,GAME_W/2,157,202,(name,inputGroup)=>{
            if(name){
                Leaderboard.submit(name,score,'skateboard',{mode:'race'}).then(()=>{
                    inputGroup.forEach(o=>o.destroy());
                    self._showRacePostButtons();
                });
            } else {
                self._showRacePostButtons();
            }
        });
    }
    _showRacePostButtons(){
        const retBtn=this.add.text(GAME_W/2,GAME_H-70,'  RACE AGAIN  ',{fontSize:'11px',fontFamily:'monospace',color:'#fff',backgroundColor:'#CC6633',padding:{x:16,y:7}}).setOrigin(0.5).setDepth(202).setInteractive();
        const menuBtn=this.add.text(GAME_W/2,GAME_H-35,'  MENU  ',{fontSize:'11px',fontFamily:'monospace',color:'#fff',backgroundColor:'#555566',padding:{x:16,y:7}}).setOrigin(0.5).setDepth(202).setInteractive();
        retBtn.on('pointerdown',()=>{audio.playClick();this.scene.restart();});
        menuBtn.on('pointerdown',()=>{audio.playClick();this.scene.start('MainMenu');});
    }
}

// CONFIG moved to launcher.js
