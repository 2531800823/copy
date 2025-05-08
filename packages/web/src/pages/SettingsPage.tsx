import { Button } from '@douyinfe/semi-ui'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './SettingsPage.module.less';

/**
 * 设置页面组件
 */
const SettingsPage: React.FC = () => {
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
    </div>
  );
}

export default SettingsPage;
