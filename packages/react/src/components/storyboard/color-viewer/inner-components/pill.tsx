import { _styled } from '@internal/styled';

type Props = {
  icon?: React.ReactElement;
  sentiment: 'success' | 'warning' | 'danger';
  text?: string;
};
export const Pill = (props: Props) => {
  return (
    <Wrapper $sentiment={props.sentiment}>
      <p>AAA | 7.3:1</p>
    </Wrapper>
  );
};

const Wrapper = _styled.div<{ $sentiment: Props['sentiment'] }>`
  height: 20px;
  width: fit-content;
  padding: 0 5px;
  margin: 0;
  background-color: ${({ $sentiment, theme }) => theme.color[$sentiment].lighter};
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  p {
    font-size: 0.7rem;
    padding: 0;
    margin: 0;
  }
`;
