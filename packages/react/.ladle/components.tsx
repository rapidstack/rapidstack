import type { GlobalProvider, ThemeState } from '@ladle/react';
import type { ComponentType } from 'react';

import { useEffect, useState } from 'react';
import { StyleSheetManager } from 'styled-components';

const getDocument = (story: string) => {
  const iframe = document.querySelector(
    `[title='Story ${story}']`
  ) as HTMLIFrameElement | null;
  return iframe && iframe.contentDocument ? iframe.contentDocument : document;
};

const IFrameStyleProvider: ComponentType<{
  children: React.ReactNode;
  globalState: {
    story: string;
    theme: string;
    width: number;
  };
}> = ({ children, globalState }) => {
  const [target, setTarget] = useState(getDocument(globalState.story).head);
  useEffect(() => {
    setTarget(getDocument(globalState.story).head);
  }, [globalState.width, globalState.story]);

  return <StyleSheetManager target={target}>{children}</StyleSheetManager>;
};

const FullscreenHelper = ({
  show,
  theme,
}: {
  show: boolean;
  theme: ThemeState;
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: 20,
        justifyContent: 'flex-end',
        width: '100%',
      }}
    >
      <p
        onClick={() => {
          if (window.location.href.includes('?mode=preview'))
            window.location.href = window.location.href.replace(
              '?mode=preview',
              '?'
            );
          else if (window.location.href.includes('&mode=preview'))
            window.location.href = window.location.href.replace(
              '&mode=preview',
              ''
            );
        }}
        style={{
          color:
            theme === 'auto' ? 'black' : theme === 'light' ? 'black' : 'white',
          cursor: 'pointer',
          margin: 0,
          marginRight: 10,
          padding: 0,
          textDecoration: 'underline',
        }}
      >
        Exit Fullscreen
      </p>
    </div>
  );
};

export const Provider: GlobalProvider = ({ children, globalState }) => {
  return (
    <>
      <FullscreenHelper
        show={globalState.mode === 'preview'}
        theme={globalState.theme}
      />
      <IFrameStyleProvider globalState={globalState}>
        {children}
      </IFrameStyleProvider>
    </>
  );
};
