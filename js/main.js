document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const toggle = document.getElementById('mobileToggle');
    const nav = document.querySelector('.nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('open');
            const icon = toggle.querySelector('i');
            if (nav.classList.contains('open')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
    }

    // Cookie consent
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptBtn = document.getElementById('cookieAccept');
    const rejectBtn = document.getElementById('cookieReject');
    
    if (!localStorage.getItem('cookieConsent')) {
        cookieConsent.classList.add('show');
    }
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieConsent.classList.remove('show');
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'rejected');
            cookieConsent.classList.remove('show');
        });
    }

    // Interest tags
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Option buttons
    document.querySelectorAll('.option-btn input').forEach(input => {
        input.addEventListener('change', function() {
            const parent = this.closest('.options-grid');
            if (parent) {
                parent.querySelectorAll('.option-btn input').forEach(btn => {
                    if (btn !== this) btn.checked = false;
                });
            }
        });
    });

    // Scroll animations
    const fadeElements = document.querySelectorAll('.fade-in');
    function isElementPartiallyInViewport(el) {
        const rect = el.getBoundingClientRect();
        return rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
    }
    function handleScrollAnimations() {
        fadeElements.forEach(el => {
            if (isElementPartiallyInViewport(el)) {
                el.classList.add('visible');
            }
        });
    }
    handleScrollAnimations();
    window.addEventListener('scroll', handleScrollAnimations);
});