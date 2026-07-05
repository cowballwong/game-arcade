// ============================================================
// GAME ARCADE LAUNCHER
// Game selection screen + Leaderboard + Phaser config
// ============================================================

// ============================================================
// LAUNCHER SCENE
// ============================================================
class LauncherScene extends Phaser.Scene {
    constructor() { super('Launcher'); }

    create() {
        audio.init();
        audio.stopMusic();
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Background gradient
        const bgG = this.add.graphics();
        for (let y = 0; y < GAME_H; y++) {
            const t = y / GAME_H;
            const r = Math.floor(15 + t * 15);
            const gv = Math.floor(15 + t * 20);
            const b = Math.floor(35 + t * 25);
            bgG.fillStyle(Phaser.Display.Color.GetColor(r, gv, b));
            bgG.fillRect(0, y, GAME_W, 1);
        }

        // Decorative stars
        const starG = this.add.graphics();
        for (let i = 0; i < 30; i++) {
            const sx = Math.random() * GAME_W;
            const sy = Math.random() * GAME_H;
            const alpha = 0.3 + Math.random() * 0.7;
            starG.fillStyle(0xFFFFFF, alpha);
            starG.fillRect(sx, sy, 1, 1);
            if (Math.random() < 0.3) {
                starG.fillRect(sx - 1, sy, 3, 1);
                starG.fillRect(sx, sy - 1, 1, 3);
            }
        }

        // Title
        this.add.text(GAME_W / 2, 30, 'GAME ARCADE', {
            fontSize: '18px', fontFamily: 'monospace', color: '#FFD700',
            align: 'center', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        // ---- Leaderboard section ----
        this.add.text(GAME_W / 2, 55, 'LEADERBOARD', {
            fontSize: '9px', fontFamily: 'monospace', color: '#FFD700'
        }).setOrigin(0.5);

        // Leaderboard panel background
        const lbG = this.add.graphics();
        lbG.fillStyle(0x111122, 0.8);
        lbG.fillRect(10, 65, GAME_W - 20, 155);
        lbG.lineStyle(1, 0x4444aa, 0.6);
        lbG.strokeRect(10, 65, GAME_W - 20, 155);

        // Column headers
        this.add.text(22, 70, '#', { fontSize: '7px', fontFamily: 'monospace', color: '#888' });
        this.add.text(34, 70, 'NAME', { fontSize: '7px', fontFamily: 'monospace', color: '#888' });
        this.add.text(130, 70, 'SCORE', { fontSize: '7px', fontFamily: 'monospace', color: '#888' });
        this.add.text(175, 70, 'GAME', { fontSize: '7px', fontFamily: 'monospace', color: '#888' });
        this.add.text(225, 70, 'DATE', { fontSize: '7px', fontFamily: 'monospace', color: '#888' });

        // Separator line
        const sepG = this.add.graphics();
        sepG.lineStyle(1, 0x444466, 0.5);
        sepG.lineBetween(15, 80, GAME_W - 15, 80);

        // Loading text (will be replaced when data arrives)
        this.loadingText = this.add.text(GAME_W / 2, 145, 'Loading...', {
            fontSize: '8px', fontFamily: 'monospace', color: '#666'
        }).setOrigin(0.5);

        this.lbTexts = [];
        this._fetchLeaderboard();

        // ---- Game cards (compact) ----
        this._drawGameCard(256, 'SKATEBOARD JUMPS', 0x3366CC, 'Endless runner on a motorway!', () => {
            this.scene.start('MainMenu');
        }, 'skateboard');

        this._drawGameCard(316, 'JUMP TO THE TOP', 0x33AA66, 'Bounce your way up to the sky!', () => {
            this.scene.start('JTTBoot');
        }, 'jumptotop');

        this._drawGameCard(376, 'SKATE 3D  ⭐NEW', 0xFF6633, 'Skate in full 3D! Made by Asher', () => {
            window.location.href = 'skate3d.html';
        }, 'skateboard');

        // Footer
        this.add.text(GAME_W / 2, 424, 'TOTAL COINS: $' + (SaveData.get('totalCoins') || 0), {
            fontSize: '9px', fontFamily: 'monospace', color: '#FFD700'
        }).setOrigin(0.5);

        this.add.text(GAME_W / 2, 438, 'v1.2', {
            fontSize: '7px', fontFamily: 'monospace', color: '#444'
        }).setOrigin(0.5);
    }

    async _fetchLeaderboard() {
        // Leaderboard is now Firestore-backed (see shared.js) — always available.
        const scores = await Leaderboard.fetch();
        if (this.loadingText) this.loadingText.destroy();

        if (!scores || scores.length === 0) {
            this.add.text(GAME_W / 2, 145, 'No scores yet!\nPlay a game to get on the board!', {
                fontSize: '8px', fontFamily: 'monospace', color: '#666', align: 'center'
            }).setOrigin(0.5);
            return;
        }

        const top10 = scores.slice(0, 10);
        top10.forEach((entry, i) => {
            const rowY = 85 + i * 13;
            const rankCol = i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : '#777';
            const nameStr = (entry.name || '???').substring(0, 10);
            const scoreStr = String(entry.score || 0);
            const gameStr = entry.game === 'skateboard' ? 'SK8' : entry.game === 'jumptotop' ? 'JTT' : entry.game === 'skate3d' ? '3D' : '???';
            const dateStr = entry.date ? entry.date.slice(0, 10).substring(5) : '';

            this.add.text(22, rowY, (i + 1) + '.', { fontSize: '7px', fontFamily: 'monospace', color: rankCol });
            this.add.text(34, rowY, nameStr, { fontSize: '7px', fontFamily: 'monospace', color: '#ddd' });
            this.add.text(130, rowY, scoreStr, { fontSize: '7px', fontFamily: 'monospace', color: '#88CCFF' });
            this.add.text(175, rowY, gameStr, { fontSize: '7px', fontFamily: 'monospace', color: '#aaa' });
            this.add.text(225, rowY, dateStr, { fontSize: '7px', fontFamily: 'monospace', color: '#666' });
        });
    }

    _drawGameCard(y, title, color, subtitle, onClick, gameType) {
        const cardX = 15;
        const cardW = GAME_W - 30;
        const cardH = 55;
        const cardTop = y - cardH / 2;

        // Card background
        const card = this.add.graphics();
        card.fillStyle(color, 0.2);
        card.fillRect(cardX, cardTop, cardW, cardH);
        card.lineStyle(2, color, 0.7);
        card.strokeRect(cardX, cardTop, cardW, cardH);

        // Game icon (left side, compact)
        const iconG = this.add.graphics();
        if (gameType === 'skateboard') {
            iconG.fillStyle(0x333340); iconG.fillRect(25, y - 15, 30, 30);
            iconG.fillStyle(0xCCCCCC); iconG.fillRect(33, y - 15, 1, 30); iconG.fillRect(47, y - 15, 1, 30);
            iconG.fillStyle(0xFFCC99); iconG.fillRect(37, y - 3, 5, 4);
            iconG.fillStyle(0x3366CC); iconG.fillRect(36, y + 1, 7, 7);
            iconG.fillStyle(0x8B4513); iconG.fillRect(34, y + 9, 11, 2);
            iconG.fillStyle(0x444444); iconG.fillRect(35, y + 11, 2, 2); iconG.fillRect(42, y + 11, 2, 2);
        } else {
            iconG.fillStyle(0x44AA44); iconG.fillRect(25, y + 8, 30, 5);
            iconG.fillStyle(0x33AA33); iconG.fillRect(30, y, 16, 4);
            iconG.fillStyle(0x6B4A2A); iconG.fillRect(33, y - 8, 12, 3);
            iconG.fillStyle(0xDDDDEE); iconG.fillRect(28, y - 15, 18, 4);
            iconG.fillStyle(0xFFCC99); iconG.fillRect(38, y - 22, 5, 4);
            iconG.fillStyle(0x3366CC); iconG.fillRect(37, y - 18, 7, 6);
        }

        // Title text
        this.add.text(62, y - 12, title, {
            fontSize: '10px', fontFamily: 'monospace', color: '#fff'
        });

        // Subtitle
        this.add.text(62, y + 3, subtitle, {
            fontSize: '7px', fontFamily: 'monospace', color: '#aaa'
        });

        // Play indicator
        this.add.text(GAME_W - 28, y, '>', {
            fontSize: '14px', fontFamily: 'monospace', color: color === 0x3366CC ? '#6699FF' : '#66DD99'
        }).setOrigin(0.5);

        // Clickable area
        const hitArea = this.add.rectangle(GAME_W / 2, y, cardW, cardH, 0xffffff, 0)
            .setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            card.clear();
            card.fillStyle(color, 0.4);
            card.fillRect(cardX, cardTop, cardW, cardH);
            card.lineStyle(2, color, 1);
            card.strokeRect(cardX, cardTop, cardW, cardH);
        });

        hitArea.on('pointerout', () => {
            card.clear();
            card.fillStyle(color, 0.2);
            card.fillRect(cardX, cardTop, cardW, cardH);
            card.lineStyle(2, color, 0.7);
            card.strokeRect(cardX, cardTop, cardW, cardH);
        });

        hitArea.on('pointerdown', () => {
            audio.playClick();
            onClick();
        });
    }
}

// ============================================================
// PHASER CONFIG - All scenes from both games
// ============================================================
const config = {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [
        // Skateboard Jumps scenes (BootScene runs first, then goes to Launcher)
        BootScene, LauncherScene, MainMenuScene, InstructionsScene,
        CharSelectScene, WardrobeScene, ShopScene, ChatScene, SettingsScene,
        HighScoresScene, GameScene, RaceScene,
        // Jump to the Top scenes
        JTTBootScene, JTTMenuScene, JTTInstructionsScene,
        JTTHighScoresScene, JTTGameScene
    ],
    input: { activePointers: 2 },
    render: { antialias: false, roundPixels: true },
    dom: { createContainer: true },
};

new Phaser.Game(config);
