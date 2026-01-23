import { initCarousel } from './carousel.js';

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
}

async function loadTabContent(tabName, fileName) {
    const container = document.getElementById(tabName);
    
    // Show loading state
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
            
            if (tabName === 'objects' || tabName === 'code') {
                initCarousel(tabName);
                initLightbox(tabName);
            }
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
    loadTabContent('about', 'about.html');
    loadTabContent('code', 'ideas.html');
    loadTabContent('objects', 'objects.html');

    const initial = location.hash.replace('#', '');
    if (initial) {
        setTimeout(() => showTab(null, initial, false), 400);
    }
}

window.addEventListener('popstate', handlePopState);

// Dark mode toggle
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;
    
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
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

// Menu toggle (plus icon rollout)
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
    
    // Close menu when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Close menu when a tab is clicked
    navMenu.addEventListener('click', (e) => {
        if (e.target.closest('.tab-button')) {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Lightbox for images
function initLightbox(tabName) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxCaption = document.getElementById('lightboxCaption');
    
    if (!lightbox) return;
    
    const container = tabName ? document.getElementById(tabName) : document;
    const images = container.querySelectorAll('.screenshot');
    
    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.onclick = () => {
            lightbox.classList.add('active');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCaption.textContent = img.alt;
            lightboxImg.classList.remove('zoomed');
            document.body.style.overflow = 'hidden';
        };
    });
    
    // Toggle zoom on image click
    lightboxImg.onclick = () => {
        lightboxImg.classList.toggle('zoomed');
    };
    
    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxImg.classList.remove('zoomed');
    }
    
    lightboxClose.onclick = closeLightbox;
    
    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    };
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

// Back to top button
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
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initDarkMode();
    initMobileMenu();
    initBackToTop();
    
    // Event delegation for tab buttons
    document.body.addEventListener('click', (e) => {
        const tabButton = e.target.closest('[data-tab]');
        if (tabButton) {
            e.preventDefault();
            showTab(e, tabButton.dataset.tab);
        }
    });
});