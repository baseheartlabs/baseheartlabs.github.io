export function initCarousel(tabName){
    const tab = tabName ? document.getElementById(tabName) : document;
    const timeline = tab.querySelector('.timeline');
    if(!timeline) return;
    
    // Guard against double initialization
    if(timeline.dataset.carouselInit) return;
    timeline.dataset.carouselInit = 'true';
    
    const wrapper = timeline.querySelector('.timeline-wrapper');
    const nav = timeline.querySelector('.carousel-nav');
    if(!wrapper || !nav) return;
    
    const entries = Array.from(wrapper.querySelectorAll('.entry'));
    if(entries.length <= 1) return;
    
    // Add dots
    const dotsContainer = nav.querySelector('.carousel-dots');
    entries.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    });
    
    let currentIndex = 0;
    
    function goToSlide(index){
        currentIndex = index;
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update dots
        nav.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        
        // Buttons are always enabled for wrap-around
        nav.querySelector('.prev').disabled = false;
        nav.querySelector('.next').disabled = false;
    }
    
    nav.querySelector('.prev').onclick = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : entries.length - 1;
        goToSlide(newIndex);
    };
    
    nav.querySelector('.next').onclick = () => {
        const newIndex = currentIndex < entries.length - 1 ? currentIndex + 1 : 0;
        goToSlide(newIndex);
    };
    
    // Make timeline focusable for keyboard navigation
    timeline.setAttribute('tabindex', '0');
    timeline.setAttribute('role', 'region');
    timeline.setAttribute('aria-label', 'Image carousel');
    
    // Keyboard navigation
    timeline.addEventListener('keydown', (e) => {
        if(e.key === 'ArrowLeft') {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : entries.length - 1;
            goToSlide(newIndex);
        }
        if(e.key === 'ArrowRight') {
            const newIndex = currentIndex < entries.length - 1 ? currentIndex + 1 : 0;
            goToSlide(newIndex);
        }
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 50;
    
    timeline.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    timeline.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0) {
                // Swipe left - go next
                const newIndex = currentIndex < entries.length - 1 ? currentIndex + 1 : 0;
                goToSlide(newIndex);
            } else {
                // Swipe right - go prev
                const newIndex = currentIndex > 0 ? currentIndex - 1 : entries.length - 1;
                goToSlide(newIndex);
            }
        }
    }, { passive: true });
    
    // Add aria-live for screen reader announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    timeline.appendChild(liveRegion);
    
    // Announce slide changes
    const originalGoToSlide = goToSlide;
    goToSlide = function(index) {
        originalGoToSlide(index);
        liveRegion.textContent = `Slide ${index + 1} of ${entries.length}`;
    };
    
    // Initialize
    goToSlide(0);
}