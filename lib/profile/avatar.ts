import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';

function avatarExtension(mimeType: string): 'jpg' | 'png' | 'webp' {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export function getAvatarStoragePath(userId: string, mimeType: string): string {
  return `${userId}/avatar.${avatarExtension(mimeType)}`;
}

export async function uploadProfileAvatar(
  userId: string,
  localUri: string,
  mimeType: string,
): Promise<string> {
  const path = getAvatarStoragePath(userId, mimeType);
  const response = await fetch(localUri);

  if (!response.ok) {
    throw new Error('Could not read the selected photo.');
  }

  const arrayBuffer = await response.arrayBuffer();

  const uploadResult = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteProfileAvatar(userId: string): Promise<void> {
  const extensions = ['jpg', 'png', 'webp'] as const;
  const paths = extensions.map((ext) => `${userId}/avatar.${ext}`);

  const deleteResult = await supabase.storage.from(AVATAR_BUCKET).remove(paths);

  if (deleteResult.error) {
    throw deleteResult.error;
  }
}
