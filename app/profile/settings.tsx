import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { ZodError } from 'zod';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { QueryError, QueryLoading } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useProfile, useUpdateProfile } from '@/hooks/queries';
import { isUsernameAvailable } from '@/lib/auth/resolveLoginEmail';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { normalizeUsername } from '@/lib/auth/username';
import {
  DEFAULT_UNIT_PREFERENCE,
  formatUnitPreferenceLabel,
  resolveUnitPreference,
  type UnitPreference,
} from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import {
  changePasswordSchema,
  deleteAccountSchema,
  type ChangePasswordFormValues,
  type DeleteAccountFormValues,
} from '@/lib/validations/auth';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/training';
import { useAuth } from '@/providers/AuthProvider';

function buildProfilePatch(
  profile: NonNullable<ReturnType<typeof useProfile>['data']>,
  displayName: string,
  username: string,
  unitPreference: UnitPreference,
): { patch: UpdateProfileInput; error: string | null } {
  const patch: UpdateProfileInput = {};
  const trimmedDisplayName = displayName.trim();
  const normalizedUsername = normalizeUsername(username);
  const currentUsername = normalizeUsername(profile.username);

  if (trimmedDisplayName !== (profile.display_name ?? '')) {
    if (!trimmedDisplayName) {
      return { patch, error: 'Display name cannot be empty.' };
    }

    patch.display_name = trimmedDisplayName;
  }

  if (normalizedUsername !== currentUsername) {
    if (normalizedUsername.length < 3) {
      return { patch, error: 'Username must be at least 3 characters.' };
    }

    patch.username = normalizedUsername;
  }

  if (unitPreference !== profile.unit_preference) {
    patch.unit_preference = unitPreference;
  }

  return { patch, error: null };
}

export default function ProfileSettingsScreen() {
  const { user, updatePassword } = useAuth();
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [unitPreference, setUnitPreference] = useState<UnitPreference>(
    DEFAULT_UNIT_PREFERENCE,
  );

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const deleteForm = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: '' },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setUsername(profile.username ?? '');
      setUnitPreference(resolveUnitPreference(profile.unit_preference));
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setProfileMessage(null);
    setProfileError(null);

    try {
      const { patch, error: validationError } = buildProfilePatch(
        profile,
        displayName,
        username,
        unitPreference,
      );

      if (validationError) {
        setProfileError(validationError);
        return;
      }

      if (Object.keys(patch).length === 0) {
        setProfileMessage('No changes to save.');
        return;
      }

      if (patch.username) {
        const available = await isUsernameAvailable(patch.username);
        if (!available) {
          setProfileError('That username is already taken. Choose another one.');
          return;
        }
      }

      updateProfileSchema.parse(patch);
      await updateProfile.mutateAsync(patch);
      setProfileMessage('Profile updated.');
    } catch (err) {
      if (err instanceof ZodError) {
        setProfileError(err.errors[0]?.message ?? 'Invalid profile details.');
        return;
      }

      setProfileError(getSupabaseErrorMessage(err));
    }
  };

  const handleChangePassword = passwordForm.handleSubmit(async (values) => {
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      await updatePassword(values.password);
      passwordForm.reset();
      setPasswordMessage('Password updated.');
    } catch (err) {
      setPasswordError(getAuthErrorMessage(err));
    }
  });

  const handleDeleteAccount = deleteForm.handleSubmit(async () => {
    setDeleteError(null);

    try {
      await deleteAccount.mutateAsync();
      router.replace('/(auth)/login');
    } catch (err) {
      setDeleteError(getSupabaseErrorMessage(err));
    }
  });

  if (isLoading) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <QueryLoading label="Loading settings…" />
      </Screen>
    );
  }

  if (isError || !profile) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <TabPageHeading title="Settings" />
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  const profileDirty =
    displayName.trim() !== (profile.display_name ?? '') ||
    normalizeUsername(username) !== normalizeUsername(profile.username) ||
    unitPreference !== profile.unit_preference;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <BackButton className="mb-2" />
        <TabPageHeading title="Settings" />

        <Card className="gap-3">
          <AppText variant="muted">Signed in as</AppText>
          <AppText variant="mono">{user?.email ?? '—'}</AppText>
        </Card>

        <Card className="gap-4">
          <TabPageHeading title="Profile" />

          <View className="gap-2">
            <AppText className="text-sm" variant="body">
              Display name
            </AppText>
            <Input
              accessibilityLabel="Display name"
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={setDisplayName}
              placeholder="Athlete"
              textContentType="name"
              value={displayName}
            />
          </View>

          <View className="gap-2">
            <AppText className="text-sm" variant="body">
              Username
            </AppText>
            <Input
              accessibilityLabel="Username"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              onChangeText={setUsername}
              placeholder="your_username"
              textContentType="username"
              value={username}
            />
            <AppText variant="muted">
              3–20 characters. Letters, numbers, and underscores only.
            </AppText>
          </View>

          <OptionPicker
            formatLabel={formatUnitPreferenceLabel}
            label="Weight units"
            onChange={setUnitPreference}
            options={['lb', 'kg'] as const}
            value={unitPreference}
          />

          {profileError ? <AuthErrorBanner message={profileError} /> : null}
          {profileMessage ? (
            <AppText className="text-accent2" variant="body">
              {profileMessage}
            </AppText>
          ) : null}

          <Button
            disabled={!profileDirty}
            label="Save profile"
            loading={updateProfile.isPending}
            onPress={() => void handleSaveProfile()}
          />
        </Card>

        <Card className="gap-4">
          <TabPageHeading title="Change password" />
          <AppText variant="muted">
            Update your password while signed in.
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

        <Card className="gap-4 border-accent3/30">
          <TabPageHeading title="Delete account" />
          <AppText variant="muted">
            Permanently removes your account, workouts, and progress. This
            cannot be undone.
          </AppText>

          <FormField
            control={deleteForm.control}
            label='Type "DELETE" to confirm'
            name="confirmation"
            placeholder="DELETE"
          />

          {deleteError ? <AuthErrorBanner message={deleteError} /> : null}

          <Button
            label="Delete my account"
            loading={deleteAccount.isPending}
            onPress={handleDeleteAccount}
            variant="danger"
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
