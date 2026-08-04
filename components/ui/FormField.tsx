import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputAutoComplete;
  keyboardType?: 'default' | 'email-address';
  textContentType?: TextInputContentType;
}

type TextInputAutoComplete =
  | 'email'
  | 'password'
  | 'password-new'
  | 'name'
  | 'username'
  | 'off';

type TextInputContentType =
  | 'emailAddress'
  | 'password'
  | 'newPassword'
  | 'name'
  | 'username'
  | 'none';

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  autoComplete,
  keyboardType = 'default',
  textContentType,
}: FormFieldProps<T>) {
  const fieldId = `${String(name)}-field`;
  const labelId = `${fieldId}-label`;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPasswordField = Boolean(secureTextEntry);
  const hidePassword = isPasswordField && !passwordVisible;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="gap-2">
          <AppText
            className="text-sm"
            nativeID={labelId}
            variant="body"
          >
            {label}
          </AppText>
          <View className="relative">
            <Input
              accessibilityLabel={label}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              autoCorrect={false}
              className={isPasswordField ? 'pr-12' : undefined}
              hasError={Boolean(error)}
              keyboardType={keyboardType}
              nativeID={fieldId}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              secureTextEntry={hidePassword}
              textContentType={textContentType}
              value={value ?? ''}
            />
            {isPasswordField ? (
              <Pressable
                accessibilityLabel={
                  passwordVisible ? 'Hide password' : 'Show password'
                }
                accessibilityRole="button"
                className="absolute bottom-0 right-0 top-0 w-12 items-center justify-center active:opacity-70"
                hitSlop={8}
                onPress={() => setPasswordVisible((visible) => !visible)}
              >
                {passwordVisible ? (
                  <EyeOff color={colors.muted} size={20} />
                ) : (
                  <Eye color={colors.muted} size={20} />
                )}
              </Pressable>
            ) : null}
          </View>
          {error ? (
            <AppText className="text-sm text-accent3" variant="body">
              {error.message}
            </AppText>
          ) : null}
        </View>
      )}
    />
  );
}
