import { forwardRef } from 'react';

export const Button = forwardRef<
  HTMLButtonElement,
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>((props, ref) => {
  return (
    <button
      ref={ref}
      {...props}
    />
  );
});
