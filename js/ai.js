/**
 * 五子棋游戏 - AI模块
 * 实现AI对手逻辑
 */

class GomokuAI {
  constructor(player) {
    this.player = player; // AI执子颜色 (1=黑, 2=白)
    this.opponent = player === 1 ? 2 : 1;
    
    // 评分权重
    this.scores = {
      FIVE: 100000,       // 五连
      FOUR: 10000,        // 活四
      BLOCKED_FOUR: 1000, // 冲四
      THREE: 1000,        // 活三
      BLOCKED_THREE: 100, // 眠三
      TWO: 100,           // 活二
      BLOCKED_TWO: 10,    // 眠二
      ONE: 10             // 活一
    };
  }

  /**
   * 获取最佳落子位置
   */
  getBestMove(board, lastMove = null) {
    const candidates = this.getCandidates(board, lastMove);
    
    if (candidates.length === 0) {
      // 如果是第一步，下在中心
      return { row: 7, col: 7 };
    }

    let bestScore = -Infinity;
    let bestMoves = [];

    for (const { row, col } of candidates) {
      const score = this.evaluateMove(board, row, col);
      
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [{ row, col }];
      } else if (score === bestScore) {
        bestMoves.push({ row, col });
      }
    }

    // 随机选择一个最佳位置
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  /**
   * 获取候选位置（周围有棋子的空位）
   */
  getCandidates(board, lastMove) {
    const candidates = new Set();
    const range = 2; // 搜索范围

    // 如果有上一步，优先考虑周围位置
    if (lastMove) {
      for (let dr = -range; dr <= range; dr++) {
        for (let dc = -range; dc <= range; dc++) {
          const r = lastMove.row + dr;
          const c = lastMove.col + dc;
          if (this.isValidPos(r, c) && board[r][c] === 0) {
            candidates.add(`${r},${c}`);
          }
        }
      }
    }

    // 扫描整个棋盘
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (board[r][c] !== 0) {
          for (let dr = -range; dr <= range; dr++) {
            for (let dc = -range; dc <= range; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (this.isValidPos(nr, nc) && board[nr][nc] === 0) {
                candidates.add(`${nr},${nc}`);
              }
            }
          }
        }
      }
    }

    return Array.from(candidates).map(s => {
      const [row, col] = s.split(',').map(Number);
      return { row, col };
    });
  }

  /**
   * 评估落子得分
   */
  evaluateMove(board, row, col) {
    // 进攻得分（AI落子）
    const attackScore = this.evaluatePosition(board, row, col, this.player);
    
    // 防守得分（阻止对手）
    const defenseScore = this.evaluatePosition(board, row, col, this.opponent);
    
    // 进攻略高于防守
    return Math.max(attackScore * 1.1, defenseScore);
  }

  /**
   * 评估某个位置的得分
   */
  evaluatePosition(board, row, col, player) {
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线
      [1, -1]   // 反对角线
    ];

    let totalScore = 0;

    for (const [dr, dc] of directions) {
      const line = this.getLine(board, row, col, dr, dc, player);
      totalScore += this.evaluateLine(line, player);
    }

    return totalScore;
  }

  /**
   * 获取某个方向的棋型
   */
  getLine(board, row, col, dr, dc, player) {
    const line = [];
    
    // 向负方向延伸4格
    for (let i = 4; i >= 1; i--) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (this.isValidPos(r, c)) {
        line.push(board[r][c]);
      } else {
        line.push(-1); // 边界
      }
    }
    
    // 当前位置（假设落子）
    line.push(player);
    
    // 向正方向延伸4格
    for (let i = 1; i <= 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (this.isValidPos(r, c)) {
        line.push(board[r][c]);
      } else {
        line.push(-1); // 边界
      }
    }

    return line;
  }

  /**
   * 评估棋型得分
   */
  evaluateLine(line, player) {
    const opponent = player === 1 ? 2 : 1;
    let score = 0;

    // 检查各种棋型
    const patterns = this.getPatterns(line, player);
    
    for (const pattern of patterns) {
      const count = pattern.count;
      const openEnds = pattern.openEnds;
      
      if (count >= 5) {
        score += this.scores.FIVE;
      } else if (count === 4) {
        if (openEnds === 2) score += this.scores.FOUR;
        else if (openEnds === 1) score += this.scores.BLOCKED_FOUR;
      } else if (count === 3) {
        if (openEnds === 2) score += this.scores.THREE;
        else if (openEnds === 1) score += this.scores.BLOCKED_THREE;
      } else if (count === 2) {
        if (openEnds === 2) score += this.scores.TWO;
        else if (openEnds === 1) score += this.scores.BLOCKED_TWO;
      } else if (count === 1) {
        if (openEnds === 2) score += this.scores.ONE;
      }
    }

    return score;
  }

  /**
   * 获取棋型模式
   */
  getPatterns(line, player) {
    const patterns = [];
    let count = 0;
    let openEnds = 0;
    let counting = false;

    for (let i = 0; i < line.length; i++) {
      if (line[i] === player) {
        if (!counting) {
          counting = true;
          count = 1;
          // 检查左端是否开放
          if (i > 0 && line[i - 1] === 0) {
            openEnds = 1;
          } else {
            openEnds = 0;
          }
        } else {
          count++;
        }
      } else if (line[i] === 0) {
        if (counting) {
          openEnds++;
          patterns.push({ count, openEnds });
          counting = false;
        }
      } else {
        // 遇到对手或边界
        if (counting) {
          patterns.push({ count, openEnds });
          counting = false;
        }
      }
    }

    if (counting) {
      patterns.push({ count, openEnds });
    }

    return patterns;
  }

  /**
   * 检查位置是否有效
   */
  isValidPos(row, col) {
    return row >= 0 && row < 15 && col >= 0 && col < 15;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GomokuAI;
}
