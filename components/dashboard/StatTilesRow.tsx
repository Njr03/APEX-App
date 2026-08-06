import { useMemo, useState } from 'react';
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

const TOP_ROW_LABELS = ['Streak', 'Sessions This Year'] as const;
const BOTTOM_ROW_LABELS = ["This Week's Volume", 'Total PRs'] as const;

function StatTileGridRow({
  tiles,
  onSelectTile,
}: {
  tiles: StatTileData[];
  onSelectTile: (tile: StatTileData) => void;
}) {
  return (
    <View className="w-full flex-row" style={{ gap: 12 }}>
      {tiles.map((tile) => (
        <View key={tile.label} style={{ flex: 1, minWidth: 0 }}>
          <StatTile {...tile} onPress={() => onSelectTile(tile)} />
        </View>
      ))}
    </View>
  );
}

export function StatTilesRow({ unit = 'kg' }: StatTilesRowProps) {
  const { data, isLoading, isError, error, refetch } = useDashboardStatTiles(unit);
  const [selectedTile, setSelectedTile] = useState<StatTileData | null>(null);

  const { topRow, bottomRow } = useMemo(() => {
    const tileByLabel = new Map(
      (data?.tiles ?? []).map((tile) => [tile.label, tile]),
    );

    return {
      topRow: TOP_ROW_LABELS.flatMap((label) => {
        const tile = tileByLabel.get(label);
        return tile ? [tile] : [];
      }),
      bottomRow: BOTTOM_ROW_LABELS.flatMap((label) => {
        const tile = tileByLabel.get(label);
        return tile ? [tile] : [];
      }),
    };
  }, [data?.tiles]);

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
      <View className="w-full" style={{ gap: 12 }}>
        <StatTileGridRow tiles={topRow} onSelectTile={setSelectedTile} />
        <StatTileGridRow tiles={bottomRow} onSelectTile={setSelectedTile} />
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
