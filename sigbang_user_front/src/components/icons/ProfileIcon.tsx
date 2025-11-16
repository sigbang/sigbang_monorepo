type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
  className?: string;
};

export default function ProfileIcon({
  size = 24,
  color = "currentColor",
  filled = false,
  className,
}: Props) {
  if (filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path d="M12 2a6 6 0 1 1 0 12A6 6 0 0 1 12 2z" fill={color} />
        <path d="M4 22a8 8 0 0 1 16 0" fill={color} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <path d="M4 22a8 8 0 0 1 16 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


