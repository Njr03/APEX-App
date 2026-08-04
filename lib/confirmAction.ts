import { Alert, Platform } from 'react-native';

interface ConfirmActionOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

/** Cross-platform destructive confirmation (Alert is a no-op on web). */
export function confirmDestructiveAction({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
}: ConfirmActionOptions) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { style: 'cancel', text: 'Cancel' },
    { style: 'destructive', text: confirmLabel, onPress: onConfirm },
  ]);
}
