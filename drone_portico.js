    function droneRR(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    // Bichinho voador estilo desenho Chaotic: corpo gota verde-limao, pescoco
    // metalico ondulado e domo-cabeca branco (visor / olho verde / costas).
    function drawChaoticDrone(ctx, pose) {
      const OUT = '#1a2027';
      const LIME = '#b8f53d', LIME_D = '#6faf22', LIME_L = '#e2f7b1';
      const DOME = '#f2f5f0', DOME_D = '#c9d2c6';
      const NECK = '#9aa4ae', NECK_D = '#5c646c';
      // ---- corpo (gota verde) ----
      const bx = 24, by = 42;
      const tilt = pose === 'side' ? 3 : 0;
      ctx.fillStyle = LIME;
      ctx.beginPath(); ctx.ellipse(bx + tilt, by, 15, 13, 0, 0, 7); ctx.fill();
      ctx.fillStyle = LIME_D;
      ctx.beginPath(); ctx.ellipse(bx + tilt, by + 7, 10, 5.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(bx - 7 + tilt, by - 4, 3, 5, -0.2, 0, 7); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(bx + tilt, by, 15, 13, 0, 0, 7); ctx.stroke();
      // respiro + bolinha azul
      ctx.strokeStyle = '#3f7a12'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath();
      if (pose === 'side') { ctx.moveTo(bx + 1, by - 5); ctx.lineTo(bx + 5, by + 3); }
      else { ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by + 3); }
      ctx.stroke();
      if (pose !== 'back') {
        ctx.fillStyle = '#5fb4e8';
        ctx.beginPath(); ctx.arc(bx + 9 + tilt, by - 3, 3, 0, 7); ctx.fill();
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      }
      // ---- pescoco metalico ----
      const neckPath = () => {
        ctx.beginPath();
        if (pose === 'side') {
          ctx.moveTo(bx + 4, by - 12);
          ctx.quadraticCurveTo(bx + 9, by - 18, bx + 1, by - 21);
          ctx.quadraticCurveTo(bx - 6, by - 24, bx - 7, by - 29);
        } else if (pose === 'back') {
          ctx.moveTo(bx, by - 12); ctx.lineTo(bx, by - 21);
        } else {
          ctx.moveTo(bx, by - 12);
          ctx.quadraticCurveTo(bx - 4, by - 16, bx - 1, by - 19);
          ctx.quadraticCurveTo(bx + 1, by - 21, bx, by - 23);
        }
      };
      neckPath(); ctx.strokeStyle = NECK_D; ctx.lineWidth = 6; ctx.stroke();
      neckPath(); ctx.strokeStyle = NECK; ctx.lineWidth = 3.5; ctx.stroke();
      // ---- cabeca (domo branco) ----
      const hx = pose === 'side' ? 16 : 24, hy = 13;
      const hrx = pose === 'side' ? 12 : 13, hry = 9.5;
      ctx.fillStyle = DOME;
      ctx.beginPath(); ctx.ellipse(hx, hy, hrx, hry, 0, 0, 7); ctx.fill();
      ctx.fillStyle = LIME_L;
      ctx.beginPath(); ctx.ellipse(hx, hy + 6.5, hrx - 5, 3, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(hx, hy, hrx, hry, 0, 0, 7); ctx.stroke();
      if (pose === 'front') {
        droneRR(ctx, hx - 7.5, hy - 6, 15, 8.5, 4);
        ctx.fillStyle = '#0c0f12'; ctx.fill();
        ctx.fillStyle = '#0f8a5f';
        ctx.beginPath(); ctx.arc(hx - hrx - 0.5, hy + 1, 2.6, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + hrx + 0.5, hy + 1, 2.6, 0, 7); ctx.fill();
      } else if (pose === 'side') {
        ctx.fillStyle = '#0c0f12';
        ctx.beginPath(); ctx.ellipse(hx + 8, hy - 0.5, 4, 7, 0.15, 0, 7); ctx.fill();
        ctx.fillStyle = '#0f8a5f';
        ctx.beginPath(); ctx.arc(hx - 4, hy - 0.5, 4, 0, 7); ctx.fill();
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      } else {
        droneRR(ctx, hx - 6, hy - 6, 12, 9, 3);
        ctx.fillStyle = DOME_D; ctx.fill();
        ctx.strokeStyle = NECK_D; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
    function drawDroneA(ctx) { drawChaoticDrone(ctx, 'front'); }
    function drawDroneB(ctx) { drawChaoticDrone(ctx, 'side'); }
    function drawDroneC(ctx) { drawChaoticDrone(ctx, 'back'); }
