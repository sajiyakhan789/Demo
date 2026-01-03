// levels.js
class LevelManager {
    static getLevelConfig(level) {
        const baseConfig = {
            anomalyCount: 10 + (level * 2),
            anomalySpeed: 0.5 + (level * 0.1),
            spawnRate: 2000 - (level * 150),
            timeLimit: 60 + (level * 5)
        };
        
        // Cap values
        baseConfig.spawnRate = Math.max(500, baseConfig.spawnRate);
        baseConfig.anomalySpeed = Math.min(2.5, baseConfig.anomalySpeed);
        
        return baseConfig;
    }
    
    static getLevelTheme(level) {
        const themes = [
            { primary: '#00aaff', secondary: '#0066aa' },
            { primary: '#aa00ff', secondary: '#6600aa' },
            { primary: '#ffaa00', secondary: '#aa6600' },
            { primary: '#00ffaa', secondary: '#00aa66' },
            { primary: '#ff0066', secondary: '#aa0044' }
        ];
        
        return themes[(level - 1) % themes.length];
    }
}