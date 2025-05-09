import type { Card, Tag } from '../types'
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';

interface CardState {
  cards: Card[]
  tags: Tag[]
  activeTag: string

  // 卡片操作
  addCard: (card: Card) => void
  updateCard: (id: string, card: Partial<Omit<Card, 'id'>>) => void
  deleteCard: (id: string) => void
  reorderCards: (activeId: string, overId: string) => void

  // 标签操作
  addTag: (tag: Tag) => void
  updateTag: (id: string, tag: Partial<Omit<Tag, 'id'>>) => void
  deleteTag: (id: string) => void
  reorderTags: (activeId: string, overId: string) => void

  setActiveTag: (id: string) => void

  // 导入数据操作
  importData: (data: { cards: Card[], tags: Tag[] }) => void
}

/**
 * 卡片状态管理Store
 */
const useCardStore = create<CardState>()(
  persist(
    set => ({
      cards: [{
        id: '1',
        content: '您好，欢迎使用',
        title: '标题',
        tags: ['1'],
        categoryId: 'text',
        copyCount: 0,
      }],
      tags: [{ id: '1', name: '常用', color: '#4285f4' }],
      activeTag: '1',
      // 卡片操作
      addCard: card => set((state) => {
        const newCard: Card = {
          ...card,
        };
        return { cards: [...state.cards, newCard] }
      }),

      updateCard: (id, updatedCard) => set(state => ({
        cards: state.cards.map(card =>
          card.id === id ? { ...card, ...updatedCard } : card,
        ),
      })),

      deleteCard: id => set(state => ({
        cards: state.cards.filter(card => card.id !== id),
      })),

      reorderCards: (activeId, overId) => set((state) => {
        const cards = [...state.cards];

        // 找到卡片在数组中的索引
        const activeIndex = cards.findIndex(card => card.id === activeId);
        const overIndex = cards.findIndex(card => card.id === overId);

        if (activeIndex === -1 || overIndex === -1) {
          return { cards };
        }

        // 通过移动数组元素来重新排序
        const [movedCard] = cards.splice(activeIndex, 1);
        cards.splice(overIndex, 0, movedCard);

        return { cards };
      }),

      // 标签操作
      addTag: tag => set(state => ({
        tags: [...state.tags, { ...tag }],
      })),

      updateTag: (id, updatedTag) => set(state => ({
        tags: state.tags.map(tag =>
          tag.id === id ? { ...tag, ...updatedTag } : tag,
        ),
      })),

      deleteTag: id => set((state) => {
        // 删除标签的同时，也要从卡片中移除对应的标签引用
        const updatedCards = state.cards.map(card => ({
          ...card,
          tags: card.tags.filter(tagId => tagId !== id),
        }))

        return {
          tags: state.tags.filter(tag => tag.id !== id),
          cards: updatedCards,
        };
      }),

      /**
       * 重新排序标签
       * @param activeId 被拖拽的标签ID
       * @param overId 放置目标的标签ID
       */
      reorderTags: (activeId, overId) => set((state) => {
        const tags = [...state.tags];

        // 找到标签在数组中的索引
        const activeIndex = tags.findIndex(tag => tag.id === activeId);
        const overIndex = tags.findIndex(tag => tag.id === overId);

        if (activeIndex === -1 || overIndex === -1) {
          return { tags };
        }

        // 通过移动数组元素来重新排序
        const [movedTag] = tags.splice(activeIndex, 1);
        tags.splice(overIndex, 0, movedTag);

        return { tags };
      }),

      setActiveTag: id => set({ activeTag: id }),

      /**
       * 导入数据，完全覆盖现有数据
       * @param data 要导入的数据，包含cards和tags
       */
      importData: data => set(() => {
        // 为了保持数据的完整性，我们需要确保导入的数据符合我们的结构要求
        const importedCards = Array.isArray(data.cards) ? data.cards : [];
        const importedTags = Array.isArray(data.tags) ? data.tags : [];

        // 如果导入的数据为空，保留默认数据
        if (importedCards.length === 0 && importedTags.length === 0) {
          return {};
        }

        // 如果标签为空但卡片不为空，添加一个默认标签
        const tags = importedTags.length > 0 ? importedTags : [{ id: '1', name: '默认', color: '#4285f4' }];

        // 如果卡片中引用了不存在的标签，清除这些引用
        const tagIds = new Set(tags.map(tag => tag.id));
        const cards = importedCards.map(card => ({
          ...card,
          tags: Array.isArray(card.tags) ? card.tags.filter(tagId => tagIds.has(tagId)) : [],
        }));

        return { cards, tags };
      }),
    }),
    {
      name: 'card-store',
      storage: createJSONStorage(() => localStorage),

    },
  ),
);

export default useCardStore
