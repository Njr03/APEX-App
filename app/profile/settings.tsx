import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Screen } from '@/components/ui/Screen';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/lib/validations/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileSettingsScreen() {
  const { updatePassword } = useAuth();

  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleChangePassword = passwordForm.handleSubmit(async (values) => {
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      await updatePassword(values.password.trim());
      passwordForm.reset();
      setPasswordMessage(
        'Password updated. Use your new password the next time you sign in.',
      );
    } catch (err) {
      setPasswordError(getAuthErrorMessage(err));
    }
  });

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <BackButton className="mb-2" />
        <TabPageHeading title="Settings" />

        <Card className="gap-4">
          <TabPageHeading title="Change password" />
          <AppText variant="muted">
            Set a new password for your account. You can sign in with your
            username or email and this password.
          </AppText>

          <FormField
            autoComplete="password-new"
            control={passwordForm.control}
            label="New password"
            name="password"
            placeholder="At least 8 characters"
            secureTextEntry
            textContentType="newPassword"
          />
          <FormField
            autoComplete="password-new"
            control={passwordForm.control}
            label="Confirm new password"
            name="confirmPassword"
            placeholder="Repeat your password"
            secureTextEntry
            textContentType="newPassword"
          />

          {passwordError ? <AuthErrorBanner message={passwordError} /> : null}
          {passwordMessage ? (
            <AppText className="text-accent2" variant="body">
              {passwordMessage}
            </AppText>
          ) : null}

          <Button
            label="Update password"
            loading={passwordForm.formState.isSubmitting}
            onPress={handleChangePassword}
            variant="secondary"
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
