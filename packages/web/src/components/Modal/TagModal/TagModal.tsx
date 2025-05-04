import type { FC } from 'react';
import { Input, Modal } from '@douyinfe/semi-ui'
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useCardStore from '../../../store/useCardStore'

interface TagModalProps {
  visible: boolean
  onOk: () => void
  onCancel: () => void
}

const TagModal: FC<TagModalProps> = (props) => {
  const { visible, onOk, onCancel } = props;
  const { addTag } = useCardStore();
  console.log('TagModal');
  const [name, setName] = useState('');

  const handleOk = () => {
      console.log(name);
      const newId = uuidv4();
      
    addTag({
      id: newId,
      name,
      color: `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`, // 随机生成一个 6 位的十六进制颜色值
    })
    onOk();

  };

  return (
    <Modal
      title="添加标签"
      visible={visible}
      onOk={handleOk}
      afterClose={onCancel} // >=1.16.0
      onCancel={onCancel}
      closeOnEsc={true}
    >
      <Input placeholder="请输入标签名称" value={name} onChange={setName} />
    </Modal>
  );
}

export default TagModal
