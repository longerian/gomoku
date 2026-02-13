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
    this.isReplayMode = false;
    this.replayBoard = [];
    this.replayIndex = 0;
    this.isOnlineMode = false;
    this.myColor = null; // 联机模式下我的颜色
    
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
    this.setupOnlineCallbacks();
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
    
    // 主题按钮
    document.getElementById('themeBtn').addEventListener('click', () => themeManager.createThemePanel());
    
    // 统计按钮
    document.getElementById('statsBtn').addEventListener('click', () => statsManager.createStatsPanel());
    
    // 棋谱按钮
    document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecordPanel());
    document.getElementById('closeRecordBtn').addEventListener('click', () => this.closeRecordPanel());
    
    // 弹窗关闭
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.querySelector('.modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal();
      }
    });
  }

  /**
   * 设置联机回调
   */
  setupOnlineCallbacks() {
    onlineManager.onGameStart = (data) => {
      this.myColor = data.myColor;
      this.isOnlineMode = true;
      this.restart();
      this.showNotification(`联机对战开始！你执${data.myColor === 1 ? '黑' : '白'}棋`);
    };

    onlineManager.onOpponentMove = (row, col) => {
      this.board[row][col] = this.currentPlayer;
      this.moveHistory.push({ row, col, player: this.currentPlayer });
      this.lastMove = { row, col };
      SoundManager.play('place');
      this.renderBoard(true);
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      this.updateDisplay();
    };

    onlineManager.onOpponentDisconnect = () => {
      this.showNotification('对手已断开连接', 'error');
      this.gameOver = true;
    };

    onlineManager.onWaiting = (roomId) => {
      this.showNotification(`房间已创建: ${roomId}，等待对手...`);
    };
  }

  /**
   * 设置游戏模式
   */
  setGameMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    this.isAIMode = mode === 'ai';
    this.isOnlineMode = mode === 'online';
    
    if (this.isAIMode) {
      this.ai = new GomokuAI(this.aiPlayer);
    } else {
      this.ai = null;
    }
    
    if (this.isOnlineMode) {
      onlineManager.createOnlinePanel();
    } else {
      onlineManager.disconnect();
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
    
    // 联机模式下，检查是否轮到自己
    if (this.isOnlineMode && this.myColor !== this.currentPlayer) return;
    
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

    // 渲染棋盘，只对新落子添加动画
    this.renderBoard(true);

    // 联机模式发送落子
    if (this.isOnlineMode) {
      onlineManager.makeMove(row, col);
    }

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
    // 先移除已存在的指示器，防止重复
    const existing = document.getElementById('thinkingIndicator');
    if (existing) existing.remove();
    
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
    
    // 保存棋谱
    const mode = this.isOnlineMode ? 'online' : (this.isAIMode ? 'ai' : 'pvp');
    recordManager.saveRecord(this.moveHistory, mode, winner, this.aiPlayer);
    
    // 记录统计
    statsManager.recordGame({
      mode: this.isOnlineMode ? 'online' : (this.isAIMode ? 'ai' : 'pvp'),
      winner,
      moves: this.moveHistory.length,
      playerColor: this.isAIMode ? 1 : null
    });
    
    // 更新分数
    this.scores[winner]++;
    this.saveScores();
    this.updateDisplay();
    
    // 播放音效
    SoundManager.play('win');
    
    // 显示胜利弹窗
    const winnerText = this.currentPlayer === 1 ? '黑方' : '白方';
    const winnerName = this.isAIMode && this.currentPlayer === this.aiPlayer ? 'AI' : winnerText;
    this.showModal(`🎉 ${winnerName}获胜！`, `恭喜${winnerName}赢得比赛！棋谱已自动保存。`);
  }

  /**
   * 处理平局
   */
  handleDraw() {
    this.gameOver = true;
    
    // 保存棋谱
    const mode = this.isOnlineMode ? 'online' : (this.isAIMode ? 'ai' : 'pvp');
    recordManager.saveRecord(this.moveHistory, mode, 'draw', this.aiPlayer);
    
    // 记录统计
    statsManager.recordGame({
      mode: this.isOnlineMode ? 'online' : (this.isAIMode ? 'ai' : 'pvp'),
      winner: 'draw',
      moves: this.moveHistory.length,
      playerColor: null
    });
    
    SoundManager.play('draw');
    this.showModal('🤝 平局', '棋盘已满，双方平局！棋谱已自动保存。');
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
    this.renderBoard(false);
    this.updateDisplay();
  }

  /**
   * 重新开始
   */
  restart() {
    this.createBoard();
    this.renderBoard(false);
    this.updateDisplay();
    SoundManager.play('restart');
  }

  /**
   * 渲染棋盘
   */
  renderBoard(animateLast = false) {
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
          // 只对新落子添加动画类
          if (animateLast && this.lastMove && this.lastMove.row === row && this.lastMove.col === col) {
            stone.classList.add('animate');
          }
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

  // ========== 棋谱功能 ==========

  /**
   * 打开棋谱面板
   */
  toggleRecordPanel() {
    const panel = document.getElementById('recordPanel');
    panel.classList.add('show');
    this.renderRecordList();
  }

  /**
   * 关闭棋谱面板
   */
  closeRecordPanel() {
    document.getElementById('recordPanel').classList.remove('show');
  }

  /**
   * 渲染棋谱列表
   */
  renderRecordList() {
    const listEl = document.getElementById('recordList');
    const records = recordManager.getRecords();
    
    if (records.length === 0) {
      listEl.innerHTML = '<div class="no-records">暂无棋谱记录</div>';
      return;
    }
    
    listEl.innerHTML = records.map(record => `
      <div class="record-item" data-id="${record.id}">
        <div class="record-info">
          <div class="record-date">${record.date}</div>
          <div class="record-detail">
            <span class="record-mode">${record.mode === 'ai' ? '🤖 人机' : '👥 双人'}</span>
            <span class="record-result ${record.winner}">${record.winner === 'black' ? '⚫黑胜' : record.winner === 'white' ? '⚪白胜' : '🤝平局'}</span>
            <span class="record-moves">${record.moveCount}步</span>
          </div>
        </div>
        <div class="record-actions">
          <button class="record-btn replay-btn" title="回放">▶️</button>
          <button class="record-btn export-btn" title="导出">📤</button>
          <button class="record-btn delete-btn" title="删除">🗑️</button>
        </div>
      </div>
    `).join('');
    
    // 绑定事件
    listEl.querySelectorAll('.replay-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('.record-item').dataset.id);
        this.startReplay(id);
      });
    });
    
    listEl.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('.record-item').dataset.id);
        this.exportRecord(id);
      });
    });
    
    listEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('.record-item').dataset.id);
        this.deleteRecord(id);
      });
    });
  }

  /**
   * 开始回放棋谱
   */
  startReplay(recordId) {
    const record = recordManager.getRecord(recordId);
    if (!record) return;

    this.closeRecordPanel();
    this.isReplayMode = true;
    this.replayRecord = record;
    this.replayIndex = 0;

    // 清空棋盘
    this.createBoard();
    this.renderBoard(false);

    // 显示回放控制
    this.showReplayControls();
    this.updateReplayProgress();
  }

  /**
   * 显示回放控制
   */
  showReplayControls() {
    let controlsEl = document.getElementById('replayControls');
    if (!controlsEl) {
      controlsEl = document.createElement('div');
      controlsEl.id = 'replayControls';
      controlsEl.className = 'replay-controls';
      controlsEl.innerHTML = `
        <button id="replayFirst" class="replay-btn" title="第一步">⏮️</button>
        <button id="replayPrev" class="replay-btn" title="上一步">⏪</button>
        <span id="replayProgress" class="replay-progress">0/0</span>
        <button id="replayNext" class="replay-btn" title="下一步">⏩</button>
        <button id="replayLast" class="replay-btn" title="最后一步">⏭️</button>
        <button id="replayAuto" class="replay-btn" title="自动播放">▶️</button>
        <button id="exitReplay" class="replay-btn exit" title="退出回放">❌</button>
      `;
      document.querySelector('.game-container').appendChild(controlsEl);
      
      // 绑定事件
      document.getElementById('replayFirst').addEventListener('click', () => this.replayFirst());
      document.getElementById('replayPrev').addEventListener('click', () => this.replayPrev());
      document.getElementById('replayNext').addEventListener('click', () => this.replayNext());
      document.getElementById('replayLast').addEventListener('click', () => this.replayLast());
      document.getElementById('replayAuto').addEventListener('click', () => this.toggleAutoReplay());
      document.getElementById('exitReplay').addEventListener('click', () => this.exitReplay());
    }
    controlsEl.style.display = 'flex';
  }

  /**
   * 隐藏回放控制
   */
  hideReplayControls() {
    const controlsEl = document.getElementById('replayControls');
    if (controlsEl) {
      controlsEl.style.display = 'none';
    }
  }

  /**
   * 更新回放进度显示
   */
  updateReplayProgress() {
    const progressEl = document.getElementById('replayProgress');
    if (progressEl && this.replayRecord) {
      progressEl.textContent = `${this.replayIndex}/${this.replayRecord.moves.length}`;
    }
  }

  /**
   * 回放第一步
   */
  replayFirst() {
    this.replayIndex = 0;
    this.createBoard();
    this.renderBoard(false);
    this.updateReplayProgress();
  }

  /**
   * 回放上一步
   */
  replayPrev() {
    if (this.replayIndex <= 0) return;

    this.replayIndex--;
    const move = this.replayRecord.moves[this.replayIndex];
    this.board[move.row][move.col] = 0;

    // 更新最后一步标记
    if (this.replayIndex > 0) {
      const prevMove = this.replayRecord.moves[this.replayIndex - 1];
      this.lastMove = { row: prevMove.row, col: prevMove.col };
    } else {
      this.lastMove = null;
    }

    this.renderBoard(false);
    this.updateReplayProgress();
    SoundManager.play('place');
  }

  /**
   * 回放下一步
   */
  replayNext() {
    if (!this.replayRecord || this.replayIndex >= this.replayRecord.moves.length) return;

    const move = this.replayRecord.moves[this.replayIndex];
    this.board[move.row][move.col] = move.player;
    this.lastMove = { row: move.row, col: move.col };
    this.replayIndex++;

    this.renderBoard(true);
    this.updateReplayProgress();
    SoundManager.play('place');
  }

  /**
   * 回放最后一步
   */
  replayLast() {
    while (this.replayIndex < this.replayRecord.moves.length) {
      const move = this.replayRecord.moves[this.replayIndex];
      this.board[move.row][move.col] = move.player;
      this.lastMove = { row: move.row, col: move.col };
      this.replayIndex++;
    }
    this.renderBoard(false);
    this.updateReplayProgress();
    SoundManager.play('place');
  }

  /**
   * 自动回放
   */
  toggleAutoReplay() {
    const btn = document.getElementById('replayAuto');
    
    if (this.autoReplayTimer) {
      clearInterval(this.autoReplayTimer);
      this.autoReplayTimer = null;
      btn.textContent = '▶️';
    } else {
      btn.textContent = '⏸️';
      this.autoReplayTimer = setInterval(() => {
        if (this.replayIndex >= this.replayRecord.moves.length) {
          clearInterval(this.autoReplayTimer);
          this.autoReplayTimer = null;
          btn.textContent = '▶️';
          return;
        }
        this.replayNext();
      }, 800);
    }
  }

  /**
   * 退出回放
   */
  exitReplay() {
    if (this.autoReplayTimer) {
      clearInterval(this.autoReplayTimer);
      this.autoReplayTimer = null;
    }
    
    this.isReplayMode = false;
    this.replayRecord = null;
    this.replayIndex = 0;
    this.hideReplayControls();
    this.restart();
  }

  /**
   * 导出棋谱
   */
  exportRecord(recordId) {
    const jsonStr = recordManager.exportRecord(recordId);
    if (!jsonStr) return;
    
    const record = recordManager.getRecord(recordId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `gomoku_${record.date.replace(/[/:]/g, '-')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('棋谱已导出');
  }

  /**
   * 导入棋谱
   */
  importRecord(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const record = recordManager.importRecord(e.target.result);
      if (record) {
        this.renderRecordList();
        this.showNotification('棋谱导入成功');
      } else {
        this.showNotification('棋谱格式无效', 'error');
      }
    };
    reader.readAsText(file);
  }

  /**
   * 删除棋谱
   */
  deleteRecord(recordId) {
    if (confirm('确定要删除这个棋谱吗？')) {
      recordManager.deleteRecord(recordId);
      this.renderRecordList();
      this.showNotification('棋谱已删除');
    }
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  window.game = new GomokuGame();
});
