import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useUpdateProfile } from '@/hooks/queries';
import { deleteProfileAvatar, uploadProfileAvatar } from '@/lib/profile/avatar';
import { pickProfileImage } from '@/lib/profile/pickProfileImage';
import {
  getProfileIconUrl,
  PROFILE_ICON_PRESETS,
} from '@/lib/profile/profileIcons';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigationStore } from '@/stores/navigationStore';

function showAvatarError(message: string) {
  Alert.alert('Profile photo', message);
}

export function useProfileAvatar() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const asset = await pickProfileImage();
      if (!asset) return null;

      const mimeType = asset.mimeType ?? 'image/jpeg';
      const avatarUrl = await uploadProfileAvatar(user.id, asset.uri, mimeType);

      return updateProfile.mutateAsync({ avatar_url: avatarUrl });
    },
    onError: (error) => {
      showAvatarError(getSupabaseErrorMessage(error));
    },
  });

  const iconMutation = useMutation({
    mutationFn: async (seed: string) => {
      if (!user) throw new Error('Not authenticated');

      const avatarUrl = `${getProfileIconUrl(seed)}&t=${Date.now()}`;
      return updateProfile.mutateAsync({ avatar_url: avatarUrl });
    },
    onError: (error) => {
      showAvatarError(getSupabaseErrorMessage(error));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      await deleteProfileAvatar(user.id);
      return updateProfile.mutateAsync({ avatar_url: null });
    },
    onError: (error) => {
      showAvatarError(getSupabaseErrorMessage(error));
    },
  });

  const openIconPicker = () => {
    Alert.alert(
      'Choose icon',
      undefined,
      [
        ...PROFILE_ICON_PRESETS.map((icon) => ({
          text: icon.label,
          onPress: () => {
            void iconMutation.mutate(icon.seed);
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  const openAvatarActions = (hasCustomAvatar: boolean) => {
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [
      {
        text: 'Choose Photo',
        onPress: () => {
          void uploadMutation.mutate();
        },
      },
      {
        text: 'Choose Icon',
        onPress: openIconPicker,
      },
      {
        text: 'View Profile',
        onPress: () => {
          useNavigationStore.getState().setActivePage('profile');
          router.push('/profile');
        },
      },
    ];

    if (hasCustomAvatar) {
      buttons.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => {
          void removeMutation.mutate();
        },
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Profile photo', undefined, buttons);
  };

  return {
    openAvatarActions,
    isUpdating:
      uploadMutation.isPending ||
      iconMutation.isPending ||
      removeMutation.isPending,
  };
}
