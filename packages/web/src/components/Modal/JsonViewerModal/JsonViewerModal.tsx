import type { FC } from 'react';
import { Button, JsonViewer, Modal } from '@douyinfe/semi-ui'
import React, { useRef } from 'react'
import styles from './JsonViewerModal.module.less';
import useModalStore from '../../../store/useModal';

interface JsonViewerModalProps {
  visible: boolean
  data?: string
}

// 定义JsonViewer组件的ref类型
interface JsonViewerRefType {
  format: () => void
  [key: string]: any
}

const JsonViewerModal: FC<JsonViewerModalProps> = (props) => {
  const { visible, data = `{}` } = props;
  const {   setJsonViewerModal} = useModalStore()

  const jsonviewerRef = useRef<JsonViewerRefType>(null);

  if (!visible) return null

  const onCancel = () => {
    setJsonViewerModal({ visible: false })
  }

  return (
    <Modal
      title={null}
      visible={visible}
      className={styles.modal}
      style={{ height: '100%' }}
      onOk={onCancel}
      afterClose={onCancel}
      onCancel={onCancel}
      closeOnEsc={true}
      footer={null}
      fullScreen
    >
      <Button onClick={() => console.log(jsonviewerRef.current?.format())}>格式化</Button>
      <div style={{ marginTop: 12, paddingBottom: 12, height: 'calc(100% - 32px)' }}>
        <JsonViewer
          style={{ backgroundColor: 'red' }}
          ref={jsonviewerRef}
          height="100%"
          width="100%"
          value={data}
          options={{ autoWrap: true,lineHeight: 26 }}
        />
      </div>
    </Modal>
  );
}

export default JsonViewerModal
