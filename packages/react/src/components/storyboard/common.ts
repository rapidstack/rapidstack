import type { AppThemeInput } from '../../theme/theme-input.types.js';
import type { MakeThemeOutput } from '../../theme/theme-output.types.js';

type InnerStyledFunctionProps<T extends AppThemeInput> = {
  theme: MakeThemeOutput<T>;
};

/**
 *
 * @param root0
 * @param root0.theme
 */
export function applyStoryboardCommonRadius<T extends AppThemeInput>({
  theme,
}: InnerStyledFunctionProps<T>): string {
  return `
    border-radius: 8px;
  `;
}

/**
 *
 * @param root0
 * @param root0.theme
 */
export function applyStoryboardCommonFont<T extends AppThemeInput>({
  theme,
}: InnerStyledFunctionProps<T>): string {
  return `
    font-family: Arial, sans-serif;
  `;
}
