/**
 * Granny: Haunted Escape
 * Stealth Horror Survival Game
 * Inspire Games
 */

class GrannyGame {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.active = false;
    this.day = 1;
    this.maxDays = 5;
    this.escaped = false;
    this.gameOver = false;
    this.paused = false;

    // Player state
    this.player = {
      x: 160,
      y: 160,
      radius: 14,
      angle: 0,
      speed: 120,
      crouching: false,
      hidden: false,
      hidingSpot: null,
      flashlight: true,
      inventory: null // holds 1 active item (e.g., 'padlock_key', 'wire_cutters', 'hammer', 'master_key')
    };

    // Granny state
    this.granny = {
      x: 620,
      y: 480,
      radius: 16,
      angle: Math.PI,
      speed: 85,
      state: 'patrol', // 'patrol', 'investigate', 'chase', 'stunned'
      targetPos: { x: 620, y: 480 },
      patrolIndex: 0,
      stunTime: 0,
      seePlayer: false
    };

    // Front Door Locks Status
    this.locks = {
      padlock: false,     // unlocked with 'padlock_key'
      wires: false,       // cut with 'wire_cutters'
      planks: false,      // removed with 'hammer'
      master: false       // unlocked with 'master_key'
    };

    // House Map Layout (Rooms, Walls, Doors, Items, Hideouts)
    this.walls = [];
    this.rooms = [];
    this.doors = [];
    this.hideouts = [];
    this.items = [];
    this.traps = [];
    this.soundWaves = [];
    this.interactPrompt = '';

    this.keysDown = {};
    this.jumpscareAlpha = 0;
    this.dayCardAlpha = 0;
    this.dayCardText = 'DAY 1';

    this.initMap();
    this.initEvents();
    this.resize();
    this.startDay(1);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 600;
  }

  initMap() {
    // 800 x 600 house layout
    // Exterior walls
    this.walls = [
      { x: 30, y: 30, w: 740, h: 16 }, // Top wall
      { x: 30, y: 554, w: 740, h: 16 }, // Bottom wall
      { x: 30, y: 30, w: 16, h: 540 }, // Left wall
      { x: 754, y: 30, w: 16, h: 540 }, // Right wall

      // Interior wall 1: Separating bedroom (top-left) from hallway
      { x: 30, y: 240, w: 220, h: 14 },
      // Interior wall 2: Separating living room (top-right)
      { x: 420, y: 30, w: 14, h: 220 },
      // Interior wall 3: Separating Kitchen (bottom-left)
      { x: 260, y: 340, w: 14, h: 230 },
      // Interior wall 4: Separating Basement / Foyer
      { x: 420, y: 340, w: 14, h: 230 },
      // Center hallway division
      { x: 420, y: 240, w: 180, h: 14 }
    ];

    // Front Exit Door (located on bottom wall center between x: 340 and 400)
    this.exitDoor = {
      x: 330,
      y: 546,
      w: 80,
      h: 24,
      isExit: true
    };

    // Interior Doors (can be opened/closed)
    this.doors = [
      { id: 'd_bedroom', x: 250, y: 150, w: 12, h: 70, open: false },
      { id: 'd_kitchen', x: 260, y: 280, w: 70, h: 12, open: false },
      { id: 'd_living', x: 420, y: 150, w: 12, h: 70, open: false }
    ];

    // Hideouts (Wardrobe / Under Bed)
    this.hideouts = [
      { id: 'bed_bedroom', x: 70, y: 70, w: 60, h: 90, type: 'bed', name: 'Hide Under Bed' },
      { id: 'closet_hall', x: 320, y: 50, w: 50, h: 50, type: 'closet', name: 'Hide in Closet' },
      { id: 'closet_kitchen', x: 70, y: 460, w: 50, h: 50, type: 'closet', name: 'Hide in Cabinet' }
    ];

    // Items to discover (scattered in rooms)
    this.items = [
      { id: 'padlock_key', name: 'Padlock Key', x: 90, y: 380, icon: '🔑', color: '#38bdf8', collected: false },
      { id: 'wire_cutters', name: 'Wire Cutters', x: 670, y: 100, icon: '✂️', color: '#f59e0b', collected: false },
      { id: 'hammer', name: 'Heavy Hammer', x: 660, y: 450, icon: '🔨', color: '#10b981', collected: false },
      { id: 'master_key', name: 'Master Exit Key', x: 330, y: 150, icon: '🗝️', color: '#eab308', collected: false }
    ];

    // Granny Patrol Waypoints
    this.patrolPoints = [
      { x: 140, y: 150 }, // Bedroom doorway
      { x: 340, y: 200 }, // Upper hallway
      { x: 580, y: 130 }, // Living room
      { x: 600, y: 440 }, // Dining room
      { x: 360, y: 450 }, // Front Foyer
      { x: 150, y: 420 }  // Kitchen
    ];
  }

  initEvents() {
    this.onKeyDown = (e) => {
      this.keysDown[e.key.toLowerCase()] = true;

      // E or Space to Interact / Hide
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        this.interact();
      }

      // C to toggle crouch
      if (e.key === 'c' || e.key === 'C') {
        this.player.crouching = !this.player.crouching;
      }

      // F to toggle flashlight
      if (e.key === 'f' || e.key === 'F') {
        this.player.flashlight = !this.player.flashlight;
      }

      // Drop item
      if (e.key === 'g' || e.key === 'G') {
        this.dropItem();
      }

      // Restart after game over
      if (e.key === 'r' && (this.gameOver || this.escaped)) {
        this.restart();
      }
    };

    this.onKeyUp = (e) => {
      this.keysDown[e.key.toLowerCase()] = false;
    };

    this.onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.player.angle = Math.atan2(my - this.player.y, mx - this.player.x);
    };

    this.canvas.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  startDay(dayNum) {
    this.day = dayNum;
    this.dayCardText = `DAY ${this.day}`;
    this.dayCardAlpha = 1.0;

    // Reset Player to Master Bedroom
    this.player.x = 140;
    this.player.y = 140;
    this.player.hidden = false;
    this.player.hidingSpot = null;

    // Reset Granny far away
    this.granny.x = 600;
    this.granny.y = 480;
    this.granny.state = 'patrol';
    this.granny.patrolIndex = 0;
    this.granny.targetPos = { ...this.patrolPoints[0] };

    if (dayNum === 1) {
      this.active = true;
      this.gameOver = false;
      this.escaped = false;
      this.locks = { padlock: false, wires: false, planks: false, master: false };
      this.items.forEach((it) => (it.collected = false));
      this.traps = [];
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
  }

  interact() {
    // 1. If currently hidden, unhide!
    if (this.player.hidden) {
      this.player.hidden = false;
      this.player.hidingSpot = null;
      if (window.sound) window.sound.playCreak();
      return;
    }

    // 2. Check nearby Hideouts
    for (const h of this.hideouts) {
      const dist = Math.hypot(this.player.x - (h.x + h.w / 2), this.player.y - (h.y + h.h / 2));
      if (dist < 45) {
        this.player.hidden = true;
        this.player.hidingSpot = h;
        if (window.sound) window.sound.playCreak();
        return;
      }
    }

    // 3. Check Front Exit Door locks
    const exitDist = Math.hypot(this.player.x - (this.exitDoor.x + this.exitDoor.w / 2), this.player.y - this.exitDoor.y);
    if (exitDist < 50) {
      this.handleExitDoorInteraction();
      return;
    }

    // 4. Check Doors (open/close)
    for (const d of this.doors) {
      const dist = Math.hypot(this.player.x - (d.x + d.w / 2), this.player.y - (d.y + d.h / 2));
      if (dist < 50) {
        d.open = !d.open;
        if (window.sound) window.sound.playCreak();
        this.makeNoise(d.x, d.y, 140, 'Door squeaked!');
        return;
      }
    }

    // 5. Check Items on floor
    for (const it of this.items) {
      if (it.collected) continue;
      const dist = Math.hypot(this.player.x - it.x, this.player.y - it.y);
      if (dist < 35) {
        // Drop existing item if holding one
        this.dropItem();
        it.collected = true;
        this.player.inventory = it;
        if (window.sound) window.sound.playClick();
        return;
      }
    }
  }

  handleExitDoorInteraction() {
    const inv = this.player.inventory;

    if (!this.locks.planks) {
      if (inv && inv.id === 'hammer') {
        this.locks.planks = true;
        if (window.sound) window.sound.playCreak();
        this.makeNoise(this.exitDoor.x, this.exitDoor.y, 180, 'Loud hammer pry!');
        return;
      }
    }

    if (!this.locks.wires) {
      if (inv && inv.id === 'wire_cutters') {
        this.locks.wires = true;
        if (window.sound) window.sound.playClick();
        return;
      }
    }

    if (!this.locks.padlock) {
      if (inv && inv.id === 'padlock_key') {
        this.locks.padlock = true;
        if (window.sound) window.sound.playClick();
        return;
      }
    }

    if (!this.locks.master) {
      if (inv && inv.id === 'master_key') {
        this.locks.master = true;
        if (window.sound) window.sound.playClick();
        return;
      }
    }

    // Check if ALL locks unlocked -> ESCAPE VICTORY!
    if (this.locks.planks && this.locks.wires && this.locks.padlock && this.locks.master) {
      this.escapeSuccess();
    }
  }

  dropItem() {
    if (!this.player.inventory) return;
    const it = this.player.inventory;
    it.collected = false;
    it.x = this.player.x + Math.cos(this.player.angle) * 25;
    it.y = this.player.y + Math.sin(this.player.angle) * 25;
    this.player.inventory = null;

    if (window.sound) window.sound.playCreak();
    this.makeNoise(it.x, it.y, 100, 'Item dropped!');
  }

  makeNoise(x, y, radius, label) {
    this.soundWaves.push({ x, y, radius, maxRadius: radius, life: 0.6, label });
    // Alert Granny!
    const distToGranny = Math.hypot(this.granny.x - x, this.granny.y - y);
    if (distToGranny < radius * 2.5) {
      this.granny.state = 'investigate';
      this.granny.targetPos = { x, y };
    }
  }

  update(dt) {
    // Fade Day card overlay
    if (this.dayCardAlpha > 0) {
      this.dayCardAlpha -= dt * 0.5;
    }

    // Fade jumpscare screen
    if (this.jumpscareAlpha > 0) {
      this.jumpscareAlpha -= dt * 0.8;
    }

    if (this.gameOver || this.escaped) return;

    // 1. Update Player Movement
    if (!this.player.hidden) {
      let dx = 0;
      let dy = 0;

      if (this.keysDown['w'] || this.keysDown['arrowup']) dy -= 1;
      if (this.keysDown['s'] || this.keysDown['arrowdown']) dy += 1;
      if (this.keysDown['a'] || this.keysDown['arrowleft']) dx -= 1;
      if (this.keysDown['d'] || this.keysDown['arrowright']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      const speed = this.player.crouching ? 65 : 125;
      const targetX = this.player.x + dx * speed * dt;
      const targetY = this.player.y + dy * speed * dt;

      // Check footsteps noise if running
      if ((dx !== 0 || dy !== 0) && !this.player.crouching) {
        if (Math.random() < 0.02) {
          this.makeNoise(this.player.x, this.player.y, 60, 'Squeaky floor!');
        }
      }

      // Check collision with walls and closed doors
      if (!this.checkWallCollision(targetX, this.player.y, this.player.radius)) {
        this.player.x = targetX;
      }
      if (!this.checkWallCollision(this.player.x, targetY, this.player.radius)) {
        this.player.y = targetY;
      }
    }

    // 2. Granny AI Update
    this.updateGranny(dt);

    // 3. Heartbeat audio intensity based on Granny distance
    const distToGranny = Math.hypot(this.player.x - this.granny.x, this.player.y - this.granny.y);
    if (distToGranny < 250 && !this.player.hidden) {
      const intensity = 1 - distToGranny / 250;
      if (Math.random() < 0.04) {
        if (window.sound) window.sound.playHeartbeat(intensity);
      }
    }

    // 4. Update Sound Waves
    for (let i = this.soundWaves.length - 1; i >= 0; i--) {
      const sw = this.soundWaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.soundWaves.splice(i, 1);
      }
    }

    // 5. Update Nearby Interaction Prompt
    this.updateInteractionPrompt();
  }

  checkWallCollision(x, y, radius) {
    // Check perimeter and walls
    for (const w of this.walls) {
      if (
        x + radius > w.x &&
        x - radius < w.x + w.w &&
        y + radius > w.y &&
        y - radius < w.y + w.h
      ) {
        return true;
      }
    }

    // Check closed doors
    for (const d of this.doors) {
      if (!d.open) {
        if (
          x + radius > d.x &&
          x - radius < d.x + d.w &&
          y + radius > d.y &&
          y - radius < d.y + d.h
        ) {
          return true;
        }
      }
    }

    // Check exit door if locked
    const ed = this.exitDoor;
    if (
      x + radius > ed.x &&
      x - radius < ed.x + ed.w &&
      y + radius > ed.y &&
      y - radius < ed.y + ed.h
    ) {
      return true;
    }

    return false;
  }

  updateGranny(dt) {
    const g = this.granny;

    // Check line of sight to player
    const distToPlayer = Math.hypot(g.x - this.player.x, g.y - this.player.y);
    let canSeePlayer = false;

    if (!this.player.hidden && distToPlayer < 240) {
      // Check if walls block sight
      if (!this.raycastWall(g.x, g.y, this.player.x, this.player.y)) {
        canSeePlayer = true;
      }
    }

    if (canSeePlayer) {
      g.state = 'chase';
      g.targetPos = { x: this.player.x, y: this.player.y };
      g.speed = 105; // faster when chasing!
    }

    // Movement towards targetPos
    const dx = g.targetPos.x - g.x;
    const dy = g.targetPos.y - g.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      g.angle = Math.atan2(dy, dx);
      const step = g.speed * dt;
      const gx = g.x + Math.cos(g.angle) * step;
      const gy = g.y + Math.sin(g.angle) * step;

      // Soft navigation around walls
      if (!this.checkWallCollision(gx, g.y, g.radius)) g.x = gx;
      if (!this.checkWallCollision(g.x, gy, g.radius)) g.y = gy;
    } else {
      // Reached destination
      if (g.state === 'chase' || g.state === 'investigate') {
        g.state = 'patrol';
      } else if (g.state === 'patrol') {
        // Advance to next patrol waypoint
        g.patrolIndex = (g.patrolIndex + 1) % this.patrolPoints.length;
        g.targetPos = { ...this.patrolPoints[g.patrolIndex] };
        g.speed = 70;
      }
    }

    // Catch Player Check
    if (!this.player.hidden && distToPlayer < 24) {
      this.grannyCatchPlayer();
    }
  }

  raycastWall(x1, y1, x2, y2) {
    // Simple line segment vs box check for walls
    for (const w of this.walls) {
      if (this.lineIntersectsRect(x1, y1, x2, y2, w)) {
        return true;
      }
    }
    for (const d of this.doors) {
      if (!d.open && this.lineIntersectsRect(x1, y1, x2, y2, d)) {
        return true;
      }
    }
    return false;
  }

  lineIntersectsRect(x1, y1, x2, y2, rect) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) {
      return false;
    }
    return true;
  }

  updateInteractionPrompt() {
    this.interactPrompt = '';

    if (this.player.hidden) {
      this.interactPrompt = 'Press [E] or Space to Exit Hideout';
      return;
    }

    // Check hideouts
    for (const h of this.hideouts) {
      const dist = Math.hypot(this.player.x - (h.x + h.w / 2), this.player.y - (h.y + h.h / 2));
      if (dist < 45) {
        this.interactPrompt = `Press [E] to ${h.name}`;
        return;
      }
    }

    // Check items
    for (const it of this.items) {
      if (it.collected) continue;
      const dist = Math.hypot(this.player.x - it.x, this.player.y - it.y);
      if (dist < 35) {
        this.interactPrompt = `Press [E] to Pick Up ${it.name}`;
        return;
      }
    }

    // Check doors
    for (const d of this.doors) {
      const dist = Math.hypot(this.player.x - (d.x + d.w / 2), this.player.y - (d.y + d.h / 2));
      if (dist < 50) {
        this.interactPrompt = `Press [E] to ${d.open ? 'Close' : 'Open'} Door`;
        return;
      }
    }

    // Check exit door
    const exitDist = Math.hypot(this.player.x - (this.exitDoor.x + this.exitDoor.w / 2), this.player.y - this.exitDoor.y);
    if (exitDist < 50) {
      const req = [];
      if (!this.locks.planks) req.push('Hammer (Planks)');
      if (!this.locks.wires) req.push('Cutters (Wires)');
      if (!this.locks.padlock) req.push('Padlock Key');
      if (!this.locks.master) req.push('Master Key');

      if (req.length === 0) {
        this.interactPrompt = 'Press [E] to ESCAPE THE HOUSE!';
      } else {
        this.interactPrompt = `Locks Remaining: ${req.join(', ')} [Need Tools]`;
      }
    }
  }

  grannyCatchPlayer() {
    this.jumpscareAlpha = 1.0;
    if (window.sound) window.sound.playJumpscare();

    if (this.day < this.maxDays) {
      this.day++;
      setTimeout(() => {
        this.startDay(this.day);
      }, 1200);
    } else {
      this.gameOver = true;
      if (window.sound) window.sound.playGameOver();
    }
  }

  escapeSuccess() {
    this.escaped = true;
    if (window.sound) window.sound.playVictory();
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Creepy dark wooden floor
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, w, h);

    // Floorboard plank lines
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1;
    for (let y = 30; y < 560; y += 25) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(760, y);
      ctx.stroke();
    }

    // 2. Draw Hideouts (Beds, Closets)
    this.hideouts.forEach((ho) => {
      ctx.fillStyle = ho.type === 'bed' ? '#451a03' : '#3f3f46';
      ctx.fillRect(ho.x, ho.y, ho.w, ho.h);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(ho.x, ho.y, ho.w, ho.h);

      if (ho.type === 'bed') {
        // Pillow
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(ho.x + 8, ho.y + 8, ho.w - 16, 20);
      }
    });

    // 3. Draw Items on floor
    this.items.forEach((it) => {
      if (!it.collected) {
        ctx.save();
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 10;
        ctx.fillText(it.icon, it.x, it.y);
        ctx.restore();
      }
    });

    // 4. Draw Walls
    ctx.fillStyle = '#44403c';
    this.walls.forEach((wl) => {
      ctx.fillRect(wl.x, wl.y, wl.w, wl.h);
    });

    // 5. Draw Doors
    this.doors.forEach((d) => {
      if (d.open) {
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.w * 0.7, d.y + d.h * 0.7);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(d.x, d.y, d.w, d.h);
      }
    });

    // 6. Draw Exit Door with lock indicators
    const ed = this.exitDoor;
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(ed.x, ed.y, ed.w, ed.h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT DOOR', ed.x + ed.w / 2, ed.y + 15);

    // 7. Draw Sound waves
    this.soundWaves.forEach((sw) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, ' + sw.life / 0.6 + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * (1 - sw.life / 0.6), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 8. Draw Granny
    this.drawGranny();

    // 9. Draw Player
    if (!this.player.hidden) {
      this.drawPlayer();
    }

    // 10. Fog of War / Flashlight Lighting Mask
    this.drawLightingMask();

    // 11. HUD Overlay (Inventory, Day, Lock Checklist)
    this.drawHUD();

    // 12. Day Announcement Card
    if (this.dayCardAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.dayCardAlpha;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '900 50px "Orbitron", sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText(this.dayCardText, w / 2, h / 2);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Find all tools and escape before Day ${this.maxDays}`, w / 2, h / 2 + 50);
      ctx.restore();
    }

    // 13. Jumpscare Glitch Overlay
    if (this.jumpscareAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.jumpscareAlpha;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '900 55px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('GRANNY CAUGHT YOU!', w / 2, h / 2);
      ctx.restore();
    }

    // 14. Victory or Game Over
    if (this.escaped) {
      this.drawVictoryScreen();
    } else if (this.gameOver) {
      this.drawGameOverScreen();
    }
  }

  drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Player Body
    ctx.fillStyle = p.crouching ? '#0284c7' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hands
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(p.radius * 0.8, -8, 4, 0, Math.PI * 2);
    ctx.arc(p.radius * 0.8, 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawGranny() {
    const ctx = this.ctx;
    const g = this.granny;

    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);

    // Creepy bloody nightgown
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bat / weapon in hand
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 10, 16, 4);

    // Glowing creepy eyes
    ctx.fillStyle = '#f87171';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.arc(10, 5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawLightingMask() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.player;

    ctx.save();
    // Ambient darkness
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mCtx = maskCanvas.getContext('2d');

    mCtx.fillStyle = 'rgba(5, 5, 5, 0.93)';
    mCtx.fillRect(0, 0, w, h);

    if (!p.hidden) {
      mCtx.globalCompositeOperation = 'destination-out';

      // Small ambient light circle around player
      const ambGrad = mCtx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 75);
      ambGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mCtx.fillStyle = ambGrad;
      mCtx.beginPath();
      mCtx.arc(p.x, p.y, 75, 0, Math.PI * 2);
      mCtx.fill();

      // Flashlight cone
      if (p.flashlight) {
        const coneGrad = mCtx.createRadialGradient(p.x, p.y, 15, p.x, p.y, 280);
        coneGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        coneGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.85)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        mCtx.fillStyle = coneGrad;

        mCtx.beginPath();
        mCtx.moveTo(p.x, p.y);
        mCtx.arc(p.x, p.y, 280, p.angle - 0.45, p.angle + 0.45);
        mCtx.closePath();
        mCtx.fill();
      }
    } else {
      // Hiding Vignette
      mCtx.globalCompositeOperation = 'destination-out';
      mCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      mCtx.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
    }

    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();
  }

  drawHUD() {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();
    // Top Bar HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 45);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 45);

    // Day counter
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`DAY ${this.day} / ${this.maxDays}`, 15, 28);

    // Mode: Standing / Crouching / Hidden
    ctx.font = '14px sans-serif';
    ctx.fillStyle = this.player.hidden ? '#a855f7' : (this.player.crouching ? '#38bdf8' : '#e2e8f0');
    const stateText = this.player.hidden ? 'HIDDEN' : (this.player.crouching ? 'CROUCHING (Quiet)' : 'WALKING');
    ctx.fillText(`[C] State: ${stateText}`, 150, 28);

    // Active Item Held
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#fbbf24';
    const held = this.player.inventory ? `${this.player.inventory.icon} ${this.player.inventory.name}` : 'Empty Hands';
    ctx.fillText(`Holding: ${held}`, 340, 28);

    // Exit Locks Checklist
    ctx.textAlign = 'right';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = this.locks.planks ? '#10b981' : '#64748b';
    ctx.fillText('Planks ' + (this.locks.planks ? '✓' : '✗'), w - 210, 28);
    ctx.fillStyle = this.locks.wires ? '#10b981' : '#64748b';
    ctx.fillText('Wires ' + (this.locks.wires ? '✓' : '✗'), w - 145, 28);
    ctx.fillStyle = this.locks.padlock ? '#10b981' : '#64748b';
    ctx.fillText('Padlock ' + (this.locks.padlock ? '✓' : '✗'), w - 85, 28);
    ctx.fillStyle = this.locks.master ? '#10b981' : '#64748b';
    ctx.fillText('Master ' + (this.locks.master ? '✓' : '✗'), w - 15, 28);
    ctx.textAlign = 'left';

    // Interaction prompt on bottom
    if (this.interactPrompt) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(w / 2 - 220, this.canvas.height - 45, 440, 32);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(w / 2 - 220, this.canvas.height - 45, 440, 32);

      ctx.font = 'bold 14px "Orbitron", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(this.interactPrompt, w / 2, this.canvas.height - 24);
    }

    ctx.restore();
  }

  drawVictoryScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '900 45px "Orbitron", sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('YOU ESCAPED!', w / 2, h * 0.4);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`You unlocked all doors and escaped Granny on Day ${this.day}!`, w / 2, h * 0.52);

    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('PRESS R TO PLAY AGAIN', w / 2, h * 0.65);
    ctx.restore();
  }

  drawGameOverScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = '900 46px "Orbitron", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('YOUR 5 DAYS ARE UP...', w / 2, h * 0.4);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Granny has locked you in the cellar forever.', w / 2, h * 0.52);

    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('PRESS R TO RETRY ESCAPE', w / 2, h * 0.65);
    ctx.restore();
  }

  restart() {
    this.startDay(1);
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
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}

window.GrannyGame = GrannyGame;
