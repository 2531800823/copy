import type {
  DragEndEvent,
} from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, { useMemo, useState } from 'react';
import useCardStore from '../../store/useCardStore';
import useSettingStore from '../../store/useSetting'
import { useDragSensors } from '../../utils/dndUtils';
import Card from '../Card/Card';
import EditorTextModal from '../Modal/EditorTextModal/EditorTextModal';
import styles from './CardList.module.less';

const defaultTag = 'all';

/**
 * 卡片列表组件
 */
const CardList: React.FC = () => {
  const { cards, tags, activeTag, reorderCards } = useCardStore();

  const sensors = useDragSensors();
  const { countSort } = useSettingStore();

  // 拖拽结束时重新排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // 直接将活动卡片ID和目标卡片ID传递给reorderCards
      reorderCards(active.id.toString(), over.id.toString());
    }
  };

  // 过滤出当前标签的卡片并根据设置进行排序
  const currentCards = useMemo(() => {
    const filterCards = activeTag === defaultTag
      ? [...cards]
      : cards.filter(card => card.tags.includes(activeTag));

    // 根据 countSort 决定是按 copyCount 排序还是保持手动排序顺序
    if (countSort) {
      // 按照复制次数排序
      return filterCards.sort((a, b) => (b.copyCount ?? 0) - (a.copyCount ?? 0));
    }

    // 使用原有顺序（手动排序的结果）
    return filterCards;
  }, [cards, activeTag, countSort]);

  const [stateEditorTextVisible, setEditorTextVisible] = useState(false)
  const [stateEditorTextId, setEditorTextId] = useState<string>()
  const handleEditorText = (id: string) => {
    setEditorTextVisible(true)
    setEditorTextId(id)
  }

  return (
    <div className={styles.cardList}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={currentCards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {currentCards.map(card => (
            <Card
              onHandleEditorText={handleEditorText}
              key={card.id}
              card={card}
              tags={tags}
              isHighlighted={false}
            />
          ))}
        </SortableContext>
      </DndContext>
      {stateEditorTextId && (
        <EditorTextModal
          id={stateEditorTextId}
          onCancel={() => {
            setEditorTextVisible(false)
            setEditorTextId(undefined);
          }}
          onOk={() => {
            setEditorTextVisible(false);
            setEditorTextId(undefined);
          }}
          visible={stateEditorTextVisible}
        />
      )}
    </div>
  );
};

export default CardList;
