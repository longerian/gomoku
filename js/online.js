/**
 * 五子棋游戏 - 联机对战模块
 * 基于 WebSocket 实现实时对战
 */

class OnlineManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.roomId = null;
    this.playerColor = null; // 1=黑, 2=白
    this.isMyTurn = false;
    this.opponent = null;
    this.serverUrl = 'wss://gomoku-server.example.com'; // 替换为实际服务器地址
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // 回调函数
    this.onConnect = null;
    this.onDisconnect = null;
    this.onRoomJoined = null;
    this.onGameStart = null;
    this.onOpponentMove = null;
    this.onOpponentDisconnect = null;
    this.onError = null;
    this.onWaiting = null;
  }

  /**
   * 连接服务器
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      try {
        // 模拟模式：使用本地存储模拟联机（演示用）
        if (this.isDemoMode()) {
          this.startDemoMode();
          resolve();
          return;
        }

        this.socket = new WebSocket(this.serverUrl);
        
        this.socket.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('已连接到服务器');
          this.onConnect?.();
          resolve();
        };

        this.socket.onclose = () => {
          this.connected = false;
          this.onDisconnect?.();
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket错误:', error);
          this.onError?.('连接失败，请检查网络');
          reject(error);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.roomId = null;
    this.playerColor = null;
    this.isMyTurn = false;
    this.opponent = null;
  }

  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000);
    }
  }

  /**
   * 发送消息
   */
  send(type, data = {}) {
    if (!this.connected || !this.socket) {
      console.warn('未连接到服务器');
      return false;
    }

    this.socket.send(JSON.stringify({ type, ...data }));
    return true;
  }

  /**
   * 处理服务器消息
   */
  handleMessage(message) {
    const { type, ...data } = message;

    switch (type) {
      case 'room_created':
        this.roomId = data.roomId;
        this.playerColor = 1; // 房主执黑
        this.onWaiting?.(data.roomId);
        break;

      case 'room_joined':
        this.roomId = data.roomId;
        this.playerColor = 2; // 加入者执白
        this.opponent = data.host;
        this.onRoomJoined?.(data);
        break;

      case 'game_start':
        this.opponent = data.opponent;
        this.isMyTurn = this.playerColor === 1;
        this.onGameStart?.({
          myColor: this.playerColor,
          opponent: this.opponent,
          isMyTurn: this.isMyTurn
        });
        break;

      case 'move':
        this.isMyTurn = true;
        this.onOpponentMove?.(data.row, data.col);
        break;

      case 'opponent_disconnect':
        this.onOpponentDisconnect?.();
        break;

      case 'error':
        this.onError?.(data.message);
        break;

      default:
        console.log('未知消息类型:', type);
    }
  }

  /**
   * 创建房间
   */
  createRoom(playerName = '玩家') {
    this.send('create_room', { name: playerName });
  }

  /**
   * 加入房间
   */
  joinRoom(roomId, playerName = '玩家') {
    this.send('join_room', { roomId, name: playerName });
  }

  /**
   * 发送落子
   */
  sendMove(row, col) {
    if (!this.isMyTurn) {
      console.warn('不是你的回合');
      return false;
    }
    
    this.isMyTurn = false;
    return this.send('move', { row, col });
  }

  /**
   * 发送游戏结束
   */
  sendGameOver(winner) {
    this.send('game_over', { winner });
  }

  /**
   * 是否已连接
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 是否在我的回合
   */
  canMove() {
    return this.connected && this.isMyTurn;
  }

  /**
   * 获取房间ID
   */
  getRoomId() {
    return this.roomId;
  }

  /**
   * 获取我的颜色
   */
  getMyColor() {
    return this.playerColor;
  }

  // ========== 本地演示模式 ==========

  /**
   * 检查是否演示模式
   */
  isDemoMode() {
    // 如果服务器地址是默认的示例地址，使用演示模式
    return this.serverUrl.includes('example.com');
  }

  /**
   * 启动演示模式（使用 BroadcastChannel 模拟多窗口对战）
   */
  startDemoMode() {
    this.connected = true;
    this.demoChannel = new BroadcastChannel('gomoku_online_demo');
    
    this.demoChannel.onmessage = (event) => {
      this.handleDemoMessage(event.data);
    };

    console.log('演示模式已启动 - 在另一个浏览器窗口打开游戏即可对战');
  }

  /**
   * 处理演示模式消息
   */
  handleDemoMessage(message) {
    const { type, ...data } = message;

    switch (type) {
      case 'room_created':
        // 收到房间创建消息
        break;

      case 'join_room':
        if (this.roomId === data.roomId && this.playerColor === 1) {
          // 有人加入我的房间
          this.demoChannel.postMessage({
            type: 'game_start',
            opponent: data.name,
            roomId: this.roomId
          });
          this.opponent = data.name;
          this.isMyTurn = true;
          this.onGameStart?.({
            myColor: 1,
            opponent: this.opponent,
            isMyTurn: true
          });
        }
        break;

      case 'game_start':
        this.opponent = data.opponent;
        this.isMyTurn = this.playerColor === 1;
        this.onGameStart?.({
          myColor: this.playerColor,
          opponent: this.opponent,
          isMyTurn: this.isMyTurn
        });
        break;

      case 'move':
        this.isMyTurn = true;
        this.onOpponentMove?.(data.row, data.col);
        break;

      case 'opponent_disconnect':
        this.onOpponentDisconnect?.();
        break;
    }
  }

  /**
   * 演示模式创建房间
   */
  demoCreateRoom(playerName) {
    this.roomId = this.generateRoomId();
    this.playerColor = 1;
    this.demoChannel?.postMessage({
      type: 'room_created',
      roomId: this.roomId,
      name: playerName
    });
    this.onWaiting?.(this.roomId);
  }

  /**
   * 演示模式加入房间
   */
  demoJoinRoom(roomId, playerName) {
    this.roomId = roomId;
    this.playerColor = 2;
    this.demoChannel?.postMessage({
      type: 'join_room',
      roomId: roomId,
      name: playerName
    });
  }

  /**
   * 演示模式发送落子
   */
  demoSendMove(row, col) {
    if (!this.isMyTurn) return false;
    this.isMyTurn = false;
    this.demoChannel?.postMessage({
      type: 'move',
      row,
      col,
      roomId: this.roomId
    });
    return true;
  }

  /**
   * 生成房间ID
   */
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * 创建联机面板
   */
  createOnlinePanel() {
    let panel = document.getElementById('onlinePanel');
    if (panel) {
      panel.classList.toggle('show');
      return;
    }

    panel = document.createElement('div');
    panel.id = 'onlinePanel';
    panel.className = 'online-panel';
    
    panel.innerHTML = `
      <div class="online-panel-header">
        <h3>🌐 联机对战</h3>
        <button class="btn-icon" id="closeOnlinePanel">❌</button>
      </div>
      <div class="online-content">
        <div class="online-status">
          <span class="status-dot ${this.connected ? 'connected' : ''}"></span>
          <span>${this.connected ? '已连接' : '未连接'}</span>
        </div>
        
        <div class="online-section">
          <h4>🏠 创建房间</h4>
          <div class="input-group">
            <input type="text" id="createPlayerName" placeholder="你的昵称" maxlength="10">
            <button id="createRoomBtn" class="btn btn-primary">创建房间</button>
          </div>
        </div>
        
        <div class="online-section">
          <h4>🚪 加入房间</h4>
          <div class="input-group">
            <input type="text" id="joinRoomId" placeholder="房间号" maxlength="6" style="text-transform: uppercase;">
            <input type="text" id="joinPlayerName" placeholder="你的昵称" maxlength="10">
            <button id="joinRoomBtn" class="btn btn-primary">加入</button>
          </div>
        </div>
        
        <div id="roomInfo" class="room-info" style="display: none;">
          <div class="room-id-display">
            <span>房间号:</span>
            <span id="currentRoomId" class="room-code">------</span>
            <button id="copyRoomId" class="btn btn-secondary btn-sm">📋 复制</button>
          </div>
          <div class="waiting-status" id="waitingStatus">
            <span class="spinner"></span>
            <span>等待对手加入...</span>
          </div>
        </div>
        
        <div class="online-tips">
          <p>💡 提示：当前为演示模式</p>
          <p>在另一个浏览器窗口打开游戏，输入相同的房间号即可对战</p>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    document.getElementById('closeOnlinePanel').addEventListener('click', () => {
      panel.classList.remove('show');
    });

    document.getElementById('createRoomBtn').addEventListener('click', () => {
      const name = document.getElementById('createPlayerName').value || '玩家';
      this.handleCreateRoom(name);
    });

    document.getElementById('joinRoomBtn').addEventListener('click', () => {
      const roomId = document.getElementById('joinRoomId').value.toUpperCase();
      const name = document.getElementById('joinPlayerName').value || '玩家';
      if (roomId.length === 6) {
        this.handleJoinRoom(roomId, name);
      } else {
        window.game?.showNotification('请输入6位房间号', 'error');
      }
    });

    document.getElementById('copyRoomId')?.addEventListener('click', () => {
      const roomId = document.getElementById('currentRoomId').textContent;
      navigator.clipboard.writeText(roomId).then(() => {
        window.game?.showNotification('房间号已复制');
      });
    });

    setTimeout(() => panel.classList.add('show'), 10);
  }

  /**
   * 处理创建房间
   */
  handleCreateRoom(playerName) {
    if (this.isDemoMode()) {
      this.startDemoMode();
      this.demoCreateRoom(playerName);
    } else {
      this.createRoom(playerName);
    }

    // 显示房间信息
    document.getElementById('roomInfo').style.display = 'block';
    document.getElementById('currentRoomId').textContent = this.roomId;
    document.getElementById('waitingStatus').style.display = 'flex';
  }

  /**
   * 处理加入房间
   */
  handleJoinRoom(roomId, playerName) {
    if (this.isDemoMode()) {
      this.startDemoMode();
      this.demoJoinRoom(roomId, playerName);
    } else {
      this.joinRoom(roomId, playerName);
    }
  }

  /**
   * 发送落子（自动选择模式）
   */
  makeMove(row, col) {
    if (this.isDemoMode()) {
      return this.demoSendMove(row, col);
    } else {
      return this.sendMove(row, col);
    }
  }

  /**
   * 关闭联机面板
   */
  closeOnlinePanel() {
    const panel = document.getElementById('onlinePanel');
    if (panel) {
      panel.classList.remove('show');
    }
  }
}

const onlineManager = new OnlineManager();
