import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

export enum EnumCountSort {
  ASC = 'asc',
  DESC = 'desc',
}
interface SettingState {
  countSort: boolean;

  // 卡片操作
  setCountSort: (countSort: boolean) => void;
}

/**
 * 设置状态管理Store
 */
const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      countSort: true,
      // 卡片操作
      setCountSort: (countSort: boolean) => set({countSort}),
    }),
    {
      name: 'setting-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useSettingStore;
