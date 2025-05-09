import React, { FC, useMemo, useState } from 'react';
import TextModalModal from './TextModal/TextModal';
import EditorTextModal from './EditorTextModal/EditorTextModal';
import EditorTagModal from './EditorTagModal/EditorTagModal';
import JsonViewerModal from './JsonViewerModal/JsonViewerModal';
import useModalStore, { ModalState } from '../../store/useModal';

interface ModalManagerProps {}

const ModalManager: FC<ModalManagerProps> = props => {
  const { } = props;

  const modals = useModalStore()
  console.log("🚀 liu123 ~ modals:", modals)

  const [modalMap] = useState(() => {
     const map =new Map()

    map.set('textModal', TextModalModal)
    map.set('editorTextModal', EditorTextModal)
    map.set('editorTagModal', EditorTagModal)
    map.set('jsonViewerModal', JsonViewerModal)

     return map
  })

  const visibleModals = useMemo(() => {
    const modalList: React.ReactElement[] = [];
    modalMap.forEach((Element, key) => {
      const value = modals[key as keyof ModalState]
      if (value.visible) {
        modalList.push(
          <Element key={key} {...value} ></Element>
        );
      }
    });
    return modalList;
  }, [modalMap, modals]);

  return <>{visibleModals.filter(Boolean)}</>;
};

export default ModalManager;