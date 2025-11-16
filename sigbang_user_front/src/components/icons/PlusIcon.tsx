type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
  className?: string;
};

export default function PlusIcon({
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
        <circle cx="12" cy="12" r="10" fill={color} />
        <path d="M12 9v6M9 12h6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 9v6M9 12h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


