// game.js
class QuantumDefender {
    constructor() {
        this.gameState = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.energy = 100;
        this.level = 1;
        this.timeLeft = 60;
        this.anomaliesDestroyed = 0;
        this.anomaliesTotal = 10;
        this.anomalies = [];
        this.nodes = [];
        this.connections = [];
        this.powerUses = {
            slowTime: 3,
            shield: 3,
            blast: 3
        };
        
        this.isShieldActive = false;
        this.isTimeSlowed = false;
        this.gameInterval = null;
        this.anomalySpawnInterval = null;
        
        this.initElements();
        this.initEventListeners();
        this.generateGrid();
        this.createDefenseNodes();
        
        // Show instructions on load
        setTimeout(() => {
            this.showInstructions();
        }, 1000);
    }
    
    initElements() {
        // Game elements
        this.energyFill = document.getElementById('energy-fill');
        this.energyValue = document.getElementById('energy-value');
        this.scoreValue = document.getElementById('score-value');
        this.levelValue = document.getElementById('level-value');
        this.anomaliesValue = document.getElementById('anomalies-value');
        this.timeValue = document.getElementById('time-value');
        
        // Containers
        this.anomaliesContainer = document.getElementById('anomalies-container');
        this.particlesContainer = document.getElementById('particles-container');
        this.defenseNodesContainer = document.querySelector('.defense-nodes');
        
        // Buttons
        this.btnStart = document.getElementById('btn-start');
        this.btnPause = document.getElementById('btn-pause');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnSlow = document.getElementById('btn-slow');
        this.btnShield = document.getElementById('btn-shield');
        this.btnBlast = document.getElementById('btn-blast');
        this.btnHelp = document.getElementById('btn-help');
        
        // Modals
        this.instructionsModal = document.getElementById('instructions-modal');
        this.gameoverModal = document.getElementById('gameover-modal');
        this.closeInstructions = document.getElementById('close-instructions');
        this.playAgain = document.getElementById('play-again');
        
        // Game messages
        this.gameMessage = document.getElementById('game-message');
    }
    
    initEventListeners() {
        // Game control buttons
        this.btnStart.addEventListener('click', () => this.startGame());
        this.btnPause.addEventListener('click', () => this.togglePause());
        this.btnRestart.addEventListener('click', () => this.restartGame());
        
        // Power buttons
        this.btnSlow.addEventListener('click', () => this.activateSlowTime());
        this.btnShield.addEventListener('click', () => this.activateShield());
        this.btnBlast.addEventListener('click', () => this.activateQuantumBlast());
        
        // Modal buttons
        this.btnHelp.addEventListener('click', () => this.showInstructions());
        this.closeInstructions.addEventListener('click', () => this.hideInstructions());
        this.playAgain.addEventListener('click', () => this.restartGame());
        
        // Volume control
        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            AudioManager.setVolume(e.target.value / 100);
        });
        
        // Allow dragging defense nodes
        this.initNodeDragging();
    }
    
    generateGrid() {
        const grid = document.querySelector('.defense-grid');
        const gridSize = 40;
        const width = grid.clientWidth;
        const height = grid.clientHeight;
        
        // Generate grid lines dynamically for better performance
        grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    }
    
    createDefenseNodes() {
        const nodePositions = [
            {x: 20, y: 20}, {x: 50, y: 80}, {x: 80, y: 20},
            {x: 20, y: 80}, {x: 80, y: 80}, {x: 50, y: 20}
        ];
        
        // Convert percentages to actual positions
        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        nodePositions.forEach((pos, index) => {
            const node = document.createElement('div');
            node.className = 'defense-node';
            node.id = `node-${index}`;
            node.dataset.index = index;
            
            // Calculate actual positions
            const xPos = (pos.x / 100) * containerWidth;
            const yPos = (pos.y / 100) * containerHeight;
            
            node.style.left = `${xPos}px`;
            node.style.top = `${yPos}px`;
            
            this.defenseNodesContainer.appendChild(node);
            this.nodes.push({
                element: node,
                x: xPos,
                y: yPos,
                connections: []
            });
        });
    }
    
    initNodeDragging() {
        let draggedNode = null;
        let startX, startY;
        
        document.querySelectorAll('.defense-node').forEach(node => {
            node.addEventListener('mousedown', (e) => {
                if (this.gameState !== 'playing') return;
                
                draggedNode = node;
                startX = e.clientX - parseFloat(node.style.left || 0);
                startY = e.clientY - parseFloat(node.style.top || 0);
                node.classList.add('active');
                
                e.preventDefault();
            });
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!draggedNode) return;
            
            const container = document.querySelector('.game-container');
            const containerRect = container.getBoundingClientRect();
            
            let newX = e.clientX - startX;
            let newY = e.clientY - startY;
            
            // Constrain to container
            newX = Math.max(0, Math.min(newX, containerRect.width - 30));
            newY = Math.max(0, Math.min(newY, containerRect.height - 30));
            
            draggedNode.style.left = `${newX}px`;
            draggedNode.style.top = `${newY}px`;
            
            // Update node position in array
            const nodeIndex = parseInt(draggedNode.dataset.index);
            this.nodes[nodeIndex].x = newX;
            this.nodes[nodeIndex].y = newY;
            
            // Update connections
            this.updateNodeConnections(nodeIndex);
        });
        
        document.addEventListener('mouseup', () => {
            if (draggedNode) {
                draggedNode.classList.remove('active');
                draggedNode = null;
            }
        });
    }
    
    updateNodeConnections(updatedNodeIndex) {
        // Remove old connections for this node
        this.connections = this.connections.filter(conn => 
            conn.from !== updatedNodeIndex && conn.to !== updatedNodeIndex
        );
        
        // Remove connection elements from DOM
        document.querySelectorAll('.node-connection').forEach(el => el.remove());
        
        // Create new connections with nearby nodes
        const updatedNode = this.nodes[updatedNodeIndex];
        
        this.nodes.forEach((node, index) => {
            if (index === updatedNodeIndex) return;
            
            const distance = Math.sqrt(
                Math.pow(node.x - updatedNode.x, 2) + 
                Math.pow(node.y - updatedNode.y, 2)
            );
            
            if (distance < 200) { // Connection threshold
                this.createConnection(updatedNodeIndex, index);
            }
        });
    }
    
    createConnection(fromIndex, toIndex) {
        const fromNode = this.nodes[fromIndex];
        const toNode = this.nodes[toIndex];
        
        // Create connection element
        const connection = document.createElement('div');
        connection.className = 'node-connection';
        
        const length = Math.sqrt(
            Math.pow(toNode.x - fromNode.x, 2) + 
            Math.pow(toNode.y - fromNode.y, 2)
        );
        
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * 180 / Math.PI;
        
        connection.style.width = `${length}px`;
        connection.style.left = `${fromNode.x + 15}px`;
        connection.style.top = `${fromNode.y + 15}px`;
        connection.style.transform = `rotate(${angle}deg)`;
        
        document.querySelector('.game-container').appendChild(connection);
        
        // Store connection
        this.connections.push({
            from: fromIndex,
            to: toIndex,
            element: connection
        });
    }
    
    startGame() {
        if (this.gameState === 'playing') return;
        
        this.gameState = 'playing';
        this.updateUI();
        
        AudioManager.playBackgroundMusic();
        
        // Start game loop
        this.gameInterval = setInterval(() => {
            this.gameLoop();
        }, 1000);
        
        // Start spawning anomalies
        this.spawnAnomaly();
        this.anomalySpawnInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.spawnAnomaly();
            }
        }, 2000);
        
        this.showMessage('QUANTUM DEFENSE INITIATED!', '#00ffcc');
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.btnPause.innerHTML = '<i class="fas fa-play"></i> RESUME';
            AudioManager.pauseBackgroundMusic();
            this.showMessage('GAME PAUSED', '#ffff00');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.btnPause.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
            AudioManager.resumeBackgroundMusic();
            this.hideMessage();
        }
    }
    
    restartGame() {
        // Clear intervals
        clearInterval(this.gameInterval);
        clearInterval(this.anomalySpawnInterval);
        
        // Reset game state
        this.gameState = 'menu';
        this.score = 0;
        this.energy = 100;
        this.level = 1;
        this.timeLeft = 60;
        this.anomaliesDestroyed = 0;
        this.anomaliesTotal = 10;
        
        // Reset power uses
        this.powerUses = {
            slowTime: 3,
            shield: 3,
            blast: 3
        };
        
        // Clear anomalies
        this.anomalies.forEach(anomaly => {
            anomaly.element.remove();
        });
        this.anomalies = [];
        
        // Update UI
        this.updateUI();
        this.hideGameOver();
        this.hideMessage();
        
        this.btnPause.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
        
        AudioManager.stopBackgroundMusic();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        // Update time
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.endGame(false);
            return;
        }
        
        // Move anomalies toward core
        this.moveAnomalies();
        
        // Check for collisions with connections
        this.checkConnectionCollisions();
        
        // Update UI
        this.updateUI();
        
        // Check for level completion
        if (this.anomaliesDestroyed >= this.anomaliesTotal) {
            this.completeLevel();
        }
    }
    
    spawnAnomaly() {
        if (this.anomalies.length >= 15) return; // Limit simultaneous anomalies
        
        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Spawn from edges
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // Top
                x = Math.random() * containerWidth;
                y = -40;
                break;
            case 1: // Right
                x = containerWidth + 40;
                y = Math.random() * containerHeight;
                break;
            case 2: // Bottom
                x = Math.random() * containerWidth;
                y = containerHeight + 40;
                break;
            case 3: // Left
                x = -40;
                y = Math.random() * containerHeight;
                break;
        }
        
        // Create anomaly element
        const anomaly = document.createElement('div');
        const type = Math.floor(Math.random() * 3) + 1;
        
        anomaly.className = `anomaly type-${type}`;
        anomaly.dataset.id = Date.now() + Math.random();
        
        // Add symbol inside
        const symbols = ['🌀', '⚡', '💥', '🌟', '🔮'];
        anomaly.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
        
        anomaly.style.left = `${x}px`;
        anomaly.style.top = `${y}px`;
        
        // Add click event to destroy anomaly
        anomaly.addEventListener('click', (e) => {
            if (this.gameState !== 'playing') return;
            this.destroyAnomaly(anomaly.dataset.id, e.clientX, e.clientY);
            AudioManager.playSound('click');
        });
        
        this.anomaliesContainer.appendChild(anomaly);
        
        // Store anomaly data
        this.anomalies.push({
            element: anomaly,
            id: anomaly.dataset.id,
            x: x,
            y: y,
            type: type,
            speed: 0.5 + Math.random() * 0.5,
            targetX: containerWidth / 2,
            targetY: containerHeight / 2
        });
    }
    
    moveAnomalies() {
        const container = document.querySelector('.game-container');
        const coreX = container.clientWidth / 2;
        const coreY = container.clientHeight / 2;
        
        this.anomalies.forEach(anomaly => {
            // Calculate direction to core
            const dx = coreX - anomaly.x;
            const dy = coreY - anomaly.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Normalize direction and apply speed
            const speed = this.isTimeSlowed ? anomaly.speed * 0.3 : anomaly.speed;
            anomaly.x += (dx / distance) * speed;
            anomaly.y += (dy / distance) * speed;
            
            // Update element position
            anomaly.element.style.left = `${anomaly.x}px`;
            anomaly.element.style.top = `${anomaly.y}px`;
            
            // Check if reached core
            if (distance < 90 && !this.isShieldActive) {
                this.hitCore(anomaly);
            }
        });
    }
    
    checkConnectionCollisions() {
        this.anomalies.forEach((anomaly, aIndex) => {
            this.connections.forEach(connection => {
                const fromNode = this.nodes[connection.from];
                const toNode = this.nodes[connection.to];
                
                // Check distance from anomaly to line segment
                const distance = this.pointToLineDistance(
                    anomaly.x + 20, anomaly.y + 20,
                    fromNode.x + 15, fromNode.y + 15,
                    toNode.x + 15, toNode.y + 15
                );
                
                if (distance < 25) { // Collision threshold
                    this.destroyAnomaly(anomaly.id, anomaly.x, anomaly.y);
                    
                    // Visual feedback for connection
                    connection.element.style.background = 'linear-gradient(90deg, #ffff00, #ffaa00)';
                    connection.element.style.boxShadow = '0 0 15px #ffff00';
                    
                    setTimeout(() => {
                        if (connection.element) {
                            connection.element.style.background = 'linear-gradient(90deg, #00ccff, transparent)';
                            connection.element.style.boxShadow = '0 0 10px #00ccff';
                        }
                    }, 300);
                }
            });
        });
    }
    
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    destroyAnomaly(anomalyId, x, y) {
        // Find and remove anomaly
        const anomalyIndex = this.anomalies.findIndex(a => a.id === anomalyId);
        if (anomalyIndex === -1) return;
        
        const anomaly = this.anomalies[anomalyIndex];
        
        // Visual effect
        anomaly.element.classList.add('explosion');
        ParticleSystem.createExplosion(x, y, anomaly.type);
        
        // Remove after animation
        setTimeout(() => {
            if (anomaly.element.parentNode) {
                anomaly.element.remove();
            }
        }, 500);
        
        // Update game state
        this.anomalies.splice(anomalyIndex, 1);
        this.anomaliesDestroyed++;
        this.score += 10;
        
        AudioManager.playSound('explosion');
        
        // Update UI
        this.updateUI();
    }
    
    hitCore(anomaly) {
        // Remove anomaly
        const anomalyIndex = this.anomalies.findIndex(a => a.id === anomaly.id);
        if (anomalyIndex === -1) return;
        
        anomaly.element.remove();
        this.anomalies.splice(anomalyIndex, 1);
        
        // Reduce energy
        this.energy -= 10;
        if (this.energy <= 0) {
            this.energy = 0;
            this.endGame(false);
        }
        
        // Visual feedback
        const core = document.getElementById('reactor-core');
        core.classList.add('shield-active');
        setTimeout(() => {
            core.classList.remove('shield-active');
        }, 500);
        
        ParticleSystem.createCoreHit(anomaly.x, anomaly.y);
        AudioManager.playSound('explosion');
        
        this.updateUI();
    }
    
    completeLevel() {
        // Calculate level bonus
        const timeBonus = Math.floor(this.timeLeft * 2);
        const energyBonus = Math.floor(this.energy / 2);
        const levelBonus = 50 * this.level;
        
        this.score += timeBonus + energyBonus + levelBonus;
        
        // Show level complete message
        this.showMessage(
            `LEVEL ${this.level} COMPLETE! +${timeBonus + energyBonus + levelBonus} POINTS`, 
            '#00ffcc'
        );
        
        // Next level
        this.level++;
        this.timeLeft = 60 + (this.level * 5);
        this.anomaliesDestroyed = 0;
        this.anomaliesTotal = 10 + (this.level * 2);
        
        // Refill energy partially
        this.energy = Math.min(100, this.energy + 30);
        
        // Refill power uses
        this.powerUses.slowTime = Math.min(3, this.powerUses.slowTime + 1);
        this.powerUses.shield = Math.min(3, this.powerUses.shield + 1);
        this.powerUses.blast = Math.min(3, this.powerUses.blast + 1);
        
        AudioManager.playSound('powerup');
        this.updateUI();
    }
    
    endGame(success) {
        this.gameState = 'gameover';
        clearInterval(this.gameInterval);
        clearInterval(this.anomalySpawnInterval);
        
        // Update final stats
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level - (success ? 0 : 1);
        document.getElementById('final-anomalies').textContent = this.anomaliesDestroyed;
        document.getElementById('final-energy').textContent = `${this.energy}%`;
        
        // Update title
        const title = document.getElementById('gameover-title');
        title.innerHTML = success ? 
            'MISSION <span class="success">SUCCESS</span>' : 
            'MISSION <span class="failure">FAILED</span>';
        
        // Show game over modal
        this.showGameOver();
        AudioManager.stopBackgroundMusic();
    }
    
    activateSlowTime() {
        if (this.gameState !== 'playing' || this.powerUses.slowTime <= 0) return;
        
        this.powerUses.slowTime--;
        this.isTimeSlowed = true;
        
        // Visual effect
        document.querySelector('.game-container').classList.add('slow-time-active');
        
        // Update button
        this.btnSlow.innerHTML = `<i class="fas fa-tachometer-alt"></i> SLOW TIME (${this.powerUses.slowTime})`;
        this.btnSlow.disabled = this.powerUses.slowTime <= 0;
        
        AudioManager.playSound('powerup');
        
        // Reset after 5 seconds
        setTimeout(() => {
            this.isTimeSlowed = false;
            document.querySelector('.game-container').classList.remove('slow-time-active');
        }, 5000);
    }
    
    activateShield() {
        if (this.gameState !== 'playing' || this.powerUses.shield <= 0) return;
        
        this.powerUses.shield--;
        this.isShieldActive = true;
        
        // Visual effect on core
        const core = document.getElementById('reactor-core');
        core.classList.add('shield-active');
        
        // Update button
        this.btnShield.innerHTML = `<i class="fas fa-shield-alt"></i> ENERGY SHIELD (${this.powerUses.shield})`;
        this.btnShield.disabled = this.powerUses.shield <= 0;
        
        AudioManager.playSound('powerup');
        
        // Reset after 8 seconds
        setTimeout(() => {
            this.isShieldActive = false;
            core.classList.remove('shield-active');
        }, 8000);
    }
    
    activateQuantumBlast() {
        if (this.gameState !== 'playing' || this.powerUses.blast <= 0) return;
        
        this.powerUses.blast--;
        
        // Destroy all anomalies
        const anomaliesToDestroy = [...this.anomalies];
        anomaliesToDestroy.forEach(anomaly => {
            this.destroyAnomaly(anomaly.id, anomaly.x, anomaly.y);
        });
        
        // Update button
        this.btnBlast.innerHTML = `<i class="fas fa-bolt"></i> QUANTUM BLAST (${this.powerUses.blast})`;
        this.btnBlast.disabled = this.powerUses.blast <= 0;
        
        AudioManager.playSound('powerup');
        this.showMessage('QUANTUM BLAST!', '#ffaa00');
    }
    
    updateUI() {
        // Update stats
        this.energyFill.style.width = `${this.energy}%`;
        this.energyValue.textContent = `${this.energy}%`;
        this.scoreValue.textContent = this.score;
        this.levelValue.textContent = this.level;
        this.anomaliesValue.textContent = `${this.anomaliesDestroyed}/${this.anomaliesTotal}`;
        this.timeValue.textContent = `${this.timeLeft}s`;
        
        // Update power buttons
        this.btnSlow.innerHTML = `<i class="fas fa-tachometer-alt"></i> SLOW TIME (${this.powerUses.slowTime})`;
        this.btnShield.innerHTML = `<i class="fas fa-shield-alt"></i> ENERGY SHIELD (${this.powerUses.shield})`;
        this.btnBlast.innerHTML = `<i class="fas fa-bolt"></i> QUANTUM BLAST (${this.powerUses.blast})`;
        
        this.btnSlow.disabled = this.powerUses.slowTime <= 0 || this.gameState !== 'playing';
        this.btnShield.disabled = this.powerUses.shield <= 0 || this.gameState !== 'playing';
        this.btnBlast.disabled = this.powerUses.blast <= 0 || this.gameState !== 'playing';
        
        // Update button states based on game state
        if (this.gameState === 'playing') {
            this.btnStart.style.display = 'none';
            this.btnPause.style.display = 'inline-flex';
        } else {
            this.btnStart.style.display = 'inline-flex';
            this.btnPause.style.display = 'none';
        }
    }
    
    showMessage(text, color) {
        this.gameMessage.textContent = text;
        this.gameMessage.style.color = color;
        this.gameMessage.style.opacity = '1';
        this.gameMessage.style.borderColor = color;
        
        setTimeout(() => {
            this.hideMessage();
        }, 2000);
    }
    
    hideMessage() {
        this.gameMessage.style.opacity = '0';
    }
    
    showInstructions() {
        this.instructionsModal.style.display = 'flex';
    }
    
    hideInstructions() {
        this.instructionsModal.style.display = 'none';
    }
    
    showGameOver() {
        this.gameoverModal.style.display = 'flex';
    }
    
    hideGameOver() {
        this.gameoverModal.style.display = 'none';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new QuantumDefender();
});