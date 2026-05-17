# 术数排盘 Web MVP

按 milestone 逐步开发，不一次性塞完整排盘逻辑。当前状态：Milestone 2。

## 结构

- `backend/`: Python FastAPI
- `frontend/`: React + Vite + TypeScript

## 后端启动

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

## 前端启动

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## 测试

```powershell
cd backend
.\.venv\Scripts\python -m pytest
```

## API

- `GET /api/health`: 后端健康检查
- `POST /api/liuyao/manual`: 手动六爻排盘
- `POST /api/liuren/basic`: 大六壬基础盘

六爻示例：

```json
{
  "manual_lines": [7, 8, 9, 6, 7, 8]
}
```

`manual_lines` 按自下而上输入，即初爻到上爻。当前只输出本卦、变卦、动爻和 `debug_trace`。

大六壬示例：

```json
{
  "question_time": "2026-05-17T10:30:00",
  "timezone": "Asia/Shanghai"
}
```

当前只输出四柱、旬空、月将、天地盘和 `debug_trace`；四课、三传字段已预留，具体判别留到 Milestone 3。

## Milestones

- Milestone 0: 项目骨架、`/api/health`、前端调用后端
- Milestone 1: 六爻 MVP，仅手动 6/7/8/9，输出本卦、变卦、动爻
- Milestone 2: 大六壬基础盘，时间输入，四柱、旬空、月将、天地盘，四课三传预留
- Milestone 3: 大六壬 V1，九宗门三传判别，每步 debug trace
- Milestone 4: 前端可视化、JSON 面板、保存问卦记录

参考源会在进入对应 milestone 时再引入和校准，例如 `kentang2017/kinliuren`、`bopo/najia` 等。
