// ==========================================
// 1. SETUP AND CONFIGURATIONS
// ==========================================
const container = document.getElementById('canvas-container');
const cardZone = document.getElementById('card-game-zone');

// Define our sprite arrays using your custom file names
const SPRITES = {
  idle: 'icons/setting.png',
  walk: [
    'icons/walk1.png',
    'icons/walk2.png',
    'icons/walk3.png',
    'icons/walk4.png',
    'icons/walk5.png',
    'icons/walk6.png'
  ],
  jump: [
    'icons/jump1.png',
    'icons/jump2.png',
    'icons/jump3.png',
    'icons/jump4.png'
  ]
};

// ==========================================
// 2. MOUSE-FOLLOWING / SNIFFING BUNNIES
// ==========================================
let targetX = container.clientWidth / 2;
let targetY = container.clientHeight / 2;
let isMouseInside = false;

const updateTarget = (e) => {
  const rect = container.getBoundingClientRect();
  if (e.touches && e.touches[0]) {
    targetX = e.touches[0].clientX - rect.left;
    targetY = e.touches[0].clientY - rect.top;
  } else {
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  }
};

container.addEventListener('mouseenter', () => isMouseInside = true);
container.addEventListener('mouseleave', () => isMouseInside = false);
container.addEventListener('mousemove', updateTarget);
container.addEventListener('touchstart', (e) => {
  isMouseInside = true;
  updateTarget(e);
}, { passive: true });
container.addEventListener('touchmove', updateTarget, { passive: true });

// Instantiate bunnies with animation tracking variables
const bunnies = [
  { x: 100, y: 150, speed: 0.05, element: null, imgElement: null, faceRight: true, animFrame: 0, lastAnimTime: 0 },
  { x: 200, y: 350, speed: 0.03, element: null, imgElement: null, faceRight: true, animFrame: 0, lastAnimTime: 0 }
];

bunnies.forEach((bunny) => {
  const div = document.createElement('div');
  div.className = 'absolute pointer-events-none transition-transform duration-75 ease-out';

  // Create the image child for the bunny frame
  const img = document.createElement('img');
  img.src = SPRITES.idle;
  img.className = 'pixel-art';
  img.style.width = '60px';
  img.style.height = '60px';

  div.appendChild(img);
  container.appendChild(div);

  bunny.element = div;
  bunny.imgElement = img;
});

// Physics/Movement Loop for Mouse Sniffers
function animateBunnies() {
  const now = Date.now();

  bunnies.forEach((bunny) => {
    const tx = isMouseInside ? targetX : (container.clientWidth / 2) + Math.sin(now * 0.001) * 120;
    const ty = isMouseInside ? targetY : (container.clientHeight / 2) + Math.cos(now * 0.001) * 90;

    const dx = tx - bunny.x;
    const dy = ty - bunny.y;

    bunny.x += dx * bunny.speed;
    bunny.y += dy * bunny.speed;

    bunny.x = Math.max(10, Math.min(container.clientWidth - 70, bunny.x));
    bunny.y = Math.max(10, Math.min(container.clientHeight - 70, bunny.y));

    // Flip image class based on direction
    if (dx > 2 && !bunny.faceRight) {
      bunny.faceRight = true;
      bunny.imgElement.classList.remove('flipped');
    } else if (dx < -2 && bunny.faceRight) {
      bunny.faceRight = false;
      bunny.imgElement.classList.add('flipped');
    }

    // --- ANIMATION CONTROLLER ---
    const movementSpeed = Math.sqrt(dx * dx + dy * dy);

    if (movementSpeed > 40) {
      // Fast chase: Cycle through your 4 JUMP frames
      if (now - bunny.lastAnimTime > 80) { // Speed of jump cycle (80ms)
        bunny.animFrame = (bunny.animFrame + 1) % SPRITES.jump.length;
        bunny.imgElement.src = SPRITES.jump[bunny.animFrame];
        bunny.lastAnimTime = now;
      }
    } else if (movementSpeed > 3) {
      // Slow walking: Cycle through your 6 WALK frames
      if (now - bunny.lastAnimTime > 120) { // Speed of walk cycle (120ms)
        bunny.animFrame = (bunny.animFrame + 1) % SPRITES.walk.length;
        bunny.imgElement.src = SPRITES.walk[bunny.animFrame];
        bunny.lastAnimTime = now;
      }
    } else {
      // Stopped: Static idle frame
      bunny.imgElement.src = SPRITES.idle;
    }

    bunny.element.style.left = `${bunny.x}px`;
    bunny.element.style.top = `${bunny.y}px`;
  });

  requestAnimationFrame(animateBunnies);
}
animateBunnies();


// ==========================================
// 3. BUNNIES PLAYING CARDS (RUNS AWAY ON HOVER)
// ==========================================
function renderCardZone() {
  cardZone.innerHTML = `
        <div class="relative flex items-center justify-center h-48 w-[300px]">
            <!-- Flying cards container -->
            <div id="cards-container" class="absolute inset-0 pointer-events-none"></div>

            <!-- Left Player (sitting/setting.png) -->
            <div id="bunny-left" class="absolute left-4 bottom-0 transition-all duration-500 ease-out">
                <img src="${SPRITES.idle}" class="pixel-art flipped" style="width: 60px; height: 60px;">
            </div>

            <!-- Table -->
            <div id="bunny-table" class="absolute bottom-0 left-[110px] w-20 h-10 bg-amber-900 rounded-t border-t-2 border-amber-700 shadow flex items-center justify-center transition-all duration-300">
                <div class="table-cards flex gap-0.5">
                    <div class="w-3 h-5 bg-white border border-slate-400 rotate-[-10deg]"></div>
                    <div class="w-3 h-5 bg-red-100 border border-slate-400 rotate-[5deg]"></div>
                    <div class="w-3 h-5 bg-white border border-slate-400 rotate-[15deg]"></div>
                </div>
            </div>

            <!-- Right Player (sitting/setting.png) -->
            <div id="bunny-right" class="absolute right-4 bottom-0 transition-all duration-500 ease-out">
                <img src="${SPRITES.idle}" class="pixel-art" style="width: 60px; height: 60px;">
            </div>
        </div>
    `;
}
renderCardZone();

const bLeft = document.getElementById('bunny-left');
const bRight = document.getElementById('bunny-right');
const bTable = document.getElementById('bunny-table');
const cardsContainer = document.getElementById('cards-container');

let isScattered = false;

function scatter() {
  if (isScattered) return;
  isScattered = true;

  bTable.classList.add('table-panic');

  // Scatter rabbits away to sides and swap their image to the maximum jump state (jump index 2)
  const leftImg = bLeft.querySelector('img');
  const rightImg = bRight.querySelector('img');
  leftImg.src = SPRITES.jump[2];
  rightImg.src = SPRITES.jump[2];

  bLeft.style.transform = 'translateX(-150px) translateY(-10px) scale(0.8)';
  bLeft.style.opacity = '0.3';
  bRight.style.transform = 'translateX(150px) translateY(-10px) scale(0.8)';
  bRight.style.opacity = '0.3';

  // Throw cards in the air
  for (let i = 0; i < 7; i++) {
    const card = document.createElement('div');
    card.className = 'flying-card absolute bg-white text-rose-500 font-bold border border-slate-300 text-[8px] rounded-sm flex items-center justify-center w-3 h-5 shadow';
    card.style.left = '145px';
    card.style.bottom = '35px';
    card.style.setProperty('--x-offset', `${(Math.random() - 0.5) * 200}px`);
    card.style.setProperty('--rot-offset', `${(Math.random() - 0.5) * 720}deg`);
    card.innerText = Math.random() > 0.5 ? '♥️' : '♠️';

    cardsContainer.appendChild(card);
    setTimeout(() => card.remove(), 600);
  }
}

function resetScattered() {
  if (!isScattered) return;
  isScattered = false;

  bTable.classList.remove('table-panic');

  // Return to sitting positions
  const leftImg = bLeft.querySelector('img');
  const rightImg = bRight.querySelector('img');
  leftImg.src = SPRITES.idle;
  rightImg.src = SPRITES.idle;

  bLeft.style.transform = 'translateX(0) translateY(0) scale(1)';
  bLeft.style.opacity = '1';
  bRight.style.transform = 'translateX(0) translateY(0) scale(1)';
  bRight.style.opacity = '1';
}

cardZone.addEventListener('mouseenter', scatter);
cardZone.addEventListener('mouseleave', resetScattered);
cardZone.addEventListener('touchstart', (e) => {
  e.stopPropagation();
  scatter();
  setTimeout(resetScattered, 3000);
}, { passive: true });


// ==========================================
// 4. SCROLL TO REVEAL COMFORT MESSAGES
// ==========================================
const scrollElements = document.querySelectorAll('.reveal-on-scroll');

const elementInView = (el, dividend = 1) => {
  const elementTop = el.getBoundingClientRect().top;
  return (elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend);
};

const displayScrollElement = (element) => {
  element.classList.add('active');
};

const handleScrollAnimation = () => {
  scrollElements.forEach((el) => {
    if (elementInView(el, 1.15)) {
      displayScrollElement(el);
    }
  });
};

window.addEventListener('scroll', handleScrollAnimation);
handleScrollAnimation();
