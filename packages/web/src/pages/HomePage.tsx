import { IconEdit, IconMoreStroked, IconSetting } from '@douyinfe/semi-icons'
import { IconForm, IconTag } from '@douyinfe/semi-icons-lab'
import { Button, Dropdown, Tooltip } from '@douyinfe/semi-ui';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import CardList from '../components/CardList/CardList'
import EditorTagModal from '../components/Modal/EditorTagModal/EditorTagModal'
import TagModal from '../components/Modal/TagModal/TagModal';
import TextModalModal from '../components/Modal/TextModal/TextModal';
import { Tags } from '../components/Tags' 
import styles from './HomePage.module.less'

/**
 * 主页面组件
 */
const HomePage: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editTagVisible, setEditTagVisible] = useState(false)

  // 监听窗口大小变化
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 500);
    };

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
        icon={<IconEdit />}
        onClick={() => { setEditTagVisible(true); }}
      >
        管理 tag
      </Dropdown.Item>
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
      <Dropdown.Divider />
      <Dropdown.Item
        onClick={() => { window.location.href = '/#/settings'; }}
      >
        设置
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  /**
   * 渲染常规按钮组
   */
  const renderButtonGroup = () => {
    return (
      <>
        {/* 编辑 tag */}
        <Tooltip content="管理 tag">
          <Button
            icon={<IconEdit />}
            theme="borderless"
            size="small"
            aria-label="管理 tag"
            onClick={() => { setEditTagVisible(true); }}
          />
        </Tooltip>
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

        {/* 设置页面 */}
        <Tooltip content="设置">
          <Link to="/settings">
            <Button
              theme="borderless"
              size="small"
              aria-label="设置"
              icon={<IconSetting />}
            >
            </Button>
          </Link>
        </Tooltip>
      </>
    );
  };
  const [stateTop, setTop] = useState(false)

  return (
    <div className={styles.homePage}>
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
            <div
              onClick={() => {
                setTop((prev) => {
                  window?.ipcRenderer.toggleWindowTop(!prev);
                  return !prev;
                })
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                style={{ width: 14, height: 14, transform: stateTop ? 'rotate(45deg)' : 'rotate(0deg)', color: stateTop ? 'red' : 'initial' }}
              >
                <path d="M26.08 18.8c-1.44-3.44-4.72-5.12-5.76-5.6-.08 0-.08-.08-.08-.16-.08-.88-.56-7.6-.64-8.56 0-.08 0-.16.08-.16a4.8 4.8 0 001.76-3.04c0-.08-.08-.24-.08-.32-.08-.08-.24-.08-.4-.16l-9.68.08c-.08 0-.24.08-.4.16-.08.08-.08.24-.08.32s.16 1.76 1.76 3.04c0 .08.08.16.08.16l-.72 8.56c0 .08-.08.16-.16.16a11.67 11.67 0 00-5.92 5.76s.08.16.08.32c.08.08.24.24.4.16l9.04-.08.24.24-.08 8.4c0 .24.24.4.4.4.08 0 .24-.08.32-.08.08-.08.08-.24.08-.32l.08-8.4.24-.24 9.04-.08c.08 0 .24-.08.32-.08l.08-.08c.08-.08.08-.24 0-.4zm-9.44-1.68H9.92c-.16 0-.32-.24-.16-.4 2.32-2.48 4-2.48 3.92-2.72.16-.08.32-.48.32-.64l.72-7.44c0-.08.08-.48.08-.72 0-.16.08-.32.08-.48-.48-.4-.8-.88-.88-1.28-.08-.16.08-.32.24-.32H18c.16 0 .24.16.16.32-.24.48-.48.72-.72 1.04-.08.16-.16.32-.16.48l.08.8.72 7.6c0 .48.56.64.72.72 0 0 1.36.4 3.6 2.48.16.16.08.4-.16.4l-5.6.16z" fill="currentColor"></path>
                <path d="M16 31.2c-.64 0-1.2-.56-1.2-1.2V19.52c0-.64.56-1.2 1.2-1.2.64 0 1.2.56 1.2 1.2V30c0 .64-.56 1.2-1.2 1.2z" fill="currentColor"></path>
              </svg>
            </div>
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

      <EditorTagModal
        visible={!!editTagVisible}
        onOk={() => {
          setEditTagVisible(false)
        }}
        onCancel={() => {
          setEditTagVisible(false)
        }}
      />
    </div>
  );
};

export default HomePage;
