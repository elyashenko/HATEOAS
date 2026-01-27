import React from 'react';
import type { HateoasLink } from '../../api/types';

interface HateoasButtonProps {
  link: HateoasLink | null;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * Кнопка, которая активна только если есть HATEOAS ссылка
 */
export function HateoasButton({
  link,
  onClick,
  children,
  disabled = false,
  variant = 'primary',
}: HateoasButtonProps) {
  const isDisabled = !link || disabled;

  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const disabledStyles = 'opacity-50 cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${isDisabled ? disabledStyles : ''}`}
    >
      {children}
    </button>
  );
}
