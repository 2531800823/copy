import classNames from 'classnames';
import React, {useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import styles from './DropWindowPage.module.less';

function findZipFile(fileList: FileList) {
  return Array.from(fileList).find((file) =>
    file.name.toLowerCase().endsWith('.zip')
  );
}

const DropWindowPage: React.FC = () => {
  const [active, setActive] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const previousBodyBackground = document.body.style.background;
    const previousDocumentBackground = document.documentElement.style.background;

    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';

    return () => {
      document.body.style.background = previousBodyBackground;
      document.documentElement.style.background = previousDocumentBackground;
    };
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setActive(true);
  };

  const handleDragLeave = () => {
    if (!processing) {
      setActive(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setActive(false);

    if (processing) return;

    const zipFile = findZipFile(event.dataTransfer.files);
    if (!zipFile) {
      toast.error('请拖入 ZIP 文件');
      window.archive?.hideDropWindow();
      return;
    }

    if (!window.archive) {
      toast.error('当前环境不支持解压 ZIP');
      return;
    }

    try {
      const zipPath = window.archive.getPathForFile(zipFile);
      if (!zipPath) {
        toast.error('无法读取 ZIP 文件路径');
        return;
      }

      setProcessing(true);
      await toast.promise(window.archive.extractZipAndOpen(zipPath), {
        loading: '正在解压...',
        success: '已用 VSCode 打开',
        error: (error) =>
          error instanceof Error ? error.message : '解压 ZIP 失败',
      });
    } finally {
      setProcessing(false);
      setTimeout(() => {
        window.archive?.hideDropWindow();
      }, 800);
    }
  };

  return (
    <div
      className={styles.dropWindow}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
      <div className={styles.dragHandle}>ZIP Drop</div>
      <div className={styles.content}>
        <div className={classNames(styles.badge, active && styles.active)}>
          {processing ? '...' : 'ZIP'}
        </div>
        <h1 className={styles.title}>
          {active ? '释放 ZIP' : processing ? '处理中' : '拖到这里'}
        </h1>
        <p className={styles.desc}>拖拽开始时自动出现，释放后解压并打开。</p>
      </div>
    </div>
  );
};

export default DropWindowPage;
