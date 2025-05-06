/**
 * 卡片标签类型
 */
export interface Tag {
  id: string
  name: string
  color?: string
}

/**
 * 卡片类型
 */
export interface Card {
  id: string
  title: string
  content: string
  tags: string[] // 标签ID列表
  /** 暂存 */
  categoryId: string
}

/**
 * 分类类型
 */
export interface Category {
  id: string
  name: string
  order: number
}

/**
 * 拖拽项目类型
 */
export interface DragItem {
  id: string
  type: 'card' | 'tag'
}

/**
 * 应用设置类型
 */
export interface AppSettings {
  theme: 'light' | 'dark'
  autoClipboard: boolean
  showCopyNotification: boolean
}
