/**
 * 五子棋游戏 - 主题模块
 * 支持多种主题切换
 */

class ThemeManager {
  constructor() {
    this.themes = {
      classic: {
        name: '经典紫',
        icon: '💜',
        primary: '#667eea',
        secondary: '#764ba2',
        board: '#DEB887',
        boardDark: '#D2691E',
        line: '#8B4513',
        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      ocean: {
        name: '海洋蓝',
        icon: '🌊',
        primary: '#00c6fb',
        secondary: '#005bea',
        board: '#e0f7fa',
        boardDark: '#80deea',
        line: '#00838f',
        bg: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)'
      },
      forest: {
        name: '森林绿',
        icon: '🌲',
        primary: '#11998e',
        secondary: '#38ef7d',
        board: '#dcedc8',
        boardDark: '#aed581',
        line: '#558b2f',
        bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
      },
      sunset: {
        name: '日落橙',
        icon: '🌅',
        primary: '#f093fb',
        secondary: '#f5576c',
        board: '#fff3e0',
        boardDark: '#ffcc80',
        line: '#e65100',
        bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      night: {
        name: '暗夜黑',
        icon: '🌙',
        primary: '#232526',
        secondary: '#414345',
        board: '#2d2d2d',
        boardDark: '#3d3d3d',
        line: '#666666',
        bg: 'linear-gradient(135deg, #232526 0%, #414345 100%)'
      },
      sakura: {
        name: '樱花粉',
        icon: '🌸',
        primary: '#ff9a9e',
        secondary: '#fecfef',
        board: '#fce4ec',
        boardDark: '#f8bbd9',
        line: '#c2185b',
        bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
      }
    };
    
    this.currentTheme = 'classic';
    this.init();
  }

  /**
   * 初始化
   */
  init() {
    // 加载保存的主题
    const saved = localStorage.getItem('gomoku_theme');
    if (saved && this.themes[saved]) {
      this.currentTheme = saved;
    }
    this.applyTheme(this.currentTheme);
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * 获取所有主题
   */
  getAllThemes() {
    return Object.entries(this.themes).map(([key, value]) => ({
      key,
      ...value
    }));
  }

  /**
   * 应用主题
   */
  applyTheme(themeKey) {
    const theme = this.themes[themeKey];
    if (!theme) return;

    this.currentTheme = themeKey;
    
    // 设置CSS变量
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-bg', theme.bg);
    root.style.setProperty('--theme-board', theme.board);
    root.style.setProperty('--theme-board-dark', theme.boardDark);
    root.style.setProperty('--theme-line', theme.line);

    // 更新body背景
    document.body.style.background = theme.bg;

    // 保存设置
    localStorage.setItem('gomoku_theme', themeKey);

    // 更新主题按钮显示
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.textContent = theme.icon;
    }
  }

  /**
   * 切换到下一个主题
   */
  nextTheme() {
    const keys = Object.keys(this.themes);
    const currentIndex = keys.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % keys.length;
    this.applyTheme(keys[nextIndex]);
    
    // 显示主题名称
    if (window.game) {
      window.game.showNotification(`主题: ${this.themes[keys[nextIndex]].name}`);
    }
  }

  /**
   * 创建主题选择面板
   */
  createThemePanel() {
    let panel = document.getElementById('themePanel');
    if (panel) {
      panel.classList.toggle('show');
      return;
    }

    panel = document.createElement('div');
    panel.id = 'themePanel';
    panel.className = 'theme-panel';
    
    const themes = this.getAllThemes();
    panel.innerHTML = `
      <div class="theme-panel-header">
        <h3>🎨 选择主题</h3>
        <button class="btn-icon" id="closeThemePanel">❌</button>
      </div>
      <div class="theme-grid">
        ${themes.map(t => `
          <div class="theme-item ${t.key === this.currentTheme ? 'active' : ''}" data-theme="${t.key}">
            <div class="theme-preview" style="background: ${t.bg}"></div>
            <div class="theme-name">${t.icon} ${t.name}</div>
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    panel.querySelectorAll('.theme-item').forEach(item => {
      item.addEventListener('click', () => {
        const themeKey = item.dataset.theme;
        this.applyTheme(themeKey);
        
        // 更新选中状态
        panel.querySelectorAll('.theme-item').forEach(i => {
          i.classList.toggle('active', i.dataset.theme === themeKey);
        });
      });
    });

    document.getElementById('closeThemePanel').addEventListener('click', () => {
      panel.classList.remove('show');
    });

    // 显示面板
    setTimeout(() => panel.classList.add('show'), 10);
  }

  /**
   * 关闭主题面板
   */
  closeThemePanel() {
    const panel = document.getElementById('themePanel');
    if (panel) {
      panel.classList.remove('show');
    }
  }
}

// 创建全局实例
const themeManager = new ThemeManager();
