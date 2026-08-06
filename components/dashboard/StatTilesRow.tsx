import { useMemo, useState } from 'react';
import { ActivityIndicator, View, type ViewStyle } from 'react-native';

import { StatTile } from '@/components/dashboard/StatTile';
import { StatTileDetailModal } from '@/components/dashboard/StatTileDetailModal';
import { QueryError } from '@/components/ui/QueryState';
import { useDashboardStatTiles, type StatTileData } from '@/hooks/useDashboardStatTiles';
import { colors } from '@/constants/theme';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

interface StatTilesRowProps {
  unit?: 'kg' | 'lb';
}

const TILE_GAP = 12;

const GRID_ROW_LABELS = [
  ['Streak', 'Sessions This Year'],
  ["This Week's Volume", 'Total PRs'],
] as const;

const rowStyle: ViewStyle = {
  flexDirection: 'row',
  gap: TILE_GAP,
  width: '100%',
};

const cellStyle: ViewStyle = {
  flex: 1,
  flexBasis: 0,
  minWidth: 0,
};

function StatTileGridRow({
  tiles,
  onSelectTile,
}: {
  tiles: StatTileData[];
  onSelectTile: (tile: StatTileData) => void;
}) {
  if (tiles.length === 0) return null;

  return (
    <View style={rowStyle}>
      {tiles.map((tile) => (
        <View key={tile.label} style={cellStyle}>
          <StatTile {...tile} onPress={() => onSelectTile(tile)} />
        </View>
      ))}
    </View>
  );
}

export function StatTilesRow({ unit = 'kg' }: StatTilesRowProps) {
  const { data, isLoading, isError, error, refetch } = useDashboardStatTiles(unit);
  const [selectedTile, setSelectedTile] = useState<StatTileData | null>(null);

  const gridRows = useMemo(() => {
    const tileByLabel = new Map(
      (data?.tiles ?? []).map((tile) => [tile.label, tile]),
    );

    return GRID_ROW_LABELS.map((labels) =>
      labels.flatMap((label) => {
        const tile = tileByLabel.get(label);
        return tile ? [tile] : [];
      }),
    );
  }, [data?.tiles]);

  if (isLoading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
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
      <View style={{ gap: TILE_GAP, width: '100%' }}>
        {gridRows.map((rowTiles, index) => (
          <StatTileGridRow
            key={GRID_ROW_LABELS[index]?.join('-') ?? index}
            onSelectTile={setSelectedTile}
            tiles={rowTiles}
          />
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
