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

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    
    // Event delegation for tab buttons
    document.body.addEventListener('click', (e) => {
        const tabButton = e.target.closest('[data-tab]');
        if (tabButton) {
            e.preventDefault();
            showTab(e, tabButton.dataset.tab);
        }
    });
});