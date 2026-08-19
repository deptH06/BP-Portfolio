/* Dynamic Cursor Spotlight Tracking */
const spotlight = document.getElementById('cursorSpotlight');

window.addEventListener('mousemove', (e) => {
  if (spotlight) {
    spotlight.style.left = `${e.clientX}px`;
    spotlight.style.top = `${e.clientY}px`;
  }
});

/* ==========================================================================
   Background Audio Engine (Auto-pause on tab change, Low vibe volume, Toggle)
   ========================================================================== */
const bgMusic = document.getElementById('bgMusic');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const musicLabel = document.getElementById('musicLabel');

let isAudioUnlocked = false;
let wasPlayingBeforeHidden = false;

// 1. Lower volume to ~0.25 for a chill, subtle background vibe
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

async function playAudio() {
  if (!bgMusic) return;
  try {
    bgMusic.volume = TARGET_VOLUME;
    await bgMusic.play();
    isAudioUnlocked = true;
    updateAudioUI(true);
  } catch (err) {
    updateAudioUI(false);
  }
}

// 2. Auto-pause when leaving/switching tabs, resumes where left off
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
      bgMusic.play().then(() => {
        updateAudioUI(true);
      }).catch(() => {});
    }
  }
});

// Unlock audio on very first user interaction anywhere
function unlockAudio() {
  if (!isAudioUnlocked && bgMusic) {
    playAudio();
  }
}
['click', 'touchstart', 'keydown'].forEach((evt) => {
  window.addEventListener(evt, unlockAudio, { once: true });
});

// 3. Floating Bottom-Right Sound Button Mute / Unmute
if (musicToggleBtn) {
  musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!bgMusic) return;

    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        isAudioUnlocked = true;
        updateAudioUI(true);
      });
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
      console.warn('Autoplay prevented, retrying on user interaction:', err);
    });
  }
  playAudio();
});

/* Theme Switcher */
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-theme', next);
});

/* ==========================================================================
   Welcome Screen -> Fake Loader -> Pop-Out About Section Transition
   ========================================================================== */
const welcomeScreen = document.getElementById('welcomeScreen');
const letzzGoBtn = document.getElementById('letzzGoBtn');
const demoLoader = document.getElementById('demoLoader');
const demoProgressBar = document.getElementById('demoProgressBar');
const demoPercent = document.getElementById('demoPercent');
const appContainer = document.getElementById('appContainer');
const spidermanVideo = document.getElementById('spidermanVideo');

letzzGoBtn.addEventListener('click', () => {
  playAudio();

  // Pause video to free up memory and GPU cycles[cite: 3]
  if (spidermanVideo) {
    spidermanVideo.pause();
  }

  welcomeScreen.classList.add('hidden');
  demoLoader.classList.remove('hidden');

  let progress = 0;
  const interval = setInterval(() => {
    // Slower progress step increment (1% - 4%)
    progress += Math.floor(Math.random() * 4) + 1;
    if (progress > 100) progress = 100;
    demoProgressBar.style.width = `${progress}%`;
    demoPercent.textContent = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      // Extra pause after reaching 100% before displaying the portfolio
      setTimeout(() => {
        demoLoader.classList.add('hidden');
        appContainer.classList.remove('hidden');
        // Triggers the pop-out entrance animation specifically for the About section
        switchPane('about', true);
      }, 500);
    }
  }, 60);
});

/* ==========================================================================
   Full View-Pane Controller (Click Tabs + Mouse Wheel Scroll + Touch Swipe)
   ========================================================================== */
const tabButtons = document.querySelectorAll('.nav-tab-btn');
const panes = document.querySelectorAll('.view-pane');

// Ordered list of pane IDs matching data-target attributes
const paneOrder = ['about', 'skills', 'projects', 'certificates'];
let currentPaneIndex = 0;
let isScrollThrottled = false;

function switchPane(targetId, isInitialPop = false) {
  const targetIndex = paneOrder.indexOf(targetId);
  if (targetIndex !== -1) {
    currentPaneIndex = targetIndex;
  }

  // 1. Update active states on navigation tab buttons
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

// 1. Manual click on top navigation tabs
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target) switchPane(target, false);
  });
});

// 2. Mouse Wheel Scroll (Up/Down) section switcher
window.addEventListener('wheel', (e) => {
  // Prevent switching if a modal dialog (certificate or project modal) is open
  const certModal = document.getElementById('certModal');
  const projectModal = document.getElementById('projectModal');
  if (
    (certModal && !certModal.classList.contains('hidden')) ||
    (projectModal && !projectModal.classList.contains('hidden'))
  ) {
    return;
  }

  // Prevent scroll events from firing before the welcome screen is dismissed
  const appContainer = document.getElementById('appContainer');
  if (!appContainer || appContainer.classList.contains('hidden')) {
    return;
  }

  if (isScrollThrottled) return;

  // Detect scroll direction (threshold prevents accidental triggers)
  if (Math.abs(e.deltaY) > 30) {
    if (e.deltaY > 0) {
      // Scroll Down -> Next Section
      if (currentPaneIndex < paneOrder.length - 1) {
        currentPaneIndex++;
        switchPane(paneOrder[currentPaneIndex], false);
        throttleScroll();
      }
    } else {
      // Scroll Up -> Previous Section
      if (currentPaneIndex > 0) {
        currentPaneIndex--;
        switchPane(paneOrder[currentPaneIndex], false);
        throttleScroll();
      }
    }
  }
}, { passive: true });

// Scroll debounce cooldown (700ms) to ensure clean single-section transitions
function throttleScroll() {
  isScrollThrottled = true;
  setTimeout(() => {
    isScrollThrottled = false;
  }, 700);
}

// 3. Touch Swipe support for mobile screens
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
      // Swipe Up -> Next Section
      currentPaneIndex++;
      switchPane(paneOrder[currentPaneIndex], false);
      throttleScroll();
    } else if (diffY < 0 && currentPaneIndex > 0) {
      // Swipe Down -> Previous Section
      currentPaneIndex--;
      switchPane(paneOrder[currentPaneIndex], false);
      throttleScroll();
    }
  }
}, { passive: true });
/* Abstract Fluid Wave Canvas Animation (Red Theme Support) */
const canvas = document.getElementById('waveCanvas');
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
});

function drawAbstractWave() {
  ctx.clearRect(0, 0, width, height);

  const isLight = htmlEl.getAttribute('data-theme') === 'light';

  // Red accent color integration for both themes[cite: 18]
  const strokeColor1 = isLight ? 'rgba(225, 29, 72, 0.18)' : 'rgba(255, 51, 75, 0.16)';
  const strokeColor2 = isLight ? 'rgba(116, 77, 86, 0.12)' : 'rgba(200, 180, 184, 0.08)';

  mouseX += (targetMouseX - mouseX) * 0.04;
  mouseY += (targetMouseY - mouseY) * 0.04;
  scrollDistortion *= 0.94;
  time += 0.008;

  const numRibbons = 6;
  const numPoints = 65;
  const stepX = width / (numPoints - 1);

  for (let r = 0; r < numRibbons; r++) {
    ctx.beginPath();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = r % 2 === 0 ? strokeColor1 : strokeColor2;

    for (let i = 0; i < numPoints; i++) {
      const x = i * stepX;
      const dx = x - mouseX;
      const mouseFactor = Math.exp(-(dx * dx) / (2 * 180 * 180));
      const mouseLift = (mouseY - height / 2) * mouseFactor * 0.35;

      const wave1 = Math.sin(i * 0.12 + time + r * 0.6) * (38 + scrollDistortion);
      const wave2 = Math.cos(i * 0.06 - time * 0.8 + r) * 25;
      const y = (height * 0.52) + (r * 24 - (numRibbons * 12)) + wave1 + wave2 + mouseLift;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  /* Certificate Modal Event Engine */


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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && certModal && !certModal.classList.contains('hidden')) {
    closeCertModal();
  }
});
  requestAnimationFrame(drawAbstractWave);
}
requestAnimationFrame(drawAbstractWave);