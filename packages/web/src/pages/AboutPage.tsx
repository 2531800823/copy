import {Button} from '@douyinfe/semi-ui';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import styles from './AboutPage.module.less';

/**
 * 关于页面组件
 */
const AboutPage: React.FC = () => {
  const [stateVersion, setVersion] = useState<string>();

  useEffect(() => {
    window?.ipcRenderer?.getVersion().then((res) => {
      setVersion(res);
    });
  }, []);
  return (
    <div className={styles.aboutPage}>
      <h1>关于我们</h1>
      <p>
        这是一个高效的复制粘贴管理工具，帮助你更好地管理日常使用的文本和代码片段。
      </p>

      <div className={styles.features}>
        版本号：
        {stateVersion}
      </div>

      <div className={styles.actions}>
        <Link to="/">
          <Button type="primary">返回首页</Button>
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
