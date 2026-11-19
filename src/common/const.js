// 后端地址已统一到 src/common/enum.ts 的 ADDRESS

// 密码等级：0 访客（未通过验证）/ 1 测试 / 2 管理员，后面会再调整
export const PASSWORD_LEVEL = {
  GUEST: 0,
  TEST: 1,
  ADMIN: 2
}

// 当前日期，格式 yyyyMMdd
function formatDate() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
}

// 测试密码：test/当前日期
export const accessPassword = `test/${formatDate()}`

// 管理员密码
export const adminPassword = 'admin123456CC'

// 密码 -> 等级映射
const passwordLevels = {
  [accessPassword]: PASSWORD_LEVEL.TEST,
  [adminPassword]: PASSWORD_LEVEL.ADMIN
}

// 获取密码等级：无效密码返回 0（访客）
export function getPasswordLevel(password) {
  if (!password) return PASSWORD_LEVEL.GUEST
  return passwordLevels[password] ?? PASSWORD_LEVEL.GUEST
}
