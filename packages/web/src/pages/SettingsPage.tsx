import { Button } from '@douyinfe/semi-ui'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ImportJsonModal from '../components/Modal/ImportJsonModal/ImportJsonModal'
import useCardStore from '../store/useCardStore';
import useSettingStore, { EnumCountSort } from '../store/useSetting'
import { clearAllBackups } from '../utils/clean'
import { handleExportJSON } from '../utils/exportFile'
import styles from './SettingsPage.module.less'

/**
 * 设置页面组件
 */
const SettingsPage: React.FC = () => {
  const { cards, tags } = useCardStore();

  // 自启动状态
  const [autoLaunch, setAutoLaunch] = useState(false);
  // 加载状态
  const [loading, setLoading] = useState(true);

  // 初始化时获取自启动状态
  useEffect(() => {
    const initAutoLaunch = async () => {
      try {
        // 获取当前自启动状态
        if (window.autoLaunch) {
          const status = await window.autoLaunch.get();
          console.log('🚀 liu123 ~ status:', status)
          setAutoLaunch(status);
        }
      }
      catch (error) {
        console.error('获取自启动状态失败', error);
      }
      finally {
        setLoading(false);
      }
    };

    initAutoLaunch();
  }, []);

  /**
   * 切换自启动状态
   */
  const handleAutoLaunchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.checked;

    try {
      setLoading(true);
      // 设置自启动状态
      if (window.autoLaunch) {
        const success = await window.autoLaunch.set(newStatus);
        if (success) {
          setAutoLaunch(newStatus);
          console.log(`已${newStatus ? '启用' : '禁用'}开机自启动`);
        }
        else {
          console.error('设置自启动失败');
        }
      }
    }
    catch (error) {
      console.error('设置自启动出错', error);
    }
    finally {
      setLoading(false);
    }
  };

  const [importJsonVisible, setImportJsonVisible] = useState(false);
  const { countSort, setCountSort } = useSettingStore();
  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>设置</h1>
        <Link to="/">
          <Button type="primary" size="small">返回首页</Button>
        </Link>
      </div>

      <div className={styles.settingSection}>
        <h2>常规设置</h2>

        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <span>
              卡片根据复制排序：
            </span>
            <div className={styles.switchWrapper}>
              <input
                type="checkbox"
                checked={countSort}
                onChange={() => setCountSort(!countSort)}
                disabled={loading}
                className={styles.switchInput}
              />
              <div className={styles.switchSlider}></div>
            </div>
          </label>
        </div>
      </div>

      <div className={styles.settingSection}>
        <h2>文件操作</h2>

        <div className={styles.settingItem} style={{ display: 'flex', gap: 10 }}>
          <Button
            type="primary"
            onClick={() => {
              handleExportJSON({
                cards,
                tags,
              })
            }}
            className={styles.actionButton}
          >
            导出文件
          </Button>
          <Button
            type="primary"
            onClick={() => { setImportJsonVisible(true); }}
            className={styles.actionButton}
          >
            导入文件
          </Button>
          <Button
            type="danger"
            onClick={clearAllBackups}
            className={styles.actionButton}
          >
            清除备份数据
          </Button>
        </div>

      </div>

      <div className={styles.settingSection}>
        <h2>系统设置</h2>

        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <span>开机自动启动</span>
            <div className={styles.switchWrapper}>
              <input
                type="checkbox"
                checked={autoLaunch}
                onChange={handleAutoLaunchChange}
                disabled={loading}
                className={styles.switchInput}
              />
              <div className={styles.switchSlider}></div>
            </div>
          </label>
          <p className={styles.settingDescription}>
            启用后，系统启动时应用会自动启动并在后台运行
          </p>
        </div>
      </div>

      <ImportJsonModal
        visible={importJsonVisible}
        onOk={() => { setImportJsonVisible(false); }}
        onCancel={() => { setImportJsonVisible(false); }}
      />

    </div>
  );
};

export default SettingsPage;
