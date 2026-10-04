/**
 * Bottle Shooter - Arcade Shooting Gallery
 * Inspire Games
 */

class BottleShooterGame {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.active = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('inspire_bottle_high') || '0', 10);
    this.bullets = 6;
    this.maxBullets = 6;
    this.isReloading = false;
    this.timeLeft = 60;
    this.gameOver = false;
    this.paused = false;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.combo = 0;
    this.maxCombo = 0;

    // Crosshair coordinates
    this.crosshair = { x: 400, y: 300, kickback: 0 };
    this.muzzleFlashes = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bottles = [];

    // Shelves configuration
    this.shelves = [];

    this.initEvents();
    this.resize();
    this.start();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 600;
    this.initShelves();
  }

  initShelves() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.shelves = [
      { y: h * 0.42, height: 16, depth: 0.7, speed: 0.8 },
      { y: h * 0.65, height: 20, depth: 1.0, speed: -1.2 },
      { y: h * 0.85, height: 24, depth: 1.3, speed: 0 } // static foreground shelf
    ];
  }

  initEvents() {
    this.onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.crosshair.x = e.clientX - rect.left;
      this.crosshair.y = e.clientY - rect.top;
    };

    this.onMouseDown = (e) => {
      if (this.gameOver || this.paused) return;
      this.shoot();
    };

    this.onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.crosshair.x = e.touches[0].clientX - rect.left;
        this.crosshair.y = e.touches[0].clientY - rect.top;
      }
    };

    this.onTouchStart = (e) => {
      if (this.gameOver || this.paused) return;
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.crosshair.x = e.touches[0].clientX - rect.left;
        this.crosshair.y = e.touches[0].clientY - rect.top;
        this.shoot();
      }
    };

    this.onKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.reload();
      }
      if (e.key === ' ' && this.gameOver) {
        this.restart();
      }
    };

    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);
  }

  start() {
    this.active = true;
    this.score = 0;
    this.bullets = this.maxBullets;
    this.isReloading = false;
    this.timeLeft = 60;
    this.gameOver = false;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.combo = 0;
    this.bottles = [];
    this.particles = [];
    this.floatingTexts = [];

    // Populate initial bottles
    for (let i = 0; i < 9; i++) {
      this.spawnBottle();
    }

    this.lastTime = performance.now();
    this.timerInterval = setInterval(() => {
      if (!this.paused && !this.gameOver) {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }
    }, 1000);

    this.loop = (now) => {
      if (!this.active) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (!this.paused) {
        this.update(dt);
      }
      this.render();
      requestAnimationFrame(this.loop);
    };
    requestAnimationFrame(this.loop);
  }

  spawnBottle() {
    const shelfIndex = Math.floor(Math.random() * this.shelves.length);
    const shelf = this.shelves[shelfIndex];
    if (!shelf) return;

    const types = [
      { name: 'green', color: '#10b981', points: 100, hp: 1, radius: 24, label: 'SODA' },
      { name: 'amber', color: '#f59e0b', points: 150, hp: 1, radius: 22, label: 'ALE' },
      { name: 'blue', color: '#06b6d4', points: 200, hp: 1, radius: 20, label: 'POTION' },
      { name: 'tnt', color: '#ef4444', points: 300, hp: 1, radius: 26, isBomb: true, label: 'TNT' },
      { name: 'gold', color: '#fbbf24', points: 500, hp: 1, radius: 18, isGold: true, label: 'GOLD' }
    ];

    const rand = Math.random();
    let type = types[0];
    if (rand < 0.1) type = types[4]; // gold
    else if (rand < 0.25) type = types[3]; // tnt
    else if (rand < 0.5) type = types[2]; // blue
    else if (rand < 0.75) type = types[1]; // amber

    const scale = shelf.depth;
    const width = 36 * scale;
    const height = 75 * scale;
    const x = Math.random() * (this.canvas.width - 100) + 50;
    const y = shelf.y - height;

    this.bottles.push({
      x,
      y,
      baseY: shelf.y,
      width,
      height,
      shelfIndex,
      type,
      scale,
      vx: shelf.speed * (0.8 + Math.random() * 0.4),
      sway: Math.random() * Math.PI * 2,
      hit: false
    });
  }

  shoot() {
    if (this.isReloading) return;

    if (this.bullets <= 0) {
      if (window.sound) window.sound.playClick();
      this.reload();
      return;
    }

    this.bullets--;
    this.shotsFired++;
    if (window.sound) window.sound.playGunshot();

    // Kickback effect on crosshair
    this.crosshair.kickback = 12;

    // Add muzzle flash
    this.muzzleFlashes.push({
      x: this.crosshair.x,
      y: this.crosshair.y,
      radius: 40 + Math.random() * 20,
      life: 0.08
    });

    // Check hit
    let hitAny = false;
    // Iterate from top to bottom (closest/highest depth first)
    const sortedBottles = [...this.bottles].sort((a, b) => b.scale - a.scale);

    for (const bottle of sortedBottles) {
      if (bottle.hit) continue;

      const hitBoxPadding = 12;
      if (
        this.crosshair.x >= bottle.x - hitBoxPadding &&
        this.crosshair.x <= bottle.x + bottle.width + hitBoxPadding &&
        this.crosshair.y >= bottle.y - hitBoxPadding &&
        this.crosshair.y <= bottle.y + bottle.height + hitBoxPadding
      ) {
        // HIT!
        hitAny = true;
        this.shotsHit++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        this.shatterBottle(bottle);

        if (bottle.type.isBomb) {
          // Explode neighboring bottles
          this.explodeTNT(bottle.x + bottle.width / 2, bottle.y + bottle.height / 2);
        }
        break; // One bullet hits one bottle
      }
    }

    if (!hitAny) {
      this.combo = 0;
      // Bullet hole in the back wall
      this.particles.push({
        type: 'dust',
        x: this.crosshair.x,
        y: this.crosshair.y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        radius: 4,
        life: 0.3,
        maxLife: 0.3,
        color: '#94a3b8'
      });
    }

    if (this.bullets === 0) {
      setTimeout(() => this.reload(), 250);
    }
  }

  explodeTNT(centerX, centerY) {
    const explosionRadius = 180;
    // Explosion particles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 300 + 100;
      this.particles.push({
        type: 'fire',
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 8 + 4,
        color: ['#f97316', '#ef4444', '#fbbf24'][Math.floor(Math.random() * 3)],
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }

    // Hit nearby bottles
    this.bottles.forEach((b) => {
      if (b.hit) return;
      const bx = b.x + b.width / 2;
      const by = b.y + b.height / 2;
      const dist = Math.hypot(bx - centerX, by - centerY);
      if (dist <= explosionRadius) {
        this.shatterBottle(b);
      }
    });
  }

  shatterBottle(bottle) {
    bottle.hit = true;
    if (window.sound) window.sound.playBottleShatter();

    const mult = Math.min(this.combo, 5);
    const addedPoints = bottle.type.points * (mult > 1 ? mult : 1);
    this.score += addedPoints;

    // Floating text
    this.floatingTexts.push({
      x: bottle.x + bottle.width / 2,
      y: bottle.y,
      text: `+${addedPoints}` + (mult > 1 ? ` (${mult}x)` : ''),
      color: bottle.type.isGold ? '#fbbf24' : '#38bdf8',
      life: 0.8,
      maxLife: 0.8
    });

    // Glass shards particles
    const shardCount = 20;
    for (let i = 0; i < shardCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 220 + 80;
      this.particles.push({
        type: 'shard',
        x: bottle.x + bottle.width / 2 + (Math.random() - 0.5) * bottle.width,
        y: bottle.y + bottle.height / 2 + (Math.random() - 0.5) * bottle.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100, // burst upwards
        angle: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 15,
        size: Math.random() * 8 + 4,
        color: bottle.type.color,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }

    // Remove bottle and schedule replacement
    this.bottles = this.bottles.filter((b) => b !== bottle);
    setTimeout(() => {
      if (this.active && !this.gameOver) {
        this.spawnBottle();
      }
    }, 800 + Math.random() * 1000);
  }

  reload() {
    if (this.isReloading || this.bullets === this.maxBullets) return;
    this.isReloading = true;
    if (window.sound) window.sound.playReload();

    setTimeout(() => {
      this.bullets = this.maxBullets;
      this.isReloading = false;
    }, 800);
  }

  update(dt) {
    // Crosshair kickback decay
    if (this.crosshair.kickback > 0) {
      this.crosshair.kickback = Math.max(0, this.crosshair.kickback - dt * 60);
    }

    // Update muzzle flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      this.muzzleFlashes[i].life -= dt;
      if (this.muzzleFlashes[i].life <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }

    // Update bottles
    this.bottles.forEach((b) => {
      b.x += b.vx * 60 * dt;
      b.sway += dt * 3;
      // Bounce or wrap
      if (b.x < 30) {
        b.x = 30;
        b.vx *= -1;
      } else if (b.x > this.canvas.width - b.width - 30) {
        b.x = this.canvas.width - b.width - 30;
        b.vx *= -1;
      }
    });

    // Replenish bottles if too few
    if (this.bottles.length < 6) {
      this.spawnBottle();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'shard') {
        p.vy += 450 * dt; // gravity
        p.angle += p.vRot * dt;
      } else if (p.type === 'fire') {
        p.vy -= 120 * dt; // upward draft
        p.radius = Math.max(1, p.radius - dt * 10);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 45;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Background Gallery Wall
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Brick / wood panel background pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Target Range Neon Accent Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // 2. Draw Shelves
    this.shelves.forEach((shelf) => {
      // Shelf shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(20, shelf.y + shelf.height, w - 40, 15);

      // Wooden shelf body
      const shelfGrad = ctx.createLinearGradient(0, shelf.y, 0, shelf.y + shelf.height);
      shelfGrad.addColorStop(0, '#78350f');
      shelfGrad.addColorStop(0.3, '#92400e');
      shelfGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = shelfGrad;
      ctx.fillRect(20, shelf.y, w - 40, shelf.height);

      // Shelf rim highlight
      ctx.fillStyle = '#b45309';
      ctx.fillRect(20, shelf.y, w - 40, 3);
    });

    // 3. Draw Bottles
    this.bottles.forEach((b) => {
      this.drawBottle(b);
    });

    // 4. Draw Particles
    this.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      if (p.type === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-p.size / 2, -p.size / 2);
        ctx.lineTo(p.size / 2, -p.size / 4);
        ctx.lineTo(0, p.size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else if (p.type === 'fire') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 5. Muzzle flashes
    this.muzzleFlashes.forEach((f) => {
      ctx.save();
      const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      flashGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.7)');
      flashGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.4)');
      flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Floating Score Texts
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.font = 'bold 20px "Orbitron", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 7. Tactical Crosshair
    this.drawCrosshair();

    // 8. HUD & UI Elements
    this.drawHUD();

    // 9. Game Over Screen
    if (this.gameOver) {
      this.drawGameOver();
    }
  }

  drawBottle(b) {
    const ctx = this.ctx;
    const x = b.x;
    const y = b.y;
    const w = b.width;
    const h = b.height;

    ctx.save();
    // Glass glow
    ctx.shadowColor = b.type.color;
    ctx.shadowBlur = 10;

    // Bottle Neck
    const neckW = w * 0.35;
    const neckH = h * 0.3;
    const bodyH = h * 0.7;

    // Body Gradient
    const bodyGrad = ctx.createLinearGradient(x, y, x + w, y);
    bodyGrad.addColorStop(0, b.type.color);
    bodyGrad.addColorStop(0.4, '#ffffffaa');
    bodyGrad.addColorStop(0.8, b.type.color);
    bodyGrad.addColorStop(1, '#00000088');

    // Draw Neck
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x + (w - neckW) / 2, y, neckW, neckH);

    // Draw Cap / Rim
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + (w - neckW * 1.2) / 2, y - 4, neckW * 1.2, 5);

    // Draw Shoulder & Main Bottle Body
    ctx.beginPath();
    ctx.moveTo(x + (w - neckW) / 2, y + neckH);
    ctx.quadraticCurveTo(x, y + neckH + 10, x, y + neckH + 18);
    ctx.lineTo(x, y + h - 5);
    ctx.quadraticCurveTo(x, y + h, x + 6, y + h);
    ctx.lineTo(x + w - 6, y + h);
    ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - 5);
    ctx.lineTo(x + w, y + neckH + 18);
    ctx.quadraticCurveTo(x + w, y + neckH + 10, x + (w + neckW) / 2, y + neckH);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Label on bottle
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(9, Math.floor(10 * b.scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.type.label, x + w / 2, y + neckH + bodyH * 0.5);

    ctx.restore();
  }

  drawCrosshair() {
    const ctx = this.ctx;
    const ch = this.crosshair;
    const r = 24 + ch.kickback;

    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;

    // Outer circle
    ctx.beginPath();
    ctx.arc(ch.x, ch.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ch.x, ch.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Crosshairs lines
    ctx.beginPath();
    ctx.moveTo(ch.x - r - 8, ch.y);
    ctx.lineTo(ch.x - r + 6, ch.y);
    ctx.moveTo(ch.x + r - 6, ch.y);
    ctx.lineTo(ch.x + r + 8, ch.y);

    ctx.moveTo(ch.x, ch.y - r - 8);
    ctx.lineTo(ch.x, ch.y - r + 6);
    ctx.moveTo(ch.x, ch.y + r - 6);
    ctx.lineTo(ch.x, ch.y + r + 8);
    ctx.stroke();

    ctx.restore();
  }

  drawHUD() {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();
    // Top Bar Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, 55);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 55);

    // Score
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SCORE: ${this.score}`, 25, 34);

    // High Score
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "Orbitron", sans-serif';
    ctx.fillText(`BEST: ${this.highScore}`, 200, 34);

    // Combo
    if (this.combo > 1) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 16px "Orbitron", sans-serif';
      ctx.fillText(`COMBO x${this.combo}!`, 340, 34);
    }

    // Time Remaining
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.fillStyle = this.timeLeft <= 10 ? '#ef4444' : '#10b981';
    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${this.timeLeft}s`, w - 180, 34);

    // Bullets Chamber (Revolver UI)
    const chamberX = w - 140;
    const chamberY = 27;
    for (let i = 0; i < this.maxBullets; i++) {
      ctx.beginPath();
      ctx.arc(chamberX + i * 20, chamberY, 7, 0, Math.PI * 2);
      if (i < this.bullets) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.fill();
      } else {
        ctx.fillStyle = '#334155';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (this.isReloading) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RELOADING...', w - 80, 50);
    } else if (this.bullets === 0) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 13px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS R TO RELOAD', w - 80, 50);
    }

    ctx.restore();
  }

  drawGameOver() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '900 42px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.fillText('TIME UP!', w / 2, h * 0.32);

    ctx.shadowBlur = 0;
    ctx.font = '22px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${this.score}`, w / 2, h * 0.44);

    const acc = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Accuracy: ${acc}% | Max Combo: ${this.maxCombo}x`, w / 2, h * 0.52);

    if (this.score > this.highScore) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px "Orbitron", sans-serif';
      ctx.fillText('NEW HIGH SCORE!', w / 2, h * 0.6);
    }

    // Play again prompt
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.fillText('TAP OR PRESS SPACE TO PLAY AGAIN', w / 2, h * 0.72);

    ctx.restore();
  }

  endGame() {
    this.gameOver = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('inspire_bottle_high', this.score);
    }
    if (window.sound) window.sound.playGameOver();
  }

  restart() {
    clearInterval(this.timerInterval);
    this.start();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  destroy() {
    this.active = false;
    clearInterval(this.timerInterval);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}

window.BottleShooterGame = BottleShooterGame;
