"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SubmitButton({ children, variant = "default", size = "default", className, disabled }: { children: React.ReactNode, variant?: any, size?: any, className?: string, disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending || disabled} variant={variant} size={size} className={className}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </Button>
    );
}
