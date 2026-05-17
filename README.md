# 术数排盘 Web MVP

当前状态：Milestone 3，已整理为可静态部署的浏览器网页。

## 可分享网页

前端已经把六爻手动排盘和大六壬 V1 的核心计算放到浏览器内，不再依赖本地 FastAPI 后端。因此可以部署到 GitHub Pages、Netlify、Vercel 或任意静态文件托管。

### GitHub Pages 自动部署

本仓库包含 `.github/workflows/pages.yml`。推送到 `main` 后：

1. 打开 GitHub 仓库的 `Settings -> Pages`。
2. `Build and deployment` 选择 `GitHub Actions`。
3. 等待 `Deploy static web app` workflow 完成。
4. 分享 GitHub Pages 生成的链接。

### 本地构建

```powershell
cd frontend
npm.cmd install
npm.cmd run build
npm.cmd run preview
```

构建产物在 `frontend/dist/`，也可以直接上传到静态托管服务。

## 项目结构

- `frontend/`: React + Vite + TypeScript 静态网页
- `frontend/src/calculators.ts`: 浏览器端排盘计算
- `backend/`: 原 FastAPI 后端，仍可用于接口版本或测试参考

## 功能

- 六爻：手动输入 6/7/8/9，输出本卦、变卦、动爻和 debug trace。
- 大六壬 V1：输入问事时间，输出四柱、旬空、月将、天地盘、四课、九宗门三传和 debug trace。
- 页面只做排盘展示，不做断语。

## 后端启动（可选）

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

## 后端测试（可选）

```powershell
cd backend
.\.venv\Scripts\python -m pytest
```
