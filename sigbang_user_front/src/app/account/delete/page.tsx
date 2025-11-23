export const dynamic = 'force-dynamic';

import DeleteClient from "./DeleteClient";

export default function Page() {
  // Server wrapper to disable static generation for this route
  return <DeleteClient />;
}
