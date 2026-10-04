/**
 * Bubble Shooter Classic
 * Inspire Games
 */

class BubbleShooterGame {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.active = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('inspire_bubble_high') || '0', 10);
    this.gameOver = false;
    this.victory = false;
    this.paused = false;

    // Grid configuration
    this.rows = 12;
    this.cols = 10;
    this.bubbleRadius = 22;
    this.grid = []; // 2D array [row][col]

    // Palette
    this.colors = [
      { id: 'red', hex: '#ef4444', light: '#fca5a5' },
      { id: 'blue', hex: '#3b82f6', light: '#93c5fd' },
      { id: 'green', hex: '#10b981', light: '#6ee7b7' },
      { id: 'yellow', hex: '#f59e0b', light: '#fde68a' },
      { id: 'purple', hex: '#8b5cf6', light: '#c4b5fd' },
      { id: 'cyan', hex: '#06b6d4', light: '#67e8f9' }
    ];

    // Shooter cannon
    this.aimAngle = -Math.PI / 2; // pointing straight up
    this.currentBubble = null;
    this.nextBubble = null;
    this.bullet = null; // in-flight bubble

    this.missesAllowed = 5;
    this.missCount = 0;

    this.particles = [];
    this.fallingBubbles = [];
    this.floatingTexts = [];

    this.initEvents();
    this.resize();
    this.start();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width || 700;
    this.canvas.height = rect.height || 650;

    // Adjust radius based on canvas width
    this.bubbleRadius = Math.floor(this.canvas.width / (this.cols * 2 + 1));
    this.rowHeight = this.bubbleRadius * Math.sqrt(3);
  }

  initEvents() {
    this.onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.updateAim(mx, my);
    };

    this.onMouseDown = (e) => {
      if (this.gameOver || this.paused) return;
      this.shoot();
    };

    this.onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.touches[0].clientX - rect.left;
        const my = e.touches[0].clientY - rect.top;
        this.updateAim(mx, my);
      }
    };

    this.onTouchStart = (e) => {
      if (this.gameOver || this.paused) return;
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.touches[0].clientX - rect.left;
        const my = e.touches[0].clientY - rect.top;
        this.updateAim(mx, my);
        this.shoot();
      }
    };

    this.onKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'c' || e.key === 'C') {
        this.swapBubbles();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (this.gameOver) this.restart();
      }
    };

    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);
  }

  updateAim(mx, my) {
    const cannonX = this.canvas.width / 2;
    const cannonY = this.canvas.height - 40;
    const angle = Math.atan2(my - cannonY, mx - cannonX);
    // Clamp between -170 deg and -10 deg
    if (angle < -0.15 && angle > -Math.PI + 0.15) {
      this.aimAngle = angle;
    }
  }

  getRandomColor() {
    // Pick an existing color on board if possible
    const available = new Set();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r] && this.grid[r][c]) {
          available.add(this.grid[r][c].color.id);
        }
      }
    }
    const colorPool = available.size > 0 
      ? this.colors.filter((c) => available.has(c.id))
      : this.colors;
    return colorPool[Math.floor(Math.random() * colorPool.length)] || this.colors[0];
  }

  start() {
    this.active = true;
    this.score = 0;
    this.gameOver = false;
    this.victory = false;
    this.missCount = 0;
    this.particles = [];
    this.fallingBubbles = [];
    this.floatingTexts = [];
    this.bullet = null;

    // Initialize bubble grid with 5 starting rows
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      const colsInRow = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < colsInRow; c++) {
        if (r < 5) {
          const color = this.colors[Math.floor(Math.random() * (this.colors.length - 1))];
          this.grid[r][c] = { color };
        } else {
          this.grid[r][c] = null;
        }
      }
    }

    this.currentBubble = this.getRandomColor();
    this.nextBubble = this.getRandomColor();

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

  getBubblePosition(r, c) {
    const isOdd = r % 2 === 1;
    const offset = isOdd ? this.bubbleRadius * 2 : this.bubbleRadius;
    const x = offset + c * (this.bubbleRadius * 2);
    const y = 35 + this.bubbleRadius + r * this.rowHeight;
    return { x, y };
  }

  swapBubbles() {
    if (this.bullet) return;
    const temp = this.currentBubble;
    this.currentBubble = this.nextBubble;
    this.nextBubble = temp;
    if (window.sound) window.sound.playClick();
  }

  shoot() {
    if (this.bullet || !this.currentBubble) return;

    const cannonX = this.canvas.width / 2;
    const cannonY = this.canvas.height - 40;
    const speed = 1100;

    this.bullet = {
      x: cannonX,
      y: cannonY,
      vx: Math.cos(this.aimAngle) * speed,
      vy: Math.sin(this.aimAngle) * speed,
      color: this.currentBubble,
      radius: this.bubbleRadius
    };

    this.currentBubble = this.nextBubble;
    this.nextBubble = this.getRandomColor();

    if (window.sound) window.sound.playBubbleShoot();
  }

  update(dt) {
    // 1. Update in-flight bullet
    if (this.bullet) {
      this.bullet.x += this.bullet.vx * dt;
      this.bullet.y += this.bullet.vy * dt;

      // Bounce off walls
      if (this.bullet.x - this.bullet.radius <= 0) {
        this.bullet.x = this.bullet.radius;
        this.bullet.vx *= -1;
      } else if (this.bullet.x + this.bullet.radius >= this.canvas.width) {
        this.bullet.x = this.canvas.width - this.bullet.radius;
        this.bullet.vx *= -1;
      }

      // Check collision with ceiling
      if (this.bullet.y - this.bullet.radius <= 35) {
        this.snapBulletToGrid();
      } else {
        // Check collision with other bubbles
        let collided = false;
        for (let r = 0; r < this.rows; r++) {
          const colsInRow = r % 2 === 1 ? this.cols - 1 : this.cols;
          for (let c = 0; c < colsInRow; c++) {
            if (this.grid[r][c]) {
              const pos = this.getBubblePosition(r, c);
              const dist = Math.hypot(this.bullet.x - pos.x, this.bullet.y - pos.y);
              if (dist <= this.bullet.radius * 1.85) {
                collided = true;
                break;
              }
            }
          }
          if (collided) break;
        }

        if (collided) {
          this.snapBulletToGrid();
        }
      }
    }

    // 2. Update falling detached bubbles
    for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = this.fallingBubbles[i];
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;
      fb.vy += 700 * dt; // gravity
      if (fb.y > this.canvas.height + 50) {
        this.fallingBubbles.splice(i, 1);
      }
    }

    // 3. Update popping particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 4. Update floating score texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 40;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  snapBulletToGrid() {
    if (!this.bullet) return;

    // Find nearest empty cell in grid
    let bestR = 0;
    let bestC = 0;
    let minDist = Infinity;

    for (let r = 0; r < this.rows; r++) {
      const colsInRow = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < colsInRow; c++) {
        if (!this.grid[r][c]) {
          const pos = this.getBubblePosition(r, c);
          const dist = Math.hypot(this.bullet.x - pos.x, this.bullet.y - pos.y);
          if (dist < minDist) {
            minDist = dist;
            bestR = r;
            bestC = c;
          }
        }
      }
    }

    // Place bubble
    this.grid[bestR][bestC] = { color: this.bullet.color };
    const placedColor = this.bullet.color;
    this.bullet = null;

    // Find matches
    const matched = this.findCluster(bestR, bestC, placedColor.id);

    if (matched.length >= 3) {
      // Pop matching cluster!
      matched.forEach(({ r, c }) => {
        const pos = this.getBubblePosition(r, c);
        this.createPopParticles(pos.x, pos.y, this.grid[r][c].color.hex);
        this.grid[r][c] = null;
      });

      if (window.sound) window.sound.playBubblePop(1 + matched.length * 0.1);

      const added = matched.length * 30;
      this.score += added;
      const leadPos = this.getBubblePosition(bestR, bestC);
      this.floatingTexts.push({
        x: leadPos.x,
        y: leadPos.y,
        text: `+${added}`,
        color: placedColor.hex,
        life: 0.8,
        maxLife: 0.8
      });

      // Drop disconnected floating bubbles
      const dropped = this.dropDisconnectedBubbles();
      if (dropped > 0) {
        const dropBonus = dropped * 100;
        this.score += dropBonus;
        this.floatingTexts.push({
          x: this.canvas.width / 2,
          y: leadPos.y + 30,
          text: `CASCADE +${dropBonus}!`,
          color: '#fbbf24',
          life: 1.0,
          maxLife: 1.0
        });
      }

      // Check victory
      if (this.checkBoardEmpty()) {
        this.endVictory();
        return;
      }
    } else {
      // Missed match -> increase miss count
      this.missCount++;
      if (this.missCount >= this.missesAllowed) {
        this.missCount = 0;
        this.pushDownCeiling();
      }
    }

    // Check game over (bubbles crossing danger line)
    for (let c = 0; c < this.cols; c++) {
      if (this.grid[this.rows - 2] && this.grid[this.rows - 2][c]) {
        this.endGameOver();
        return;
      }
    }
  }

  getNeighbors(r, c) {
    const isOdd = r % 2 === 1;
    const offsets = isOdd
      ? [
          [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, 0], [1, 1]
        ]
      : [
          [-1, -1], [-1, 0],
          [0, -1], [0, 1],
          [1, -1], [1, 0]
        ];

    const neighbors = [];
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      const colsInRow = nr % 2 === 1 ? this.cols - 1 : this.cols;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < colsInRow) {
        neighbors.push({ r: nr, c: nc });
      }
    }
    return neighbors;
  }

  findCluster(startR, startC, targetColorId) {
    const visited = new Set();
    const cluster = [];
    const queue = [{ r: startR, c: startC }];
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const curr = queue.shift();
      cluster.push(curr);

      for (const nb of this.getNeighbors(curr.r, curr.c)) {
        const key = `${nb.r},${nb.c}`;
        if (!visited.has(key)) {
          visited.add(key);
          const cell = this.grid[nb.r] && this.grid[nb.r][nb.c];
          if (cell && cell.color.id === targetColorId) {
            queue.push(nb);
          }
        }
      }
    }
    return cluster;
  }

  dropDisconnectedBubbles() {
    // Find all bubbles connected to ceiling (row 0)
    const connected = new Set();
    const queue = [];

    for (let c = 0; c < this.cols; c++) {
      if (this.grid[0][c]) {
        queue.push({ r: 0, c });
        connected.add(`0,${c}`);
      }
    }

    while (queue.length > 0) {
      const curr = queue.shift();
      for (const nb of this.getNeighbors(curr.r, curr.c)) {
        const key = `${nb.r},${nb.c}`;
        if (!connected.has(key)) {
          if (this.grid[nb.r] && this.grid[nb.r][nb.c]) {
            connected.add(key);
            queue.push(nb);
          }
        }
      }
    }

    let droppedCount = 0;
    // Any existing bubble not in connected set will fall
    for (let r = 0; r < this.rows; r++) {
      const colsInRow = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < colsInRow; c++) {
        if (this.grid[r][c] && !connected.has(`${r},${c}`)) {
          const pos = this.getBubblePosition(r, c);
          this.fallingBubbles.push({
            x: pos.x,
            y: pos.y,
            vx: (Math.random() - 0.5) * 120,
            vy: -Math.random() * 80 - 40,
            color: this.grid[r][c].color,
            radius: this.bubbleRadius
          });
          this.grid[r][c] = null;
          droppedCount++;
        }
      }
    }

    return droppedCount;
  }

  pushDownCeiling() {
    // Shift every row down
    for (let r = this.rows - 1; r > 0; r--) {
      this.grid[r] = [...this.grid[r - 1]];
    }

    // New top row
    this.grid[0] = [];
    for (let c = 0; c < this.cols; c++) {
      this.grid[0][c] = { color: this.colors[Math.floor(Math.random() * (this.colors.length - 1))] };
    }
  }

  checkBoardEmpty() {
    for (let r = 0; r < this.rows; r++) {
      const colsInRow = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < colsInRow; c++) {
        if (this.grid[r][c]) return false;
      }
    }
    return true;
  }

  createPopParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 5 + 2,
        color,
        life: 0.35 + Math.random() * 0.2
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#1e1b4b');
    bg.addColorStop(1, '#090514');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Top Header Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 35);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 35);

    // Score & HUD
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SCORE: ${this.score}`, 15, 24);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`BEST: ${this.highScore}`, 160, 24);

    // Misses remaining indicator
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Drop in: ${this.missesAllowed - this.missCount} misses`, w - 15, 23);
    ctx.textAlign = 'left';

    // Danger Line
    const dangerY = this.canvas.height - 110;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, dangerY);
    ctx.lineTo(w, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Aim Trajectory Guide
    this.drawAimGuide();

    // Draw Grid Bubbles
    for (let r = 0; r < this.rows; r++) {
      const colsInRow = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < colsInRow; c++) {
        if (this.grid[r][c]) {
          const pos = this.getBubblePosition(r, c);
          this.drawBubble(pos.x, pos.y, this.grid[r][c].color, this.bubbleRadius);
        }
      }
    }

    // Draw Falling bubbles
    this.fallingBubbles.forEach((fb) => {
      this.drawBubble(fb.x, fb.y, fb.color, fb.radius);
    });

    // Draw In-Flight Bullet
    if (this.bullet) {
      this.drawBubble(this.bullet.x, this.bullet.y, this.bullet.color, this.bullet.radius);
    }

    // Draw Particles
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / 0.5);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Floating texts
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.font = 'bold 20px "Orbitron", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Draw Shooter Cannon & Base
    this.drawCannon();

    // Game Over or Victory Overlays
    if (this.gameOver) {
      this.drawGameOver();
    } else if (this.victory) {
      this.drawVictory();
    }
  }

  drawBubble(x, y, colorObj, radius) {
    const ctx = this.ctx;
    ctx.save();

    // Outer glow
    ctx.shadowColor = colorObj.hex;
    ctx.shadowBlur = 8;

    // Gradient sphere
    const grad = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      radius * 0.1,
      x,
      y,
      radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, colorObj.light);
    grad.addColorStop(0.8, colorObj.hex);
    grad.addColorStop(1, '#00000088');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawAimGuide() {
    const ctx = this.ctx;
    const startX = this.canvas.width / 2;
    const startY = this.canvas.height - 40;

    let currX = startX;
    let currY = startY;
    let dx = Math.cos(this.aimAngle);
    let dy = Math.sin(this.aimAngle);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(currX, currY);

    let maxSteps = 450;
    while (currY > 35 && maxSteps > 0) {
      currX += dx * 4;
      currY += dy * 4;
      maxSteps--;

      // Bounce off walls
      if (currX <= this.bubbleRadius || currX >= this.canvas.width - this.bubbleRadius) {
        dx *= -1;
        ctx.lineTo(currX, currY);
      }
    }
    ctx.lineTo(currX, currY);
    ctx.stroke();
    ctx.restore();
  }

  drawCannon() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height - 40;

    ctx.save();

    // Base podium
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cannon pointer barrel
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.aimAngle + Math.PI / 2);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(-8, -48, 16, 36);
    ctx.strokeRect(-8, -48, 16, 36);
    ctx.restore();

    // Current Bubble loaded
    if (this.currentBubble) {
      this.drawBubble(cx, cy, this.currentBubble, this.bubbleRadius);
    }

    // Next Bubble Preview
    if (this.nextBubble) {
      const nextX = cx - 80;
      const nextY = cy;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.arc(nextX, nextY, this.bubbleRadius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      this.drawBubble(nextX, nextY, this.nextBubble, this.bubbleRadius * 0.85);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT', nextX, nextY + 30);
    }

    // Swap Hint Button
    const swapX = cx + 80;
    const swapY = cy;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(swapX, swapY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⇄', swapX, swapY);

    ctx.restore();
  }

  drawGameOver() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '900 40px "Orbitron", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('GAME OVER', w / 2, h * 0.38);

    ctx.font = '22px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${this.score}`, w / 2, h * 0.5);

    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('PRESS R OR TAP TO RESTART', w / 2, h * 0.65);
    ctx.restore();
  }

  drawVictory() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '900 40px "Orbitron", sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('STAGE CLEARED!', w / 2, h * 0.38);

    ctx.font = '22px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Spectacular Score: ${this.score}`, w / 2, h * 0.5);

    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('PLAY AGAIN', w / 2, h * 0.65);
    ctx.restore();
  }

  endGameOver() {
    this.gameOver = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('inspire_bubble_high', this.score);
    }
    if (window.sound) window.sound.playGameOver();
  }

  endVictory() {
    this.victory = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('inspire_bubble_high', this.score);
    }
    if (window.sound) window.sound.playVictory();
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
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}

window.BubbleShooterGame = BubbleShooterGame;
