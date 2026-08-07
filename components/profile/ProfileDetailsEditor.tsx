import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ZodError } from 'zod';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FilterSectionLabel } from '@/components/ui/FilterSectionLabel';
import { Input } from '@/components/ui/Input';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { useUpdateProfile } from '@/hooks/queries';
import { isUsernameAvailable } from '@/lib/auth/resolveLoginEmail';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { normalizeUsername, usernameSchema } from '@/lib/auth/username';
import {
  DEFAULT_UNIT_PREFERENCE,
  formatUnitPreferenceLabel,
  resolveUnitPreference,
  type UnitPreference,
} from '@/lib/profile/unitPreference';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/training';
import type { Profile } from '@/lib/supabase';

const PROFILE_MESSAGE_DURATION_MS = 5000;

function buildProfilePatch(
  profile: Profile,
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
    const parsed = usernameSchema.safeParse(normalizedUsername);
    if (!parsed.success) {
      return {
        patch,
        error: parsed.error.errors[0]?.message ?? 'Invalid username.',
      };
    }

    patch.username = parsed.data;
  }

  if (unitPreference !== profile.unit_preference) {
    patch.unit_preference = unitPreference;
  }

  return { patch, error: null };
}

interface ProfileDetailsEditorProps {
  profile: Profile;
  userId?: string;
}

export function ProfileDetailsEditor({
  profile,
  userId,
}: ProfileDetailsEditorProps) {
  const updateProfile = useUpdateProfile();
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [unitPreference, setUnitPreference] = useState<UnitPreference>(
    DEFAULT_UNIT_PREFERENCE,
  );

  useEffect(() => {
    setDisplayName(profile.display_name ?? '');
    setUsername(profile.username ?? '');
    setUnitPreference(resolveUnitPreference(profile.unit_preference));
  }, [profile]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const clearProfileMessage = () => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    setProfileMessage(null);
  };

  const showTemporaryProfileMessage = (message: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setProfileMessage(message);
    messageTimeoutRef.current = setTimeout(() => {
      setProfileMessage(null);
      messageTimeoutRef.current = null;
    }, PROFILE_MESSAGE_DURATION_MS);
  };

  const profileDirty =
    displayName.trim() !== (profile.display_name ?? '') ||
    normalizeUsername(username) !== normalizeUsername(profile.username) ||
    unitPreference !== profile.unit_preference;

  const handleSaveProfile = async () => {
    clearProfileMessage();
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
        showTemporaryProfileMessage('No changes to save.');
        return;
      }

      if (patch.username) {
        const available = await isUsernameAvailable(patch.username, userId);
        if (!available) {
          setProfileError('That username is already taken. Choose another one.');
          return;
        }
      }

      updateProfileSchema.parse(patch);
      await updateProfile.mutateAsync(patch);
      showTemporaryProfileMessage(
        patch.username
          ? 'Profile updated. You can now sign in with your username and password.'
          : 'Profile updated.',
      );
    } catch (err) {
      if (err instanceof ZodError) {
        setProfileError(err.errors[0]?.message ?? 'Invalid profile details.');
        return;
      }

      setProfileError(getAuthErrorMessage(err));
    }
  };

  return (
    <View className="gap-4">
      <View className="gap-2">
        <FilterSectionLabel>Display name</FilterSectionLabel>
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
        <FilterSectionLabel>Username</FilterSectionLabel>
        <Input
          accessibilityLabel="Username"
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
          onChangeText={(value) => setUsername(normalizeUsername(value))}
          placeholder="your_username"
          textContentType="username"
          value={username}
        />
        <AppText variant="muted">
          3–20 characters. Letters, numbers, and underscores only. After saving,
          use this username on the login screen with your password.
        </AppText>
      </View>

      <OptionPicker
        formatLabel={formatUnitPreferenceLabel}
        label="Weight units"
        onChange={setUnitPreference}
        options={['lb', 'kg'] as const}
        sectionLabel
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
    </View>
  );
}
