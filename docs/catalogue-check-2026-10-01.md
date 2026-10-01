# 曲目与收藏品核对（2026-10-02 复核更正）

曲目与谱面定数来源：`https://www.diving-fish.com/api/maimaidxprober/music_data`。
国服年代来源：`https://maimai.lxns.net/api/v0/maimai/song/list?version=25500&notes=true`，版本表明确标为「舞萌DX 2026」。水鱼的原始 `from` 可能使用日文版本名，显示年代和 B15/B35 分组以落雪国服映射为准。

水鱼原始曲库为 1405 个曲目条目，本地在 v2.6 按用户纠错排除 11879 后为 1404 个曲目条目（标准/DX 独立，含宴曲）；缺失、多余以及曲名、类型、难度和定数差异均为 0。全部条目具有国服年代映射和本地封面。上次补入的 11 首曲目漏同步封面和年代，现已修复。`Link(CoF)` 按稳定 ID 383 匹配落雪 `Link`；水鱼 `Xaleid◆scopiX (2)`（11879）为用户确认的错误项，已移除且导入时持续排除。

收藏品核对使用 `/plate/list?version=25500&required=true` 和 `/trophy/list?version=25500&required=true`，不另行导入日服数据。上一轮把 550301、558034、605901 硬编码为日服专属缺乏依据，已撤销该排除表。7sRefちほー4 同时见于国服万花筒攻略，已补齐对应路线及奖励图片。558034 的条件是伙伴亲密度，不接入该机制；不能因此把它称为日服专属。

称号目录中依赖未收录或不可用谱面的 107 条记录运行时不可选，并非已证实的“历史国服称号”。依赖现有曲库的 1464 条 API 曲目称号没有缺失。

常驻区域按国服版本收藏目录的「原创区域」分类整理，含历代区域；现有 73 条常驻、100 条联动路线。API 没有区域当前开放/关闭日期，不能从“拥有该区域的奖励”推断“当前机台还能探索”。联动 10 天轮换、原创区域常驻以及路线里程仍是模拟器改编。

万花筒门事件在 v2.6 实现；模拟器规则和解锁范围见 [v2.6.md](v2.6.md)。实际国服机制是完成指定区域发现门、另外达成钥匙条件，持钥匙后挑战。国服攻略仍将棱镜塔标为「10月4号后（预计）」，API 提前收录曲目不等于已开放。

参考：
- https://maimai.lxns.net/docs/api/maimai
- https://maimai-net.cn/kaleidxscope

机器对比：`node scripts/compare-catalogue.cjs`，使用 `artifacts/region-check/*-current.json` 当次快照并写出 `catalogue-comparison.json`。年代同步：`node scripts/sync-cn-versions.cjs artifacts/region-check/lxns-current.json`。封面同步：`node scripts/cache-covers.cjs`。
