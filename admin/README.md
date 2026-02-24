# In Fortune AI 管理后台

管理后台用于管理In Fortune AI网站的基础数据和页面配置。

## 功能特性

- **仪表盘** - 查看系统统计信息和快捷操作
- **股票管理** - 管理股票基础数据（增删改查）
- **持仓管理** - 管理自选股持仓列表
- **估值管理** - 查看指数估值数据
- **页面配置** - 管理页面 SEO 元数据

## 技术栈

- Vue 3 + TypeScript
- Vue Router
- Tailwind CSS
- Axios

## 启动方式

### 1. 先启动 website 后端服务

```bash
cd ../website
npm run server
```

后端服务默认运行在 http://localhost:3001

### 2. 再启动管理后台

```bash
npm run dev
```

管理后台默认运行在 http://localhost:5174

## 默认账号

管理后台目前没有内置认证，如需添加登录功能，请自行扩展。

## 项目结构

```
admin/
├── src/
│   ├── api/          # API 接口
│   ├── components/   # 公共组件
│   ├── layouts/      # 布局组件
│   ├── router/       # 路由配置
│   ├── styles/       # 样式文件
│   ├── types/        # TypeScript 类型
│   ├── views/        # 页面视图
│   ├── App.vue       # 根组件
│   └── main.ts       # 入口文件
├── package.json
├── vite.config.ts
└── README.md
```

## API 接口

管理后台通过以下 API 与 website 后端通信：

- `GET /api/search` - 搜索股票
- `POST /api/stocks` - 添加股票
- `PUT /api/stocks/:code` - 更新股票
- `DELETE /api/stocks/:code` - 删除股票
- `GET /api/portfolio` - 获取持仓
- `POST /api/save-portfolio` - 保存持仓
- `GET /api/valuation` - 获取估值数据
- `GET /api/health` - 健康检查

## 注意事项

1. 启动前请确保 website 后端服务已启动
2. 管理后台默认通过代理访问 API，如需修改请编辑 `vite.config.ts`
3. 页面配置目前为前端模拟数据，如需持久化请自行对接后端接口
