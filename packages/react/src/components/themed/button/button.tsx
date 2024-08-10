import { _styled } from '@internal/styled';
import { Button as BaseButton } from '@unstyled';

import { applyStandardBorders } from '../../../styled-utils/styled-helpers.js';

export const Button = _styled(BaseButton)`
  background-color: lightgray;
  ${applyStandardBorders}
`;
