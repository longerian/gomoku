/**
 * 五子棋游戏 - 音效管理器
 * 使用 Web Audio API 生成音效
 */

class SoundManager {
  static audioContext = null;
  static enabled = true;

  /**
   * 初始化音频上下文
   */
  static init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * 设置音效开关
   */
  static setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * 播放音效
   */
  static play(type) {
    if (!this.enabled) return;
    
    this.init();
    
    switch (type) {
      case 'place':
        this.playPlace();
        break;
      case 'win':
        this.playWin();
        break;
      case 'draw':
        this.playDraw();
        break;
      case 'undo':
        this.playUndo();
        break;
      case 'restart':
        this.playRestart();
        break;
    }
  }

  /**
   * 落子音效 - 清脆的敲击声
   */
  static playPlace() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 创建振荡器
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
    
    // 添加木质音色
    const noise = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    noise.type = 'triangle';
    noise.frequency.setValueAtTime(200, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.08);
  }

  /**
   * 胜利音效 - 欢快的上升音阶
   */
  static playWin() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
    
    // 添加和弦
    const chord = [523.25, 659.25, 783.99];
    chord.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.6);
      
      gain.gain.setValueAtTime(0.15, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + 0.6);
      osc.stop(now + 1.2);
    });
  }

  /**
   * 平局音效 - 中性提示音
   */
  static playDraw() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(440, now + 0.2);
    osc.frequency.setValueAtTime(440, now + 0.4);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.setValueAtTime(0, now + 0.15);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.setValueAtTime(0, now + 0.35);
    gain.gain.setValueAtTime(0.3, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.55);
  }

  /**
   * 悔棋音效 - 回退声
   */
  static playUndo() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * 重新开始音效 - 刷新声
   */
  static playRestart() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager;
}
