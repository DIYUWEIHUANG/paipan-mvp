# 术数排盘 Web MVP

一个面向中文用户的结构化排盘工具站。当前前端可静态部署到 GitHub Pages，核心排盘逻辑在浏览器内运行；后端作为可选私有 API，用于数据集、反馈、增强解释等后续能力。

线上页面：

- https://diyuweihuang.github.io/paipan-mvp/

## 当前进度

已完成：

- **大六壬 V1**：时间起课，输出四柱、旬空、月将、天地盘、四课、九宗门三传和 debug trace。
- **六爻 MVP**：支持手动 6/7/8/9，也已加入自动起卦相关前端能力；输出本卦、变卦、动爻和 debug trace。
- **小六壬 Milestone 1-4**：
  - 独立 engine：月上起大安、日上顺数、时上顺数。
  - 独立 interpretation 层：关键词、吉凶倾向、进展、人际、资源、行动建议、风险提醒。
  - 前端 UI：小六壬 Tab、起课方式切换、六宫流程条、三步落宫卡片、基础推断、折叠 JSON。
  - 单元测试：覆盖手动农历月日时、时间起课、子时/午时/亥时。
- **工具站 UI**：React + Vite + TypeScript，克制、清爽、专业风格，移动端单栏。
- **记录与反馈能力**：本地记录、反馈质量标注、匿名/私有反馈结构、可选私有后端同步。
- **增强解释与个性化探索**：已有 LLM interpretation enhancer、姓名五行/个性化相关模块的初步代码。
- **部署**：GitHub Actions 自动部署到 GitHub Pages。

## 总体规划

下一阶段建议按这个顺序推进：

1. **规则校准**
   - 大六壬：继续校准四课、三传、涉害深度、特殊格局。
   - 六爻：完善自动起卦、纳甲、六亲、世应、变卦解释层。
   - 小六壬：补充更多可测试案例，明确不同流派差异。

2. **解释层产品化**
   - 保持“结构化、工具化、非断言式”的文本风格。
   - 所有解释输出都保留 JSON 字段，方便后续数据集和评估。
   - 增强解释要和排盘 engine 解耦，避免把推断文本写进核心算法。

3. **数据闭环**
   - 完善反馈表单、质量标注、匿名导出和私有数据集 API。
   - 用真实反馈对规则命中率、时间判断、解释有用性做迭代。

4. **协作与部署**
   - 保持 GitHub Pages 为公开演示版本。
   - 私有后端只保存用户明确提交的反馈数据。
   - 所有敏感配置放在环境变量或 GitHub Actions Variables/Secrets，不提交 `.env`。

## 项目结构

- `frontend/`: React + Vite + TypeScript 静态网页。
- `frontend/src/calculators.ts`: 大六壬、六爻浏览器端计算。
- `frontend/src/engines/`: 独立 engine，例如小六壬排盘核心。
- `frontend/src/interpretations/`: 独立解释层。
- `frontend/src/features/`: 组合 engine 与 interpretation 的薄层。
- `frontend/src/feedback/`: 记录、反馈、私有/匿名数据结构和同步。
- `backend/`: FastAPI 后端，可选启用私有 API。

## 本地运行

前端：

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

构建：

```powershell
cd frontend
npm.cmd run build
```

前端测试：

```powershell
cd frontend
npm.cmd test
```

后端（可选）：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

后端测试：

```powershell
cd backend
.\.venv\Scripts\python -m pytest
```

## GitHub Pages 部署

本仓库包含 `.github/workflows/pages.yml`。推送到 `main` 后，GitHub Actions 会自动构建 `frontend/` 并部署到 Pages。

如果需要连接私有后端，在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions -> Variables` 中配置：

- `VITE_API_BASE_URL`

公开 Pages 页面是 HTTPS；如果后端是 HTTP，会被浏览器拦截。生产后端应配置 HTTPS 域名或反向代理。

## 参考项目

本项目参考了以下开源项目/库的思路或能力边界，用于理解排盘结构、日历换算、后续规则校准方向。当前代码没有直接 vendored 这些仓库源码。

- [kentang2017/kinliuren](https://github.com/kentang2017/kinliuren)：Python 大六壬排盘项目，可作为大六壬结构、天地盘、四课三传等后续校准参考。
- [bopo/najia](https://github.com/bopo/najia)：纳甲/六爻相关参考项目，可作为六爻后续纳甲、六亲、世应等能力扩展参考。
- [6tail/lunar-javascript](https://github.com/6tail/lunar-javascript)：浏览器端公历/农历、干支、节气等日历计算能力；当前前端依赖其 npm 包 `lunar-javascript`。

## 安全约定

- 不提交 API key、token、密码、数据库账号。
- 不提交 `.env`、本地数据库、私有反馈原始数据。
- `.gitignore` 已覆盖 `.env*`、SQLite/DB 文件、私有导出、`node_modules/`、`dist/`、`.venv/` 等生成物。
