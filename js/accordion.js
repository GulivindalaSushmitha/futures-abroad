// ============================================
// ACCORDION FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    // Open first item by default if on how-it-works page
    if (window.location.pathname.includes('how-it-works.html')) {
        const firstItem = document.querySelector('.accordion-item');
        if (firstItem && !firstItem.classList.contains('active')) {
            firstItem.classList.add('active');
        }
    }
    
    // Check for hash in URL
    if (window.location.hash) {
        const hash = window.location.hash;
        const targetItem = document.querySelector(hash);
        if (targetItem && targetItem.classList.contains('accordion-item')) {
            // Close all others
            accordionItems.forEach(item => item.classList.remove('active'));
            targetItem.classList.add('active');
            
            // Scroll to it
            setTimeout(() => {
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        header.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all items
            accordionItems.forEach(i => i.classList.remove('active'));
            
            // Toggle clicked item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

// ============================================
// PHASE LINK NAVIGATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const phaseLinks = document.querySelectorAll('.phase-link');
    
    phaseLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        });
    });
});