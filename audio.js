// audio.js
class AudioManager {
    static init() {
        this.backgroundMusic = document.getElementById('background-music');
        this.clickSound = document.getElementById('click-sound');
        this.explosionSound = document.getElementById('explosion-sound');
        this.powerupSound = document.getElementById('powerup-sound');
        
        this.volume = 0.7;
        this.updateVolume();
    }
    
    static setVolume(value) {
        this.volume = value;
        this.updateVolume();
    }
    
    static updateVolume() {
        this.backgroundMusic.volume = this.volume * 0.5;
        this.clickSound.volume = this.volume * 0.7;
        this.explosionSound.volume = this.volume * 0.6;
        this.powerupSound.volume = this.volume * 0.7;
    }
    
    static playBackgroundMusic() {
        this.backgroundMusic.currentTime = 0;
        this.backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
    }
    
    static pauseBackgroundMusic() {
        this.backgroundMusic.pause();
    }
    
    static resumeBackgroundMusic() {
        this.backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
    }
    
    static stopBackgroundMusic() {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
    }
    
    static playSound(soundName) {
        let sound;
        switch(soundName) {
            case 'click': sound = this.clickSound; break;
            case 'explosion': sound = this.explosionSound; break;
            case 'powerup': sound = this.powerupSound; break;
            default: return;
        }
        
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound play failed:", e));
    }
}

// Initialize audio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AudioManager.init();
});