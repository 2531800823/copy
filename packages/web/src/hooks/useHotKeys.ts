import {useKeyPress} from 'ahooks';
import useModalStore from '../store/useModal';

export const hotKeys = {
  'ctrl.r': '打开json编辑器',
  'ctrl.d': '管理tag',
  'ctrl.e': '添加文本',
};

function useHotKeys() {
  const {
    textModal,
    jsonViewerModal,
    editorTagModal,
    setEditorTagModal,
    setJsonViewerModal,
    setTextModal,
  } = useModalStore();
  useKeyPress('ctrl.r', () => {
    if (jsonViewerModal.visible) {
      setJsonViewerModal({visible: false});
    } else {
      setJsonViewerModal({visible: true});
    }
  });
  useKeyPress('ctrl.d', () => {
    if (editorTagModal.visible) {
      setEditorTagModal({visible: false});
    } else {
      setEditorTagModal({visible: true});
    }
  });
  useKeyPress('ctrl.e', () => {
    if (textModal.visible) {
      setTextModal({visible: false});
    } else {
      setTextModal({visible: true});
    }
  });
}
export default useHotKeys;
