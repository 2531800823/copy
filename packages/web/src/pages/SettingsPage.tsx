import {Button} from '@douyinfe/semi-ui';
import {map} from 'lodash-es';
import React, {useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import {Link} from 'react-router-dom';
import {hotKeys} from '../hooks/useHotKeys';
import useCardStore from '../store/useCardStore';
import useSettingStore, {EnumCountSort} from '../store/useSetting';
import {clearAllBackups} from '../utils/clean';
import {handleExportJSON} from '../utils/exportFile';
import styles from './SettingsPage.module.less';
import useModalStore from '@/store/useModal';
/**
 * 设置页面组件
 */
const SettingsPage: React.FC = () => {
  const {cards, tags} = useCardStore();

  const {setImportJsonModal} = useModalStore();

  // 自启动状态
  const [autoLaunch, setAutoLaunch] = useState(false);
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [workspaceDir, setWorkspaceDir] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // 初始化时获取自启动状态
  useEffect(() => {
    const initAutoLaunch = async () => {
      try {
        // 获取当前自启动状态
        if (window.autoLaunch) {
          const status = await window.autoLaunch.get();
          setAutoLaunch(status);
        }
      } catch (error) {
        console.error('获取自启动状态失败', error);
      } finally {
        setLoading(false);
      }
    };

    initAutoLaunch();
  }, []);

  const loadWorkspaceDir = async () => {
    if (!window.archive) return;

    try {
      setWorkspaceLoading(true);
      const dir = await window.archive.getWorkspaceDir();
      setWorkspaceDir(dir);
    } catch (error) {
      console.error('获取 ZIP 工作目录失败', error);
      toast.error('获取 ZIP 工作目录失败');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceDir();
  }, []);

  const handleSelectWorkspaceDir = async () => {
    if (!window.archive) {
      toast.error('当前环境不支持配置 ZIP 工作目录');
      return;
    }

    try {
      setWorkspaceLoading(true);
      const selectedDir = await window.archive.selectWorkspaceDir();
      if (selectedDir) {
        setWorkspaceDir(selectedDir);
        toast.success('ZIP 工作目录已更新');
      }
    } catch (error) {
      console.error('选择 ZIP 工作目录失败', error);
      toast.error('选择 ZIP 工作目录失败');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  /**
   * 切换自启动状态
   */
  const handleAutoLaunchChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newStatus = e.target.checked;

    try {
      setLoading(true);
      // 设置自启动状态
      if (window.autoLaunch) {
        const success = await window.autoLaunch.set(newStatus);
        if (success) {
          setAutoLaunch(newStatus);
          console.log(`已${newStatus ? '启用' : '禁用'}开机自启动`);
        } else {
          console.error('设置自启动失败');
        }
      }
    } catch (error) {
      console.error('设置自启动出错', error);
    } finally {
      setLoading(false);
    }
  };

  const [importJsonVisible, setImportJsonVisible] = useState(false);
  const {countSort, setCountSort} = useSettingStore();
  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>设置</h1>
        <Link to="/">
          <Button type="primary" size="small">
            返回首页
          </Button>
        </Link>
      </div>

      <div className={styles.settingSection}>
        <h2>查看</h2>

        <div className={styles.settingItem}>
          {map(hotKeys, (value, key) => (
            <label className={styles.settingLabel} key={key}>
              <span>{key}</span>
              <span>{value}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.settingSection}>
        <h2>文件操作</h2>

        <div className={styles.settingItem} style={{display: 'flex', gap: 10}}>
          <Button
            type="primary"
            onClick={() => {
              handleExportJSON({
                cards,
                tags,
              });
            }}
            className={styles.actionButton}>
            导出文件
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setImportJsonModal({
                visible: true,
              });
            }}
            className={styles.actionButton}>
            导入文件
          </Button>
          <Button
            type="danger"
            onClick={clearAllBackups}
            className={styles.actionButton}>
            清除备份数据
          </Button>
        </div>
      </div>

      <div className={styles.settingSection}>
        <h2>ZIP 工作目录</h2>

        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <span>固定解压目录</span>
            <Button
              type="primary"
              size="small"
              loading={workspaceLoading}
              onClick={handleSelectWorkspaceDir}>
              更改目录
            </Button>
          </label>
          <div className={styles.pathBox}>
            {workspaceDir || '正在读取工作目录...'}
          </div>
          <p className={styles.settingDescription}>
            拖入 ZIP 后会解压到此目录，并自动用 VSCode 打开解压结果。
          </p>
        </div>
      </div>

      <div className={styles.settingSection}>
        <h2>常规设置</h2>

        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <span>卡片根据复制排序：</span>
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
    </div>
  );
};

export default SettingsPage;
