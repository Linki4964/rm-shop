# rm-shop

一个基于 React + FastAPI + MySQL 的电商平台（期末作业）。

### 功能特性

- 商品浏览与分类筛选
- 购物车管理
- 用户注册/登录
- 订单创建与取消
- **优惠券系统** — 支持百分比折扣与固定金额折扣
- 支付宝模拟支付（沙箱环境）
- 管理员后台

## 部署方法

### 环境准备
```
conda create -n venv python=3.10
conda activate venv
pip install -r requirements.txt
```

### 启动后端
```shell
cd ecommerce-backend
uvicorn app.main:app --reload
```
打开 `http://127.0.0.1:8000`
后端创建的时候会自动创建新的表格

### 初始化数据
```shell
## 一键初始化（创建数据库、表、商品、优惠券）
python -m app.scripts.init_db
```

### 启动前端
```shell
cd ecommerce-frontend
npm install
npm run dev
```
打开 `http://localhost:3000/`

如果出现依赖冲突请执行以下指令进行重新配置
```
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

## 版本信息

### 运行环境

| 环境 | 版本 |
|------|------|
| Python | 3.10 |
| Node.js | >=22 |

### 后端 (ecommerce-backend)

| 依赖 | 版本 | 用途 |
|------|------|------|
| FastAPI | 0.136.1 | Web 框架 |
| Uvicorn | 0.46.0 | ASGI 服务器 |
| SQLAlchemy | 2.0.49 | ORM / 数据库抽象 |
| aiomysql | 0.3.2 | 异步 MySQL 驱动 |
| PyMySQL | 1.1.2 | 同步 MySQL 驱动 |
| Pydantic | 2.13.3 | 数据校验 |
| pydantic-settings | 2.14.0 | 配置管理 |
| email-validator | 2.3.0 | 邮箱校验 |
| PyJWT | 2.12.1 | JWT 令牌处理 |
| passlib[bcrypt] | 1.7.4 | 密码哈希 |
| bcrypt | 5.0.0 | bcrypt 加密 |
| cryptography | 47.0.0 | 加密工具 |
| python-multipart | 0.0.26 | 表单解析 |
| requests | 2.34.2 | HTTP 客户端 |
| python-alipay-sdk | 3.4.0 | 支付宝支付集成 |

应用版本：**0.1.0**（定义于 `app/main.py`）

### 前端 (ecommerce-frontend)

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 19.2.7 | 前端框架 |
| React DOM | 19.2.7 | React DOM 渲染 |
| React Router DOM | 7.17.0 | 前端路由 |
| Zustand | 5.0.14 | 状态管理 |
| Axios | 1.18.0 | HTTP 客户端 |
| Bootstrap | 5.3.8 | CSS 框架 |
| ECharts | 6.1.0 | 图表库 |
| react-qr-code | 2.2.0 | 二维码生成 |

#### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| Vite | 8.0.16 | 构建工具 |
| TypeScript | 6.0.3 | 类型系统 |
| ESLint | 10.3.x | 代码检查 |
| @vitejs/plugin-react | 6.0.1 | Vite React 插件 |

### 数据库

| 组件 | 版本 |
|------|------|
| MySQL | 8.x |
| 数据库名 | ecommerce_db |


