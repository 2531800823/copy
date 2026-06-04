import React, {useEffect, useRef, useState} from 'react';
import toast from 'react-hot-toast';
import styles from './ZipDropZone.module.less';

function hasDraggedFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

function findZipFile(fileList: FileList) {
  return Array.from(fileList).find((file) =>
    file.name.toLowerCase().endsWith('.zip')
  );
}

const ZipDropZone: React.FC = () => {
  const dragDepthRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const resetDragState = () => {
      dragDepthRef.current = 0;
      setVisible(false);
    };

    const handleDragEnter = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      event.preventDefault();
      dragDepthRef.current += 1;
      setVisible(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
      setVisible(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0 && !processing) {
        setVisible(false);
      }
    };

    const handleDrop = async (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      event.preventDefault();
      resetDragState();

      if (processing) return;

      const zipFile = event.dataTransfer?.files
        ? findZipFile(event.dataTransfer.files)
        : undefined;

      if (!zipFile) {
        toast.error('请拖入 ZIP 文件');
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
          loading: '正在解压 ZIP...',
          success: ({outputDir}) => `已解压并打开：${outputDir}`,
          error: (error) =>
            error instanceof Error ? error.message : '解压 ZIP 失败',
        });
      } finally {
        setProcessing(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [processing]);

  if (!visible && !processing) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.mark}>{processing ? '...' : 'ZIP'}</div>
        <h2 className={styles.title}>
          {processing ? '正在解压并打开' : '释放以解压并打开'}
        </h2>
        <p className={styles.desc}>
          文件会解压到设置中的 ZIP 工作目录，然后用 VSCode 打开。
        </p>
      </div>
    </div>
  );
};

export default ZipDropZone;
