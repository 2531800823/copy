import type { DragEndEvent } from '@dnd-kit/core';
import type { FC } from 'react';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconDeleteStroked, IconEdit, IconPlus } from '@douyinfe/semi-icons';
import { Button, Input, Modal, Toast } from '@douyinfe/semi-ui';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'
import useCardStore from '../../../store/useCardStore'
import { useDragSensors } from '../../../utils/dndUtils'
import styles from './styles.module.less'

interface EditorTagModalProps {
  visible: boolean
  onOk: () => void
  onCancel: () => void
}

/**
 * 可排序的单个标签组件
 */
interface SortableTagProps {
  id: string
  name: string
  color: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const SortableTag: FC<SortableTagProps> = ({ id, name, color, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.tagItem}
      {...attributes}
      {...listeners}
    >
      <div className={styles.tagInfo}>
        <div
          className={styles.colorIndicator}
          style={{ backgroundColor: color || '#1677ff' }}
        />
        <span className={styles.tagName}>{name}</span>
      </div>
      <div className={styles.tagActions}>
        <Button
          type="primary"
          theme="borderless"
          icon={<IconEdit />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
        />
        <Button
          type="danger"
          theme="borderless"
          icon={<IconDeleteStroked />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        />
      </div>
    </div>
  );
}

/**
 * 标签管理模态框组件
 */
const EditorTagModal: FC<EditorTagModalProps> = (props) => {
  const { visible, onOk, onCancel } = props;
  const { tags, updateTag, deleteTag, addTag, reorderTags } = useCardStore();
  const [newTagName, setNewTagName] = useState('');
  const sensors = useDragSensors();

  /**
   * 生成随机颜色
   * @returns 随机颜色的十六进制值
   */
  const getRandomColor = () => {
    const colors = [
      '#1677ff',
      '#00b96b',
      '#ff4d4f',
      '#faad14',
      '#722ed1',
      '#eb2f96',
      '#13c2c2',
      '#fadb14',
    ]
    return colors[Math.floor(Math.random() * colors.length)];
  };

  /**
   * 处理新增标签
   */
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      Toast.warning('标签名称不能为空');
      return;
    }

    // 检查标签名是否重复
    if (tags.some(tag => tag.name === newTagName.trim())) {
      Toast.warning('标签名称已存在');
      return;
    }

    addTag({
      id: uuidv4(),
      name: newTagName.trim(),
      color: getRandomColor(),
    });

    setNewTagName('');
  };

  /**
   * 处理编辑标签
   * @param id 标签ID
   */
  const handleEditTag = (id: string) => {
    const tag = tags.find(tag => tag.id === id);
    if (!tag)
      return;

    let name = tag.name;

    Modal.confirm({
      title: '修改标签名称',
      content: (
        <Input
          defaultValue={tag.name}
          onChange={value => name = value}
          placeholder="请输入新的标签名称"
        />
      ),
      onOk: () => {
        if (name.trim()) {
          updateTag(id, {
            name: name.trim(),
            color: tag.color,
          });
        }
      },
    });
  };

  /**
   * 处理删除标签
   * @param id 标签ID
   */
  const handleDeleteTag = (id: string) => {
    if (tags.length <= 1) {
      Toast.warning('至少保留一个标签');
      return;
    }

    deleteTag(id);
  };

  /**
   * 处理拖拽结束
   * @param event 拖拽结束事件
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // 调用 store 中的 reorderTags 方法重新排序标签
      reorderTags(active.id.toString(), over.id.toString());
    }
  };

  return (
    <Modal
      title="管理标签"
      visible={visible}
      onOk={onOk}
      afterClose={onCancel}
      onCancel={onCancel}
      closeOnEsc={true}
      fullScreen
    >
      <div className={styles.container}>
        <div className={styles.addTagSection}>
          <Input
            placeholder="请输入标签名称"
            value={newTagName}
            onChange={setNewTagName}
            onEnterPress={handleAddTag}
          />
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={handleAddTag}
          >
            添加标签
          </Button>
        </div>

        {tags.length > 0
          ? (
              <div className={styles.tagList}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={tags.map(tag => tag.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tags.map(tag => (
                      <SortableTag
                        key={tag.id}
                        id={tag.id}
                        name={tag.name}
                        color={tag.color || '#1677ff'}
                        onEdit={handleEditTag}
                        onDelete={handleDeleteTag}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )
          : (
              <div className={styles.emptyState}>暂无标签，请添加</div>
            )}

        {tags.length === 1 && (
          <div className={styles.singleTagWarning}>至少需要保留一个标签</div>
        )}
      </div>
    </Modal>
  );
}

export default EditorTagModal;
