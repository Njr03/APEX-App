import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { StatTile } from '@/components/dashboard/StatTile';
import { StatTileDetailModal } from '@/components/dashboard/StatTileDetailModal';
import { QueryError } from '@/components/ui/QueryState';
import { useDashboardStatTiles, type StatTileData } from '@/hooks/useDashboardStatTiles';
import { colors } from '@/constants/theme';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

interface StatTilesRowProps {
  unit?: 'kg' | 'lb';
}

export function StatTilesRow({ unit = 'kg' }: StatTilesRowProps) {
  const { data, isLoading, isError, error, refetch } = useDashboardStatTiles(unit);
  const [selectedTile, setSelectedTile] = useState<StatTileData | null>(null);

  if (isLoading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <QueryError
        message={getSupabaseErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <>
      <View className="w-full flex-row" style={{ gap: 12 }}>
        {data.tiles.map((tile) => (
          <View key={tile.label} style={{ flex: 1, minWidth: 0 }}>
            <StatTile {...tile} onPress={() => setSelectedTile(tile)} />
          </View>
        ))}
      </View>

      <StatTileDetailModal
        breakdown={data.breakdown}
        onClose={() => setSelectedTile(null)}
        tile={selectedTile}
        unit={unit}
        visible={selectedTile != null}
      />
    </>
  );
}
