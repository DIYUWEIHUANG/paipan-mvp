# 腾讯云私有后端 MVP 部署

本阶段允许私有保存 `private_raw` 数据，但 raw 数据只能通过 Admin API 访问，不能通过公开接口暴露。

## 目录

```bash
sudo mkdir -p /opt/paipan/data
cd /opt/paipan
git clone https://github.com/DIYUWEIHUANG/paipan-mvp.git app
cd app
```

## 后端环境变量

不要把真实值提交到 GitHub。推荐通过 systemd 或服务器环境变量注入：

```bash
DATABASE_URL=sqlite:////opt/paipan/data/paipan.sqlite3
ADMIN_TOKEN=<openssl rand -hex 32>
CORS_ALLOWED_ORIGINS=https://diyuweihuang.github.io,http://localhost:5173
NODE_ENV=production
```

`ADMIN_TOKEN` 用于 `X-Admin-Token`。前端代码里不要写这个值，只能在管理员浏览器里手动输入并保存到 localStorage。

## 启动后端

```bash
cd /opt/paipan/app/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## systemd 示例

```ini
[Unit]
Description=Paipan MVP API
After=network.target

[Service]
WorkingDirectory=/opt/paipan/app/backend
Environment=DATABASE_URL=sqlite:////opt/paipan/data/paipan.sqlite3
Environment=ADMIN_TOKEN=replace-with-a-real-secret
Environment=CORS_ALLOWED_ORIGINS=https://diyuweihuang.github.io
ExecStart=/opt/paipan/app/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## API 暴露原则

公开：

- `GET /health`
- `GET /api/stats`

管理员：

- `POST /api/records`
- `GET /api/admin/records`
- `GET /api/admin/records/{id}`
- `POST /api/feedbacks`
- `GET /api/admin/feedbacks`
- `GET /api/admin/export/private_raw`
- `GET /api/admin/export/anonymized`

管理员接口必须带：

```http
X-Admin-Token: <ADMIN_TOKEN>
```

## 前端连接后端

构建前端时设置：

```bash
VITE_API_BASE_URL=https://your-api-domain.example.com
```

普通统计面板会读取 `/api/stats`。管理员模式下手动输入 token 后，才能同步本地记录、读取 raw 数据、导出 raw 或 anonymized JSON。

## 不要上传

- `/opt/paipan/data/paipan.sqlite3`
- `private_feedback_*.json`
- `.env`
- 数据库 dump 或备份文件
