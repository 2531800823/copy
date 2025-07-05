import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';

/**
 * 模态框可见性状态
 */
type Visible = {
  visible: boolean;
};

/**
 * 模态框状态类型
 */
export interface ModalState {
  editorTextModal: Visible & {id?: string};
  jsonViewerModal: Visible & {data?: string};
  editorTagModal: Visible;
  textModal: Visible;
  importJsonModal: Visible;
}

/**
 * 模态框操作类型
 */
interface ModalAction {
  setEditorTextModal: (data: Visible & {id?: string}) => void;
  setEditorTagModal: (data: Visible) => void;
  setJsonViewerModal: (data: Visible) => void;
  setTextModal: (data: Visible) => void;
  setImportJsonModal: (data: Visible) => void;
}

type State = ModalState & ModalAction;

const v = {
  visible: false,
};

const initialState: ModalState = {
  editorTextModal: {...v},
  editorTagModal: {...v},
  jsonViewerModal: {...v},
  textModal: {...v},
  importJsonModal: {...v},
};

/**
 * 模态框状态管理Store
 */
const useModalStore = create<State>()(
  immer((set) => ({
    ...initialState,
    setEditorTextModal: (data) => {
      set((state) => {
        state.editorTextModal = data;
      });
    },
    setEditorTagModal: (data) => {
      set((state) => {
        state.editorTagModal = data;
      });
    },
    setJsonViewerModal: (data) => {
      set((state) => {
        state.jsonViewerModal = data;
      });
    },
    setTextModal: (data) => {
      set((state) => {
        state.textModal = data;
      });
    },
    setImportJsonModal: (data) => {
      set((state) => {
        state.importJsonModal = data;
      });
    },
  }))
);

export default useModalStore;
