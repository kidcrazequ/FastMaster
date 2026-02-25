# 命理大师 (FastMaster)

> 融合 AI 与传统八字命理的智能分析系统 —— "博通阴阳理，洞察天地机"

## 项目简介

命理大师是一个基于 Next.js 构建的 AI 八字命理分析 Web 应用，将传统中国命理学与现代人工智能技术相结合，提供专业、深度、有温度的八字解析服务。

## 核心功能

### 八字合婚分析
- 输入男女双方出生日期时间，自动计算八字（年柱、月柱、日柱、时柱）
- AI 智能解读双方五行匹配度，从性格、婚姻宫、家庭、子嗣等多维度分析
- 生成总体契合度评分（0-100 分）及详细分析报告

### 算姻缘（个人姻缘分析）
- 根据个人八字信息，AI 分析桃花运势特点与旺盛时期
- 描绘最适合的另一半特质与性格
- 近年流年姻缘运势走向分析

### AI 对话追问
- 针对分析结果，支持与 AI 进行多轮对话
- 深入解答命理相关疑问，助您拨云见日

## 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 16 / React 19 / TypeScript |
| **样式** | Tailwind CSS 4 / Radix UI / Lucide Icons |
| **数据库** | SQLite + Prisma ORM |
| **认证** | NextAuth.js |
| **AI** | DeepSeek API (OpenAI SDK) |
| **八字计算** | lunar-typescript (农历/八字算法) |
| **图表** | Recharts |
| **表单** | React Hook Form + Zod 验证 |

## 项目结构

```
fastmaster/
├── prisma/                    # 数据库模型与迁移
│   ├── schema.prisma          # Prisma 数据模型定义
│   ├── seed.ts                # 数据库种子数据
│   └── migrations/            # 数据库迁移文件
├── src/
│   ├── app/
│   │   ├── (auth)/            # 认证页面（登录/注册）
│   │   ├── (main)/            # 主要页面
│   │   │   ├── page.tsx       # 首页
│   │   │   └── workspace/     # 工作台
│   │   │       ├── bazi-marriage/   # 合婚分析
│   │   │       ├── bazi-destiny/    # 算姻缘
│   │   │       └── history/         # 历史记录
│   │   └── api/               # API 路由
│   │       ├── auth/          # 认证 API
│   │       └── bazi/          # 八字分析 API
│   ├── components/
│   │   ├── layout/            # 布局组件（Header/Footer/Sidebar）
│   │   ├── providers/         # Context Providers
│   │   └── ui/                # UI 基础组件（基于 Radix UI）
│   ├── lib/
│   │   ├── ai/                # AI API 封装（DeepSeek）
│   │   ├── bazi/              # 八字计算核心逻辑
│   │   ├── auth.ts            # NextAuth 配置
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── utils.ts           # 工具函数
│   └── types/                 # TypeScript 类型定义
├── package.json
└── tsconfig.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制环境变量模板并填写配置：

```bash
cp .env.example .env.local
```

需要配置的环境变量：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# DeepSeek AI API
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

### 初始化数据库

```bash
npx prisma migrate dev
npx prisma db seed
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 数据模型

- **User** — 用户（支持高级用户标识）
- **MarriageAnalysis** — 合婚分析记录（含双方八字、分析结果、评分）
- **DestinyAnalysis** — 姻缘分析记录
- **Conversation / DestinyConversation** — AI 对话历史

## 设计风格

采用古典中国风设计，暗红色（`#8B0000`）、金色（`#FFD700`）、古纸色（`#F5F2E9`）等配色，衬线字体，营造传统命理文化的视觉氛围。

## 作者

**zhi.qu** — 2026

## 许可证

本项目仅供学习交流使用。
