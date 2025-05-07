import type { FC } from 'react';
import { IconDeleteStroked, IconEdit } from '@douyinfe/semi-icons'
import { Button, Input, Modal, Table } from '@douyinfe/semi-ui';
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import useCardStore from '../../../store/useCardStore';
import styles from './styles.module.less'

interface EditorTagModalProps {
  visible: boolean
  onOk: () => void
  onCancel: () => void
}

const EditorTagModal: FC<EditorTagModalProps> = (props) => {
  const { visible, onOk, onCancel } = props;
  const { tags, updateTag, deleteTag } = useCardStore();

  const handleOk = () => {
    console.log(name);

    onOk();

  }

  return (
    <Modal
      title="添加标签"
      visible={visible}
      onOk={handleOk}
      afterClose={onCancel} // >=1.16.0
      onCancel={onCancel}
      closeOnEsc={true}
    >
      {tags.length === 1
        ? <div>就剩一个了，别删了</div>
        : (
            <Table
              columns={[
                {
                  title: '标签名称',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: '操作',
                  dataIndex: 'operation',
                  key: 'operation',
                  render: (_, record) => (
                    <>
                      <Button
                        type="primary"
                        theme="borderless"
                        icon={<IconEdit />}
                        onClick={() => {
                          let name = record.name
                          Modal.confirm({
                            title: '修改标签名称',
                            content: (
                              <Input
                                defaultValue={record.name}
                                onChange={value => name = value}
                                placeholder="请输入新的标签名称"
                              />
                            ),
                            onOk: () => {
                              if (record.name) {
                                updateTag(record.id, {
                                  name,
                                  color: record.color,
                                })
                              }
                            },
                          });

                        }}
                      >
                      </Button>
                      <Button
                        type="danger"
                        theme="borderless"
                        icon={<IconDeleteStroked />}
                        onClick={() => {
                          deleteTag(record.id);
                        }}
                      >
                      </Button>
                    </>

                  ),
                },
              ]}
              dataSource={tags}
              pagination={false}
            />
          )}
    </Modal>
  );
};

export default EditorTagModal
