// template.js

document.addEventListener('DOMContentLoaded', () => {
    // ===============================
    // PAGE SWITCHING
    // ===============================
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link[data-page-target]');
    const logoTriggers = document.querySelectorAll('.logo[data-page-target], .footer-logo[data-page-target]');

    function setActivePage(pageId) {
        let pageFound = false;

        pages.forEach(page => {
            const isTarget = page.id === pageId;
            page.classList.toggle('is-active', isTarget);
            if (isTarget) pageFound = true;
        });

        // If requested id doesn't exist, fall back to first page
        if (!pageFound && pages.length > 0) {
            const fallbackId = pages[0].id;
            pages[0].classList.add('is-active');
            pageId = fallbackId;
        }

        navLinks.forEach(link => {
            const target = link.dataset.pageTarget;
            link.classList.toggle('is-active', target === pageId);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Initial page
    setActivePage('page-overview');

    // Nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.pageTarget;
            if (targetId) setActivePage(targetId);
        });
    });

    // Logo + footer logo act as "home" unless pointed somewhere else
    logoTriggers.forEach(el => {
        el.addEventListener('click', () => {
            const targetId = el.dataset.pageTarget || 'page-overview';
            setActivePage(targetId);
        });
    });

    // ===============================
    // PARALLAX BACKGROUND SHAPES
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
    // RIPPLE EFFECT ON GLASS
    // ===============================
    const glassElements = document.querySelectorAll('.glass');
    glassElements.forEach(element => {
        element.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('div');
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

    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);

    // ===============================
    // OPTIONAL FORM HANDLER (SAFE)
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


