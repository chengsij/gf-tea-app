type SortOption = 'date' | 'name-asc' | 'name-desc' | 'type' | 'caffeine-asc' | 'caffeine-desc' | 'steeps-asc' | 'steeps-desc'

interface SortControlsProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export const SortControls = ({ sortBy, onSortChange }: SortControlsProps) => {
  return (
    <select
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value as SortOption)}
      className="sort-select"
    >
      <option value="date">Recently Added</option>
      <option value="name-asc">Name (A-Z)</option>
      <option value="name-desc">Name (Z-A)</option>
      <option value="type">Tea Type</option>
      <option value="caffeine-asc">Caffeine (Low to High)</option>
      <option value="caffeine-desc">Caffeine (High to Low)</option>
      <option value="steeps-asc">Steeps (Fewest First)</option>
      <option value="steeps-desc">Steeps (Most First)</option>
    </select>
  )
}
