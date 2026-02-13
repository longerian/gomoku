/**
 * 棋谱管理模块
 */

class RecordManager {
  constructor() {
    this.records = [];
    this.currentRecord = null;
    this.replayIndex = 0;
    this.isReplaying = false;
    this.storageKey = 'gomoku_records';
    
    this.loadRecords();
  }

  /**
   * 加载本地存储的棋谱
   */
  loadRecords() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.records = JSON.parse(saved);
    }
  }

  /**
   * 保存棋谱到本地存储
   */
  saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.records));
  }

  /**
   * 创建新棋谱记录
   */
  createRecord(moves, mode, winner, aiPlayer) {
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString('zh-CN'),
      mode: mode,
      winner: winner,
      moves: [...moves],
      blackPlayer: mode === 'ai' && aiPlayer === 1 ? 'AI' : '玩家',
      whitePlayer: mode === 'ai' && aiPlayer === 2 ? 'AI' : '玩家',
      moveCount: moves.length
    };
    return record;
  }

  /**
   * 保存棋谱
   */
  saveRecord(moves, mode, winner, aiPlayer) {
    const record = this.createRecord(moves, mode, winner, aiPlayer);
    this.records.unshift(record); // 新记录放在最前面
    this.saveToStorage();
    return record;
  }

  /**
   * 删除棋谱
   */
  deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this.saveToStorage();
  }

  /**
   * 清空所有棋谱
   */
  clearAllRecords() {
    this.records = [];
    this.saveToStorage();
  }

  /**
   * 获取棋谱列表
   */
  getRecords() {
    return this.records;
  }

  /**
   * 获取单个棋谱
   */
  getRecord(id) {
    return this.records.find(r => r.id === id);
  }

  /**
   * 导出棋谱为JSON
   */
  exportRecord(id) {
    const record = this.getRecord(id);
    if (!record) return null;
    
    return JSON.stringify(record, null, 2);
  }

  /**
   * 导出所有棋谱
   */
  exportAllRecords() {
    return JSON.stringify(this.records, null, 2);
  }

  /**
   * 导入棋谱
   */
  importRecord(jsonStr) {
    try {
      const record = JSON.parse(jsonStr);
      if (!record.moves || !Array.isArray(record.moves)) {
        throw new Error('无效的棋谱格式');
      }
      record.id = Date.now(); // 重新生成ID
      record.date = new Date().toLocaleString('zh-CN');
      this.records.unshift(record);
      this.saveToStorage();
      return record;
    } catch (e) {
      console.error('导入棋谱失败:', e);
      return null;
    }
  }

  /**
   * 开始回放棋谱
   */
  startReplay(record) {
    this.currentRecord = record;
    this.replayIndex = 0;
    this.isReplaying = true;
  }

  /**
   * 停止回放
   */
  stopReplay() {
    this.currentRecord = null;
    this.replayIndex = 0;
    this.isReplaying = false;
  }

  /**
   * 获取下一步棋
   */
  getNextMove() {
    if (!this.currentRecord || this.replayIndex >= this.currentRecord.moves.length) {
      return null;
    }
    return this.currentRecord.moves[this.replayIndex++];
  }

  /**
   * 获取上一步棋
   */
  getPrevMove() {
    if (!this.currentRecord || this.replayIndex <= 0) {
      return null;
    }
    this.replayIndex--;
    return this.currentRecord.moves[this.replayIndex];
  }

  /**
   * 跳转到指定步数
   */
  jumpToMove(index) {
    if (!this.currentRecord) return;
    this.replayIndex = Math.max(0, Math.min(index, this.currentRecord.moves.length));
  }

  /**
   * 获取回放进度
   */
  getReplayProgress() {
    if (!this.currentRecord) return { current: 0, total: 0 };
    return {
      current: this.replayIndex,
      total: this.currentRecord.moves.length
    };
  }

  /**
   * 是否回放结束
   */
  isReplayEnd() {
    if (!this.currentRecord) return true;
    return this.replayIndex >= this.currentRecord.moves.length;
  }

  /**
   * 格式化棋谱为文本
   */
  formatAsText(record) {
    let text = `五子棋棋谱\n`;
    text += `日期: ${record.date}\n`;
    text += `模式: ${record.mode === 'ai' ? '人机对战' : '双人对战'}\n`;
    text += `黑方: ${record.blackPlayer}\n`;
    text += `白方: ${record.whitePlayer}\n`;
    text += `结果: ${record.winner === 'black' ? '黑方胜' : record.winner === 'white' ? '白方胜' : '平局'}\n`;
    text += `总步数: ${record.moveCount}\n`;
    text += `\n落子记录:\n`;
    
    record.moves.forEach((move, index) => {
      const player = move.player === 1 ? '黑' : '白';
      const col = String.fromCharCode(65 + move.col); // A-O
      const row = 15 - move.row; // 15-1
      text += `${index + 1}. ${player} ${col}${row}\n`;
    });
    
    return text;
  }
}

// 创建全局实例
window.recordManager = new RecordManager();
