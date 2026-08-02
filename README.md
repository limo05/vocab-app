# 📚 Vocab App - 离线英语背单词应用

纯前端离线英语背单词 Web SPA，基于 Vue3 + TypeScript + TailwindCSS，数据全部存储在浏览器 IndexedDB 中。

## ✨ 功能特性

### 🎯 核心功能
- **SM-2 间隔重复算法** - 科学安排复习计划，高效记忆单词
- **闪卡模式** - 翻转卡片学习，支持英/美发音、助记、例句
- **默写模式** - 汉译英 / 英译汉，支持音标和首字母提示
- **复习系统** - 按词库或全部复习到期单词
- **生词本** - 默写错误自动加入，支持手动管理

### 🔊 发音系统
三层降级策略，确保离线也能发音：
1. 有道真人发音（需联网）
2. FreeDictionary 音频（需联网）
3. 浏览器 Web Speech TTS（离线可用）

### 📊 数据统计
- 今日学习概览（新词、复习、正确率、时长）
- ECharts 趋势图表（柱状图、折线图、饼图）
- 单词状态分布可视化
- JSON 数据导出/导入备份

### 📖 词库管理
- 内置中考核心词汇、高考3500词汇
- 支持自定义词库导入（JSON / TXT / CSV）
- 词库导出备份

### ⚙️ 系统设置
- 亮色 / 暗色主题切换
- 每日新词数量限制
- 英音 / 美音切换
- 各模式自动发音开关
- 默写提示（音标、首字母）
- 联网增强开关（可完全离线使用）
- 语速调节

### ⌨️ 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Space` | 翻转卡片 |
| `←` | 不认识 |
| `→` | 认识 |
| `P` | 播放发音 |
| `Enter` | 提交答案 / 下一个 |

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 | 前端框架（Composition API + `<script setup>`） |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| TailwindCSS 3 | 样式框架（暗色模式） |
| Dexie.js 4 | IndexedDB 封装层 |
| ECharts 5 | 数据可视化图表 |
| Vue Router 4 | 路由管理 |

## 🚀 快速开始

### 环境要求
- Node.js >= 18

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📱 手机访问

### 方式一：局域网访问
```bash
npm run dev -- --host
```
手机和电脑连同一 WiFi，浏览器打开终端显示的局域网地址。

### 方式二：部署到 GitHub Pages
推送代码到 `main` 分支，GitHub Actions 自动构建部署。

### 方式三：部署到 Vercel
```bash
npx vercel deploy
```

## 📂 项目结构

```
vocab-app/
├── .github/workflows/     # GitHub Actions 配置
│   └── deploy.yml         # 自动部署到 GitHub Pages
├── src/
│   ├── assets/            # 全局样式
│   │   └── main.css       # TailwindCSS 入口 + 自定义样式
│   ├── composables/       # Vue Composables
│   │   ├── useLearning.ts # 学习核心逻辑
│   │   ├── useSettings.ts # 设置管理
│   │   ├── useStats.ts    # 统计数据
│   │   └── useStudyTimer.ts # 学习时长追踪
│   ├── db/
│   │   └── index.ts       # Dexie 数据库层
│   ├── router/
│   │   └── index.ts       # Vue Router 路由配置
│   ├── services/
│   │   ├── dictionary.ts  # 词典 API 服务
│   │   └── pronunciation.ts # 发音服务（三层降级）
│   ├── types/
│   │   └── index.ts       # TypeScript 类型定义
│   ├── utils/
│   │   └── sm2.ts         # SM-2 间隔重复算法
│   ├── views/             # 页面组件
│   │   ├── HomeView.vue       # 首页 Dashboard
│   │   ├── FlashCardView.vue  # 闪卡学习
│   │   ├── DictationView.vue  # 默写模式
│   │   ├── ReviewView.vue     # 复习系统
│   │   ├── WordBookView.vue   # 生词本
│   │   ├── StatsView.vue      # 学习统计
│   │   ├── SettingsView.vue   # 系统设置
│   │   └── LibraryView.vue    # 词库管理
│   ├── wordlists/         # 内置词库
│   │   ├── zhongkao.json  # 中考核心词汇
│   │   └── gaokao.json    # 高考3500词汇
│   ├── App.vue            # 根组件（导航 + 主题）
│   └── main.ts            # 入口文件
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 💾 数据存储

所有数据存储在浏览器 **IndexedDB** 中（通过 Dexie.js 封装），包含以下表：

| 数据表 | 说明 |
|--------|------|
| `wordBooks` | 词库信息 |
| `words` | 单词表 |
| `learningRecords` | 学习记录（SM2 参数） |
| `dailyStats` | 每日统计 |
| `wordBookItems` | 生词本 |
| `userSettings` | 用户设置 |
| `apiCache` | API 缓存（7天过期） |
| `learningSessions` | 学习会话 |

> 数据按域名隔离，不同地址访问会产生独立数据库。建议定期通过统计页面的导出功能备份数据。

## 🌐 GitHub Pages 部署

1. 在 GitHub 创建仓库并推送代码
2. 进入仓库 **Settings → Pages**
3. Source 选择 **GitHub Actions**
4. 推送代码到 `main` 分支即自动部署

部署后访问地址：`https://<username>.github.io/<repo-name>/`

## 📄 License

MIT
