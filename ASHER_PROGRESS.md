# 🛹 Asher's Game Progress

_Session 1 — 2026-07-05, with LillyRose. Everything below is built, committed, and LIVE._

**Live:** https://cowballwong.github.io/game-arcade/ · **Repo:** github.com/cowballwong/game-arcade (branch `main`)

## What Asher built today (his ideas, guided step-by-step)

**Skate 3D** (`skate3d.html`) — a brand-new **3D skateboard game** (his idea: "make it 3D"):
- 3 lanes + jump, dodge red blocks, grab coins, speeds up over time, high score
- 🤸 **Flip tricks** (his idea + he set them): tap JUMP in the air → Backflip → Frontflip → 360 (cycle across jumps), bonus points
- 🛡🧲 **Power-ups** (his "make it more fun" — researched what makes games addictive): Shield (survive a crash) + Magnet (pull coins)
- 🎵 Background music + mute button
- ✨ Polished UI: glass score/coins pills, card menus, results card
- 🐛 He found the **"Play Again froze" bug** as a real game-tester → fixed
- Added a **"To Arcade"** button on the wipeout screen (he spotted the old one was hidden)

**Skateboard Jumps** (`js/skateboard_jumps.js`) — his **Tricks Shop** (game-economy design, his prices):
- Backflip $3,000 · Frontflip $4,000 · 360 $6,000 — buy with coins; owning them = trick + bonus on jumps

**Arcade landing** (`index.html`) — his idea "a page to pick games" → rebuilt as a sleek HTML page (glass cards + leaderboard).

## What Asher learned (game-designer thinking)
- **Build the simplest version first**, test if it's more fun, then add more
- **Pick ONE idea to start** (not "everything at once")
- **Game economy** — pricing shop items (cheaper vs pricier = bigger reward)
- **Being a game tester** — finding + reporting bugs is a real skill
- **UX** — menus, and buttons that shouldn't be hidden

## To continue next time (ideas that came up)
- Wire **Skate 3D scores into the shared Firestore leaderboard** (name entry on game over → posts to the arcade board)
- More **obstacle / environment variety** in Skate 3D (ramps, new places to skate)
- **Sound effects** (coin, crash, trick)
- New **characters / skateboards** to unlock
- More power-ups (speed boost? 2× coins?)

## How it's saved
All work is committed to git (`main`, latest `3853bad`) and deployed to GitHub Pages. Nothing to lose — just open the repo and keep building. See `project_game_arcade_firebase` memory for the technical architecture (Firebase leaderboard, play.html boot flow, deploy notes).
