# 后端路线图

## Phase 0：localStorage only

- 所有排盘记录和反馈都保存在浏览器 `localStorage`。
- 不接真实数据库。
- 重点是稳定数据结构、质量标签和隐私分级。

## Phase 1：导出/导入 JSON

- 支持 `private_raw` JSON 导出，供本地备份和私有分析。
- 支持 `anonymized` JSON 导出，移除问题原文、出生信息和备注。
- 增加 JSON 导入和人工复核流程。
- 默认统计只读取 `qualityTag=valid` 的反馈。

## Phase 2：后端 API + SQLite

- 增加私有后端 API。
- SQLite 只在服务器或本机私有环境落盘，不进入 GitHub。
- 前端只调用 API，不读取数据库连接串。
- 只提交 schema 和 migrations。
- Public API 只暴露 `/health` 和匿名聚合 `/api/stats`。
- Admin API 通过 `X-Admin-Token` 读写 raw records、feedbacks 和导出数据。
- early-stage 数据库允许保存 `private_raw`，但 raw 只能用于管理员人工筛选和规则评估。

## Phase 3：用户系统 + Postgres

- 增加用户认证、会话和权限。
- 使用 Postgres 或 Supabase 等托管数据库。
- 区分普通用户反馈、管理员审核和公开统计。
- 密钥进入后端环境变量或部署平台 secret store。

## Phase 4：反馈统计和规则评估

- 对不同排盘类型、问题类型和规则版本做统计。
- 对 `valid` 数据做命中率、部分命中、应期偏差等评估。
- 建立规则版本号，保证每条反馈能回溯到生成时的解释规则。
- 先做统计和人工复盘，不做自动学习或自动断语扩写。
