import type { AppThemeInput } from '../theme/theme-input.types.js';
import type { MakeThemeOutput } from '../theme/theme-output.types.js';

type InnerStyledFunctionProps<T extends AppThemeInput> = {
  theme: MakeThemeOutput<T>;
};

/**
 *
 * @param root0
 * @param root0.theme
 */
export function applyStandardBorders<T extends AppThemeInput>({
  theme,
}: InnerStyledFunctionProps<T>): string {
  return `
    border: 1px solid ${theme.color.primary.main};
    border-radius: 5px;
  `;
}
