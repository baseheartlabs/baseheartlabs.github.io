export function showTab(event, tabName, push = true) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
    });

    const target = document.getElementById(tabName);
    if (target) {
        target.classList.add('active');
    }

    const btn = document.querySelector(`.tab-button[aria-controls="${tabName}"]`);
    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
    }

    if (push) {
        history.pushState({ tab: tabName }, '', '#' + tabName);
    }

    // Scroll to top when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const TAB_FILE_MAP = {
    kitchen: 'kitchen.html',
    office: 'office.html',
    livingroom: 'livingroom.html',
    gameroom: 'gameroom.html',
    software: 'software.html',
    about: 'about.html'
};

async function loadTabContent(tabName, fileName) {
    const container = document.getElementById(tabName);
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner" aria-label="Loading content"><div class="spinner"></div></div>';

    try {
        const res = await fetch(fileName);
        if (!res.ok) throw new Error('Fetch failed');

        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const main = doc.querySelector('.container') || doc.querySelector('main');

        if (main) {
            const html = main.innerHTML.replace(/<h1>[\s\S]*?<\/h1>/, '');
            container.innerHTML = html;
            bindLightboxCards(tabName);
            observeCards(container);
        }
    } catch (e) {
        console.error('loadTabContent error', e);
        container.innerHTML = '<p style="color:#6c757d">Content not available.</p>';
    }
}

function handlePopState(ev) {
    const tab = (ev.state && ev.state.tab) || location.hash.replace('#', '') || 'home';
    showTab(null, tab, false);
}

function initializeTabs() {
    for (const [tabName, fileName] of Object.entries(TAB_FILE_MAP)) {
        loadTabContent(tabName, fileName);
    }

    const initial = location.hash.replace('#', '');
    if (initial) {
        setTimeout(() => showTab(null, initial, false), 400);
    }
}

window.addEventListener('popstate', handlePopState);

// Dark mode
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggle.checked = true;
    }

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Mobile menu
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    if (!menuToggle || !navMenu) return;

    function toggleMenu() {
        const isOpen = navMenu.classList.contains('open');
        if (isOpen) {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        } else {
            navMenu.classList.add('open');
            menuToggle.setAttribute('aria-expanded', 'true');
        }
    }

    menuToggle.addEventListener('click', toggleMenu);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    navMenu.addEventListener('click', (e) => {
        if (e.target.closest('.tab-button')) {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Multi-image lightbox — initialized once, cards bound per tab
const lightboxState = { images: [], index: 0, alt: '' };

function initLightboxOnce() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    if (!lightbox) return;

    function updateView() {
        lightboxImg.src = lightboxState.images[lightboxState.index];
        lightboxImg.alt = lightboxState.alt;
        lightboxCaption.textContent = lightboxState.alt;

        if (lightboxState.images.length > 1) {
            lightboxCounter.textContent = `${lightboxState.index + 1} of ${lightboxState.images.length}`;
            lightboxPrev.hidden = false;
            lightboxNext.hidden = false;
        } else {
            lightboxCounter.textContent = '';
            lightboxPrev.hidden = true;
            lightboxNext.hidden = true;
        }
    }

    function prevImage() {
        if (lightboxState.images.length <= 1) return;
        lightboxState.index = lightboxState.index > 0 ? lightboxState.index - 1 : lightboxState.images.length - 1;
        lightboxImg.classList.remove('zoomed');
        updateView();
    }

    function nextImage() {
        if (lightboxState.images.length <= 1) return;
        lightboxState.index = lightboxState.index < lightboxState.images.length - 1 ? lightboxState.index + 1 : 0;
        lightboxImg.classList.remove('zoomed');
        updateView();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxImg.classList.remove('zoomed');
        lightboxState.images = [];
    }

    window._openGallery = function(images, alt, index) {
        lightboxState.images = images;
        lightboxState.alt = alt;
        lightboxState.index = index;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        lightboxImg.classList.remove('zoomed');
        updateView();
    };

    lightboxImg.addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxImg.classList.toggle('zoomed');
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
    lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    });

    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextImage();
            else prevImage();
        }
    }, { passive: true });
}

function bindLightboxCards(tabName) {
    const container = tabName ? document.getElementById(tabName) : document;
    if (!container) return;

    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            let images = [];
            try { images = JSON.parse(card.dataset.images || '[]'); } catch (e) { images = []; }
            if (images.length === 0) {
                const img = card.querySelector('.card-image');
                if (img) images = [img.src];
            }
            if (images.length === 0) return;
            const alt = card.querySelector('.card-body h3')?.textContent || '';
            window._openGallery(images, alt, 0);
        });
    });

    container.querySelectorAll('.screenshot').forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => window._openGallery([img.src], img.alt, 0));
    });
}

// Scroll-triggered card reveal via IntersectionObserver
const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            cardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

function observeCards(container) {
    const cards = container.querySelectorAll('.card');
    cards.forEach((card, i) => {
        card.style.animationDelay = `${i * 0.06}s`;
        cardObserver.observe(card);
    });
}

// Back to top
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initLightboxOnce();
    initializeTabs();
    initDarkMode();
    initMobileMenu();
    initBackToTop();

    // Event delegation for tab buttons and home cards
    document.body.addEventListener('click', (e) => {
        const tabButton = e.target.closest('[data-tab]');
        if (tabButton && !tabButton.closest('.card')) {
            e.preventDefault();
            showTab(e, tabButton.dataset.tab);
        }
    });
});
