# 数据库安全规范

本项目当前仍处在 `localStorage only` 阶段。反馈数据可能包含问题原文、出生时间、用户备注和完整排盘快照，默认按私有数据处理。

## 基线规则

1. 数据库文件不要提交到 GitHub。
2. SQLite 文件必须被 `.gitignore` 忽略，包括 `*.sqlite`、`*.sqlite3`、`*.db`。
3. 只提交 `schema.sql`、迁移文件和无敏感内容的示例配置。
4. 前端不能直连私有数据库，也不能包含 `DATABASE_URL`、`JWT_SECRET`、`API_SECRET_KEY` 等后端密钥。
5. GitHub Pages 是公开前端，任何打进前端 bundle 的变量都应视为公开信息。

## 隐私分级

### private_raw

- 保存完整问题原文。
- 保存出生日期时间和提问者字段。
- 保存反馈文本、用户备注和人工审核备注。
- 保存完整原始排盘 JSON。
- 只能存在浏览器 `localStorage`、本机私有文件或私有后端数据库。
- 不得上传 GitHub。

### anonymized

- 移除问题原文。
- 移除出生信息。
- 移除用户备注和人工审核备注。
- 保留 `resultType`、`questionCategory`、`outcomeMatched`、`timingMatched`、`qualityTag`、`ruleVersion`。
- 可用于后续统计建模前的人工复核。

### public_stats

- 只保留聚合统计。
- 不保留单条记录。
- 可用于公开说明趋势，但不能反推出具体用户或具体问题。

## 密钥泄露处理

1. 立即轮换泄露的密钥和数据库凭证。
2. 仅从 Git 历史中删除不够，已泄露的密钥仍应视为失效。
3. 检查 GitHub Actions、部署平台、数据库平台和本地 `.env`。
4. 开启 GitHub secret scanning。
5. 重新部署使用新密钥的服务。

## 未来推荐架构

1. Phase 0：浏览器 `localStorage` 保存 records 和 feedbacks。
2. Phase 1：导出/导入 JSON，人工筛选 `qualityTag=valid` 数据。
3. Phase 2：后端 API 接收反馈，SQLite 私有落盘。
4. Phase 3：用户系统、权限控制和 Postgres。
5. Phase 4：反馈统计、规则评估、版本化解释规则和可回溯数据集。

## 提交前检查

运行：

```bash
npm run security:check
```

该检查会阻止已追踪的 `.env`、数据库文件、导出目录、私有反馈 JSON，以及前端源码里的后端密钥名。
