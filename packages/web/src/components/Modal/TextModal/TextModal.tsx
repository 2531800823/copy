import type {FC} from 'react';
import {Input, Modal, TextArea} from '@douyinfe/semi-ui';
import classnames from 'classnames';
import {useState} from 'react';
import {v4 as uuidv4} from 'uuid';
import useCardStore from '../../../store/useCardStore';
import styles from './TextModal.module.less';
import useModalStore from '../../../store/useModal';

interface TextModalModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
}

const TextModalModal: FC<TextModalModalProps> = (props) => {
  const {visible} = props;

  const {setTextModal} = useModalStore();

  const {tags, addCard} = useCardStore();

  const [activeTag, setActiveTag] = useState<string[]>([tags[0].id]);

  const [content, setContent] = useState('');

  const [title, setTitle] = useState('');

  const handleOk = () => {
    addCard({
      id: uuidv4(),
      content,
      title,
      tags: activeTag,
      categoryId: 'text',
      copyCount: 0,
    });
    setTitle('');
    setContent('');
    setActiveTag([tags[0].id]);
    setTextModal({visible: false});
  };

  const handleTagClick = (id: string) => {
    if (activeTag.includes(id)) {
      setActiveTag(activeTag.filter((tag) => tag !== id));
    } else {
      setActiveTag([id]);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      title="添加文本"
      visible={visible}
      onOk={handleOk}
      afterClose={() => setTextModal({visible: false})}
      onCancel={() => setTextModal({visible: false})}
      closeOnEsc={true}
      fullScreen>
      <Input placeholder="请输入标题" value={title} onChange={setTitle} />
      <TextArea
        placeholder="请输入文本"
        style={{marginTop: 12}}
        autosize
        value={content}
        onChange={setContent}
      />
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
              onClick={() => handleTagClick(item.id)}>
              {item.name}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default TextModalModal;
