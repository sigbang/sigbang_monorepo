type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
  className?: string;
};

export default function HomeIcon({
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
        <path d="M12 3L3 10.5V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9.5L12 3z"
              fill={color} />
        <rect x="10" y="14" width="4" height="7" rx="1" fill="white" />
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
      <path d="M3 10.5L12 3l9 7.5" stroke={color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9.5"
            stroke={color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21v-6h4v6"
            stroke={color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


