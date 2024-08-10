import type { Story, StoryDefault } from '@ladle/react';

import { StoryThemeProvider } from '../components/storyboard/providers/story-provider-wrapper.js';
import { DefaultAppLightTheme } from '../theme/default-theme.js';

export const WrapProviders = (...stories: Story<NonNullable<unknown>>[]) =>
  stories.forEach((story) =>
    Object.assign(story, {
      decorators: [ProviderWrapper] satisfies StoryDefault['decorators'],
    })
  );

export const ProviderWrapper = (Story: React.ComponentType, context: any) => {
  return (
    <StoryThemeProvider customTheme={DefaultAppLightTheme}>
      <Story />
    </StoryThemeProvider>
  );
};
