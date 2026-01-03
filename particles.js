// particles.js
class ParticleSystem {
    static createExplosion(x, y, type) {
        const container = document.getElementById('particles-container');
        const colors = [
            ['#ff0055', '#ffaa00'],
            ['#ffaa00', '#ffff00'],
            ['#00ffaa', '#00aaff']
        ];
        
        const colorSet = colors[type - 1] || colors[0];
        
        // Create multiple particles
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random size and color
            const size = 5 + Math.random() * 10;
            const color = colorSet[Math.floor(Math.random() * colorSet.length)];
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = color;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Add to container
            container.appendChild(particle);
            
            // Animate particle
            let opacity = 1;
            let currentX = x;
            let currentY = y;
            let particleSize = size;
            
            const animate = () => {
                opacity -= 0.03;
                particleSize -= 0.1;
                currentX += vx;
                currentY += vy;
                
                particle.style.opacity = opacity;
                particle.style.width = `${particleSize}px`;
                particle.style.height = `${particleSize}px`;
                particle.style.left = `${currentX}px`;
                particle.style.top = `${currentY}px`;
                
                if (opacity <= 0 || particleSize <= 0) {
                    particle.remove();
                    return;
                }
                
                requestAnimationFrame(animate);
            };
            
            animate();
        }
    }
    
    static createCoreHit(x, y) {
        const container = document.getElementById('particles-container');
        
        // Create shockwave
        const shockwave = document.createElement('div');
        shockwave.className = 'particle';
        shockwave.style.borderRadius = '50%';
        shockwave.style.border = '2px solid #ff3333';
        shockwave.style.width = '10px';
        shockwave.style.height = '10px';
        shockwave.style.left = `${x}px`;
        shockwave.style.top = `${y}px`;
        
        container.appendChild(shockwave);
        
        // Animate shockwave
        let size = 10;
        let opacity = 1;
        
        const animate = () => {
            size += 8;
            opacity -= 0.05;
            
            shockwave.style.width = `${size}px`;
            shockwave.style.height = `${size}px`;
            shockwave.style.left = `${x - size/2}px`;
            shockwave.style.top = `${y - size/2}px`;
            shockwave.style.opacity = opacity;
            
            if (opacity <= 0) {
                shockwave.remove();
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    static createPowerUpEffect(x, y, color) {
        const container = document.getElementById('particles-container');
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = 6 + Math.random() * 8;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = color;
            particle.style.borderRadius = '50%';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            container.appendChild(particle);
            
            // Circular motion
            const angle = (i / 8) * Math.PI * 2;
            const radius = 5;
            let currentRadius = radius;
            
            const animate = () => {
                currentRadius += 3;
                const currentX = x + Math.cos(angle) * currentRadius;
                const currentY = y + Math.sin(angle) * currentRadius;
                const opacity = 1 - (currentRadius / 100);
                
                particle.style.left = `${currentX}px`;
                particle.style.top = `${currentY}px`;
                particle.style.opacity = opacity;
                
                if (opacity <= 0) {
                    particle.remove();
                    return;
                }
                
                requestAnimationFrame(animate);
            };
            
            animate();
        }
    }
}