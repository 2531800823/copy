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
import { useDragSensors } from '../../utils/dndUtils'
import Card from '../Card/Card'
import EditorTextModal from '../Modal/EditorTextModal/EditorTextModal'
import styles from './CardList.module.less'

const defaultTag = 'all';

/**
 * 卡片列表组件
 */
const CardList: React.FC = () => {
  const { cards, tags, activeTag, reorderCards } = useCardStore();

  const sensors = useDragSensors();

  // 拖拽结束时重新排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // 直接将活动卡片ID和目标卡片ID传递给reorderCards
      reorderCards(active.id.toString(), over.id.toString());
    }
  };

  // 过滤出当前标签的卡片
  const currentCards = useMemo(() => {
    if (activeTag === defaultTag) {
      return cards;
    }
    return cards.filter(card => card.tags.includes(activeTag));
  }, [cards, activeTag]);

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
