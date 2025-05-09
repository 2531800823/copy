import type { Card as CardType, Tag } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconDeleteStroked, IconEdit } from '@douyinfe/semi-icons'
import { IconJsonViewer } from '@douyinfe/semi-icons-lab'
import { Button, Tooltip } from '@douyinfe/semi-ui';
import React, { useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { copyToClipboard } from '../../utils/commonUtils'
import styles from './Card.module.less';

interface CardProps {
  card: CardType
  tags: Tag[]
  isHighlighted?: boolean
  searchTerm?: string
  onHandleEditorText: (id: string) => void
}

/**
 * 卡片组件
 */
const Card: React.FC<CardProps> = ({
  card,
  isHighlighted = false,
  onHandleEditorText,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const { deleteCard, updateCard } = useCardStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  /**
   * 复制卡片内容
   */
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发拖拽
    const success = await copyToClipboard(card.content);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      updateCard(card.id, { copyCount: (card.copyCount ?? 0) + 1 });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isHighlighted ? styles.highlighted : ''}`}
      onClick={handleCopy}
      {...attributes}
      {...listeners}

    >

      <div
        className={styles.content}
        onMouseDown={e => e.stopPropagation()} // 防止触发拖拽
      >
        <div className={styles.title}>{card.title}</div>
        <div className={styles.content}>{card.content}</div>
        {isCopied && <div className={styles.copiedToast}>已复制</div>}
      </div>

      <div
        className={styles.actions}
        onMouseDown={e => e.stopPropagation()} // 防止按钮区域触发拖拽
      >
        <Button
          icon={<IconEdit />}
          theme="borderless"
          size="large"
          type="tertiary"
          aria-label="更改内容"
          onClick={(e) => {
            onHandleEditorText(card.id)
            e.stopPropagation();
          }}
        />

        <Button
          icon={<IconDeleteStroked />}
          theme="borderless"
          size="large"
          type="danger"
          aria-label="删除卡片"
          onClick={(e) => {
            e.stopPropagation();
            deleteCard(card.id);
          }}
        />

      </div>
    </div>
  );
}

export default Card;
