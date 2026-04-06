# @undercover/core（规划）

该包用于沉淀跨端“规则与数据模型”，供：

- `apps/web`（PC Web / H5）
- `apps/uni`（微信小程序 / uni-app H5）
- 未来 `apps/ios` / `apps/android` / `apps/harmony`

一期建议先抽离：

- 发牌规则（卧底人数自动、洗牌分配）
- 胜负判定（按你们线下规则）
- Session / WordPair 数据结构与校验

