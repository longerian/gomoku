/**
 * 五子棋游戏 - 战绩统计模块
 * 记录和分析游戏数据
 */

class StatsManager {
  constructor() {
    this.stats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
      blackWins: 0,
      whiteWins: 0,
      aiWins: 0,
      aiLosses: 0,
      totalMoves: 0,
      fastestWin: null,
      gameHistory: []
    };
    
    this.init();
  }

  init() {
    this.loadStats();
  }

  loadStats() {
    const saved = localStorage.getItem('gomoku_stats');
    if (saved) {
      this.stats = { ...this.stats, ...JSON.parse(saved) };
    }
  }

  saveStats() {
    localStorage.setItem('gomoku_stats', JSON.stringify(this.stats));
  }

  recordGame(result) {
    const { mode, winner, moves, playerColor } = result;
    
    this.stats.totalGames++;
    this.stats.totalMoves += moves;
    
    if (winner === 'draw') {
      this.stats.draws++;
      this.stats.currentStreak = 0;
    } else if (mode === 'ai') {
      const playerWon = (playerColor === 1 && winner === 'black') || 
                        (playerColor === 2 && winner === 'white');
      
      if (playerWon) {
        this.stats.wins++;
        this.stats.aiWins++;
        this.stats.currentStreak++;
        
        if (this.stats.currentStreak > this.stats.bestStreak) {
          this.stats.bestStreak = this.stats.currentStreak;
        }
        
        if (!this.stats.fastestWin || moves < this.stats.fastestWin) {
          this.stats.fastestWin = moves;
        }
      } else {
        this.stats.losses++;
        this.stats.aiLosses++;
        this.stats.currentStreak = 0;
      }
    } else {
      if (winner === 'black') {
        this.stats.blackWins++;
      } else {
        this.stats.whiteWins++;
      }
    }

    this.stats.gameHistory.unshift({
      date: new Date().toLocaleString('zh-CN'),
      mode,
      winner,
      moves
    });
    
    if (this.stats.gameHistory.length > 20) {
      this.stats.gameHistory.pop();
    }

    this.saveStats();
  }

  getStats() {
    const winRate = this.stats.totalGames > 0 
      ? Math.round((this.stats.wins / (this.stats.wins + this.stats.losses)) * 100) || 0
      : 0;
    
    return { ...this.stats, winRate };
  }

  getDetailedStats() {
    const stats = this.getStats();
    
    return {
      totalGames: stats.totalGames,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winRate: stats.winRate,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      blackWins: stats.blackWins,
      whiteWins: stats.whiteWins,
      aiGames: stats.aiWins + stats.aiLosses,
      aiWins: stats.aiWins,
      aiLosses: stats.aiLosses,
      aiWinRate: stats.aiWins + stats.aiLosses > 0 
        ? Math.round((stats.aiWins / (stats.aiWins + stats.aiLosses)) * 100)
        : 0,
      totalMoves: stats.totalMoves,
      avgMoves: stats.totalGames > 0 
        ? Math.round(stats.totalMoves / stats.totalGames)
        : 0,
      fastestWin: stats.fastestWin,
      recentGames: stats.gameHistory.slice(0, 10)
    };
  }

  resetStats() {
    this.stats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
      blackWins: 0,
      whiteWins: 0,
      aiWins: 0,
      aiLosses: 0,
      totalMoves: 0,
      fastestWin: null,
      gameHistory: []
    };
    this.saveStats();
  }

  createStatsPanel() {
    let panel = document.getElementById('statsPanel');
    if (panel) {
      panel.classList.toggle('show');
      this.updateStatsPanel();
      return;
    }

    panel = document.createElement('div');
    panel.id = 'statsPanel';
    panel.className = 'stats-panel';
    
    panel.innerHTML = `
      <div class="stats-panel-header">
        <h3>📊 战绩统计</h3>
        <button class="btn-icon" id="closeStatsPanel">❌</button>
      </div>
      <div class="stats-content" id="statsContent">
        ${this.renderStatsContent()}
      </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('closeStatsPanel').addEventListener('click', () => {
      panel.classList.remove('show');
    });

    panel.querySelector('#resetStatsBtn')?.addEventListener('click', () => {
      if (confirm('确定要重置所有统计数据吗？')) {
        this.resetStats();
        this.updateStatsPanel();
        window.game?.showNotification('统计数据已重置');
      }
    });

    setTimeout(() => panel.classList.add('show'), 10);
  }

  renderStatsContent() {
    const stats = this.getDetailedStats();
    
    return `
      <div class="stats-overview">
        <div class="stat-card main">
          <div class="stat-value">${stats.totalGames}</div>
          <div class="stat-label">总对局</div>
        </div>
        <div class="stat-card win">
          <div class="stat-value">${stats.wins}</div>
          <div class="stat-label">胜利</div>
        </div>
        <div class="stat-card loss">
          <div class="stat-value">${stats.losses}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat-card draw">
          <div class="stat-value">${stats.draws}</div>
          <div class="stat-label">平局</div>
        </div>
      </div>
      
      <div class="stats-section">
        <h4>📈 胜率分析</h4>
        <div class="win-rate-bar">
          <div class="win-rate-fill" style="width: ${stats.winRate}%"></div>
          <span class="win-rate-text">${stats.winRate}%</span>
        </div>
      </div>
      
      <div class="stats-section">
        <h4>🔥 连胜记录</h4>
        <div class="streak-info">
          <div class="streak-item">
            <span class="streak-label">当前连胜</span>
            <span class="streak-value">${stats.currentStreak}</span>
          </div>
          <div class="streak-item">
            <span class="streak-label">最长连胜</span>
            <span class="streak-value best">${stats.bestStreak}</span>
          </div>
        </div>
      </div>
      
      <div class="stats-section">
        <h4>🤖 人机对战</h4>
        <div class="mode-stats">
          <span>对局: ${stats.aiGames}</span>
          <span>胜: ${stats.aiWins}</span>
          <span>负: ${stats.aiLosses}</span>
          <span>胜率: ${stats.aiWinRate}%</span>
        </div>
      </div>
      
      <div class="stats-section">
        <h4>⚡ 其他统计</h4>
        <div class="other-stats">
          <div class="stat-row"><span>⚫ 黑方胜</span><span>${stats.blackWins}</span></div>
          <div class="stat-row"><span>⚪ 白方胜</span><span>${stats.whiteWins}</span></div>
          <div class="stat-row"><span>📊 总步数</span><span>${stats.totalMoves}</span></div>
          <div class="stat-row"><span>📏 平均步数</span><span>${stats.avgMoves}</span></div>
          <div class="stat-row"><span>🚀 最快获胜</span><span>${stats.fastestWin || '-'}步</span></div>
        </div>
      </div>
      
      <div class="stats-section">
        <h4>📜 最近对局</h4>
        <div class="recent-games">
          ${stats.recentGames.length > 0 
            ? stats.recentGames.map(g => `
              <div class="game-record">
                <span class="game-mode">${g.mode === 'ai' ? '🤖' : '👥'}</span>
                <span class="game-result ${g.winner}">${g.winner === 'black' ? '⚫' : g.winner === 'white' ? '⚪' : '🤝'}</span>
                <span class="game-moves">${g.moves}步</span>
                <span class="game-date">${g.date}</span>
              </div>
            `).join('')
            : '<div class="no-games">暂无对局记录</div>'
          }
        </div>
      </div>
      
      <button id="resetStatsBtn" class="btn btn-danger" style="width: 100%; margin-top: 15px;">🗑️ 重置统计</button>
    `;
  }

  updateStatsPanel() {
    const content = document.getElementById('statsContent');
    if (content) {
      content.innerHTML = this.renderStatsContent();
    }
  }
}

const statsManager = new StatsManager();
