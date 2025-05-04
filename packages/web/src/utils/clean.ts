import toast from "react-hot-toast";

  /**
* 清空所有备份数据
* @returns {number} 被清除的备份数量
*/
export const clearAllBackups = () => {
 let count = 0;
 const backupPrefix = 'cards-backup-';
 
 // 获取所有localStorage的键
 const keys = Object.keys(localStorage);
 
 // 筛选出备份相关的键并删除
 keys.forEach(key => {
   if (key.startsWith(backupPrefix)) {
     localStorage.removeItem(key);
     count++;
   }
 });
 
 // 显示通知
 if (count > 0) {
   toast.success(`已成功清除${count}个备份数据`);
 } else {
   toast('没有找到需要清除的备份数据');
 }
 
 return count;
};