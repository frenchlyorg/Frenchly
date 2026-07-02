"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

interface PendingButtonProps {
  children: React.ReactNode;
  className?: string;
}

export default function PendingButton({ children, className }: PendingButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
