import type { StoryDefault } from '@ladle/react';

import { ProviderWrapper } from '@internal/stories';

import { ColorSwatch } from '../inner-components/index.js';

export const ColorViewer = () => (
  <>
    {[
      'primary',
      'secondary',
      'accent',
      'background',
      'text',
      'success',
      'danger',
      'warning',
      'info',
    ].map((themeKey, outerKey) => (
      <div
        key={outerKey}
        style={{ marginBottom: 50 }}
      >
        <div
          key={outerKey}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 20,
            margin: '10px 0px',
          }}
        >
          <div style={{ width: 40 }} />
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(
            (themeColorKey, idx) => (
              <ColorSwatch
                key={idx}
                themeColorKey={themeColorKey}
                themeKey={themeKey}
              />
            )
          )}
        </div>
        <div
          key={outerKey + 's'}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 20,
            margin: '10px 0px',
          }}
        >
          {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map(
            (themeColorKey, idx) => (
              <ColorSwatch
                key={idx}
                themeColorKey={themeColorKey}
                themeKey={themeKey}
              />
            )
          )}
        </div>
        <div
          key={outerKey + 'o'}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 20,
            margin: '10px 0px',
          }}
        >
          <div style={{ width: 40 }} />
          {['o10', 'o20', 'o30', 'o40', 'o50', 'o60', 'o70', 'o80', 'o90'].map(
            (themeColorKey, idx) => (
              <ColorSwatch
                key={idx}
                themeColorKey={themeColorKey}
                themeKey={themeKey}
              />
            )
          )}
        </div>
      </div>
    ))}
  </>
);

export default {
  decorators: [ProviderWrapper],
  title: 'Storyboarding',
} satisfies StoryDefault;
