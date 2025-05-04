import type { FC } from 'react'
import classnames from 'classnames'
import useCardStore from '../../store/useCardStore'
import styles from './Tags.module.less'

interface TagsProps {}

/**
 * 标签组件，支持多彩样式和选中状态
 */
const Tags: FC<TagsProps> = () => {
  const { activeTag, tags, setActiveTag } = useCardStore();

  const handleTagClick = (id: string) => {
    setActiveTag(id);
  };

  return (
    <div className={styles.tags}>
      {tags.map((item) => {
        const isSelected = activeTag === item.id;

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
        );
      })}
    </div>
  );
};

export default Tags;
