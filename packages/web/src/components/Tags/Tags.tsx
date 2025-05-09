import type { FC } from 'react'
import { IconChevronDown } from '@douyinfe/semi-icons';
import { Dropdown } from '@douyinfe/semi-ui';
import { useDebounceFn } from 'ahooks'
import classnames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import useCardStore from '../../store/useCardStore';
import styles from './Tags.module.less';

interface TagsProps {
  maxWidth?: number // 允许最大宽度，不传则自动计算
}

/**
 * 标签组件，支持多彩样式和选中状态
 * 当标签过多时自动折叠显示
 */
const Tags: FC<TagsProps> = ({ maxWidth }) => {
  const { activeTag, tags, setActiveTag } = useCardStore();
  const [visibleTags, setVisibleTags] = useState<number>(tags.length);
  const [needFolding, setNeedFolding] = useState<boolean>(false); // 是否需要折叠
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleTagClick = (id: string) => {
    setActiveTag(id);
  }

  const isDefault = activeTag === 'all';

  /**
   * 计算可见标签数量
   */
  const { run: calculateVisibleTags } = useDebounceFn(() => {
    if (!tagsContainerRef.current)
      return;

    // 获取容器可用宽度
    const containerMaxWidth = maxWidth || tagsContainerRef.current.parentElement?.clientWidth || 0;
    if (containerMaxWidth === 0)
      return;

    const otherWidth = window.innerWidth > 500 ? 252 : 50
    // 保留给按钮组的最小空间 (50px) 和更多按钮的空间 (40px)
    const availableWidth = containerMaxWidth - otherWidth - 24;

    // 计算所有标签的总宽度
    let totalTagsWidth = 0;
    tagRefs.current.forEach((tagRef, index) => {
      if (tagRef) {
        totalTagsWidth += tagRef.offsetWidth + (index > 0 ? 6 : 0); // 加上间距
      }
    });

    // 判断是否需要折叠
    const shouldFold = totalTagsWidth > availableWidth;
    setNeedFolding(shouldFold);

    if (!shouldFold) {
      // 宽度足够，显示所有标签
      setVisibleTags(tags.length + 1); // +1 是因为包含"全部"标签
      return
    }

    // 宽度不够，计算能显示多少个标签
    // 计算默认"全部"标签的宽度
    const allTagWidth = tagRefs.current[0]?.offsetWidth || 0;
    let usedWidth = allTagWidth + 6; // 6px是标签间距

    let visibleCount = 1; // 默认至少显示"全部"标签

    // 计算能显示多少个标签
    for (let i = 1; i < tagRefs.current.length; i++) {
      const tagWidth = tagRefs.current[i]?.offsetWidth || 0;
      // 为"更多"按钮预留空间
      if (usedWidth + tagWidth + 6 > availableWidth)
        break;

      usedWidth += tagWidth + 6;
      visibleCount++
    }

    setVisibleTags(visibleCount);
  }, {
    wait: 100,
  });

  // 监听窗口大小变化和标签数量变化
  useEffect(() => {
    calculateVisibleTags();
    window.addEventListener('resize', calculateVisibleTags);

    return () => {
      window.removeEventListener('resize', calculateVisibleTags);
    };
  }, [tags.length, maxWidth]);

  // 当组件挂载后和refs更新后再次计算
  useEffect(() => {
    // 使用setTimeout确保DOM已完全渲染
    const timer = setTimeout(calculateVisibleTags, 0);
    return () => clearTimeout(timer);
  }, [tagRefs.current.length]);

  // 渲染单个标签
  const renderTag = (id: string, name: string, color: string, isSelected: boolean, index: number) => {
    return (
      <div
        key={id}
        ref={el => tagRefs.current[index] = el}
        className={classnames(styles.tag, isSelected && styles.selected)}
        style={{
          backgroundColor: isSelected ? color : '#ffffff',
          color: isSelected ? '#ffffff' : color,
          borderColor: color,
        }}
        onClick={() => handleTagClick(id)}
      >
        {name}
      </div>
    );
  };

  // 渲染下拉菜单中的标签
  const renderDropdownMenu = () => {
    if (!needFolding || visibleTags >= tags.length + 1)
      return null;

    const hiddenTags = tags.slice(visibleTags - 1);

    return (
      <Dropdown.Menu>
        {hiddenTags.map((item) => {
          const isSelected = activeTag === item.id;
          const tagColor = item.color || '#1677ff'; // 提供默认颜色
          return (
            <Dropdown.Item
              key={item.id}
              onClick={() => handleTagClick(item.id)}
            >
              <div
                className={styles.dropdownTag}
                style={{
                  backgroundColor: isSelected ? tagColor : '#ffffff',
                  color: isSelected ? '#ffffff' : tagColor,
                  borderColor: tagColor,
                }}
              >
                {item.name}
              </div>
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    );
  };

  return (
    <div className={styles.tags} ref={tagsContainerRef}>
      {/* 全部标签始终显示 */}
      {renderTag('all', '全部', '#1677ff', isDefault, 0)}

      {/* 可见的标签：如果需要折叠就部分显示，否则全部显示 */}
      {(needFolding ? tags.slice(0, visibleTags - 1) : tags).map((item, index) => {
        const isSelected = activeTag === item.id;
        const tagColor = item.color || '#1677ff'; // 提供默认颜色
        return renderTag(item.id, item.name, tagColor, isSelected, index + 1);
      })}

      {/* 更多标签下拉菜单：只在需要折叠且有标签被隐藏时显示 */}
      {needFolding && visibleTags < tags.length + 1 && (
        <Dropdown
          trigger="click"
          position="bottomLeft"
          content={renderDropdownMenu()}
        >
          <div className={styles.moreButton}>
            <IconChevronDown />
          </div>
        </Dropdown>
      )}
    </div>
  );
}

export default Tags;
