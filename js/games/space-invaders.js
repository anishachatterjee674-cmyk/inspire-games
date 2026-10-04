/**
 * Space Invaders: Galaxy Strike
 * Retro Sci-Fi Arcade Shooter
 * Inspire Games
 */

class SpaceInvadersGame {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.active = false;
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.highScore = parseInt(localStorage.getItem('inspire_space_high') || '0', 10);
    this.gameOver = false;
    this.paused = false;

    this.player = {
      x: 350,
      y: 520,
      w: 42,
      h: 22,
      speed: 360,
      shootCooldown: 0
    };

    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.bunkers = [];
    this.particles = [];
    this.ufo = null;
    this.ufoTimer = 15;

    this.enemyDir = 1; // 1: right, -1: left
    this.enemyStepDown = false;
    this.enemySpeed = 40;

    this.keysDown = {};

    this.initEvents();
    this.resize();
    this.start();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width || 750;
    this.canvas.height = rect.height || 600;
  }

  initEvents() {
    this.onKeyDown = (e) => {
      this.keysDown[e.key.toLowerCase()] = true;
      if (e.key === ' ' && this.gameOver) {
        this.restart();
      }
    };

    this.onKeyUp = (e) => {
      this.keysDown[e.key.toLowerCase()] = false;
    };

    // Touch controls
    this.onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.player.x = e.touches[0].clientX - rect.left - this.player.w / 2;
      }
    };

    this.onTouchStart = (e) => {
      if (this.gameOver) {
        this.restart();
        return;
      }
      this.shoot();
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
  }

  start() {
    this.active = true;
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.player.x = this.canvas.width / 2 - this.player.w / 2;
    this.bullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.ufo = null;
    this.ufoTimer = 12;

    this.initWave();
    this.initBunkers();

    this.lastTime = performance.now();
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

  initWave() {
    this.enemies = [];
    this.enemyDir = 1;
    this.enemySpeed = 35 + this.wave * 10;

    const rows = 5;
    const cols = 10;
    const spacingX = 45;
    const spacingY = 35;
    const startX = 60;
    const startY = 80;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = 'grunt';
        let points = 10;
        let color = '#38bdf8';

        if (r === 0) {
          type = 'commander';
          points = 40;
          color = '#ec4899';
        } else if (r <= 2) {
          type = 'striker';
          points = 20;
          color = '#a855f7';
        }

        this.enemies.push({
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          w: 28,
          h: 22,
          type,
          points,
          color,
          alive: true
        });
      }
    }
  }

  initBunkers() {
    this.bunkers = [];
    const count = 4;
    const spacing = this.canvas.width / (count + 1);

    for (let i = 1; i <= count; i++) {
      this.bunkers.push({
        x: spacing * i - 25,
        y: 450,
        w: 50,
        h: 30,
        hp: 12
      });
    }
  }

  shoot() {
    if (this.bullets.length >= 3 || this.player.shootCooldown > 0) return;
    this.player.shootCooldown = 0.22;

    this.bullets.push({
      x: this.player.x + this.player.w / 2 - 2,
      y: this.player.y - 8,
      w: 4,
      h: 14,
      vy: -600,
      color: '#38bdf8'
    });

    if (window.sound) window.sound.playGunshot();
  }

  update(dt) {
    if (this.gameOver) return;

    if (this.player.shootCooldown > 0) {
      this.player.shootCooldown -= dt;
    }

    // Player Movement
    let dx = 0;
    if (this.keysDown['arrowleft'] || this.keysDown['a']) dx -= 1;
    if (this.keysDown['arrowright'] || this.keysDown['d']) dx += 1;
    if (this.keysDown[' '] || this.keysDown['arrowup'] || this.keysDown['w']) {
      this.shoot();
    }

    this.player.x += dx * this.player.speed * dt;
    this.player.x = Math.max(10, Math.min(this.canvas.width - this.player.w - 10, this.player.x));

    // Update Player Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * dt;

      // Hit enemies
      let hit = false;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (
          b.x + b.w > enemy.x &&
          b.x < enemy.x + enemy.w &&
          b.y < enemy.y + enemy.h &&
          b.y + b.h > enemy.y
        ) {
          enemy.alive = false;
          hit = true;
          this.score += enemy.points;
          if (window.sound) window.sound.playBubblePop(1.5);
          this.spawnExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color);
          break;
        }
      }

      // Hit UFO
      if (this.ufo && !hit) {
        if (
          b.x + b.w > this.ufo.x &&
          b.x < this.ufo.x + this.ufo.w &&
          b.y < this.ufo.y + this.ufo.h &&
          b.y + b.h > this.ufo.y
        ) {
          hit = true;
          this.score += 200;
          this.spawnExplosion(this.ufo.x + this.ufo.w / 2, this.ufo.y + this.ufo.h / 2, '#ef4444');
          this.ufo = null;
          if (window.sound) window.sound.playVictory();
        }
      }

      // Hit bunkers
      if (!hit) {
        for (const bk of this.bunkers) {
          if (bk.hp <= 0) continue;
          if (b.x + b.w > bk.x && b.x < bk.x + bk.w && b.y < bk.y + bk.h && b.y + b.h > bk.y) {
            hit = true;
            bk.hp--;
            break;
          }
        }
      }

      if (hit || b.y < 0) {
        this.bullets.splice(i, 1);
      }
    }

    // Update UFO Mothership
    this.ufoTimer -= dt;
    if (this.ufoTimer <= 0 && !this.ufo) {
      this.ufo = { x: -60, y: 55, w: 50, h: 20, vx: 140 };
      this.ufoTimer = 20;
    }
    if (this.ufo) {
      this.ufo.x += this.ufo.vx * dt;
      if (this.ufo.x > this.canvas.width + 60) {
        this.ufo = null;
      }
    }

    // Update Enemy Invaders formation
    const aliveEnemies = this.enemies.filter((e) => e.alive);
    if (aliveEnemies.length === 0) {
      // Wave cleared!
      this.wave++;
      this.initWave();
      if (window.sound) window.sound.playVictory();
      return;
    }

    // Check edges
    let reachEdge = false;
    for (const e of aliveEnemies) {
      if ((this.enemyDir === 1 && e.x + e.w > this.canvas.width - 20) || (this.enemyDir === -1 && e.x < 20)) {
        reachEdge = true;
        break;
      }
    }

    if (reachEdge) {
      this.enemyDir *= -1;
      aliveEnemies.forEach((e) => {
        e.y += 18;
      });
      // Accelerate as count reduces
      this.enemySpeed += 5;
    } else {
      aliveEnemies.forEach((e) => {
        e.x += this.enemyDir * this.enemySpeed * dt;
      });
    }

    // Enemy shooting
    if (Math.random() < 0.035 && aliveEnemies.length > 0) {
      const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      this.enemyBullets.push({
        x: shooter.x + shooter.w / 2 - 2,
        y: shooter.y + shooter.h,
        w: 4,
        h: 12,
        vy: 320,
        color: '#ef4444'
      });
    }

    // Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.y += eb.vy * dt;

      // Hit Player
      if (
        eb.x + eb.w > this.player.x &&
        eb.x < this.player.x + this.player.w &&
        eb.y + eb.h > this.player.y &&
        eb.y < this.player.y + this.player.h
      ) {
        this.lives--;
        this.spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#38bdf8');
        if (window.sound) window.sound.playCrash();
        this.enemyBullets.splice(i, 1);

        if (this.lives <= 0) {
          this.endGame();
        }
        continue;
      }

      // Hit bunkers
      let bkHit = false;
      for (const bk of this.bunkers) {
        if (bk.hp <= 0) continue;
        if (eb.x + eb.w > bk.x && eb.x < bk.x + bk.w && eb.y < bk.y + bk.h && eb.y + eb.h > bk.y) {
          bkHit = true;
          bk.hp--;
          break;
        }
      }

      if (bkHit || eb.y > this.canvas.height) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // Invaders reached bunker line -> Game Over
    for (const e of aliveEnemies) {
      if (e.y + e.h >= this.player.y) {
        this.endGame();
        break;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  spawnExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color,
        life: 0.35
      });
    }
  }

  endGame() {
    this.gameOver = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('inspire_space_high', this.score);
    }
    if (window.sound) window.sound.playGameOver();
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Deep space background with twinkling stars
    ctx.fillStyle = '#050714';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 97) % w;
      const sy = (i * 131) % h;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Top HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, 40);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(0, 0, w, 40);

    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SCORE: ${this.score}`, 15, 26);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`WAVE: ${this.wave}`, 180, 26);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`BEST: ${this.highScore}`, 280, 26);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`LIVES: ${'♥ '.repeat(Math.max(0, this.lives))}`, w - 15, 26);
    ctx.textAlign = 'left';

    // Draw UFO
    if (this.ufo) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(this.ufo.x + this.ufo.w / 2, this.ufo.y + this.ufo.h / 2, this.ufo.w / 2, this.ufo.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(this.ufo.x + this.ufo.w / 2, this.ufo.y + 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Enemies
    this.enemies.forEach((e) => {
      if (!e.alive) return;
      ctx.save();
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 8;

      // Alien Crab / Squid pixel shape
      ctx.fillRect(e.x + 4, e.y, e.w - 8, e.h - 6);
      ctx.fillRect(e.x, e.y + 4, e.w, e.h - 10);
      // Legs
      ctx.fillRect(e.x + 2, e.y + e.h - 6, 4, 6);
      ctx.fillRect(e.x + e.w - 6, e.y + e.h - 6, 4, 6);
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(e.x + 6, e.y + 6, 4, 4);
      ctx.fillRect(e.x + e.w - 10, e.y + 6, 4, 4);
      ctx.restore();
    });

    // Draw Bunkers
    this.bunkers.forEach((bk) => {
      if (bk.hp <= 0) return;
      ctx.save();
      const alpha = Math.max(0.2, bk.hp / 12);
      ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
      ctx.restore();
    });

    // Draw Bullets
    ctx.fillStyle = '#38bdf8';
    this.bullets.forEach((b) => {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    ctx.fillStyle = '#ef4444';
    this.enemyBullets.forEach((eb) => {
      ctx.fillRect(eb.x, eb.y, eb.w, eb.h);
    });

    // Draw Player Ship
    const p = this.player;
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    // Ship hull
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, p.y);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.lineTo(p.x, p.y + p.h);
    ctx.closePath();
    ctx.fill();
    // Cannon turret
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.x + p.w / 2 - 2, p.y - 4, 4, 6);
    ctx.restore();

    // Draw Particles
    this.particles.forEach((pt) => {
      ctx.save();
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Game Over Overlay
    if (this.gameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.font = '900 42px "Orbitron", sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('INVASION FAILED!', w / 2, h * 0.4);

      ctx.font = '22px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Score: ${this.score} | Wave: ${this.wave}`, w / 2, h * 0.52);

      ctx.font = 'bold 16px "Orbitron", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('PRESS SPACE OR TAP TO RETRY', w / 2, h * 0.65);
      ctx.restore();
    }
  }

  restart() {
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
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
  }
}

window.SpaceInvadersGame = SpaceInvadersGame;
