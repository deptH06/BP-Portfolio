/* ==========================================================================
   Global Theme & DOM Elements
   ========================================================================== */
const htmlEl = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const spotlight = document.getElementById('cursorSpotlight');

// Dynamic Cursor Spotlight Tracking
window.addEventListener('mousemove', (e) => {
  if (spotlight) {
    spotlight.style.left = `${e.clientX}px`;
    spotlight.style.top = `${e.clientY}px`;
  }
});

// Theme Switcher
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', next);
  });
}

/* ==========================================================================
   Background Audio Engine (Auto-pause on tab change, Low vibe volume, Toggle)
   ========================================================================== */
const bgMusic = document.getElementById('bgMusic');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const musicLabel = document.getElementById('musicLabel');

let isAudioUnlocked = false;
let wasPlayingBeforeHidden = false;
const TARGET_VOLUME = 0.25;

function updateAudioUI(isPlaying) {
  if (!musicToggleBtn || !musicLabel) return;
  if (isPlaying) {
    musicToggleBtn.classList.remove('muted');
    musicLabel.textContent = 'SOUND ON';
  } else {
    musicToggleBtn.classList.add('muted');
    musicLabel.textContent = 'SOUND OFF';
  }
}

function playAudio() {
  if (!bgMusic) return;
  bgMusic.volume = TARGET_VOLUME;
  const playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isAudioUnlocked = true;
        updateAudioUI(true);
      })
      .catch((err) => {
        console.warn('Autoplay prevented until user interaction:', err);
        updateAudioUI(false);
      });
  }
}

// Auto-pause when leaving/switching tabs, resume when returning
document.addEventListener('visibilitychange', () => {
  if (!bgMusic || !isAudioUnlocked) return;

  if (document.hidden) {
    if (!bgMusic.paused) {
      wasPlayingBeforeHidden = true;
      bgMusic.pause();
      updateAudioUI(false);
    } else {
      wasPlayingBeforeHidden = false;
    }
  } else {
    if (wasPlayingBeforeHidden) {
      bgMusic.play().then(() => updateAudioUI(true)).catch(() => {});
    }
  }
});

// Sound Button Mute / Unmute Toggle
if (musicToggleBtn) {
  musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!bgMusic) return;

    if (bgMusic.paused) {
      playAudio();
    } else {
      bgMusic.pause();
      updateAudioUI(false);
    }
  });
}

/* Force video playback on DOM load */
window.addEventListener('DOMContentLoaded', () => {
  const spidermanVideo = document.getElementById('spidermanVideo');
  if (spidermanVideo) {
    spidermanVideo.muted = true;
    spidermanVideo.play().catch((err) => {
      console.warn('Video autoplay deferred:', err);
    });
  }
});

/* ==========================================================================
   Full View-Pane Controller (Click Tabs + Mouse Wheel Scroll + Touch Swipe)
   ========================================================================== */
const tabButtons = document.querySelectorAll('.nav-tab-btn');
const panes = document.querySelectorAll('.view-pane');

const paneOrder = ['about', 'skills', 'projects', 'certificates'];
let currentPaneIndex = 0;
let isScrollThrottled = false;

function switchPane(targetId, isInitialPop = false) {
  const targetIndex = paneOrder.indexOf(targetId);
  if (targetIndex !== -1) {
    currentPaneIndex = targetIndex;
  }

  // 1. Update navigation tabs
  tabButtons.forEach((btn) => {
    if (btn.dataset.target === targetId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 2. Switch visible pane
  panes.forEach((pane) => {
    if (pane.id === `pane-${targetId}`) {
      pane.classList.add('active');
      if (isInitialPop) {
        pane.classList.add('pop-out-entry');
        setTimeout(() => pane.classList.remove('pop-out-entry'), 900);
      }
    } else {
      pane.classList.remove('active');
    }
  });
}

// Manual click on top navigation tabs
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target) switchPane(target, false);
  });
});

// Mouse Wheel Scroll (Up/Down) section switcher
window.addEventListener('wheel', (e) => {
  const certModal = document.getElementById('certModal');
  const projectModal = document.getElementById('projectModal');
  if (
    (certModal && !certModal.classList.contains('hidden')) ||
    (projectModal && !projectModal.classList.contains('hidden'))
  ) {
    return;
  }

  const appContainer = document.getElementById('appContainer');
  if (!appContainer || appContainer.classList.contains('hidden')) {
    return;
  }

  if (isScrollThrottled) return;

  if (Math.abs(e.deltaY) > 30) {
    if (e.deltaY > 0) {
      if (currentPaneIndex < paneOrder.length - 1) {
        currentPaneIndex++;
        switchPane(paneOrder[currentPaneIndex], false);
        throttleScroll();
      }
    } else {
      if (currentPaneIndex > 0) {
        currentPaneIndex--;
        switchPane(paneOrder[currentPaneIndex], false);
        throttleScroll();
      }
    }
  }
}, { passive: true });

function throttleScroll() {
  isScrollThrottled = true;
  setTimeout(() => {
    isScrollThrottled = false;
  }, 700);
}

// Touch Swipe support for mobile screens
let touchStartY = 0;
window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  const appContainer = document.getElementById('appContainer');
  if (!appContainer || appContainer.classList.contains('hidden')) return;

  const touchEndY = e.changedTouches[0].clientY;
  const diffY = touchStartY - touchEndY;

  if (Math.abs(diffY) > 50 && !isScrollThrottled) {
    if (diffY > 0 && currentPaneIndex < paneOrder.length - 1) {
      currentPaneIndex++;
      switchPane(paneOrder[currentPaneIndex], false);
      throttleScroll();
    } else if (diffY < 0 && currentPaneIndex > 0) {
      currentPaneIndex--;
      switchPane(paneOrder[currentPaneIndex], false);
      throttleScroll();
    }
  }
}, { passive: true });

/* ==========================================================================
   Welcome Screen -> Fake Loader -> About Section Transition
   ========================================================================== */
const welcomeScreen = document.getElementById('welcomeScreen');
const letzzGoBtn = document.getElementById('letzzGoBtn');
const demoLoader = document.getElementById('demoLoader');
const demoProgressBar = document.getElementById('demoProgressBar');
const demoPercent = document.getElementById('demoPercent');
const appContainer = document.getElementById('appContainer');
const spidermanVideo = document.getElementById('spidermanVideo');

if (letzzGoBtn) {
  letzzGoBtn.addEventListener('click', (e) => {
    e.preventDefault();

    playAudio();

    if (spidermanVideo) {
      spidermanVideo.pause();
    }

    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (demoLoader) demoLoader.classList.remove('hidden');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 4) + 1;
      if (progress > 100) progress = 100;
      if (demoProgressBar) demoProgressBar.style.width = `${progress}%`;
      if (demoPercent) demoPercent.textContent = `${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (demoLoader) demoLoader.classList.add('hidden');
          if (appContainer) appContainer.classList.remove('hidden');
          switchPane('about', true);
        }, 500);
      }
    }, 60);
  });
}

/* ==========================================================================
   Certificate Modal Event Engine
   ========================================================================== */
const certModal = document.getElementById('certModal');
const certModalBackdrop = document.getElementById('certModalBackdrop');
const certModalCloseBtn = document.getElementById('certModalCloseBtn');
const certModalImg = document.getElementById('certModalImg');
const certModalTitle = document.getElementById('certModalTitle');
const clickableCerts = document.querySelectorAll('.clickable-cert');

function openCertModal(docSrc, titleText) {
  if (!certModal || !certModalImg) return;
  certModalImg.src = docSrc;
  if (certModalTitle) certModalTitle.textContent = titleText;
  certModal.classList.remove('hidden');
}

function closeCertModal() {
  if (!certModal) return;
  certModal.classList.add('hidden');
  if (certModalImg) certModalImg.src = '';
}

clickableCerts.forEach((certCard) => {
  certCard.addEventListener('click', () => {
    const src = certCard.getAttribute('data-cert-src');
    const title = certCard.getAttribute('data-cert-title') || 'Certificate Preview';
    if (src) {
      openCertModal(src, title);
    }
  });
});

if (certModalCloseBtn) certModalCloseBtn.addEventListener('click', closeCertModal);
if (certModalBackdrop) certModalBackdrop.addEventListener('click', closeCertModal);

/* ==========================================================================
   Project Details Pop-up Modal Event Engine
   ========================================================================== */
const projectModal = document.getElementById('projectModal');
const projectModalBackdrop = document.getElementById('projectModalBackdrop');
const projectModalCloseBtn = document.getElementById('projectModalCloseBtn');

const projModalTag = document.getElementById('projModalTag');
const projModalTitle = document.getElementById('projModalTitle');
const projModalStatus = document.getElementById('projModalStatus');
const projModalDesc = document.getElementById('projModalDesc');
const projModalHighlights = document.getElementById('projModalHighlights');
const projModalTech = document.getElementById('projModalTech');
const clickableProjects = document.querySelectorAll('.clickable-project');

function openProjectModal(card) {
  if (!projectModal) return;

  const title = card.getAttribute('data-project-title') || 'Project Details';
  const tag = card.getAttribute('data-project-tag') || 'PROJECT';
  const tech = card.getAttribute('data-project-tech') || '';
  const status = card.getAttribute('data-project-status') || 'Active';
  const desc = card.getAttribute('data-project-desc') || '';
  const highlightsRaw = card.getAttribute('data-project-highlights') || '';

  if (projModalTitle) projModalTitle.textContent = title;
  if (projModalTag) projModalTag.textContent = tag;
  if (projModalTech) projModalTech.textContent = tech;
  if (projModalStatus) projModalStatus.textContent = status;
  if (projModalDesc) projModalDesc.textContent = desc;

  if (projModalHighlights) {
    projModalHighlights.innerHTML = '';
    const highlights = highlightsRaw.split('|');
    highlights.forEach((item) => {
      if (item.trim()) {
        const li = document.createElement('li');
        li.textContent = item.trim();
        projModalHighlights.appendChild(li);
      }
    });
  }

  projectModal.classList.remove('hidden');
}

function closeProjectModal() {
  if (!projectModal) return;
  projectModal.classList.add('hidden');
}

clickableProjects.forEach((card) => {
  card.addEventListener('click', () => {
    openProjectModal(card);
  });
});

if (projectModalCloseBtn) projectModalCloseBtn.addEventListener('click', closeProjectModal);
if (projectModalBackdrop) projectModalBackdrop.addEventListener('click', closeProjectModal);

// Global Escape Key listener for all dialogs
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (certModal && !certModal.classList.contains('hidden')) closeCertModal();
    if (projectModal && !projectModal.classList.contains('hidden')) closeProjectModal();
  }
});

/* ==========================================================================
   Rotating Spider Web Skill Constellation Engine
   ========================================================================== */
const skillCanvas = document.getElementById('skillWebCanvas');
const skillContainer = document.getElementById('skillCanvasContainer');
const skillTooltip = document.getElementById('skillTooltip');
const skillBadge = document.getElementById('skillBadge');
const skillTitle = document.getElementById('skillTitle');
const skillDesc = document.getElementById('skillDesc');

if (skillCanvas && skillContainer) {
  const sCtx = skillCanvas.getContext('2d');

  const skillsData = [
    { name: "Linear Algebra", badge: "MATHEMATICS", desc: "Nullspace, Column Space, Rank Analysis, Eigenvectors & Stochastic Matrices." },
    { name: "Complexity Theory", badge: "THEORY", desc: "PSPACE, NP-Completeness, Polynomial Reductions & Asymptotic Complexity." },
    { name: "Probability & Stats", badge: "MATHEMATICS", desc: "Stochastic Distributions, Expectation, Markov Bounds & Empirical Analytics." },
    { name: "AI Tooling & LLMs", badge: "APPLIED AI", desc: "Hands-on certified workflow pipelines, cognitive prompting & automation." },
    { name: "Canvas 2D Physics", badge: "SYSTEMS", desc: "Hardware-accelerated mathematical geometry & real-time fluid simulation." },
    { name: "Web Architecture", badge: "DEVELOPMENT", desc: "Single-page reactive rendering, responsive DOM layouts & state lifecycle." },
    { name: "Event Leadership", badge: "MANAGEMENT", desc: "Core member of IEC Event Management, optimizing structural workflows." }
  ];

  let cWidth, cHeight, centerX, centerY;
  let rotationAngle = 0;
  let isHoveredOnNode = false;
  let mousePos = { x: -9999, y: -9999 };

  function resizeSkillCanvas() {
    cWidth = skillCanvas.width = skillContainer.clientWidth;
    cHeight = skillCanvas.height = skillContainer.clientHeight;
    centerX = cWidth / 2;
    centerY = cHeight / 2;
  }
  window.addEventListener('resize', resizeSkillCanvas);
  resizeSkillCanvas();

  // Desktop Mouse Tracking
  skillContainer.addEventListener('mousemove', (e) => {
    const rect = skillCanvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });

  skillContainer.addEventListener('mouseleave', () => {
    mousePos.x = -9999;
    mousePos.y = -9999;
    isHoveredOnNode = false;
    if (skillTooltip) skillTooltip.classList.add('hidden');
  });

  // Mobile Touch Support for Skill Web
  skillContainer.addEventListener('touchstart', (e) => {
    const rect = skillCanvas.getBoundingClientRect();
    mousePos.x = e.touches[0].clientX - rect.left;
    mousePos.y = e.touches[0].clientY - rect.top;
  }, { passive: true });

  skillContainer.addEventListener('touchmove', (e) => {
    const rect = skillCanvas.getBoundingClientRect();
    mousePos.x = e.touches[0].clientX - rect.left;
    mousePos.y = e.touches[0].clientY - rect.top;
  }, { passive: true });

  skillContainer.addEventListener('touchend', () => {
    mousePos.x = -9999;
    mousePos.y = -9999;
    isHoveredOnNode = false;
    if (skillTooltip) skillTooltip.classList.add('hidden');
  });

  function renderSkillWeb() {
    sCtx.clearRect(0, 0, cWidth, cHeight);

    const radius = Math.min(centerX, centerY) * 0.68;
    const count = skillsData.length;
    const points = [];

    if (!isHoveredOnNode) {
      rotationAngle += 0.006;
    }

    for (let i = 0; i < count; i++) {
      const angle = rotationAngle + (i * 2 * Math.PI) / count;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push({ x, y, data: skillsData[i] });
    }

    // Web Concentric Rings
    const rings = [0.35, 0.7, 1.0];
    rings.forEach((scale) => {
      sCtx.beginPath();
      sCtx.strokeStyle = 'rgba(255, 51, 75, 0.12)';
      sCtx.lineWidth = 1;
      for (let i = 0; i < count; i++) {
        const angle = rotationAngle + (i * 2 * Math.PI) / count;
        const rx = centerX + Math.cos(angle) * (radius * scale);
        const ry = centerY + Math.sin(angle) * (radius * scale);
        if (i === 0) sCtx.moveTo(rx, ry);
        else sCtx.lineTo(rx, ry);
      }
      sCtx.closePath();
      sCtx.stroke();
    });

    // Radial Web Spokes
    points.forEach((p) => {
      sCtx.beginPath();
      sCtx.moveTo(centerX, centerY);
      sCtx.lineTo(p.x, p.y);
      sCtx.strokeStyle = 'rgba(255, 51, 75, 0.22)';
      sCtx.lineWidth = 1.2;
      sCtx.stroke();
    });

    // Outer Connecting Web
    sCtx.beginPath();
    for (let i = 0; i < count; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % count];
      sCtx.moveTo(p1.x, p1.y);
      sCtx.lineTo(p2.x, p2.y);
    }
    sCtx.strokeStyle = 'rgba(255, 51, 75, 0.35)';
    sCtx.lineWidth = 1.5;
    sCtx.stroke();

    // Center Spider Hub Core
    sCtx.beginPath();
    sCtx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    sCtx.fillStyle = '#ff334b';
    sCtx.shadowColor = '#ff334b';
    sCtx.shadowBlur = 15;
    sCtx.fill();
    sCtx.shadowBlur = 0;

    let currentHovered = -1;

    // Render Nodes & Check Hitbox
    points.forEach((p, idx) => {
      const dx = mousePos.x - p.x;
      const dy = mousePos.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isHovered = dist < 32;

      if (isHovered) currentHovered = idx;

      sCtx.beginPath();
      sCtx.arc(p.x, p.y, isHovered ? 18 : 12, 0, Math.PI * 2);
      sCtx.fillStyle = isHovered ? 'rgba(255, 51, 75, 0.45)' : 'rgba(255, 51, 75, 0.15)';
      sCtx.fill();

      sCtx.beginPath();
      sCtx.arc(p.x, p.y, isHovered ? 8 : 5, 0, Math.PI * 2);
      sCtx.fillStyle = isHovered ? '#ffffff' : '#ff334b';
      sCtx.shadowColor = '#ff334b';
      sCtx.shadowBlur = isHovered ? 20 : 8;
      sCtx.fill();
      sCtx.shadowBlur = 0;

      sCtx.font = `${isHovered ? '700 13px' : '600 11px'} "Space Grotesk", sans-serif`;
      sCtx.fillStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText(p.data.name, p.x, p.y + (isHovered ? 24 : 18));
    });

    if (currentHovered !== -1) {
      isHoveredOnNode = true;
      const activeNode = points[currentHovered];

      if (skillTooltip) {
        skillBadge.textContent = activeNode.data.badge;
        skillTitle.textContent = activeNode.data.name;
        skillDesc.textContent = activeNode.data.desc;

        skillTooltip.style.left = `${activeNode.x}px`;
        skillTooltip.style.top = `${activeNode.y}px`;
        skillTooltip.classList.remove('hidden');
      }
    } else {
      isHoveredOnNode = false;
      if (skillTooltip) skillTooltip.classList.add('hidden');
    }

    requestAnimationFrame(renderSkillWeb);
  }

  requestAnimationFrame(renderSkillWeb);
}

/* ==========================================================================
   Abstract Fluid Wave Canvas Animation (Prominent Dark Mode Support)
   ========================================================================== */
const canvas = document.getElementById('waveCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let scrollDistortion = 0;
  let time = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    mouseX = targetMouseX = width / 2;
    mouseY = targetMouseY = height / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });

  window.addEventListener('wheel', (e) => {
    scrollDistortion += e.deltaY * 0.04;
  }, { passive: true });

  function drawAbstractWave() {
    ctx.clearRect(0, 0, width, height);

    const isLight = htmlEl.getAttribute('data-theme') === 'light';

    // Boosted vividness in dark mode
    const strokeColor1 = isLight ? 'rgba(225, 29, 72, 0.18)' : 'rgba(255, 51, 75, 0.55)';
    const strokeColor2 = isLight ? 'rgba(116, 77, 86, 0.12)' : 'rgba(255, 100, 120, 0.32)';

    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;
    scrollDistortion *= 0.94;
    time += 0.008;

    const numRibbons = 6;
    const numPoints = 65;
    const stepX = width / (numPoints - 1);

    for (let r = 0; r < numRibbons; r++) {
      ctx.beginPath();
      ctx.lineWidth = isLight ? 1.6 : 2.4;
      ctx.strokeStyle = r % 2 === 0 ? strokeColor1 : strokeColor2;

      if (!isLight) {
        ctx.shadowColor = 'rgba(255, 51, 75, 0.4)';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      for (let i = 0; i < numPoints; i++) {
        const x = i * stepX;
        const dx = x - mouseX;
        const mouseFactor = Math.exp(-(dx * dx) / (2 * 180 * 180));
        const mouseLift = (mouseY - height / 2) * mouseFactor * 0.35;

        const wave1 = Math.sin(i * 0.12 + time + r * 0.6) * (38 + scrollDistortion);
        const wave2 = Math.cos(i * 0.06 - time * 0.8 + r) * 25;
        const y = height * 0.52 + (r * 24 - numRibbons * 12) + wave1 + wave2 + mouseLift;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    requestAnimationFrame(drawAbstractWave);
  }

  requestAnimationFrame(drawAbstractWave);
}