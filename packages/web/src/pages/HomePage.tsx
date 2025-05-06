import { IconDeleteStroked, IconDownloadStroked, IconForwardStroked, IconMoreStroked } from '@douyinfe/semi-icons'
import { IconForm, IconTag } from '@douyinfe/semi-icons-lab'
import { Button, Dropdown, Switch, Tooltip } from '@douyinfe/semi-ui';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast'
import CardList from '../components/CardList/CardList';
import ImportJsonModal from '../components/Modal/ImportJsonModal/ImportJsonModal'
import TagModal from '../components/Modal/TagModal/TagModal';
import TextModalModal from '../components/Modal/TextModal/TextModal';
import { Tags } from '../components/Tags'
import useCardStore from '../store/useCardStore';
import { clearAllBackups } from '../utils/clean'
import { handleExportJSON } from '../utils/exportFile';
import styles from './HomePage.module.less'

/**
 * 主页面组件
 */
const HomePage: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [importJsonVisible, setImportJsonVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 获取store中的卡片和标签数据
  const { cards, tags } = useCardStore();

  // 监听窗口大小变化
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 500);
    }

    // 初始化检查
    checkScreenSize();

    // 添加resize事件监听
    window.addEventListener('resize', checkScreenSize);

    // 清理函数
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /**
   * 下拉菜单组件
   */
  const dropdownMenu = (
    <Dropdown.Menu>
      <Dropdown.Item
        icon={<IconTag />}
        onClick={() => { setVisible(true); }}
      >
        添加 tag
      </Dropdown.Item>
      <Dropdown.Item
        icon={<IconForm />}
        onClick={() => { setTextVisible(true); }}
      >
        添加文本
      </Dropdown.Item>
      <Dropdown.Item
        icon={<IconForwardStroked />}
        onClick={() => {
          handleExportJSON({
            cards,
            tags,
          })
        }}
      >
        导出文件
      </Dropdown.Item>
      <Dropdown.Item
        icon={<IconDownloadStroked />}
        onClick={() => { setImportJsonVisible(true); }}
      >
        导入文件
      </Dropdown.Item>
      <Dropdown.Item
        icon={<IconDeleteStroked />}
        onClick={clearAllBackups}
      >
        清除备份数据
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  /**
   * 渲染常规按钮组
   */
  const renderButtonGroup = () => {
    return (
      <>
        <Tooltip content="添加 tag">
          <Button
            icon={<IconTag />}
            theme="borderless"
            size="small"
            aria-label="添加 tag"
            onClick={() => { setVisible(true); }}
          />
        </Tooltip>

        {/* 添加 文本 */}
        <Tooltip content="添加 文本">
          <Button
            icon={<IconForm />}
            theme="borderless"
            size="small"
            aria-label="添加 文本"
            onClick={() => { setTextVisible(true); }}
          />
        </Tooltip>

        {/* 导出文件 */}
        <Tooltip content="导出文件">
          <Button
            icon={<IconForwardStroked />}
            theme="borderless"
            size="small"
            aria-label="导出文件"
            onClick={() => {
              handleExportJSON({
                cards,
                tags,
              })
            }}
          />
        </Tooltip>

        {/* 导入文件 */}
        <Tooltip content="导入文件">
          <Button
            icon={<IconDownloadStroked />}
            theme="borderless"
            size="small"
            aria-label="导入文件"
            onClick={() => { setImportJsonVisible(true); }}
          />
        </Tooltip>

        {/* 清除备份数据 */}
        <Tooltip content="清除备份数据">
          <Button
            icon={<IconDeleteStroked />}
            theme="borderless"
            size="small"
            aria-label="清除备份数据"
            onClick={clearAllBackups}
          />
        </Tooltip>
      </>
    );
  }

  return (
    <div className={styles.homePage}>
      <Toaster />
      <header className={styles.header}>
        <Tags />
        {/* 按钮组 */}
        <div className={styles.buttonGroup}>
          {isMobile
            ? (
                <Dropdown
                  trigger="click"
                  position="bottomRight"
                  content={dropdownMenu}
                >
                  <Button
                    icon={<IconMoreStroked />}
                    theme="borderless"
                    size="small"
                    aria-label="更多操作"
                  />
                </Dropdown>
              )
            : (
                renderButtonGroup()
              )}

          <Tooltip content="置顶窗口">
            <Switch
              aria-label="置顶窗口"
              onChange={(checked) => {
                console.log('🚀 liu123 ~ checked:', checked)

                window?.ipcRenderer.toggleWindowTop(checked);
              }}
            />
          </Tooltip>
        </div>

      </header>
      <main className={styles.main}>
        <CardList />
      </main>
      <TagModal
        visible={visible}
        onOk={() => { setVisible(false); }}
        onCancel={() => { setVisible(false); }}
      />
      <TextModalModal
        visible={textVisible}
        onOk={() => { setTextVisible(false); }}
        onCancel={() => { setTextVisible(false); }}
      />
      <ImportJsonModal
        visible={importJsonVisible}
        onOk={() => { setImportJsonVisible(false); }}
        onCancel={() => { setImportJsonVisible(false); }}
      />
    </div>
  );
}

export default HomePage;
