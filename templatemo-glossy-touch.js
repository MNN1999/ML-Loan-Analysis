// ===============================
// Simple multi-page shell control
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('[data-page-target]');
    let currentPageId = 'page-overview';

    function showPage(pageId) {
        // Hide/show pages
        pages.forEach(page => {
            page.classList.toggle('is-active', page.id === pageId);
        });

        // Update nav & footer links
        navLinks.forEach(link => {
            const target = link.getAttribute('data-page-target');
            link.classList.toggle('is-active', target === pageId);
        });

        currentPageId = pageId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Attach click handlers to all elements with data-page-target
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-page-target');
            if (targetId) {
                showPage(targetId);
            }
        });
    });

    // Make logo + footer-logo act as "home" buttons if they have data-page-target
    document.querySelectorAll('.logo, .footer-logo').forEach(el => {
        el.addEventListener('click', () => {
            const targetId = el.getAttribute('data-page-target') || 'page-overview';
            showPage(targetId);
        });
    });

    // Initial page
    showPage(currentPageId);

    // ===============================
    // Parallax background shapes
    // ===============================

    document.addEventListener('mousemove', (e) => {
        const shapes = document.querySelectorAll('.shape');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            const xPos = (x - 0.5) * speed * 20;
            const yPos = (y - 0.5) * speed * 20;
            shape.style.transform = `translate(${xPos}px, ${yPos}px)`;
        });
    });

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.bg-shapes');
        if (!parallax) return;
        const speed = scrolled * 0.5;
        parallax.style.transform = `translateY(${speed}px)`;
    });

    // ===============================
    // Ripple effect on glass elements
    // ===============================

    const glassElements = document.querySelectorAll('.glass');
    glassElements.forEach(element => {
        element.addEventListener('click', function (e) {
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                z-index: 10;
            `;

            if (getComputedStyle(this).position === 'static') {
                this.style.position = 'relative';
            }

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Inject ripple keyframes if not already present
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ===============================
    // Optional form handler (safe)
    // ===============================

    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(46, 204, 113, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                backdrop-filter: blur(20px);
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            `;
            successMsg.textContent = "Message sent successfully! We'll get back to you soon.";

            document.body.appendChild(successMsg);

            setTimeout(() => {
                successMsg.remove();
            }, 3000);

            form.reset();
        });

        const fadeStyle = document.createElement('style');
        fadeStyle.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(fadeStyle);
    }
});
