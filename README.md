# 🎮 五子棋游戏 (Gomoku)

[![GitHub Pages](https://img.shields.io/badge/演示-GitHub%20Pages-brightgreen)](https://longerian.github.io/gomoku/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个精美的五子棋网页游戏，纯前端架构，支持多种游戏模式和主题切换。

## 🌟 在线演示

👉 **[立即游玩](https://longerian.github.io/gomoku/)**

## ✨ 功能特性

### 🎯 游戏模式

| 模式 | 描述 |
|------|------|
| 👥 **双人对战** | 两人轮流落子，本地对战 |
| 🤖 **人机对战** | 与智能AI博弈，三种难度 |
| 🌐 **联机对战** | 创建/加入房间，实时对战 |

### 🎨 自定义主题

提供 **6 种精美主题**：

| 主题 | 风格 |
|------|------|
| 🪵 经典木纹 | 传统棋盘风格 |
| 🌙 暗夜模式 | 护眼深色主题 |
| 🌸 樱花粉 | 清新可爱风格 |
| 🌿 森林绿 | 自然清新风格 |
| 🌊 深海蓝 | 沉稳商务风格 |
| 🌹 中国红 | 国风经典风格 |

### 🔊 音效系统

- 🪵 落子音效（木质敲击声）
- 🎉 胜利音效
- 🤝 平局音效
- ↩️ 悔棋/重开音效
- 🔇 一键开关音效

### 📜 棋谱功能

- 💾 对局结束自动保存棋谱
- 📋 棋谱列表管理
- ▶️ 棋谱回放（单步/自动播放）
- 📤 导出/导入棋谱（JSON格式）

### 📊 战绩统计

- 📈 总对局数、胜率统计
- 🏆 各模式详细战绩
- 🔥 连胜记录
- 📅 最近对局记录

### 📱 移动端适配

- ✅ 响应式布局，完美适配手机/平板
- ✅ 触摸优化，流畅操作体验
- ✅ PWA 支持，可添加到桌面
- ✅ 深色模式自动适配

### 🤖 AI 特性

- 智能棋型评估算法
- 进攻与防守策略平衡
- 多方向威胁检测
- AI 思考动画指示

## 🚀 快速开始

### 在线游玩

直接访问 [GitHub Pages](https://longerian.github.io/gomoku/) 在线游玩。

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/longerian/gomoku.git

# 进入目录
cd gomoku

# 打开游戏（macOS）
open index.html

# 或使用任意 HTTP 服务器
npx serve .
```

## 🎮 操作说明

| 操作 | 说明 |
|------|------|
| 点击棋盘 | 落子 |
| 悔棋 | 撤销上一步（AI模式撤销两步） |
| 重新开始 | 重置棋盘 |
| 模式切换 | 双人/人机/联机 |
| 主题切换 | 选择喜欢的主题 |
| 棋谱按钮 | 查看/回放棋谱 |
| 统计按钮 | 查看战绩统计 |

## 📁 项目结构

```
gomoku/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件（含响应式）
├── js/
│   ├── game.js         # 游戏主逻辑
│   ├── ai.js           # AI对战模块
│   ├── sound.js        # 音效管理模块
│   ├── record.js       # 棋谱管理模块
│   ├── online.js       # 联机对战模块
│   ├── theme.js        # 主题切换模块
│   └── stats.js        # 战绩统计模块
└── README.md           # 项目说明
```

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| CSS3 | 样式、动画、响应式布局 |
| JavaScript (ES6+) | 游戏逻辑 |
| Web Audio API | 音效生成 |
| LocalStorage | 本地数据存储 |
| PWA | 离线支持 |

## 📝 更新日志

### v2.0.0 (2026-02-13)

- ✨ 新增联机对战模式（房间匹配）
- ✨ 新增 6 种自定义主题
- ✨ 新增战绩统计系统
- ✨ 新增棋谱保存/回放功能
- ✨ 新增手机端完美适配
- 🎨 代码模块化重构
- 📖 完善 README 文档
- 🌐 配置 GitHub Pages

### v1.1.0 (2026-02-13)

- ✨ 新增 AI 对战模式
- ✨ 新增音效系统
- 🎨 代码重构，CSS/JS 分离
- 🎨 优化 UI 界面

### v1.0.0 (2026-02-13)

- 🎉 初始版本发布
- ✅ 基础五子棋功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📜 许可证

[MIT License](LICENSE)

## 🙏 致谢

- 感谢所有贡献者
- 灵感来源于经典五子棋游戏

---

⭐ 如果这个项目对你有帮助，欢迎 Star 支持！
