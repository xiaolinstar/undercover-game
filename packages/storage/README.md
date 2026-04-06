# @undercover/storage（规划）

该包用于定义统一的存储接口并提供各端适配：

- Web：localStorage
- 微信小程序：`uni.setStorageSync/getStorageSync`
- iOS/Android/鸿蒙：各自 KV 存储

