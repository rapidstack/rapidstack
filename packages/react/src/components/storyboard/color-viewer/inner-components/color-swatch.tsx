import { _styled, _useTheme } from '@internal/styled';
import { useState } from 'react';

import {
  applyStoryboardCommonFont,
  applyStoryboardCommonRadius,
} from '../../common.js';
import { Pill } from './pill.js';

type Props = {
  themeColorKey: string | number;
  themeKey: string;
};

export const ColorSwatch = (props: Props) => {
  const theme = _useTheme();
  const [hovered, setHovered] = useState(false);

  const hexColor =
    // @ts-expect-error - not typed yet
    theme._computed.color[props.themeKey][props.themeColorKey].toUpperCase();
  const hexContrast = getContrastTextHex(
    theme.color[props.themeKey][props.themeColorKey],
    theme
  ).toUpperCase();

  return (
    <Wrapper>
      <ColorStack
        onMouseLeave={() => setHovered(!1)}
        onMouseOver={() => setHovered(!!1)}
      >
        <CheckeredBackground />
        <Color
          // @ts-expect-error - not typed yet
          $themeColorKey={props.themeColorKey}
          $themeKey={props.themeKey}
        >
          {hovered ? (
            <>
              <ThemeColorText // @ts-expect-error - not typed yet
                $themeColorKey={props.themeColorKey}
                $themeKey={props.themeKey}
              >
                {hexColor}
              </ThemeColorText>
              <ContrastColorText
                // @ts-expect-error - not typed yet
                $themeColorKey={props.themeColorKey}
                $themeKey={props.themeKey}
              >
                {hexContrast}
              </ContrastColorText>
            </>
          ) : (
            <>
              <ContrastColorText
                // @ts-expect-error - not typed yet
                $themeColorKey={props.themeColorKey}
                $themeKey={props.themeKey}
              >
                {hexColor}
              </ContrastColorText>
            </>
          )}
        </Color>
      </ColorStack>
      <DescriptionContainer>
        <Description>{props.themeColorKey}</Description>
        <Pill sentiment="success" />
      </DescriptionContainer>
    </Wrapper>
  );
};

const Wrapper = _styled.div`
  width: 100px;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: 0 0 10px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  ${applyStoryboardCommonFont}
  ${applyStoryboardCommonRadius}
`;

const ColorStack = _styled.div`
  height: 50%;
  position: relative;
  font-family: courier;
`;

const CheckeredBackground = _styled.div`
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  position: absolute;

  background-image: 
    linear-gradient(
      45deg,
      ${({ theme }) => theme.color.gray.light} 25%, 
      transparent 25%
    ), 
    linear-gradient(
      -45deg,
      ${({ theme }) => theme.color.gray.light} 25%, 
      transparent 25%
    ),
    linear-gradient(
      45deg, 
      transparent 75%, 
      ${({ theme }) => theme.color.gray.light} 75%
    ), 
    linear-gradient(
      -45deg, 
      transparent 75%, 
      ${({ theme }) => theme.color.gray.light} 75%
    );
  background-size: 20px 20px;
`;

const Color = _styled.div.attrs<{
  $themeColorKey: string;
  $themeKey: string;
}>((props: any) => ({
  style: {
    backgroundColor: props.theme.color[props.$themeKey][props.$themeColorKey],
  },
}))`
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;

  p {
    margin: 0;
    padding: 0;
  }
`;

const ThemeColorText = _styled.p.attrs<{
  $themeColorKey: string;
  $themeKey: string;
}>((props: any) => ({
  style: {
    color: props.theme.color[props.$themeKey][props.$themeColorKey],
  },
}))`
  text-shadow: ${({ $themeColorKey, $themeKey, theme }) =>
    theme.utils.computeContrastText(
      // @ts-expect-error - not typed yet
      theme.color[$themeKey][$themeColorKey]
    )} 0 0 5px;
`;

const ContrastColorText = _styled.p.attrs<{
  $themeColorKey: string;
  $themeKey: string;
}>(({ $themeColorKey, $themeKey, theme }: any) => ({
  style: {
    color: theme.utils.computeContrastText(
      theme.color[$themeKey][$themeColorKey]
    ),
  },
}))`
  margin: 0;
  padding: 0;
`;

const DescriptionContainer = _styled.div`
  height: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Description = _styled.p`
  margin: 0;
  padding: 5px;
  color: ${({ theme }) => theme.color.text.main};
  font-size: 0.8rem;
`;

/**
 *
 * @param cssVariable
 * @param theme
 */
function getContrastTextHex(cssVariable: string, theme: any) {
  const contrast = theme.utils.computeContrastText(cssVariable);
  const [, , , colorKey, dirtyShade] = contrast.split('-');
  const shade = dirtyShade.replace(')', '');

  return theme._computed.color[colorKey][shade];
}
