type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
  className?: string;
};

export default function SearchIcon({
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
        <path
          d="M10.5 2a8.5 8.5 0 1 0 5.55 14.95l4.0 4.0a1.5 1.5 0 0 0 2.12-2.12l-4.0-4.0A8.5 8.5 0 0 0 10.5 2z"
          fill={color}
        />
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
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


