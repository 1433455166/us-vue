import novelJson from './noveList.json';

export const novels = novelJson.list;

// 获取小说数据
export function getNovelById(id) {
  return novels.find(novel => novel.id === id)
}

// 获取分类小说
export function getNovelsByCategory(categoryId, page = 1, pageSize = 10) {
  let filtered = [...novels]
  
  if (categoryId !== 'all') {
    // 这里简化处理，实际中应该有专门的分类字段
    filtered = filtered.filter(novel => {
      if (categoryId === 'xuanhuan') return novel.category.includes('玄幻')
      if (categoryId === 'kehuan') return novel.category.includes('科幻')
      if (categoryId === 'xuanyi') return novel.category.includes('悬疑')
      if (categoryId === 'lishi') return novel.category.includes('历史')
      return true
    })
  }
  
  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    data: filtered.slice(start, end),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}