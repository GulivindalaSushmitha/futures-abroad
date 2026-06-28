// ============================================================
// js/animations.js - Cartoon Animations with Lottie
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== HERO CHARACTER ANIMATION =====
    if (document.getElementById('lottie-character')) {
        lottie.loadAnimation({
            container: document.getElementById('lottie-character'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/animations/character.json' // ← YOUR CARTOON FILE
        });
    }

    // ===== SIGNUP ANIMATION =====
    if (document.getElementById('signup-animation')) {
        lottie.loadAnimation({
            container: document.getElementById('signup-animation'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/animations/signup.json'
        });
    }

    // ===== LOGIN ANIMATION =====
    if (document.getElementById('login-animation')) {
        lottie.loadAnimation({
            container: document.getElementById('login-animation'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/animations/login.json'
        });
    }

    // ===== ADMIN ANIMATION =====
    if (document.getElementById('admin-animation')) {
        lottie.loadAnimation({
            container: document.getElementById('admin-animation'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/animations/admin.json'
        });
    }

    // ===== QUIZ CHARACTER ANIMATION =====
    if (document.getElementById('quiz-character-animation')) {
        lottie.loadAnimation({
            container: document.getElementById('quiz-character-animation'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/animations/quiz-character.json'
        });
    }

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ===== MOBILE HAMBURGER MENU =====
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'white';
                navLinks.style.padding = '1rem';
                navLinks.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1)';
            }
        });
    }

    // ===== TIMELINE ANIMATION ON SCROLL =====
    const timelineItems = document.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.2 });
    timelineItems.forEach(item => observer.observe(item));

    // ===== COUNTER ANIMATION =====
    document.querySelectorAll('.stat-number').forEach(stat => {
        const target = parseInt(stat.textContent);
        if (target > 0) {
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = target + '+';
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current) + '+';
                }
            }, 30);
        }
    });
});
