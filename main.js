/* ============================================================
   GINOPIZZA BATTLE ROYALE
   Gioco arcade top-down realizzato con Phaser 3.
   Struttura del file:
     1. Costanti e dati (personaggi, power-up, eventi)
     2. Helper audio (Web Audio API)
     3. Gestione salvataggi (localStorage / XP)
     4. Classe Fighter (giocatore + bot)
     5. MenuScene, SelectScene, GameScene, GameOverScene
     6. Config e avvio del gioco
   Nessun asset esterno: forme, colori ed emoji sono generati via codice.
   ============================================================ */

'use strict';

/* ============================================================
   1. COSTANTI E DATI
   ============================================================ */

const WORLD = 1500;                 // Lato dell'arena quadrata (px)
const CANVAS = 900;                 // Dimensione base del canvas (scalata responsive)
const MATCH_BOTS = 20;              // Numero di bot => 21 combattenti totali
const ZONE_SHRINK_TIME = 150;       // Secondi entro cui la zona si restringe del tutto
const EVENT_INTERVAL = 30000;       // Evento assurdo ogni 30 secondi

// Moltiplicatore globale del ritmo di gioco: abbassalo per rallentare tutto
// (movimento, scatti, proiettili). 1 = velocità piena, 0.7 = 30% più lento.
const GAME_SPEED = 0.7;

// --- Personaggi giocabili -------------------------------------------------
// Ogni personaggio ha: id, nome, emoji, colore, velocità, vita, potere e frase meme.
const CHARACTERS = [
  { id: 'capybara', name: 'Capybara DJ',        emoji: '🦫', color: 0xffb347, speed: 190, hp: 120, special: 'shockwave',   cd: 8,  meme: 'Untz untz, sei fuori! 🎧' },
  { id: 'banana',   name: 'Banana Samurai',     emoji: '🍌', color: 0xffe600, speed: 235, hp: 90,  special: 'dash',        cd: 6,  meme: 'Tagliato come un frullato! 🍌' },
  { id: 'pizza',    name: 'Pizza Ninja',        emoji: '🍕', color: 0xff5533, speed: 210, hp: 100, special: 'projectiles', cd: 5,  meme: 'Consegna a domicilio... di dolore! 🍕' },
  { id: 'toilet',   name: 'Toilet Wizard',      emoji: '🚽', color: 0x66d9ff, speed: 175, hp: 130, special: 'healshield',  cd: 10, meme: 'Sciacquone magico! 🚽✨' },
  { id: 'croco',    name: 'Crocodile Boss',     emoji: '🐊', color: 0x4caf50, speed: 160, hp: 160, special: 'charge',      cd: 9,  meme: 'Affare chiuso. Sei licenziato! 💼' },
  { id: 'penguin',  name: 'Penguin Hacker',     emoji: '🐧', color: 0x9c88ff, speed: 200, hp: 95,  special: 'blink',       cd: 8,  meme: 'Access denied, noob! 💻' },
  { id: 'frog',     name: 'Frog Skater',        emoji: '🐸', color: 0x7cff5c, speed: 260, hp: 80,  special: 'speed',       cd: 7,  meme: 'Kickflip sulla tua faccia! 🛹' },
  { id: 'chicken',  name: 'Chicken Astronaut',  emoji: '🐔', color: 0xff8fd4, speed: 195, hp: 105, special: 'meteor',      cd: 10, meme: 'Houston, abbiamo un eliminato! 🚀' },
];

// Skin cosmetiche sbloccabili con l'XP (cambiano solo l'aura del personaggio)
const SKINS = [
  { id: 'default', name: 'Base',        xp: 0,    tint: null },
  { id: 'gold',    name: 'Oro Meme',    xp: 300,  tint: 0xffd700 },
  { id: 'neon',    name: 'Neon Rave',   xp: 800,  tint: 0x00ffe0 },
  { id: 'rainbow', name: 'Arcobaleno',  xp: 1500, tint: 0xff00ff },
  { id: 'cursed',  name: 'Cursed',      xp: 3000, tint: 0x9900ff },
];

// --- Power-up -------------------------------------------------------------
const POWERUPS = {
  speed:  { emoji: '⚡', color: 0xffff00, label: 'VELOCITÀ' },
  heal:   { emoji: '❤️', color: 0xff3355, label: 'CURA' },
  shield: { emoji: '🛡️', color: 0x33aaff, label: 'SCUDO' },
  power:  { emoji: '💪', color: 0xff8800, label: 'ATTACCO+' },
  invis:  { emoji: '👻', color: 0xccccff, label: 'INVISIBILE' },
  bomb:   { emoji: '💣', color: 0x333333, label: 'BOMBA MEME' },
};
const POWERUP_KEYS = Object.keys(POWERUPS);

// --- Eventi casuali assurdi ----------------------------------------------
const EVENTS = [
  { id: 'gravity',   text: '🌀 GRAVITÀ IMPAZZITA!' },
  { id: 'giants',    text: '🦖 TUTTI GIGANTI!' },
  { id: 'chickens',  text: '🐔 PIOGGIA DI POLLI ESPLOSIVI!' },
  { id: 'ice',       text: '🧊 PAVIMENTO DI GHIACCIO!' },
  { id: 'meteors',   text: '☄️ METEORITI IN ARRIVO!' },
  { id: 'tornado',   text: '🌪️ TORNADO NELL\'ARENA!' },
  { id: 'superspeed',text: '💨 SUPER VELOCITÀ PER TUTTI!' },
  { id: 'disco',     text: '🪩 LUCI DISCO!' },
];

// Frasi meme casuali mostrate a schermo durante la partita
const MEME_FLASHES = [
  'SKIBIDI! 🚽', 'GYATT! 😳', 'RIZZ +100 😎', 'OHIO FINAL BOSS 💀',
  'SIGMA MOVE 🗿', 'NO CAP 🧢', 'FANUM TAX 🍗', 'CERTIFIED BRAINROT 🧠',
  'W RIZZLER 🔥', 'ONLY IN OHIO 🌽',
];

// Nomi buffi per i bot
const BOT_NAMES = [
  'Gino', 'Skibidi', 'Toilettone', 'Rizzler', 'Gigachad', 'Baby_Gronk',
  'Ohio_Kid', 'Sussy', 'Fanum', 'Grimace', 'Mewing', 'Sigma_69',
  'Capo', 'Brainrot', 'NPC_42', 'Goofy', 'Zesty', 'Cringe', 'Based', 'Mid',
];

const BEHAVIORS = ['aggressive', 'defensive', 'coward', 'hunter', 'chaotic'];

/* ============================================================
   2. AUDIO — piccoli effetti generati con la Web Audio API
   ============================================================ */
const SFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  // Suono base: tono con inviluppo di volume
  tone(freq, dur, type = 'square', vol = 0.15) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur);
  },
  attack()   { this.tone(220, 0.08, 'square', 0.12); },
  hit()      { this.tone(140, 0.10, 'sawtooth', 0.14); },
  kill()     { this.tone(520, 0.06, 'square'); setTimeout(() => this.tone(700, 0.12, 'square'), 60); },
  powerup()  { this.tone(660, 0.08, 'triangle'); setTimeout(() => this.tone(990, 0.12, 'triangle'), 70); },
  special()  { this.tone(330, 0.06, 'sawtooth'); setTimeout(() => this.tone(440, 0.1, 'sawtooth'), 50); },
  event()    { this.tone(180, 0.2, 'sine', 0.2); setTimeout(() => this.tone(360, 0.25, 'sine', 0.2), 150); },
  win()      { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'triangle', 0.2), i * 150)); },
  lose()     { [400, 300, 200, 120].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'sawtooth', 0.18), i * 160)); },
};

/* ============================================================
   3. SALVATAGGIO — XP, skin sbloccate e classifica locale
   ============================================================ */
const Save = {
  KEY: 'ginopizza_save_v1',
  data: { xp: 0, games: 0, wins: 0, kills: 0, skin: 'default', leaderboard: [] },
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.data = Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* localStorage non disponibile: si gioca senza salvataggio */ }
    return this.data;
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
  },
  addResult(placement, kills, xpGained, won) {
    this.data.xp += xpGained;
    this.data.games += 1;
    this.data.kills += kills;
    if (won) this.data.wins += 1;
    this.data.leaderboard.push({ placement, kills, xp: xpGained, date: Date.now() });
    // Teniamo solo le 10 migliori partite (per piazzamento, poi kill)
    this.data.leaderboard.sort((a, b) => a.placement - b.placement || b.kills - a.kills);
    this.data.leaderboard = this.data.leaderboard.slice(0, 10);
    this.save();
  },
  unlockedSkins() { return SKINS.filter(s => this.data.xp >= s.xp); },
};

/* Utility casuali */
const RND = {
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
};

/* ============================================================
   4. FIGHTER — combattente controllato dal giocatore o da un bot
   ============================================================ */
class Fighter {
  constructor(scene, x, y, charDef, isPlayer, botName, behavior) {
    this.scene = scene;
    this.def = charDef;
    this.isPlayer = isPlayer;
    this.alive = true;
    this.name = isPlayer ? 'TU' : botName;
    this.behavior = behavior || 'aggressive';

    // Statistiche
    this.maxHp = charDef.hp;
    this.hp = charDef.hp;
    this.baseSpeed = charDef.speed * GAME_SPEED;
    this.kills = 0;

    // Sprite fisico (disco colorato generato via texture)
    this.sprite = scene.physics.add.image(x, y, 'disc');
    this.sprite.setDisplaySize(46, 46);
    this.sprite.body.setCircle(32); // raggio sulla texture 64x64
    this.sprite.setTint(charDef.color);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDrag(900, 900);
    this.sprite.owner = this; // riferimento inverso per le collisioni
    this.sprite.setDepth(5);

    // Emoji sopra il disco
    this.emoji = scene.add.text(x, y, charDef.emoji, { fontSize: '30px' })
      .setOrigin(0.5).setDepth(6);

    // Etichetta col nome
    this.label = scene.add.text(x, y - 34, this.name, {
      fontSize: '13px', fontFamily: 'Comic Sans MS, sans-serif',
      color: isPlayer ? '#ffff00' : '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(7);

    // Facing (direzione ultimo movimento) usato per attacchi e dash
    this.facing = new Phaser.Math.Vector2(1, 0);

    // Timer e stati temporanei
    this.attackCd = 0;
    this.specialCd = 0;
    this.speedMult = 1;
    this.attackMult = 1;
    this.shieldUntil = 0;
    this.invisUntil = 0;
    this.stunUntil = 0;
    this.buffTimers = [];
    this.hidden = false; // dentro un cespuglio

    // Timer decisionale dei bot
    this.think = RND.int(0, 300);
    this.wander = new Phaser.Math.Vector2(0, 0);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  // Applica un power-up raccolto
  applyPowerup(type) {
    const now = this.scene.time.now;
    switch (type) {
      case 'speed':  this.speedMult = 1.7; this.timedReset('speedMult', 1, 6000); break;
      case 'heal':   this.heal(45); break;
      case 'shield': this.shieldUntil = now + 5000; break;
      case 'power':  this.attackMult = 2; this.timedReset('attackMult', 1, 8000); break;
      case 'invis':  this.invisUntil = now + 4000; break;
      case 'bomb':   this.scene.spawnBomb(this); break;
    }
    if (this.isPlayer) SFX.powerup();
  }

  // Ripristina una proprietà numerica dopo un certo tempo (per i buff)
  timedReset(prop, value, delay) {
    this.scene.time.delayedCall(delay, () => { if (this.alive) this[prop] = value; });
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // Subisce danno; restituisce true se il colpo è andato a segno
  takeDamage(amount, attacker) {
    if (!this.alive) return false;
    if (this.scene.time.now < this.shieldUntil) {
      this.scene.popText(this.x, this.y - 30, 'SCUDO!', '#33aaff');
      return false;
    }
    this.hp -= amount;
    this.sprite.setTintFill(0xffffff); // flash bianco
    this.scene.time.delayedCall(60, () => { if (this.alive) this.sprite.setTint(this.currentTint()); });
    this.scene.spawnHitParticles(this.x, this.y, this.def.color);
    if (this.hp <= 0) this.die(attacker);
    return true;
  }

  currentTint() {
    // Skin cosmetica del giocatore (aura) oppure colore base
    if (this.isPlayer && this.scene.playerSkin && this.scene.playerSkin.tint) {
      return this.scene.playerSkin.tint;
    }
    return this.def.color;
  }

  die(attacker) {
    if (!this.alive) return;
    this.alive = false;
    this.scene.spawnDeathBurst(this.x, this.y, this.def.color, this.def.emoji);
    this.scene.cameras.main.shake(180, 0.008);
    if (attacker && attacker.alive) {
      attacker.kills += 1;
      if (attacker.isPlayer) {
        this.scene.playerKills += 1;
        this.scene.flashMeme(attacker.def.meme);
        SFX.kill();
      }
    }
    if (this.isPlayer) {
      SFX.lose();
      // La camera smette di seguire lo sprite che sta per essere distrutto
      this.scene.cameras.main.stopFollow();
    }
    // Rimuove gli oggetti visivi
    this.sprite.destroy();
    this.emoji.destroy();
    this.label.destroy();
    this.scene.onFighterDeath(this);
  }

  // Attacco base ad area frontale
  attack() {
    if (!this.alive || this.scene.time.now < this.attackCd) return;
    if (this.scene.time.now < this.stunUntil) return;
    this.attackCd = this.scene.time.now + 450;
    const range = 90;
    const dmg = 16 * this.attackMult;
    const cx = this.x + this.facing.x * 40;
    const cy = this.y + this.facing.y * 40;
    this.scene.spawnAttackArc(cx, cy, this.def.color);
    if (this.isPlayer) SFX.attack();
    // Colpisce i nemici nell'area frontale
    for (const f of this.scene.fighters) {
      if (f === this || !f.alive) continue;
      if (Phaser.Math.Distance.Between(cx, cy, f.x, f.y) < range) {
        if (f.takeDamage(dmg, this) && this.isPlayer) SFX.hit();
      }
    }
  }

  // Abilità speciale con cooldown, diversa per ogni personaggio
  useSpecial() {
    if (!this.alive || this.scene.time.now < this.specialCd) return;
    if (this.scene.time.now < this.stunUntil) return;
    this.specialCd = this.scene.time.now + this.def.cd * 1000;
    if (this.isPlayer) SFX.special();
    const s = this.scene;

    switch (this.def.special) {
      case 'shockwave': { // Capybara: onda disco d'area con respinta
        s.spawnShockwave(this.x, this.y, 150, this.def.color);
        for (const f of s.fighters) {
          if (f === this || !f.alive) continue;
          const d = Phaser.Math.Distance.Between(this.x, this.y, f.x, f.y);
          if (d < 150) {
            f.takeDamage(28, this);
            const a = Phaser.Math.Angle.Between(this.x, this.y, f.x, f.y);
            f.sprite.setVelocity(Math.cos(a) * 380, Math.sin(a) * 380);
          }
        }
        break;
      }
      case 'dash': { // Banana: scatto tagliente
        this.dashAttack(520, 22, 0.28);
        break;
      }
      case 'projectiles': { // Pizza: tre fette a ventaglio
        const base = Math.atan2(this.facing.y, this.facing.x);
        for (let i = -1; i <= 1; i++) {
          const a = base + i * 0.32;
          s.spawnProjectile(this, this.x, this.y, Math.cos(a) * 460 * GAME_SPEED, Math.sin(a) * 460 * GAME_SPEED, 20, '🍕', 1400);
        }
        break;
      }
      case 'healshield': { // Toilet: cura + scudo
        this.heal(45);
        this.shieldUntil = s.time.now + 4500;
        s.spawnShockwave(this.x, this.y, 80, 0x66d9ff);
        break;
      }
      case 'charge': { // Coccodrillo: carica che stordisce
        this.dashAttack(560, 30, 0.35, true);
        break;
      }
      case 'blink': { // Pinguino: teletrasporto + invisibilità
        this.sprite.x = Phaser.Math.Clamp(this.x + this.facing.x * 230, 40, WORLD - 40);
        this.sprite.y = Phaser.Math.Clamp(this.y + this.facing.y * 230, 40, WORLD - 40);
        this.invisUntil = s.time.now + 3000;
        s.spawnShockwave(this.x, this.y, 60, 0x9c88ff);
        break;
      }
      case 'speed': { // Rana: super velocità temporanea
        this.speedMult = 1.9;
        this.timedReset('speedMult', 1, 4000);
        break;
      }
      case 'meteor': { // Pollo: bomba gravitazionale che attira ed esplode
        const tx = this.x + this.facing.x * 160;
        const ty = this.y + this.facing.y * 160;
        s.spawnGravityBomb(tx, ty, this);
        break;
      }
    }
  }

  // Scatto che danneggia i nemici attraversati (usato da dash/charge)
  dashAttack(power, dmg, duration, stun = false) {
    const vx = this.facing.x * power * GAME_SPEED;
    const vy = this.facing.y * power * GAME_SPEED;
    this.sprite.setVelocity(vx, vy);
    this.dashUntil = this.scene.time.now + duration * 1000;
    this.dashDmg = dmg;
    this.dashStun = stun;
    this.dashHitSet = new Set();
  }

  // Loop di aggiornamento (chiamato ogni frame dalla scena)
  update(dt) {
    if (!this.alive) return;
    const now = this.scene.time.now;

    // Sincronizza gli elementi visivi col corpo fisico
    this.emoji.setPosition(this.x, this.y);
    this.label.setPosition(this.x, this.y - 34);

    // Invisibilità / cespuglio => trasparenza
    let alpha = 1;
    if (now < this.invisUntil) alpha = this.isPlayer ? 0.35 : 0.12;
    else if (this.hidden) alpha = 0.5;
    this.sprite.setAlpha(alpha);
    this.emoji.setAlpha(alpha);
    this.label.setAlpha(this.isPlayer ? 1 : alpha);

    // Gestione dello scatto in corso
    if (this.dashUntil && now < this.dashUntil) {
      for (const f of this.scene.fighters) {
        if (f === this || !f.alive || this.dashHitSet.has(f)) continue;
        if (Phaser.Math.Distance.Between(this.x, this.y, f.x, f.y) < 55) {
          f.takeDamage(this.dashDmg, this);
          if (this.dashStun) f.stunUntil = now + 1200;
          this.dashHitSet.add(f);
        }
      }
    }

    // Stordimento: nessun controllo
    if (now < this.stunUntil) { this.sprite.setVelocity(0, 0); return; }

    if (this.isPlayer) this.updatePlayer();
    else this.updateBot(dt);
  }

  // --- Controlli del giocatore ---
  updatePlayer() {
    const s = this.scene;
    let vx = 0, vy = 0;
    const k = s.keys;
    if (k.left.isDown || k.a.isDown)  vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown)    vy -= 1;
    if (k.down.isDown || k.s.isDown)  vy += 1;

    // Input joystick mobile (sovrascrive se attivo)
    if (s.mobileInput && (s.mobileInput.x !== 0 || s.mobileInput.y !== 0)) {
      vx = s.mobileInput.x; vy = s.mobileInput.y;
    }

    const v = new Phaser.Math.Vector2(vx, vy);
    if (v.length() > 0) {
      v.normalize();
      this.facing.copy(v);
      const speed = this.baseSpeed * this.speedMult;
      this.sprite.setVelocity(v.x * speed, v.y * speed);
    }
    // (l'attrito ferma gradualmente il giocatore quando non preme nulla)
  }

  // --- Intelligenza artificiale dei bot ---
  updateBot(dt) {
    const s = this.scene;
    const now = s.time.now;

    // Decisione periodica (ogni ~0.3s) per scegliere il bersaglio/obiettivo
    this.think -= dt;
    if (this.think <= 0) {
      this.think = RND.int(250, 400);
      this.decide();
    }

    // Priorità assoluta: rientrare nella zona sicura
    const distCenter = Phaser.Math.Distance.Between(this.x, this.y, s.zone.x, s.zone.y);
    let target = this.targetPoint;
    if (distCenter > s.zone.radius - 60) {
      target = { x: s.zone.x, y: s.zone.y };
    }

    // Movimento verso il bersaglio scelto
    if (target) {
      const a = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.facing.set(Math.cos(a), Math.sin(a));
      const speed = this.baseSpeed * this.speedMult * 0.92;
      this.sprite.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    }

    // Azioni offensive verso il nemico più vicino
    const enemy = this.nearestEnemy();
    if (enemy) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (d < 85 && this.behavior !== 'coward') {
        const a = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
        this.facing.set(Math.cos(a), Math.sin(a));
        this.attack();
      }
      // Usa la speciale quando pronta e c'è un nemico a portata media
      if (now >= this.specialCd && d < 260 && RND.chance(0.5)) this.useSpecial();
    }
  }

  // Sceglie l'obiettivo in base al comportamento
  decide() {
    const s = this.scene;
    const enemy = this.nearestEnemy();
    const pu = this.nearestPowerup();

    switch (this.behavior) {
      case 'aggressive':
        this.targetPoint = enemy ? { x: enemy.x, y: enemy.y } : this.randomPoint();
        break;
      case 'defensive':
        // Cerca cure/scudi, altrimenti mantiene le distanze dal nemico
        if (pu) this.targetPoint = { x: pu.x, y: pu.y };
        else if (enemy) this.targetPoint = this.awayFrom(enemy, 200);
        else this.targetPoint = this.randomPoint();
        break;
      case 'coward':
        // Fugge sempre dal nemico più vicino
        this.targetPoint = enemy ? this.awayFrom(enemy, 260) : this.randomPoint();
        break;
      case 'hunter':
        // Prima i power-up, poi combatte
        this.targetPoint = pu ? { x: pu.x, y: pu.y } : (enemy ? { x: enemy.x, y: enemy.y } : this.randomPoint());
        break;
      case 'chaotic':
      default:
        // Vaga a caso e ogni tanto attacca nel vuoto
        this.targetPoint = RND.chance(0.5) && enemy ? { x: enemy.x, y: enemy.y } : this.randomPoint();
        if (RND.chance(0.3)) this.attack();
        break;
    }
  }

  awayFrom(enemy, dist) {
    const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.x, this.y);
    return {
      x: Phaser.Math.Clamp(this.x + Math.cos(a) * dist, 60, WORLD - 60),
      y: Phaser.Math.Clamp(this.y + Math.sin(a) * dist, 60, WORLD - 60),
    };
  }

  randomPoint() {
    const s = this.scene;
    const ang = Math.random() * Math.PI * 2;
    const r = Math.random() * s.zone.radius * 0.7;
    return { x: s.zone.x + Math.cos(ang) * r, y: s.zone.y + Math.sin(ang) * r };
  }

  nearestEnemy() {
    let best = null, bd = Infinity;
    for (const f of this.scene.fighters) {
      if (f === this || !f.alive) continue;
      // Ignora chi è invisibile
      if (this.scene.time.now < f.invisUntil) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, f.x, f.y);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }

  nearestPowerup() {
    let best = null, bd = 320; // considera solo i power-up abbastanza vicini
    for (const p of this.scene.powerups) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
}

/* ============================================================
   5a. MENU SCENE — schermata iniziale
   ============================================================ */
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    Save.load();
    const cx = CANVAS / 2;
    this.cameras.main.setBackgroundColor('#1a0033');

    // Sfondo animato a "coriandoli"
    this.confetti = [];
    for (let i = 0; i < 40; i++) {
      const c = this.add.text(Math.random() * CANVAS, Math.random() * CANVAS,
        RND.pick(['🍕', '🍌', '🐸', '💥', '⭐', '🚽', '🐔']),
        { fontSize: `${RND.int(18, 40)}px` }).setAlpha(0.5);
      c.vy = RND.int(20, 70) / 100;
      this.confetti.push(c);
    }

    this.add.text(cx, 130, '🍕 GINOPIZZA 🍕', {
      fontSize: '58px', fontFamily: 'Comic Sans MS, sans-serif',
      color: '#ffdd00', stroke: '#ff0066', strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(cx, 195, 'BATTLE ROYALE', {
      fontSize: '46px', fontFamily: 'Comic Sans MS, sans-serif',
      color: '#00ffe0', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(cx, 250, 'sopravvivi, elimina, resta l\'ultimo brainrot in vita', {
      fontSize: '17px', color: '#ffffff',
    }).setOrigin(0.5);

    this.makeButton(cx, 360, '▶  GIOCA', 0xff3388, () => {
      SFX.init();
      this.scene.start('SelectScene');
    });

    // Istruzioni rapide
    this.add.text(cx, 470,
      'COME SI GIOCA:\n' +
      '• Muoviti: WASD o frecce (joystick su mobile)\n' +
      '• SPAZIO o 👊 = attacco base\n' +
      '• E o ✨ = abilità speciale\n' +
      '• Raccogli power-up, evita la zona rossa\n' +
      '• Ogni 30s parte un evento assurdo!',
      { fontSize: '17px', color: '#ffffff', align: 'center', lineSpacing: 6 }
    ).setOrigin(0.5);

    // Statistiche giocatore
    const d = Save.data;
    this.add.text(cx, 640,
      `⭐ XP totale: ${d.xp}   |   🎮 Partite: ${d.games}   |   🏆 Vittorie: ${d.wins}   |   💀 Kill: ${d.kills}`,
      { fontSize: '15px', color: '#ffcc00' }).setOrigin(0.5);

    // Skin sbloccate
    const unlocked = Save.unlockedSkins().length;
    this.add.text(cx, 675, `🎨 Skin sbloccate: ${unlocked}/${SKINS.length}`,
      { fontSize: '14px', color: '#aaffee' }).setOrigin(0.5);
  }

  makeButton(x, y, label, color, cb) {
    const w = 260, h = 64;
    const g = this.add.graphics();
    g.fillStyle(color, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 16);
    g.lineStyle(4, 0xffffff, 1).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);
    const t = this.add.text(x, y, label, {
      fontSize: '30px', fontFamily: 'Comic Sans MS, sans-serif', color: '#fff',
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => t.setScale(1.1));
    zone.on('pointerout', () => t.setScale(1));
    zone.on('pointerdown', cb);
    return zone;
  }

  update() {
    for (const c of this.confetti) {
      c.y += c.vy;
      if (c.y > CANVAS + 20) { c.y = -20; c.x = Math.random() * CANVAS; }
    }
  }
}

/* ============================================================
   5b. SELECT SCENE — selezione personaggio e skin
   ============================================================ */
class SelectScene extends Phaser.Scene {
  constructor() { super('SelectScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#20003a');
    const cx = CANVAS / 2;
    this.selected = 0;
    this.selectedSkin = SKINS.find(s => s.id === Save.data.skin) || SKINS[0];

    this.add.text(cx, 45, 'SCEGLI IL TUO BRAINROT', {
      fontSize: '34px', fontFamily: 'Comic Sans MS, sans-serif',
      color: '#ffdd00', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);

    // Griglia 4x2 di personaggi
    this.cards = [];
    const cols = 4, cardW = 190, cardH = 165, gapX = 20, gapY = 20;
    const startX = cx - ((cols * cardW + (cols - 1) * gapX) / 2) + cardW / 2;
    const startY = 170;
    CHARACTERS.forEach((ch, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.cards.push(this.makeCard(x, y, cardW, cardH, ch, i));
    });

    // Pannello dettagli
    this.detail = this.add.text(cx, 540, '', {
      fontSize: '17px', color: '#ffffff', align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);

    // Selettore skin
    this.skinText = this.add.text(cx, 620, '', { fontSize: '17px', color: '#00ffcc' }).setOrigin(0.5);
    this.makeSmallButton(cx - 150, 620, '◀', () => this.cycleSkin(-1));
    this.makeSmallButton(cx + 150, 620, '▶', () => this.cycleSkin(1));

    // Pulsanti navigazione
    this.makeSmallButton(cx - 220, 690, '⟵ Indietro', () => this.scene.start('MenuScene'), 160);
    this.makeSmallButton(cx + 160, 690, 'COMBATTI! ⚔️', () => {
      Save.data.skin = this.selectedSkin.id; Save.save();
      this.scene.start('GameScene', { char: CHARACTERS[this.selected], skin: this.selectedSkin });
    }, 220, 0xff3388);

    this.refresh();
  }

  makeCard(x, y, w, h, ch, index) {
    const g = this.add.graphics();
    const emoji = this.add.text(x, y - 20, ch.emoji, { fontSize: '54px' }).setOrigin(0.5);
    const name = this.add.text(x, y + 45, ch.name, {
      fontSize: '15px', color: '#fff', align: 'center', wordWrap: { width: w - 16 },
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { this.selected = index; SFX.attack(); this.refresh(); });
    return { g, x, y, w, h, ch };
  }

  makeSmallButton(x, y, label, cb, w = 90, color = 0x5533aa) {
    const h = 48;
    const g = this.add.graphics();
    g.fillStyle(color, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    g.lineStyle(3, 0xffffff).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    this.add.text(x, y, label, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', cb);
  }

  cycleSkin(dir) {
    const unlocked = Save.unlockedSkins();
    let idx = unlocked.findIndex(s => s.id === this.selectedSkin.id);
    idx = (idx + dir + unlocked.length) % unlocked.length;
    this.selectedSkin = unlocked[idx];
    SFX.powerup();
    this.refresh();
  }

  refresh() {
    // Ridisegna i bordi delle carte evidenziando quella scelta
    this.cards.forEach((c, i) => {
      c.g.clear();
      const sel = i === this.selected;
      c.g.fillStyle(sel ? 0x442266 : 0x2a1a44, 1)
        .fillRoundedRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 14);
      c.g.lineStyle(sel ? 5 : 2, sel ? 0xffdd00 : 0x6644aa)
        .strokeRoundedRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 14);
    });
    const ch = CHARACTERS[this.selected];
    this.detail.setText(
      `${ch.name}\n` +
      `❤️ Vita: ${ch.hp}   💨 Velocità: ${ch.speed}   ⏱️ Cooldown: ${ch.cd}s\n` +
      `✨ Speciale: ${this.specialDesc(ch.special)}\n` +
      `💬 "${ch.meme}"`
    );
    this.skinText.setText(`🎨 Skin: ${this.selectedSkin.name}` +
      (this.selectedSkin.tint ? ' (aura colorata)' : ''));
  }

  specialDesc(id) {
    const map = {
      shockwave: 'Onda disco che respinge e danneggia',
      dash: 'Scatto tagliente attraverso i nemici',
      projectiles: 'Lancia 3 fette di pizza',
      healshield: 'Si cura e attiva uno scudo',
      charge: 'Carica che stordisce',
      blink: 'Teletrasporto + invisibilità',
      speed: 'Super velocità temporanea',
      meteor: 'Bomba gravitazionale',
    };
    return map[id] || '';
  }
}

/* ============================================================
   5c. GAME SCENE — la partita vera e propria
   ============================================================ */
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.playerChar = data.char;
    this.playerSkin = data.skin || SKINS[0];
  }

  create() {
    const scene = this;
    this.cameras.main.setBackgroundColor('#2d1b4e');

    // Texture condivisa: disco bianco 64x64 (colorato via tint sui fighter)
    if (!this.textures.exists('disc')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1).fillCircle(32, 32, 32);
      g.generateTexture('disc', 64, 64);
      g.destroy();
    }
    // Texture particella quadrata
    if (!this.textures.exists('pix')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 8, 8);
      g.generateTexture('pix', 8, 8);
      g.destroy();
    }

    this.physics.world.setBounds(0, 0, WORLD, WORLD);

    // --- Stato della partita ---
    // IMPORTANTE: Phaser riusa la stessa istanza di scena a ogni restart,
    // quindi azzeriamo esplicitamente tutto lo stato (incluso il gruppo _fg,
    // altrimenti alla 2ª partita punterebbe a oggetti già distrutti).
    this._fg = null;
    this.discoBg = false;
    this._lastZoneTick = -1;
    this.fighters = [];
    this.powerups = [];
    this.projectiles = [];
    this.hazards = [];       // meteoriti/polli in arrivo con avviso
    this.bushes = [];
    this.slippery = [];
    this.playerKills = 0;
    this.startTime = this.time.now;
    this.matchOver = false;
    this.eventActive = null;
    this.slowmoDone = false;
    this.rankOfDeath = [];   // ordine di morte per stilare la classifica

    // --- Arena: sfondo a scacchiera ---
    this.drawArena();

    // --- Ostacoli / muri ---
    this.walls = this.physics.add.staticGroup();
    this.createObstacles();

    // --- Cespugli e zone scivolose ---
    this.createTerrain();

    // --- Zona pericolosa (cerchio che si restringe) ---
    this.zone = { x: WORLD / 2, y: WORLD / 2, radius: WORLD * 0.72, minRadius: 120 };
    this.zoneGfx = this.add.graphics().setDepth(2);

    // --- Grafica dinamica per barre vita, attacchi, ecc. ---
    this.hpGfx = this.add.graphics().setDepth(8);
    this.fxGfx = this.add.graphics().setDepth(9);

    // --- Crea i combattenti ---
    this.spawnFighters();

    // Collisioni coi muri
    this.physics.add.collider(this.fightersGroup(), this.walls);

    // --- Camera segue il giocatore ---
    this.cameras.main.setBounds(0, 0, WORLD, WORLD);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // --- Input tastiera ---
    this.keys = this.input.keyboard.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
      w: 'W', a: 'A', s: 'S', d: 'D',
      space: 'SPACE', e: 'E',
    });
    this.keys.space.on('down', () => this.player.alive && this.player.attack());
    this.keys.e.on('down', () => this.player.alive && this.player.useSpecial());

    // --- HUD fisso (scrollFactor 0) ---
    this.buildHUD();

    // --- Controlli mobile ---
    this.setupMobile();

    // --- Timer: power-up periodici ---
    this.time.addEvent({ delay: 2500, loop: true, callback: () => this.trySpawnPowerup() });
    for (let i = 0; i < 6; i++) this.trySpawnPowerup(); // qualche power-up iniziale

    // --- Timer: eventi assurdi ogni 30s ---
    this.time.addEvent({ delay: EVENT_INTERVAL, loop: true, callback: () => this.startRandomEvent() });

    // --- Timer: mini meme casuali a schermo ---
    this.time.addEvent({ delay: 9000, loop: true, callback: () => {
      if (!this.matchOver) this.flashMeme(RND.pick(MEME_FLASHES));
    }});

    // Messaggio d'avvio
    this.flashMeme('FIGHT! 🥊', 1400);
  }

  // Gruppo con gli sprite fisici dei combattenti (per i collider)
  fightersGroup() {
    if (!this._fg) this._fg = this.add.group();
    return this._fg;
  }

  drawArena() {
    const g = this.add.graphics().setDepth(0);
    const tile = 100;
    for (let x = 0; x < WORLD; x += tile) {
      for (let y = 0; y < WORLD; y += tile) {
        const dark = ((x / tile) + (y / tile)) % 2 === 0;
        g.fillStyle(dark ? 0x3a2560 : 0x33205a, 1);
        g.fillRect(x, y, tile, tile);
      }
    }
    // Bordo dell'arena
    g.lineStyle(8, 0xff00aa, 1).strokeRect(0, 0, WORLD, WORLD);
    this.arenaGfx = g;
  }

  createObstacles() {
    // Alcuni muri/ostacoli fissi disposti nell'arena
    const layout = [
      [400, 400, 200, 40], [900, 400, 40, 200], [400, 1000, 40, 220],
      [1000, 1000, 220, 40], [700, 700, 120, 120], [200, 750, 40, 200],
      [1100, 250, 180, 40], [250, 1150, 200, 40],
    ];
    for (const [x, y, w, h] of layout) {
      const r = this.add.rectangle(x, y, w, h, 0x6b4fa0).setStrokeStyle(3, 0xffffff).setDepth(3);
      this.walls.add(r);
      r.body.setSize(w, h);
      r.body.updateFromGameObject();
    }
  }

  createTerrain() {
    // Cespugli (nascondiglio) — verde traslucido
    const bushSpots = [[300, 300], [1200, 350], [650, 1150], [1150, 1150], [500, 650], [900, 900]];
    for (const [x, y] of bushSpots) {
      const b = this.add.circle(x, y, 70, 0x2e8b57, 0.55).setDepth(1);
      this.add.text(x, y, '🌳', { fontSize: '40px' }).setOrigin(0.5).setDepth(1);
      this.bushes.push({ x, y, r: 70 });
    }
    // Zone scivolose (ghiaccio) — azzurro
    const iceSpots = [[750, 300], [350, 950], [1150, 750]];
    for (const [x, y] of iceSpots) {
      this.add.ellipse(x, y, 200, 200, 0x88ddff, 0.3).setDepth(1);
      this.add.text(x, y, '🧊', { fontSize: '34px' }).setOrigin(0.5).setDepth(1).setAlpha(0.7);
      this.slippery.push({ x, y, r: 100 });
    }
  }

  spawnFighters() {
    // Il giocatore parte al centro-basso
    this.player = new Fighter(this, WORLD / 2, WORLD - 200, this.playerChar, true, 'TU');
    this.fighters.push(this.player);
    this.fightersGroup().add(this.player.sprite);

    // Bot distribuiti in cerchio attorno al centro
    const pool = Phaser.Utils.Array.Shuffle(CHARACTERS.slice());
    const names = Phaser.Utils.Array.Shuffle(BOT_NAMES.slice());
    for (let i = 0; i < MATCH_BOTS; i++) {
      const ang = (i / MATCH_BOTS) * Math.PI * 2;
      const r = WORLD * 0.35;
      const x = Phaser.Math.Clamp(WORLD / 2 + Math.cos(ang) * r, 60, WORLD - 60);
      const y = Phaser.Math.Clamp(WORLD / 2 + Math.sin(ang) * r, 60, WORLD - 60);
      const def = pool[i % pool.length];
      const behavior = RND.pick(BEHAVIORS);
      const bot = new Fighter(this, x, y, def, false, names[i % names.length], behavior);
      this.fighters.push(bot);
      this.fightersGroup().add(bot.sprite);
    }
    this.totalPlayers = this.fighters.length;
  }

  buildHUD() {
    const style = { fontSize: '20px', fontFamily: 'Comic Sans MS, sans-serif', color: '#fff', stroke: '#000', strokeThickness: 4 };
    this.hudTimer   = this.add.text(CANVAS / 2, 16, '', { ...style, fontSize: '24px' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(20);
    this.hudAlive   = this.add.text(16, 16, '', style).setScrollFactor(0).setDepth(20);
    this.hudKills   = this.add.text(16, 46, '', style).setScrollFactor(0).setDepth(20);
    this.hudSpecial = this.add.text(CANVAS - 16, 16, '', { ...style }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);
    // Barra della vita del giocatore in basso
    this.hudHpLabel = this.add.text(16, CANVAS - 40, '', style).setScrollFactor(0).setDepth(20);
  }

  setupMobile() {
    this.mobileInput = { x: 0, y: 0 };
    const isTouch = this.sys.game.device.input.touch ||
      ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const controls = document.getElementById('mobile-controls');
    if (!isTouch) { controls.classList.add('hidden'); return; }
    controls.classList.remove('hidden');

    // --- Joystick virtuale ---
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    let active = false, originX = 0, originY = 0;
    const maxDist = 45;
    const zone = document.getElementById('joystick-zone');

    const start = (e) => {
      active = true;
      const t = e.touches ? e.touches[0] : e;
      const rect = base.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      move(e);
    };
    const move = (e) => {
      if (!active) return;
      const t = e.touches ? e.touches[0] : e;
      let dx = t.clientX - originX;
      let dy = t.clientY - originY;
      const dist = Math.min(Math.hypot(dx, dy), maxDist);
      const ang = Math.atan2(dy, dx);
      dx = Math.cos(ang) * dist; dy = Math.sin(ang) * dist;
      thumb.style.transform = `translate(${dx}px, ${dy}px)`;
      this.mobileInput.x = dx / maxDist;
      this.mobileInput.y = dy / maxDist;
      if (e.cancelable) e.preventDefault();
    };
    const end = () => {
      active = false;
      thumb.style.transform = 'translate(0,0)';
      this.mobileInput.x = 0; this.mobileInput.y = 0;
    };
    zone.addEventListener('touchstart', start, { passive: false });
    zone.addEventListener('touchmove', move, { passive: false });
    zone.addEventListener('touchend', end);
    zone.addEventListener('touchcancel', end);

    // --- Pulsanti azione ---
    const btnA = document.getElementById('btn-attack');
    const btnS = document.getElementById('btn-special');
    const tap = (el, fn) => {
      el.addEventListener('touchstart', (e) => { e.preventDefault(); SFX.init(); fn(); }, { passive: false });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); SFX.init(); fn(); });
    };
    tap(btnA, () => this.player.alive && this.player.attack());
    tap(btnS, () => this.player.alive && this.player.useSpecial());
  }

  // --- Power-up ---
  trySpawnPowerup() {
    if (this.matchOver || this.powerups.length > 8) return;
    const type = RND.pick(POWERUP_KEYS);
    const info = POWERUPS[type];
    // Posizione casuale dentro la zona sicura
    const ang = Math.random() * Math.PI * 2;
    const r = Math.random() * (this.zone.radius - 100);
    const x = Phaser.Math.Clamp(this.zone.x + Math.cos(ang) * r, 60, WORLD - 60);
    const y = Phaser.Math.Clamp(this.zone.y + Math.sin(ang) * r, 60, WORLD - 60);
    const circle = this.add.circle(x, y, 22, info.color, 0.9).setStrokeStyle(3, 0xffffff).setDepth(4);
    const emoji = this.add.text(x, y, info.emoji, { fontSize: '26px' }).setOrigin(0.5).setDepth(4);
    this.tweens.add({ targets: [circle, emoji], scale: 1.2, yoyo: true, repeat: -1, duration: 600 });
    this.powerups.push({ x, y, type, circle, emoji });
  }

  collectPowerup(fighter, pu) {
    fighter.applyPowerup(pu.type);
    if (fighter.isPlayer) this.popText(pu.x, pu.y - 20, POWERUPS[pu.type].label, '#ffff00');
    this.spawnHitParticles(pu.x, pu.y, POWERUPS[pu.type].color);
    pu.circle.destroy(); pu.emoji.destroy();
    this.powerups = this.powerups.filter(p => p !== pu);
  }

  // --- Proiettili (pizza, bomba, ecc.) ---
  spawnProjectile(owner, x, y, vx, vy, dmg, emoji, life) {
    const t = this.add.text(x, y, emoji, { fontSize: '26px' }).setOrigin(0.5).setDepth(6);
    this.projectiles.push({ owner, x, y, vx, vy, dmg, life, obj: t, hitSet: new Set() });
  }

  spawnBomb(owner) {
    // La bomba meme vola in avanti e poi esplode ad area
    const x = owner.x, y = owner.y;
    const vx = owner.facing.x * 350 * GAME_SPEED, vy = owner.facing.y * 350 * GAME_SPEED;
    const t = this.add.text(x, y, '💣', { fontSize: '30px' }).setOrigin(0.5).setDepth(6);
    this.projectiles.push({ owner, x, y, vx, vy, dmg: 0, life: 800, obj: t, hitSet: new Set(), explodeOnEnd: 55 });
  }

  spawnGravityBomb(x, y, owner) {
    // Attira i nemici per un attimo, poi esplode
    const warn = this.add.circle(x, y, 40, 0xff00ff, 0.3).setDepth(4);
    const hole = this.add.text(x, y, '🕳️', { fontSize: '34px' }).setOrigin(0.5).setDepth(4);
    const pull = this.time.addEvent({ delay: 50, repeat: 15, callback: () => {
      for (const f of this.fighters) {
        if (f === owner || !f.alive) continue;
        if (Phaser.Math.Distance.Between(x, y, f.x, f.y) < 220) {
          const a = Phaser.Math.Angle.Between(f.x, f.y, x, y);
          f.sprite.setVelocity(Math.cos(a) * 180, Math.sin(a) * 180);
        }
      }
    }});
    this.time.delayedCall(900, () => {
      warn.destroy();
      hole.destroy();
      this.spawnShockwave(x, y, 130, 0xff00ff);
      for (const f of this.fighters) {
        if (f === owner || !f.alive) continue;
        if (Phaser.Math.Distance.Between(x, y, f.x, f.y) < 130) f.takeDamage(32, owner);
      }
    });
  }

  // --- Effetti visivi ---
  spawnAttackArc(x, y, color) {
    const c = this.add.circle(x, y, 40, color, 0.4).setDepth(9);
    this.tweens.add({ targets: c, scale: 1.6, alpha: 0, duration: 200, onComplete: () => c.destroy() });
  }

  spawnShockwave(x, y, radius, color) {
    const c = this.add.circle(x, y, 20, color, 0.5).setStrokeStyle(4, 0xffffff).setDepth(9);
    this.tweens.add({
      targets: c, radius, scale: radius / 20, alpha: 0, duration: 400,
      onComplete: () => c.destroy(),
    });
    this.cameras.main.shake(120, 0.006);
  }

  spawnHitParticles(x, y, color) {
    const p = this.add.particles(x, y, 'pix', {
      speed: { min: 60, max: 200 }, scale: { start: 1.5, end: 0 },
      lifespan: 350, quantity: 8, tint: color, blendMode: 'ADD',
    }).setDepth(9);
    this.time.delayedCall(400, () => p.destroy());
  }

  spawnDeathBurst(x, y, color, emoji) {
    this.add.text(x, y, emoji, { fontSize: '40px' }).setOrigin(0.5).setDepth(10)
      .setAngle(0);
    const t = this.add.text(x, y - 10, '💥', { fontSize: '50px' }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: t, scale: 2, alpha: 0, duration: 500, onComplete: () => t.destroy() });
    const p = this.add.particles(x, y, 'pix', {
      speed: { min: 100, max: 320 }, scale: { start: 2.5, end: 0 },
      lifespan: 600, quantity: 24, tint: [color, 0xffffff, 0xffff00], blendMode: 'ADD',
    }).setDepth(10);
    this.time.delayedCall(650, () => p.destroy());
  }

  popText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontSize: '20px', fontFamily: 'Comic Sans MS, sans-serif',
      color, stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  // Grande scritta meme al centro dello schermo (HUD, scrollFactor 0)
  flashMeme(text, duration = 1000) {
    const t = this.add.text(CANVAS / 2, CANVAS * 0.32, text, {
      fontSize: '40px', fontFamily: 'Comic Sans MS, sans-serif',
      color: '#ffdd00', stroke: '#ff0066', strokeThickness: 7, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back' });
    this.tweens.add({ targets: t, alpha: 0, delay: duration, duration: 300, onComplete: () => t.destroy() });
  }

  // --- Eventi casuali ---
  startRandomEvent() {
    if (this.matchOver) return;
    const ev = RND.pick(EVENTS);
    this.eventActive = ev.id;
    this.flashMeme(ev.text, 1800);
    SFX.event();
    this.cameras.main.flash(300, 255, 200, 0);

    // Effetti che durano ~10 secondi
    switch (ev.id) {
      case 'giants':
        this.fighters.forEach(f => { if (f.alive) { f.sprite.setDisplaySize(70, 70); f.emoji.setFontSize(46); } });
        this.time.delayedCall(10000, () => this.fighters.forEach(f => {
          if (f.alive) { f.sprite.setDisplaySize(46, 46); f.emoji.setFontSize(30); }
        }));
        break;
      case 'superspeed':
        this.fighters.forEach(f => { if (f.alive) f.speedMult *= 1.8; });
        this.time.delayedCall(10000, () => this.fighters.forEach(f => { if (f.alive) f.speedMult /= 1.8; }));
        break;
      case 'ice':
        this.globalIce = true;
        this.fighters.forEach(f => f.alive && f.sprite.setDrag(150, 150));
        this.time.delayedCall(10000, () => {
          this.globalIce = false;
          this.fighters.forEach(f => f.alive && f.sprite.setDrag(900, 900));
        });
        break;
      case 'disco':
        this.discoUntil = this.time.now + 10000;
        this.discoBg = true; // segnala che va ripristinato lo sfondo a fine evento
        break;
      case 'gravity':
        // Spinte casuali ripetute a tutti (gravità impazzita)
        this.gravityEvent = this.time.addEvent({ delay: 400, repeat: 24, callback: () => {
          this.fighters.forEach(f => { if (f.alive) f.sprite.setVelocity(RND.int(-300, 300), RND.int(-300, 300)); });
        }});
        break;
      case 'chickens':
        // Polli esplosivi che cadono in punti casuali
        this.hazardWave('🐔', 14, 60, 22);
        break;
      case 'meteors':
        this.hazardWave('☄️', 12, 90, 35);
        break;
      case 'tornado':
        this.spawnTornado();
        break;
    }
  }

  // Ondata di pericoli che cadono (polli/meteoriti) con avviso a terra
  hazardWave(emoji, count, radius, dmg) {
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 450, () => {
        if (this.matchOver) return;
        const x = RND.int(80, WORLD - 80), y = RND.int(80, WORLD - 80);
        const warn = this.add.circle(x, y, radius, 0xff0000, 0.25).setStrokeStyle(3, 0xff0000).setDepth(4);
        this.time.delayedCall(700, () => {
          warn.destroy();
          if (this.matchOver) return;
          const e = this.add.text(x, y, emoji, { fontSize: '40px' }).setOrigin(0.5).setDepth(10);
          this.spawnShockwave(x, y, radius, 0xff6600);
          this.tweens.add({ targets: e, alpha: 0, scale: 1.6, duration: 500, onComplete: () => e.destroy() });
          for (const f of this.fighters) {
            if (!f.alive) continue;
            if (Phaser.Math.Distance.Between(x, y, f.x, f.y) < radius) f.takeDamage(dmg, null);
          }
        });
      });
    }
  }

  spawnTornado() {
    // Un vortice che si muove e attira/danneggia chi è vicino
    const tornado = { x: RND.int(300, WORLD - 300), y: RND.int(300, WORLD - 300), vx: RND.int(-80, 80), vy: RND.int(-80, 80) };
    const spr = this.add.text(tornado.x, tornado.y, '🌪️', { fontSize: '70px' }).setOrigin(0.5).setDepth(9);
    const dmgTimer = this.time.addEvent({ delay: 100, repeat: 100, callback: () => {
      tornado.x = Phaser.Math.Clamp(tornado.x + tornado.vx * 0.1, 100, WORLD - 100);
      tornado.y = Phaser.Math.Clamp(tornado.y + tornado.vy * 0.1, 100, WORLD - 100);
      if (Math.random() < 0.03) { tornado.vx = RND.int(-80, 80); tornado.vy = RND.int(-80, 80); }
      spr.setPosition(tornado.x, tornado.y).setAngle(spr.angle + 20);
      for (const f of this.fighters) {
        if (!f.alive) continue;
        const d = Phaser.Math.Distance.Between(tornado.x, tornado.y, f.x, f.y);
        if (d < 120) {
          const a = Phaser.Math.Angle.Between(f.x, f.y, tornado.x, tornado.y);
          f.sprite.setVelocity(Math.cos(a) * 260 - Math.sin(a) * 200, Math.sin(a) * 260 + Math.cos(a) * 200);
          if (Math.random() < 0.05) f.takeDamage(6, null);
        }
      }
    }});
    this.time.delayedCall(10000, () => spr.destroy());
  }

  // Chiamato quando un combattente muore
  onFighterDeath(f) {
    this.rankOfDeath.push(f);
    const alive = this.aliveFighters();

    // Slow-motion quando resta solo un avversario (oltre al giocatore)
    if (!this.slowmoDone && this.player.alive && alive.length === 2) {
      this.slowmoDone = true;
      this.flashMeme('⚔️ ULTIMO NEMICO! ⚔️', 1500);
      this.time.timeScale = 0.45;
      this.tweens.timeScale = 0.45;
      this.time.delayedCall(1400 * 0.45, () => { this.time.timeScale = 1; this.tweens.timeScale = 1; });
    }

    // Fine partita: uno solo vivo, oppure il giocatore è morto
    if (alive.length <= 1 || !this.player.alive) {
      this.time.delayedCall(!this.player.alive ? 900 : 400, () => this.endMatch());
    }
  }

  aliveFighters() { return this.fighters.filter(f => f.alive); }

  endMatch() {
    if (this.matchOver) return;
    this.matchOver = true;
    this.time.timeScale = 1; this.tweens.timeScale = 1;

    // Calcola il piazzamento del giocatore
    const alive = this.aliveFighters();
    const won = this.player.alive && alive.length === 1 && alive[0] === this.player;
    let placement;
    if (this.player.alive) {
      placement = 1; // vincitore (o comunque tra gli ultimi vivi)
    } else {
      // Posizione = totale - (indice di morte)
      const deathIndex = this.rankOfDeath.indexOf(this.player);
      placement = this.totalPlayers - deathIndex;
    }

    // XP: base + kill + bonus piazzamento
    const xp = 20 + this.playerKills * 15 + Math.max(0, (this.totalPlayers - placement) * 3) + (won ? 100 : 0);
    Save.addResult(placement, this.playerKills, xp, won);

    if (won) SFX.win();

    const durationSec = Math.floor((this.time.now - this.startTime) / 1000);

    // Passa alla schermata di fine partita
    this.time.delayedCall(600, () => {
      this.scene.start('GameOverScene', {
        won, placement, kills: this.playerKills, xp,
        total: this.totalPlayers, char: this.playerChar, duration: durationSec,
      });
    });
  }

  // --- Loop principale ---
  update(time, delta) {
    if (this.matchOver) return;

    // Restringimento della zona pericolosa nel tempo
    const elapsed = (time - this.startTime) / 1000;
    const t = Phaser.Math.Clamp(elapsed / ZONE_SHRINK_TIME, 0, 1);
    this.zone.radius = Phaser.Math.Linear(WORLD * 0.72, this.zone.minRadius, t);

    // Aggiorna i combattenti
    for (const f of this.fighters) f.update(delta);

    // Terreno: cespugli e ghiaccio applicati a ogni combattente
    for (const f of this.fighters) {
      if (!f.alive) continue;
      f.hidden = this.bushes.some(b => Phaser.Math.Distance.Between(b.x, b.y, f.x, f.y) < b.r);
      const onIce = this.slippery.some(s => Phaser.Math.Distance.Between(s.x, s.y, f.x, f.y) < s.r);
      if (!this.globalIce) f.sprite.setDrag(onIce ? 120 : 900, onIce ? 120 : 900);
    }

    // Danno da zona pericolosa (fuori dal cerchio sicuro)
    if (Math.floor(time / 500) !== this._lastZoneTick) {
      this._lastZoneTick = Math.floor(time / 500);
      for (const f of this.fighters) {
        if (!f.alive) continue;
        const d = Phaser.Math.Distance.Between(this.zone.x, this.zone.y, f.x, f.y);
        if (d > this.zone.radius) {
          f.takeDamage(5, null);
          if (f.isPlayer) this.cameras.main.flash(120, 120, 0, 0);
        }
      }
    }

    // Raccolta power-up
    for (const pu of this.powerups.slice()) {
      for (const f of this.fighters) {
        if (f.alive && Phaser.Math.Distance.Between(pu.x, pu.y, f.x, f.y) < 34) {
          this.collectPowerup(f, pu);
          break;
        }
      }
    }

    // Aggiorna i proiettili
    this.updateProjectiles(delta);

    // Ridisegna zona, barre vita ed effetti
    this.drawZone();
    this.drawHealthBars();
    this.updateHUD(elapsed);

    // Effetto luci disco
    if (this.discoUntil && time < this.discoUntil) {
      const hue = (time / 5) % 360;
      const col = Phaser.Display.Color.HSVToRGB(hue / 360, 0.6, 0.4).color;
      this.cameras.main.setBackgroundColor(col);
    } else if (this.discoBg !== false) {
      this.cameras.main.setBackgroundColor('#2d1b4e');
      this.discoBg = false;
    }
  }

  updateProjectiles(delta) {
    const dt = delta / 1000;
    for (const p of this.projectiles.slice()) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= delta;
      p.obj.setPosition(p.x, p.y);
      p.obj.angle += 12;

      let hit = false;
      // Collisione coi nemici
      for (const f of this.fighters) {
        if (f === p.owner || !f.alive || p.hitSet.has(f)) continue;
        if (Phaser.Math.Distance.Between(p.x, p.y, f.x, f.y) < 34) {
          if (p.dmg > 0) f.takeDamage(p.dmg, p.owner);
          p.hitSet.add(f);
          hit = !p.explodeOnEnd;
          if (p.explodeOnEnd) { p.life = 0; }
          break;
        }
      }
      // Fuori dai bordi o vita esaurita
      const out = p.x < 0 || p.x > WORLD || p.y < 0 || p.y > WORLD;
      if (hit || out || p.life <= 0) {
        if (p.explodeOnEnd) {
          this.spawnShockwave(p.x, p.y, p.explodeOnEnd * 2, 0xff8800);
          for (const f of this.fighters) {
            if (f === p.owner || !f.alive) continue;
            if (Phaser.Math.Distance.Between(p.x, p.y, f.x, f.y) < p.explodeOnEnd * 2) f.takeDamage(30, p.owner);
          }
        }
        p.obj.destroy();
        this.projectiles = this.projectiles.filter(x => x !== p);
      }
    }
  }

  drawZone() {
    const g = this.zoneGfx;
    g.clear();
    // Area pericolosa: tutto ciò che sta FUORI dal cerchio, colorato di rosso
    g.fillStyle(0xff0033, 0.18);
    g.fillRect(0, 0, WORLD, WORLD);
    // "Buco" sicuro: ridisegna lo sfondo dentro il cerchio
    g.fillStyle(0x2d1b4e, 0.0); // trasparente (usiamo un cerchio di taglio via blend)
    // Bordo della zona sicura pulsante
    const pulse = 4 + Math.sin(this.time.now / 200) * 2;
    g.lineStyle(pulse, 0x00ffff, 0.9);
    g.strokeCircle(this.zone.x, this.zone.y, this.zone.radius);
    // Maschera: disegniamo il cerchio sicuro con il colore di sfondo per "bucare" il rosso
    g.fillStyle(0x2d1b4e, 0.18);
    g.fillCircle(this.zone.x, this.zone.y, this.zone.radius);
  }

  drawHealthBars() {
    const g = this.hpGfx;
    g.clear();
    for (const f of this.fighters) {
      if (!f.alive) continue;
      const w = 40, h = 6;
      const x = f.x - w / 2, y = f.y - 26;
      const ratio = Phaser.Math.Clamp(f.hp / f.maxHp, 0, 1);
      g.fillStyle(0x000000, 0.6).fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle(0x333333, 1).fillRect(x, y, w, h);
      const col = ratio > 0.5 ? 0x00ff66 : ratio > 0.25 ? 0xffcc00 : 0xff3333;
      g.fillStyle(col, 1).fillRect(x, y, w * ratio, h);
      // Indicatore scudo
      if (this.time.now < f.shieldUntil) {
        g.lineStyle(2, 0x33aaff, 1).strokeCircle(f.x, f.y, 28);
      }
    }
  }

  updateHUD(elapsed) {
    const alive = this.aliveFighters().length;
    const min = Math.floor(elapsed / 60);
    const sec = Math.floor(elapsed % 60).toString().padStart(2, '0');
    this.hudTimer.setText(`⏱️ ${min}:${sec}`);
    this.hudAlive.setText(`👥 Vivi: ${alive}/${this.totalPlayers}`);
    this.hudKills.setText(`💀 Kill: ${this.playerKills}`);

    // Cooldown speciale del giocatore
    const remain = Math.max(0, (this.player.specialCd - this.time.now) / 1000);
    this.hudSpecial.setText(remain > 0 ? `✨ ${remain.toFixed(1)}s` : '✨ PRONTA (E)');
    this.hudSpecial.setColor(remain > 0 ? '#888888' : '#00ff66');

    if (this.player.alive) {
      this.hudHpLabel.setText(`❤️ ${Math.max(0, Math.ceil(this.player.hp))}/${this.player.maxHp}`);
    } else {
      this.hudHpLabel.setText('💀 ELIMINATO - guarda il finale!');
    }
  }
}

/* ============================================================
   5d. GAME OVER SCENE — risultato, XP, classifica, condivisione
   ============================================================ */
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.result = data; }

  create() {
    const r = this.result;
    const cx = CANVAS / 2;
    this.cameras.main.setBackgroundColor(r.won ? '#003322' : '#330011');

    const title = r.won ? '🏆 VITTORIA REALE! 🏆' : '☠️ ELIMINATO ☠️';
    this.add.text(cx, 70, title, {
      fontSize: '48px', fontFamily: 'Comic Sans MS, sans-serif',
      color: r.won ? '#ffdd00' : '#ff5555', stroke: '#000', strokeThickness: 7,
    }).setOrigin(0.5);

    this.add.text(cx, 130, r.won ? 'Sei l\'ultimo brainrot in vita! 🔥' : `Ti sei piazzato #${r.placement} su ${r.total}`, {
      fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 165, r.char.emoji, { fontSize: '60px' }).setOrigin(0.5);

    // Riepilogo partita (replay testuale)
    const dur = `${Math.floor(r.duration / 60)}:${(r.duration % 60).toString().padStart(2, '0')}`;
    this.summary =
      `📊 RIEPILOGO PARTITA\n` +
      `Personaggio: ${r.char.name}\n` +
      `Piazzamento: #${r.placement} / ${r.total}\n` +
      `Eliminazioni: ${r.kills}\n` +
      `Durata sopravvivenza: ${dur}\n` +
      `XP guadagnati: +${r.xp}\n` +
      `XP totali: ${Save.data.xp}`;
    this.add.text(cx, 300, this.summary, {
      fontSize: '19px', color: '#ffffff', align: 'center', lineSpacing: 7,
    }).setOrigin(0.5);

    // Notifica nuove skin sbloccate
    const nextLocked = SKINS.find(s => Save.data.xp < s.xp);
    if (nextLocked) {
      this.add.text(cx, 415, `🎨 Prossima skin "${nextLocked.name}" a ${nextLocked.xp} XP (mancano ${nextLocked.xp - Save.data.xp})`,
        { fontSize: '15px', color: '#88ffdd' }).setOrigin(0.5);
    } else {
      this.add.text(cx, 415, '🎨 Hai sbloccato TUTTE le skin! Leggenda!', { fontSize: '15px', color: '#ffdd00' }).setOrigin(0.5);
    }

    // Classifica locale (migliori partite)
    let lb = '🏅 MIGLIORI PARTITE (locale)\n';
    Save.data.leaderboard.slice(0, 5).forEach((e, i) => {
      lb += `${i + 1}. #${e.placement} — ${e.kills} kill — ${e.xp} XP\n`;
    });
    this.add.text(cx, 500, lb, { fontSize: '15px', color: '#ffcc66', align: 'center', lineSpacing: 4 }).setOrigin(0.5);

    // Pulsanti
    this.makeButton(cx - 170, 630, '🔁 GIOCA ANCORA', 0x33aa55, () => this.scene.start('SelectScene'));
    this.makeButton(cx + 20, 630, '🏠 MENU', 0x5533aa, () => this.scene.start('MenuScene'), 160);
    this.copyBtn = this.makeButton(cx + 190, 630, '📋 CONDIVIDI', 0xaa5533, () => this.copyResult(), 190);

    if (r.won) this.winConfetti();
  }

  makeButton(x, y, label, color, cb, w = 220) {
    const h = 56;
    const g = this.add.graphics();
    g.fillStyle(color, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    g.lineStyle(3, 0xffffff).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    const t = this.add.text(x, y, label, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => t.setScale(1.08));
    zone.on('pointerout', () => t.setScale(1));
    zone.on('pointerdown', cb);
    return t;
  }

  // Copia il risultato negli appunti per condividerlo sui social
  copyResult() {
    const r = this.result;
    const text =
      `🍕 GINOPIZZA BATTLE ROYALE 🍕\n` +
      `${r.won ? '🏆 VITTORIA REALE!' : `Piazzamento #${r.placement}/${r.total}`}\n` +
      `Personaggio: ${r.char.emoji} ${r.char.name}\n` +
      `💀 ${r.kills} eliminazioni | ⭐ +${r.xp} XP\n` +
      `Battimi se ci riesci! #GinopizzaBattleRoyale`;
    const done = () => { this.copyBtn.setText('✅ COPIATO!'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text, done));
    } else {
      this.fallbackCopy(text, done);
    }
  }

  fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { this.copyBtn.setText('❌ Copia manuale'); }
    document.body.removeChild(ta);
  }

  winConfetti() {
    for (let i = 0; i < 30; i++) {
      const e = this.add.text(Math.random() * CANVAS, -30, RND.pick(['🎉', '⭐', '🍕', '🏆', '✨']), { fontSize: '30px' });
      this.tweens.add({
        targets: e, y: CANVAS + 30, x: e.x + RND.int(-100, 100),
        duration: RND.int(2000, 4000), repeat: -1, delay: RND.int(0, 2000),
      });
    }
  }
}

/* ============================================================
   6. CONFIGURAZIONE E AVVIO
   ============================================================ */
const config = {
  type: Phaser.AUTO,
  width: CANVAS,
  height: CANVAS,
  parent: 'game-container',
  backgroundColor: '#12002e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, SelectScene, GameScene, GameOverScene],
};

// Sblocca l'audio al primo tocco/click (policy dei browser)
window.addEventListener('pointerdown', () => SFX.init(), { once: true });

// Avvia il gioco
const game = new Phaser.Game(config);
