/**
 * 五子棋游戏 - 主逻辑
 */

class GomokuGame {
  constructor() {
    this.boardSize = 15;
    this.board = [];
    this.currentPlayer = 1; // 1=黑, 2=白
    this.gameOver = false;
    this.moveHistory = [];
    this.lastMove = null;
    this.scores = { black: 0, white: 0 };
    this.isAIMode = false;
    this.ai = null;
    this.aiPlayer = 2; // AI执白
    this.isAIThinking = false;
    this.soundEnabled = true;
    
    this.init();
  }

  /**
   * 初始化游戏
   */
  init() {
    this.createBoard();
    this.bindEvents();
    this.loadScores();
    this.updateDisplay();
  }

  /**
   * 创建棋盘数据
   */
  createBoard() {
    this.board = [];
    for (let i = 0; i < this.boardSize; i++) {
      this.board[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        this.board[i][j] = 0;
      }
    }
    this.currentPlayer = 1;
    this.gameOver = false;
    this.moveHistory = [];
    this.lastMove = null;
    this.isAIThinking = false;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const boardEl = document.getElementById('board');
    boardEl.addEventListener('click', (e) => this.handleCellClick(e));
    
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    
    // 模式选择
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setGameMode(e.target.dataset.mode));
    });
    
    // 音效开关
    document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
    
    // 弹窗关闭
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.querySelector('.modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal();
      }
    });
  }

  /**
   * 设置游戏模式
   */
  setGameMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    this.isAIMode = mode === 'ai';
    if (this.isAIMode) {
      this.ai = new GomokuAI(this.aiPlayer);
    } else {
      this.ai = null;
    }
    
    this.restart();
  }

  /**
   * 处理棋盘点击
   */
  handleCellClick(e) {
    if (this.gameOver || this.isAIThinking) return;
    
    const cell = e.target.closest('.cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    if (this.board[row][col] !== 0) return;
    
    // AI模式下，只允许玩家执黑
    if (this.isAIMode && this.currentPlayer === this.aiPlayer) return;
    
    this.makeMove(row, col);
  }

  /**
   * 落子
   */
  makeMove(row, col) {
    this.board[row][col] = this.currentPlayer;
    this.moveHistory.push({ row, col, player: this.currentPlayer });
    this.lastMove = { row, col };
    
    // 播放音效
    SoundManager.play('place');
    
    // 渲染棋盘
    this.renderBoard();
    
    // 检查胜负
    if (this.checkWin(row, col)) {
      this.handleWin();
      return;
    }
    
    // 检查平局
    if (this.moveHistory.length === this.boardSize * this.boardSize) {
      this.handleDraw();
      return;
    }
    
    // 切换玩家
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.updateDisplay();
    
    // AI回合
    if (this.isAIMode && this.currentPlayer === this.aiPlayer) {
      this.aiMove();
    }
  }

  /**
   * AI落子
   */
  aiMove() {
    this.isAIThinking = true;
    this.showThinkingIndicator();
    
    // 添加延迟，让玩家看到AI在思考
    setTimeout(() => {
      const move = this.ai.getBestMove(this.board, this.lastMove);
      this.isAIThinking = false;
      this.hideThinkingIndicator();
      
      if (move) {
        this.makeMove(move.row, move.col);
      }
    }, 500);
  }

  /**
   * 显示AI思考指示器
   */
  showThinkingIndicator() {
    const boardEl = document.getElementById('board');
    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator';
    indicator.id = 'thinkingIndicator';
    boardEl.appendChild(indicator);
  }

  /**
   * 隐藏AI思考指示器
   */
  hideThinkingIndicator() {
    const indicator = document.getElementById('thinkingIndicator');
    if (indicator) indicator.remove();
  }

  /**
   * 检查胜负
   */
  checkWin(row, col) {
    const player = this.board[row][col];
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线
      [1, -1]   // 反对角线
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      
      // 正方向计数
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
        if (this.board[r][c] !== player) break;
        count++;
      }
      
      // 负方向计数
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
        if (this.board[r][c] !== player) break;
        count++;
      }
      
      if (count >= 5) return true;
    }
    
    return false;
  }

  /**
   * 处理胜利
   */
  handleWin() {
    this.gameOver = true;
    const winner = this.currentPlayer === 1 ? 'black' : 'white';
    
    // 更新分数
    this.scores[winner]++;
    this.saveScores();
    this.updateDisplay();
    
    // 播放音效
    SoundManager.play('win');
    
    // 显示胜利弹窗
    const winnerText = this.currentPlayer === 1 ? '黑方' : '白方';
    const winnerName = this.isAIMode && this.currentPlayer === this.aiPlayer ? 'AI' : winnerText;
    this.showModal(`🎉 ${winnerName}获胜！`, `恭喜${winnerName}赢得比赛！`);
  }

  /**
   * 处理平局
   */
  handleDraw() {
    this.gameOver = true;
    SoundManager.play('draw');
    this.showModal('🤝 平局', '棋盘已满，双方平局！');
  }

  /**
   * 悔棋
   */
  undo() {
    if (this.moveHistory.length === 0 || this.gameOver || this.isAIThinking) return;
    
    // AI模式下需要撤销两步
    const stepsToUndo = this.isAIMode && this.moveHistory.length > 1 ? 2 : 1;
    
    for (let i = 0; i < stepsToUndo && this.moveHistory.length > 0; i++) {
      const lastMove = this.moveHistory.pop();
      this.board[lastMove.row][lastMove.col] = 0;
    }
    
    // 更新最后一步标记
    if (this.moveHistory.length > 0) {
      const prev = this.moveHistory[this.moveHistory.length - 1];
      this.lastMove = { row: prev.row, col: prev.col };
      this.currentPlayer = prev.player === 1 ? 2 : 1;
    } else {
      this.lastMove = null;
      this.currentPlayer = 1;
    }
    
    SoundManager.play('undo');
    this.renderBoard();
    this.updateDisplay();
  }

  /**
   * 重新开始
   */
  restart() {
    this.createBoard();
    this.renderBoard();
    this.updateDisplay();
    SoundManager.play('restart');
  }

  /**
   * 渲染棋盘
   */
  renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    // 星位坐标
    const starPoints = [[3, 3], [3, 7], [3, 11], [7, 3], [7, 7], [7, 11], [11, 3], [11, 7], [11, 11]];
    
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // 添加星位
        if (starPoints.some(p => p[0] === row && p[1] === col)) {
          cell.classList.add('star-point');
        }
        
        // 添加棋子
        if (this.board[row][col] !== 0) {
          const stone = document.createElement('div');
          stone.className = `stone ${this.board[row][col] === 1 ? 'black' : 'white'}`;
          cell.appendChild(stone);
          
          // 标记最后一步
          if (this.lastMove && this.lastMove.row === row && this.lastMove.col === col) {
            cell.classList.add('last-move');
          }
        }
        
        boardEl.appendChild(cell);
      }
    }
  }

  /**
   * 更新显示
   */
  updateDisplay() {
    // 更新当前玩家指示
    document.querySelectorAll('.player-info').forEach(el => {
      const isBlack = el.dataset.player === 'black';
      const isActive = (this.currentPlayer === 1 && isBlack) || (this.currentPlayer === 2 && !isBlack);
      el.classList.toggle('active', isActive && !this.gameOver);
    });
    
    // 更新分数
    document.getElementById('blackScore').textContent = this.scores.black;
    document.getElementById('whiteScore').textContent = this.scores.white;
  }

  /**
   * 显示弹窗
   */
  showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modal').classList.add('show');
  }

  /**
   * 关闭弹窗
   */
  closeModal() {
    document.getElementById('modal').classList.remove('show');
  }

  /**
   * 切换音效
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    SoundManager.setEnabled(this.soundEnabled);
    const btn = document.getElementById('soundToggle');
    btn.textContent = this.soundEnabled ? '🔊' : '🔇';
    btn.classList.toggle('muted', !this.soundEnabled);
  }

  /**
   * 保存分数
   */
  saveScores() {
    localStorage.setItem('gomoku_scores', JSON.stringify(this.scores));
  }

  /**
   * 加载分数
   */
  loadScores() {
    const saved = localStorage.getItem('gomoku_scores');
    if (saved) {
      this.scores = JSON.parse(saved);
    }
  }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  window.game = new GomokuGame();
});
