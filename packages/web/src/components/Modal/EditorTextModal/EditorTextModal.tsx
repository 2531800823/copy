import type { FC } from 'react';
import { Input, Modal, TextArea } from '@douyinfe/semi-ui'
import classnames from 'classnames';
import { useState } from 'react'
import useCardStore from '../../../store/useCardStore'
import styles from './EditorTextModal.module.less'

interface TextModalModalProps {
  id: string
  visible: boolean
  onOk: () => void
  onCancel: () => void
}

const EditorTextModal: FC<TextModalModalProps> = (props) => {
  const { id, visible, onOk, onCancel } = props;

  const { cards, tags, updateCard } = useCardStore();

  const card = cards.find(item => item.id === id)
  console.log('🚀 liu123 ~ card:', card)

  const [activeTag, setActiveTag] = useState<string[]>(card?.tags ?? [tags[0].id]);

  const [content, setContent] = useState(card?.content ?? '');

  const [title, setTitle] = useState(card?.title ?? '');

  const handleOk = () => {
    updateCard(id, {
      content,
      title,
      tags: activeTag,
      categoryId: 'text',
    })
    setTitle('');
    setContent('');
    setActiveTag([tags[0].id]);
    onOk();

  };

  const handleTagClick = (id: string) => {
    if (activeTag.includes(id)) {
      setActiveTag(activeTag.filter(tag => tag !== id));
    }
    else {
      setActiveTag([...activeTag, id]);
    }
  }

  return (
    <Modal
      title="修改文本"
      visible={visible}
      onOk={handleOk}
      afterClose={onCancel}
      onCancel={onCancel}
      closeOnEsc={true}
      fullScreen
    >
      <Input placeholder="请输入标题" value={title} onChange={setTitle} />
      <TextArea placeholder="请输入文本" style={{ marginTop: 12 }} autosize value={content} onChange={setContent} />
      <div className={styles.tags}>
        {tags.map((item) => {
          const isSelected = activeTag.includes(item.id);

          return (
            <div
              key={item.id}
              className={classnames(styles.tag, isSelected && styles.selected)}
              style={{
                backgroundColor: isSelected ? item.color : '#ffffff',
                color: isSelected ? '#ffffff' : item.color,
                borderColor: item.color,
              }}
              onClick={() => handleTagClick(item.id)}
            >
              {item.name}
            </div>
          )
        })}
      </div>
    </Modal>
  );
}

export default EditorTextModal
