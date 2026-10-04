/**
 * Temple Run: Relic Escape
 * 3D Perspective Endless Runner
 * Inspire Games
 */

class TempleRunGame {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.active = false;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.highScore = parseInt(localStorage.getItem('inspire_temple_high') || '0', 10);
    this.gameOver = false;
    this.paused = false;

    // Runner physics & state
    this.player = {
      lane: 0, // -1: Left, 0: Center, 1: Right
      targetLane: 0,
      xOffset: 0,
      y: 0,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      runAnim: 0,
      stumble: 0, // 0 to 1 intensity
      hasShield: false,
      hasMagnet: false,
      magnetTimer: 0
    };

    // Beast / Demon Gorilla chasing behind
    this.beast = {
      distBehind: 120, // Distance behind player (shorter = closer)
      roarTimer: 0
    };

    this.speed = 420;
    this.baseSpeed = 420;

    // Track segments & Obstacles
    this.segments = [];
    this.coinsList = [];
    this.obstacles = [];
    this.particles = [];

    this.initEvents();
    this.resize();
    this.start();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 600;
  }

  initEvents() {
    this.onKeyDown = (e) => {
      if (this.gameOver) {
        if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
          this.restart();
        }
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.changeLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.changeLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.slide();
      }
    };

    // Touch Swipe handling
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.onTouchStart = (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    };

    this.onTouchEnd = (e) => {
      if (this.gameOver) {
        this.restart();
        return;
      }
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 30) this.changeLane(1);
          else if (dx < -30) this.changeLane(-1);
        } else {
          // Vertical swipe
          if (dy < -30) this.jump();
          else if (dy > 30) this.slide();
        }
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  changeLane(dir) {
    const nextLane = this.player.targetLane + dir;
    if (nextLane >= -1 && nextLane <= 1) {
      this.player.targetLane = nextLane;
      if (window.sound) window.sound.playClick();
    }
  }

  jump() {
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isJumping = true;
      this.player.vy = -540;
      if (window.sound) window.sound.playJump();
    }
  }

  slide() {
    if (!this.player.isSliding) {
      this.player.isSliding = true;
      this.player.slideTimer = 0.65;
      if (this.player.isJumping) {
        // Fast drop down from jump
        this.player.y = 0;
        this.player.vy = 0;
        this.player.isJumping = false;
      }
      if (window.sound) window.sound.playSlide();
    }
  }

  start() {
    this.active = true;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.gameOver = false;
    this.speed = this.baseSpeed;

    this.player.lane = 0;
    this.player.targetLane = 0;
    this.player.xOffset = 0;
    this.player.y = 0;
    this.player.vy = 0;
    this.player.isJumping = false;
    this.player.isSliding = false;
    this.player.stumble = 0;
    this.player.hasShield = false;
    this.player.hasMagnet = false;
    this.player.magnetTimer = 0;

    this.beast.distBehind = 130;

    // Generate initial track segments
    this.segments = [];
    this.coinsList = [];
    this.obstacles = [];
    this.particles = [];

    for (let i = 0; i < 40; i++) {
      this.segments.push({ z: i * 80 });
    }

    // Populate initial items
    let z = 600;
    while (z < 3500) {
      this.spawnTrackContent(z);
      z += 280;
    }

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

  spawnTrackContent(z) {
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

    // Obstacle types:
    // 'spikes' (jump over)
    // 'fire_arch' (slide under)
    // 'broken_bridge' (jump over)
    // 'stone_block' (lane shift)
    const rand = Math.random();
    if (rand < 0.35) {
      this.obstacles.push({
        z,
        lane,
        type: 'spikes', // must jump
        w: 60,
        h: 30
      });
    } else if (rand < 0.65) {
      this.obstacles.push({
        z,
        lane,
        type: 'fire_arch', // must slide
        w: 90,
        h: 70
      });
    } else {
      this.obstacles.push({
        z,
        lane,
        type: 'stone_block', // must avoid lane
        w: 70,
        h: 60
      });
    }

    // Spawn Coins in a line in other lanes
    const coinLane = lane === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    for (let c = 0; c < 4; c++) {
      this.coinsList.push({
        z: z + 80 + c * 45,
        lane: coinLane,
        collected: false
      });
    }
  }

  update(dt) {
    if (this.gameOver) return;

    // Gradual speed acceleration
    this.speed = Math.min(this.baseSpeed + this.distance * 0.12, 850);
    const moveDist = this.speed * dt;
    this.distance += moveDist * 0.05;
    this.score = Math.floor(this.distance * 10 + this.coins * 50);

    // Runner Lane Lerp
    const targetOffset = this.player.targetLane * 140;
    this.player.xOffset += (targetOffset - this.player.xOffset) * 14 * dt;
    this.player.lane = Math.round(this.player.xOffset / 140);

    // Runner Jump Physics
    if (this.player.isJumping) {
      this.player.y += this.player.vy * dt;
      this.player.vy += 1500 * dt; // gravity
      if (this.player.y >= 0) {
        this.player.y = 0;
        this.player.vy = 0;
        this.player.isJumping = false;
      }
    }

    // Runner Slide Timer
    if (this.player.isSliding) {
      this.player.slideTimer -= dt;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
      }
    }

    // Runner Run cycle
    this.player.runAnim += dt * (this.speed * 0.02);

    // Magnet power-up timer
    if (this.player.hasMagnet) {
      this.player.magnetTimer -= dt;
      if (this.player.magnetTimer <= 0) {
        this.player.hasMagnet = false;
      }
    }

    // Beast Chase Logic
    if (this.player.stumble > 0) {
      this.player.stumble -= dt * 0.3;
      // Beast lunges closer
      this.beast.distBehind = Math.max(30, this.beast.distBehind - dt * 45);
    } else {
      // Beast gradually falls back to default distance
      this.beast.distBehind = Math.min(130, this.beast.distBehind + dt * 15);
    }

    // Move track towards camera (decrease z)
    this.segments.forEach((seg) => {
      seg.z -= moveDist;
      if (seg.z < 0) {
        seg.z += 40 * 80;
      }
    });

    // Move obstacles towards camera
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= moveDist;

      // Check collision when obstacle is near player (z between 40 and 110)
      if (obs.z >= 40 && obs.z <= 110) {
        // Player lane match
        const playerLaneMatches = Math.abs(this.player.xOffset - obs.lane * 140) < 65;

        if (playerLaneMatches) {
          let hit = false;

          if (obs.type === 'spikes') {
            // Must be jumping sufficiently high!
            if (this.player.y > -45) {
              hit = true;
            }
          } else if (obs.type === 'fire_arch') {
            // Must be sliding!
            if (!this.player.isSliding) {
              hit = true;
            }
          } else if (obs.type === 'stone_block') {
            // Cannot jump or slide through solid block!
            hit = true;
          }

          if (hit) {
            this.handlePlayerCollision();
            this.obstacles.splice(i, 1);
            continue;
          }
        }
      }

      if (obs.z < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn more obstacles as player travels
    const maxZ = this.obstacles.reduce((max, o) => Math.max(max, o.z), 0);
    if (maxZ < 3000) {
      this.spawnTrackContent(maxZ + 300);
    }

    // Move coins towards camera
    for (let i = this.coinsList.length - 1; i >= 0; i--) {
      const c = this.coinsList[i];
      c.z -= moveDist;

      // Magnet attraction
      if (this.player.hasMagnet && c.z > 0 && c.z < 600) {
        c.lane += (this.player.lane - c.lane) * 10 * dt;
      }

      // Check collection
      if (!c.collected && c.z >= 30 && c.z <= 110) {
        const laneDist = Math.abs(this.player.xOffset - c.lane * 140);
        if (laneDist < 60 && this.player.y > -80) {
          c.collected = true;
          this.coins++;
          if (window.sound) window.sound.playCoin();

          // Particle burst
          for (let p = 0; p < 6; p++) {
            this.particles.push({
              x: this.canvas.width / 2 + this.player.xOffset,
              y: this.canvas.height * 0.72 + this.player.y,
              vx: (Math.random() - 0.5) * 120,
              vy: -Math.random() * 120 - 40,
              radius: 4,
              color: '#fbbf24',
              life: 0.3
            });
          }
        }
      }

      if (c.z < -50 || c.collected) {
        this.coinsList.splice(i, 1);
      }
    }

    // Update Particles
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

  handlePlayerCollision() {
    if (this.player.hasShield) {
      this.player.hasShield = false;
      if (window.sound) window.sound.playCrash();
      return;
    }

    if (this.player.stumble <= 0) {
      // First stumble: screen shake, beast lunges right onto your back!
      this.player.stumble = 1.0;
      this.beast.distBehind = 40;
      if (window.sound) window.sound.playCrash();
    } else {
      // Caught by Demon Beast!
      this.gameOver = true;
      if (window.sound) {
        window.sound.playCrash();
        window.sound.playGameOver();
      }
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('inspire_temple_high', this.score);
      }
    }
  }

  // 3D Perspective Projection Function
  project(x, y, z) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cameraHeight = 160;
    const fov = 320;

    const scale = fov / (fov + z);
    const projX = w / 2 + x * scale;
    const projY = h * 0.62 + (y + cameraHeight) * scale;
    return { x: projX, y: projY, scale };
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Sky & Ancient Temple Atmosphere
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    skyGrad.addColorStop(0, '#020617'); // Dark starry night
    skyGrad.addColorStop(0.6, '#1e1b4b'); // Mystical purple mist
    skyGrad.addColorStop(1, '#b45309'); // Flaming horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.62);

    // Temple ruins silhouette on horizon
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w * 0.15, h * 0.52);
    ctx.lineTo(w * 0.25, h * 0.55);
    ctx.lineTo(w * 0.38, h * 0.48);
    ctx.lineTo(w * 0.5, h * 0.53);
    ctx.lineTo(w * 0.65, h * 0.46);
    ctx.lineTo(w * 0.8, h * 0.56);
    ctx.lineTo(w, h * 0.62);
    ctx.closePath();
    ctx.fill();

    // Bottom Chasm / Magma Abyss
    const chasmGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
    chasmGrad.addColorStop(0, '#450a0a');
    chasmGrad.addColorStop(1, '#090505');
    ctx.fillStyle = chasmGrad;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);

    // 2. Draw 3D Stone Temple Causeway
    this.drawCauseway();

    // 3. Draw 3D Track Obstacles & Coins
    // Sort by z descending (farthest first)
    const renderItems = [
      ...this.obstacles.map((o) => ({ ...o, itemType: 'obstacle' })),
      ...this.coinsList.map((c) => ({ ...c, itemType: 'coin' }))
    ].sort((a, b) => b.z - a.z);

    renderItems.forEach((item) => {
      if (item.itemType === 'obstacle') {
        this.drawObstacle(item);
      } else {
        this.drawCoin(item);
      }
    });

    // 4. Draw Particles
    this.particles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Draw Demon Beast (chasing behind player)
    this.drawDemonBeast();

    // 6. Draw Player Runner
    this.drawRunner();

    // 7. HUD & Stats Overlay
    this.drawHUD();

    // 8. Game Over Screen
    if (this.gameOver) {
      this.drawGameOverScreen();
    }
  }

  drawCauseway() {
    const ctx = this.ctx;
    const trackWidth = 260; // total width of 3 lanes

    // Draw stone road segments from far to near
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const z1 = this.segments[i].z;
      const z2 = z1 + 80;

      const p1L = this.project(-trackWidth, 0, z1);
      const p1R = this.project(trackWidth, 0, z1);
      const p2L = this.project(-trackWidth, 0, z2);
      const p2R = this.project(trackWidth, 0, z2);

      // Alternating ancient stone tile patterns
      const isAlt = Math.floor(z1 / 160) % 2 === 0;
      ctx.fillStyle = isAlt ? '#78716c' : '#57534e';

      ctx.beginPath();
      ctx.moveTo(p1L.x, p1L.y);
      ctx.lineTo(p1R.x, p1R.y);
      ctx.lineTo(p2R.x, p2R.y);
      ctx.lineTo(p2L.x, p2L.y);
      ctx.closePath();
      ctx.fill();

      // Stone border curbs
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = Math.max(1, 4 * p1L.scale);
      ctx.stroke();

      // Lane dividers (gold engraved lines)
      [-trackWidth / 3, trackWidth / 3].forEach((laneX) => {
        const d1 = this.project(laneX, 0, z1);
        const d2 = this.project(laneX, 0, z2);
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.lineWidth = Math.max(1, 2 * d1.scale);
        ctx.beginPath();
        ctx.moveTo(d1.x, d1.y);
        ctx.lineTo(d2.x, d2.y);
        ctx.stroke();
      });
    }
  }

  drawObstacle(obs) {
    const ctx = this.ctx;
    const x = obs.lane * 140;
    const p = this.project(x, 0, obs.z);

    ctx.save();
    if (obs.type === 'spikes') {
      // Spiked rolling wooden log
      const logW = obs.w * p.scale * 2.8;
      const logH = obs.h * p.scale * 2.5;

      ctx.fillStyle = '#78350f';
      ctx.fillRect(p.x - logW / 2, p.y - logH, logW, logH);

      // Spikes on log
      ctx.fillStyle = '#dc2626';
      for (let s = -logW / 2; s < logW / 2; s += 16 * p.scale) {
        ctx.beginPath();
        ctx.moveTo(p.x + s, p.y - logH);
        ctx.lineTo(p.x + s + 6 * p.scale, p.y - logH - 14 * p.scale);
        ctx.lineTo(p.x + s + 12 * p.scale, p.y - logH);
        ctx.fill();
      }
    } else if (obs.type === 'fire_arch') {
      // Overhead flaming stone arch (slide under!)
      const archW = obs.w * p.scale * 2.5;
      const archH = obs.h * p.scale * 3.2;

      // Stone Pillars
      ctx.fillStyle = '#44403c';
      ctx.fillRect(p.x - archW / 2, p.y - archH, 14 * p.scale, archH);
      ctx.fillRect(p.x + archW / 2 - 14 * p.scale, p.y - archH, 14 * p.scale, archH);

      // Overhead lintel beam
      ctx.fillRect(p.x - archW / 2, p.y - archH, archW, 20 * p.scale);

      // Fire flame braziers
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(p.x, p.y - archH + 5 * p.scale, 16 * p.scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.type === 'stone_block') {
      // Heavy temple monolith barrier
      const blockW = obs.w * p.scale * 2.5;
      const blockH = obs.h * p.scale * 2.6;

      ctx.fillStyle = '#292524';
      ctx.fillRect(p.x - blockW / 2, p.y - blockH, blockW, blockH);
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2 * p.scale;
      ctx.strokeRect(p.x - blockW / 2, p.y - blockH, blockW, blockH);

      // Ancient glyph on block
      ctx.fillStyle = '#eab308';
      ctx.font = `bold ${Math.max(10, Math.floor(18 * p.scale))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('⚠', p.x, p.y - blockH * 0.4);
    }
    ctx.restore();
  }

  drawCoin(coin) {
    const ctx = this.ctx;
    const x = coin.lane * 140;
    const p = this.project(x, -25, coin.z);

    const r = Math.max(2, 14 * p.scale);
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 8 * p.scale;

    // Golden Coin Disc
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawRunner() {
    const ctx = this.ctx;
    const p = this.player;

    // Projected player position (at z = 40)
    const proj = this.project(p.xOffset, p.y, 40);
    const scale = proj.scale;

    ctx.save();
    ctx.translate(proj.x, proj.y);

    // Stumble screen flash / aura
    if (p.stumble > 0) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
    }

    if (p.isSliding) {
      // Sliding runner (flat profile)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-28 * scale, -18 * scale, 56 * scale, 18 * scale);
      // Head
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(20 * scale, -10 * scale, 10 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Running / Jumping runner
      const legOffset = Math.sin(p.runAnim) * 14 * scale;

      // Legs
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 8 * scale;
      // Left leg
      ctx.beginPath();
      ctx.moveTo(-8 * scale, -25 * scale);
      ctx.lineTo(-12 * scale - legOffset, 0);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(8 * scale, -25 * scale);
      ctx.lineTo(12 * scale + legOffset, 0);
      ctx.stroke();

      // Torso / Adventurer jacket
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-16 * scale, -58 * scale, 32 * scale, 34 * scale);

      // Head / Explorer Hat
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -68 * scale, 12 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Brown Fedora hat
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-20 * scale, -74 * scale, 40 * scale, 6 * scale);
      ctx.fillRect(-12 * scale, -84 * scale, 24 * scale, 10 * scale);
    }

    ctx.restore();
  }

  drawDemonBeast() {
    const ctx = this.ctx;
    const p = this.player;
    const b = this.beast;

    // The beast runs behind the player (z between -30 and -120 depending on stumble)
    const beastZ = 40 - b.distBehind;
    const beastProj = this.project(p.xOffset * 0.7, 0, Math.max(10, beastZ));
    const scale = beastProj.scale;

    ctx.save();
    ctx.translate(beastProj.x, beastProj.y);

    // Beast silhouette / glowing red eyes
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, -60 * scale, 40 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Giant claws
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-65 * scale, -50 * scale, 30 * scale, 45 * scale);
    ctx.fillRect(35 * scale, -50 * scale, 30 * scale, 45 * scale);

    // Glowing evil yellow/red eyes
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(-16 * scale, -65 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.arc(16 * scale, -65 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawHUD() {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();
    // Top Bar HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, 50);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 50);

    // Distance
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.floor(this.distance)}m`, 20, 32);

    // Coins
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🪙 ${this.coins}`, 180, 32);

    // Score & Best
    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SCORE: ${this.score}`, w - 180, 32);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "Orbitron", sans-serif';
    ctx.fillText(`BEST: ${this.highScore}`, w - 20, 32);

    // Beast Proximity Alert
    if (this.beast.distBehind < 60) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 15px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEMON BEAST IS CLOSE! DON\'T TRIP!', w / 2, 85);
    }

    ctx.restore();
  }

  drawGameOverScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '900 44px "Orbitron", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.fillText('CAUGHT BY THE BEAST!', w / 2, h * 0.35);

    ctx.shadowBlur = 0;
    ctx.font = '22px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Distance: ${Math.floor(this.distance)}m | Coins: ${this.coins}`, w / 2, h * 0.47);
    ctx.fillText(`Final Score: ${this.score}`, w / 2, h * 0.55);

    if (this.score > this.highScore) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px "Orbitron", sans-serif';
      ctx.fillText('NEW RECORD ESCAPE!', w / 2, h * 0.63);
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.fillText('PRESS SPACE OR TAP TO ESCAPE AGAIN', w / 2, h * 0.74);
    ctx.restore();
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
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }
}

window.TempleRunGame = TempleRunGame;
