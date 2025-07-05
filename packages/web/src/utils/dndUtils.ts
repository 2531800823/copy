import {PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, SortableContext} from '@dnd-kit/sortable';

/**
 * 创建拖拽传感器配置
 * @returns DND Kit传感器配置
 */
export function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 拖动激活所需的距离
        distance: 5,
      },
    })
  );
}

/**
 * 根据ID获取项目在数组中的索引
 * @param items 项目数组
 * @param id 要查找的项目ID
 * @returns 索引位置
 */
export function findItemIndexById<T extends {id: string}>(
  items: T[],
  id: string
): number {
  return items.findIndex((item) => item.id === id);
}

/**
 * 处理拖拽结束，重新排序数组
 * @param items 原始数组
 * @param activeId 被拖拽项的ID
 * @param overId 放置目标项的ID
 * @returns 重新排序后的数组
 */
export function reorderItems<T extends {id: string}>(
  items: T[],
  activeId: string,
  overId: string
): T[] {
  const oldIndex = findItemIndexById(items, activeId);
  const newIndex = findItemIndexById(items, overId);

  if (oldIndex !== -1 && newIndex !== -1) {
    return arrayMove(items, oldIndex, newIndex);
  }

  return items;
}
