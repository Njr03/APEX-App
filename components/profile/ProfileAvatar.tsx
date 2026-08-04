import type { User } from '@supabase/supabase-js';
import { Image, View } from 'react-native';

import type { Profile } from '@/lib/supabase';
import { colors } from '@/constants/theme';

function resolveProfileImageUrl(
  user: User | null | undefined,
  profile: Profile | null | undefined,
  size: number,
): string {
  if (typeof profile?.avatar_url === 'string' && profile.avatar_url.length > 0) {
    return profile.avatar_url;
  }

  const metadata = user?.user_metadata as
    | { avatar_url?: string; picture?: string }
    | undefined;

  if (typeof metadata?.avatar_url === 'string' && metadata.avatar_url.length > 0) {
    return metadata.avatar_url;
  }

  if (typeof metadata?.picture === 'string' && metadata.picture.length > 0) {
    return metadata.picture;
  }

  const seed = encodeURIComponent(
    profile?.username ?? profile?.display_name ?? user?.email ?? 'athlete',
  );

  return `https://api.dicebear.com/7.x/notionists/png?seed=${seed}&size=${size * 2}&backgroundColor=141427`;
}

interface ProfileAvatarProps {
  user?: User | null;
  profile?: Profile | null;
  size?: number;
  borderRadius?: number;
  active?: boolean;
}

export function ProfileAvatar({
  user,
  profile,
  size = 44,
  borderRadius = 11,
  active = false,
}: ProfileAvatarProps) {
  const uri = resolveProfileImageUrl(user, profile, size);

  return (
    <View
      style={{
        borderColor: active ? 'rgba(200,255,90,0.18)' : 'rgba(255,255,255,0.08)',
        borderRadius,
        borderWidth: 1,
        height: size,
        overflow: 'hidden',
        width: size,
        backgroundColor: colors.surface2,
      }}
    >
      <Image
        accessibilityLabel="Profile photo"
        source={{ uri }}
        style={{
          height: size,
          width: size,
        }}
      />
    </View>
  );
}
