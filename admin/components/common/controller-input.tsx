"use client";

import React, { useState } from "react";
import { Controller, Control } from "react-hook-form";
// ui
import { Input } from "@plane/ui";
// icons
import { Eye, EyeOff } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  control: Control<any>;
  type: "text" | "password";
  name: string;
  label: string;
  description?: string | JSX.Element;
  placeholder: string;
  error: boolean;
  required: boolean;
};

export type TControllerInputFormField = {
  key: string;
  type: "text" | "password";
  label: string;
  description?: string | JSX.Element;
  placeholder: string;
  error: boolean;
  required: boolean;
};

export const ControllerInput: React.FC<Props> = (props) => {
  const { name, control, type, label, description, placeholder, error, required } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm text-custom-text-300">{label}</h4>
      <div className="relative">
        <Controller
          control={control}
          name={name}
          rules={{ required: required ? `${label} is required.` : false }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id={name}
              name={name}
              type={type === "password" && showPassword ? "text" : type}
              value={value}
              onChange={onChange}
              ref={ref}
              hasError={error}
              placeholder={placeholder}
              className={cn("w-full rounded-md font-medium", {
                "pr-10": type === "password",
              })}
            />
          )}
        />
        {type === "password" &&
          (showPassword ? (
            <button
              className="absolute right-3 top-2.5 flex items-center justify-center text-custom-text-400"
              onClick={() => setShowPassword(false)}
            >
              <EyeOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              className="absolute right-3 top-2.5 flex items-center justify-center text-custom-text-400"
              onClick={() => setShowPassword(true)}
            >
              <Eye className="h-4 w-4" />
            </button>
          ))}
      </div>
      {description && <p className="text-xs text-custom-text-300">{description}</p>}
    </div>
  );
};
