"use client";

import { cn } from "@/lib/utils";
import { OTPInput, SlotProps } from "input-otp";

  export const OtpInput = ({
  id,
  name,
  length,
  code,
  setCode,
  disabled,
}: {
  id: string;
  name: string;
  code: string;
  setCode: (code: string) => void;
  length: number;
  disabled: boolean;
}) => {
  return (
    <>
      <OTPInput
        id={id}
        name={name}
        value={code}
        disabled={disabled}
        onChange={setCode}
        containerClassName="flex justify-center items-center gap-3 has-disabled:opacity-50"
        maxLength={length}
        render={({ slots }) => (
          <div className="flex gap-2">
            {slots.map((slot, idx) => (
              <Slot key={idx} {...slot} />
            ))}
          </div>
        )}
      />
    </>
  );
};

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "border-input bg-background text-foreground flex size-11 items-center justify-center rounded-md border font-medium shadow-xs transition-[color,box-shadow]",
        { "border-ring ring-ring/50 z-10 ring-[3px]": props.isActive }
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}

