// Swarm Effect - Particles follow cursor like bees with adaptive colors
class SwarmEffect {
    constructor() {
        this.particles = [];
        this.particleCount = 200;
        this.mouse = { x: null, y: null };
        this.lastMoveTime = Date.now();
        this.idleThreshold = 2000;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.colorUpdateInterval = 30; // Update colors every 30 frames for performance
        this.frameCount = 0;

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        this.canvas.style.mixBlendMode = 'normal';
        document.body.prepend(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Create particles with better distribution
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle(i));
        }

        // Event listeners
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('resize', () => this.resize());

        // Start animation
        this.animate();
    }

    createParticle(index) {
        const cols = Math.ceil(Math.sqrt(this.particleCount));
        const rows = Math.ceil(this.particleCount / cols);
        const cellWidth = this.canvas.width / cols;
        const cellHeight = this.canvas.height / rows;

        const col = index % cols;
        const row = Math.floor(index / cols);

        return {
            x: col * cellWidth + Math.random() * cellWidth,
            y: row * cellHeight + Math.random() * cellHeight,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            size: Math.random() * 2 + 1,
            color: 'rgba(59, 130, 246, 0.9)', // Will be updated dynamically
            baseSpeed: Math.random() * 0.5 + 0.3
        };
    }

    // Check background brightness at position
    isLightBackground(x, y) {
        const elementAtPoint = document.elementFromPoint(x, y);
        if (!elementAtPoint) return true;

        const bgColor = window.getComputedStyle(elementAtPoint).backgroundColor;

        // Extract RGB values
        const rgb = bgColor.match(/\d+/g);
        if (!rgb || rgb.length < 3) return true;

        // Calculate relative luminance
        const r = parseInt(rgb[0]) / 255;
        const g = parseInt(rgb[1]) / 255;
        const b = parseInt(rgb[2]) / 255;

        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luminance > 0.5;
    }

    getAdaptiveColor(x, y) {
        const isLight = this.isLightBackground(x, y);

        if (isLight) {
            // Dark colors for light backgrounds
            const darkColors = [
                'rgba(30, 64, 175, 0.85)',
                'rgba(37, 99, 235, 0.9)',
                'rgba(15, 23, 42, 0.75)',
                'rgba(30, 41, 59, 0.8)',
                'rgba(6, 78, 59, 0.7)'
            ];
            return darkColors[Math.floor(Math.random() * darkColors.length)];
        } else {
            // Light colors for dark backgrounds
            const lightColors = [
                'rgba(147, 197, 253, 0.95)',
                'rgba(186, 230, 253, 0.9)',
                'rgba(125, 211, 252, 0.95)',
                'rgba(165, 180, 252, 0.9)',
                'rgba(255, 255, 255, 0.8)'
            ];
            return lightColors[Math.floor(Math.random() * lightColors.length)];
        }
    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.lastMoveTime = Date.now();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    isIdle() {
        return Date.now() - this.lastMoveTime > this.idleThreshold;
    }

    updateParticles() {
        const isIdle = this.isIdle();
        this.frameCount++;

        this.particles.forEach((particle, index) => {
            // Update particle color periodically based on background
            if (this.frameCount % this.colorUpdateInterval === index % this.colorUpdateInterval) {
                particle.color = this.getAdaptiveColor(particle.x, particle.y);
            }

            // Add repulsion force from other particles
            this.particles.forEach((other, otherIndex) => {
                if (index !== otherIndex) {
                    const dx = particle.x - other.x;
                    const dy = particle.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 80 && distance > 0) {
                        const repelForce = (80 - distance) / 80 * 0.5;
                        particle.vx += (dx / distance) * repelForce;
                        particle.vy += (dy / distance) * repelForce;
                    }
                }
            });

            if (!isIdle && this.mouse.x !== null && this.mouse.y !== null) {
                // Follow cursor mode
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 10) {
                    const force = Math.min(distance / 150, 2);
                    particle.vx += (dx / distance) * force * 0.08;
                    particle.vy += (dy / distance) * force * 0.08;
                }

                particle.vx += (Math.random() - 0.5) * 0.3;
                particle.vy += (Math.random() - 0.5) * 0.3;

                const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                const maxSpeed = 3;
                if (speed > maxSpeed) {
                    particle.vx = (particle.vx / speed) * maxSpeed;
                    particle.vy = (particle.vy / speed) * maxSpeed;
                }
            } else {
                // Idle mode - random floating
                particle.vx += (Math.random() - 0.5) * 0.4;
                particle.vy += (Math.random() - 0.5) * 0.4;

                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const targetX = particle.x < centerX ? particle.x - 50 : particle.x + 50;
                const targetY = particle.y < centerY ? particle.y - 50 : particle.y + 50;

                particle.vx += (targetX - particle.x) * 0.0001;
                particle.vy += (targetY - particle.y) * 0.0001;

                const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                const maxSpeed = 1.5;
                if (speed > maxSpeed) {
                    particle.vx = (particle.vx / speed) * maxSpeed;
                    particle.vy = (particle.vy / speed) * maxSpeed;
                }
            }

            // Apply friction
            particle.vx *= 0.97;
            particle.vy *= 0.97;

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        });
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();

            // Add subtle glow
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = particle.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        cancelAnimationFrame(this.animationId);
        this.canvas.remove();
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('resize', this.resize);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SwarmEffect();
    });
} else {
    new SwarmEffect();
}
