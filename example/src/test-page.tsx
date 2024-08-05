import { appStyled } from './theme'

export const Page = () => {
  return (
    <div>
      <h1>Page</h1>
      <Button>Click me</Button>
      <Button2>Click me</Button2>
    </div>
  );
};

const BaseButton = appStyled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.3s;
  
`;
const Button = appStyled(BaseButton)`
  background-color: ${(props) => props.theme.color.primary.main};
`;
const Button2 = appStyled(BaseButton)`
  background-color: ${(props) => props.theme.color.secondary.dark};
`;


/* 

&:hover {
  ${(props) => props.theme.utils.computeHoverColor(props.theme.colors.primary, props.theme)}
}
&:active {
  ${(props) => props.theme.utils.computeActiveColor(props.theme.colors.primary, props.theme)};
}
color: ${(props) => props.theme.utils.computeContrastText(props.theme.colors.primary, props.theme)};
color: ${(props) => props.theme.utils.computeContrastText(props.theme.colors.secondary, props.theme)};
*/