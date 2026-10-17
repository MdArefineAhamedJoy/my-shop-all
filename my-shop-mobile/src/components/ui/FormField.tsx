import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Input, type InputProps } from "./Input";

interface FormFieldProps<T extends FieldValues> extends Omit<
  InputProps,
  "value" | "onChangeText" | "onBlur" | "error"
> {
  control: Control<T>;
  name: FieldPath<T>;
}
export function FormField<T extends FieldValues>({
  control,
  name,
  ...props
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          {...props}
          value={field.value}
          inputRef={field.ref}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
