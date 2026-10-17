import { useState, type Ref } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { AppColors, fonts } from "@/constants";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface InputProps extends TextInputProps {
  inputRef?: Ref<TextInput>;
  label: string;
  error?: string;
  icon?: IconName;
  isPassword?: boolean;
  hint?: string;
}
export function Input({
  inputRef,
  label,
  error,
  icon,
  isPassword,
  hint,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.invalid,
        ]}
      >
        {icon && <Icon name={icon} size={19} color={AppColors.secondaryText} />}
        <TextInput
          ref={inputRef}
          {...props}
          accessibilityLabel={label}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword ? !visible : props.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              visible
                ? `Hide ${label.toLowerCase()}`
                : `Show ${label.toLowerCase()}`
            }
            onPress={() => setVisible((v) => !v)}
            style={styles.eye}
          >
            <Icon
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={AppColors.secondaryText}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      {!!hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8, marginBottom: 18 },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 54,
    paddingLeft: 15,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    backgroundColor: AppColors.white,
  },
  focused: { borderColor: AppColors.primary },
  invalid: { borderColor: AppColors.error },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingVertical: 13,
    color: AppColors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  eye: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: AppColors.error, fontSize: 12, lineHeight: 18 },
  hint: { color: AppColors.secondaryText, fontSize: 12, lineHeight: 18 },
});
