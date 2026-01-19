import { Search } from 'lucide-react'
import { CAFFEINE_LEVELS } from '../types'

interface FilterBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedType: string | null
  onTypeChange: (type: string | null) => void
  selectedCaffeineLevel: string | null
  onCaffeineLevelChange: (level: string | null) => void
  uniqueTypes: string[]
}

export const FilterBar = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCaffeineLevel,
  onCaffeineLevelChange,
  uniqueTypes,
}: FilterBarProps) => {
  return (
    <>
      <div className="header-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            placeholder="Search teas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="filters-combined">
        <div className="filter-group">
          <button
            className={`filter-btn ${selectedType === null ? 'active' : ''}`}
            onClick={() => onTypeChange(null)}
          >
            All Types
          </button>
          {uniqueTypes.map((type) => (
            <button
              key={type}
              className={`filter-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => onTypeChange(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="filter-separator"></div>

        <div className="filter-group">
          <button
            className={`filter-btn ${
              selectedCaffeineLevel === null ? 'active' : ''
            }`}
            onClick={() => onCaffeineLevelChange(null)}
          >
            All Levels
          </button>
          {CAFFEINE_LEVELS.map((level) => (
            <button
              key={level}
              className={`filter-btn ${
                selectedCaffeineLevel === level ? 'active' : ''
              }`}
              onClick={() => onCaffeineLevelChange(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
