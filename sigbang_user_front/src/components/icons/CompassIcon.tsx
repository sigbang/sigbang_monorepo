type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
  className?: string;
};

export default function CompassIcon({
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
        <path d="M2 12L22 3L15 12L22 21L2 12Z" fill={color} transform="rotate(135 12 12)" />
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
      aria-hidden="true"
    >
      <path
        d="M2 12L22 3L15 12L22 21L2 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(135 12 12)"
      />
    </svg>
  );
}


