const SETUP_PAGE_PATH = '/pages/setup/index'
const SHARE_TITLE = '聚会开局神器 | 谁是卧底发牌器'

export function createDefaultSharePayload() {
  return {
    title: SHARE_TITLE,
    path: SETUP_PAGE_PATH,
  }
}

export function createDefaultTimelineSharePayload() {
  return {
    title: SHARE_TITLE,
    query: '',
  }
}

export function showDefaultShareMenu() {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: false,
    menus: ['shareAppMessage', 'shareTimeline'],
  })
  // #endif
}
