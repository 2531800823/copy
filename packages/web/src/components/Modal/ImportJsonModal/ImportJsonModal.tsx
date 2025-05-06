import type { FC } from 'react'
import type { Tag } from '../../../types';
import { Modal, Radio, RadioGroup, TextArea } from '@douyinfe/semi-ui';
import { useState } from 'react'
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

import useCardStore from '../../../store/useCardStore';

interface ImportJsonProps {
  visible: boolean
  onOk: () => void
  onCancel: () => void
}

/**
 * 导入数据结构，包含版本信息和数据
 */
interface ImportData {
  version: string
  cards: any[]
  tags: any[]
}

const ImportJsonModal: FC<ImportJsonProps> = (props) => {
  const { visible, onOk, onCancel } = props;
  const { cards, tags, addCard, addTag, importData } = useCardStore();

  const [jsonContent, setJsonContent] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'override'>('append');
  const [errorMsg, setErrorMsg] = useState<string>('');

  /**
   * 验证导入的JSON格式是否正确
   */
  const validateJson = (jsonData: any): jsonData is ImportData => {
    if (!jsonData) {
      setErrorMsg('数据为空');
      return false;
    }
    // 检查基本数据结构
    if (!Array.isArray(jsonData.cards) || !Array.isArray(jsonData.tags)) {
      setErrorMsg('导入的数据结构不正确，缺少cards或tags数组');
      return false;
    }

    // 验证数据通过
    setErrorMsg('');
    return true;
  };

  /**
   * 导出当前数据为备份
   */
  const createBackup = () => {
    const backupData: ImportData = {
      version: '1.0.0', // 当前应用版本
      cards,
      tags,
    }

    // 存储到本地存储，带时间戳防止覆盖
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    localStorage.setItem(`cards-backup-${timestamp}`, JSON.stringify(backupData));

    return timestamp;
  };

  /**
   * 处理导入逻辑
   */
  const handleImport = () => {
    try {
      const jsonData = JSON.parse(jsonContent);
      console.log('🚀 liu123 ~ jsonData:', jsonData)

      // 验证数据格式
      if (!validateJson(jsonData)) {
        return;
      }

      // 在导入前创建备份
      const backupTimestamp = createBackup();

      // 根据选择的模式执行导入
      if (importMode === 'override') {
        // 覆盖模式 - 使用importData方法完全替换现有数据
        importData({
          cards: jsonData.cards,
          tags: jsonData.tags,
        })

        toast.success(`数据已成功覆盖，备份时间戳: ${backupTimestamp}`);
      }
      else {
        // 追加模式 - 添加新数据但不删除现有数据

        // 创建ID映射表，用于保持标签关联关系
        const idMappings: Record<string, string> = {};

        // 追加标签并记录ID映射
        jsonData.tags.forEach((tag: any) => {
          // 检查标签是否已存在（基于名称）
          const tagExists = tags.some(t => t.name === tag.name);
          const oldId = tag.id;

          if (!tagExists) {
            // 添加新标签，生成新ID
            const newTag: Omit<Tag, 'id'> = {
              name: tag.name,
              color: tag.color || `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`,
            };

            // 先生成新ID（因为addTag内部会自动生成一个UUID）
            const newId = uuidv4();
            idMappings[oldId] = newId;

            // 通过zustand添加标签（会生成新的UUID）
            addTag({ ...newTag, id: newId });
          }
          else {
            // 如果标签已存在，使用现有标签ID作为映射
            const existingTag = tags.find(t => t.name === tag.name);
            if (existingTag) {
              idMappings[oldId] = existingTag.id;
            }
          }
        });

        // 追加卡片，使用ID映射更新标签引用
        jsonData.cards.forEach((card: any) => {
          // 映射标签ID
          const mappedTags = Array.isArray(card.tags)
            ? card.tags.map((tagId: string) => idMappings[tagId] || tagId)
            : [];
          const newId = uuidv4();

          // 添加卡片，不指定ID（会自动生成）
          addCard({
            ...card,
            id: newId,
            tags: mappedTags,
            categoryId: card.categoryId || 'text',
          });
        })

        console.log('🚀 liu123 ~ backupTimestamp:', backupTimestamp);
        toast.success(`数据已成功追加，备份时间戳: ${backupTimestamp}`);
      }

      // 完成后清空输入并关闭对话框
      setJsonContent('');
      onOk();
    }
    catch (error) {
      setErrorMsg('JSON格式不正确，请检查导入的内容');
      console.error('Import error:', error);
    }
  };

  return (
    <Modal
      title="导入JSON数据"
      visible={visible}
      onOk={handleImport}
      afterClose={onCancel}
      onCancel={onCancel}
      closeOnEsc={true}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <TextArea
          placeholder="请粘贴JSON数据"
          value={jsonContent}
          onChange={setJsonContent}
          rows={10}
          style={{ width: '100%' }}
        />
        {errorMsg && <div style={{ color: 'red', marginTop: 8 }}>{errorMsg}</div>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <RadioGroup value={importMode} onChange={e => setImportMode(e.target.value as 'append' | 'override')}>
          <Radio value="append">追加模式（保留现有数据）</Radio>
          <Radio value="override">覆盖模式（替换所有现有数据）</Radio>
        </RadioGroup>
      </div>

      <div style={{ fontSize: 12, color: '#666' }}>
        注意：导入前系统会自动创建备份。如果导入后出现问题，可以从备份恢复。
      </div>
    </Modal>
  );
};

export default ImportJsonModal
