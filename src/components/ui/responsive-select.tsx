"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ResponsiveSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  size?: "sm" | "default";
};

function useIsTouchInput() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => {
      const touchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints || 0;
      setIsTouch(query.matches || touchPoints > 0);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isTouch;
}

export function ResponsiveSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
  id,
  name,
  size = "default",
}: ResponsiveSelectProps) {
  const isTouch = useIsTouchInput();
  const sizeClassName = size === "sm" ? "h-8" : "h-9";

  if (isTouch) {
    const hasPlaceholder = Boolean(placeholder) && !options.some((option) => option.value === "");
    return (
      <select
        id={id}
        name={name}
        value={value ?? ""}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled}
        className={cn(
          "border-input dark:bg-input/30 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 w-fit",
          sizeClassName,
          className,
        )}
      >
        {hasPlaceholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
