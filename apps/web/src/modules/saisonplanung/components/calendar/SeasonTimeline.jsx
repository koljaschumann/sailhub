import { useMemo } from 'react';
import { useTheme } from '@tsc/ui';
import { boatClasses, getBoatClassName, getBoatClassColor } from '@tsc/data';
import { getMonthsInRange, getPositionInRange, getDaysBetween } from '../../utils/dateUtils';

export function SeasonTimeline({ events, season, onEventClick }) {
  const { isDark } = useTheme();

  const months = useMemo(() => {
    return getMonthsInRange(season.start, season.end);
  }, [season.start, season.end]);

  const totalDays = useMemo(() => {
    return getDaysBetween(season.start, season.end);
  }, [season.start, season.end]);

  // Group events by boat class
  const eventsByClass = useMemo(() => {
    const grouped = {};
    boatClasses.forEach(bc => {
      grouped[bc.id] = events.filter(e => e.boatClassId === bc.id);
    });
    return grouped;
  }, [events]);

  // Calculate event position and width
  const getEventStyle = (event) => {
    const startPos = getPositionInRange(event.startDate, season.start, season.end);
    const endPos = getPositionInRange(event.endDate, season.start, season.end);
    const width = (endPos - startPos) * 100;
    const left = startPos * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, Math.max(2, width))}%`,
    };
  };

  return (
    <div className={`
      rounded-2xl border overflow-hidden
      ${isDark
        ? 'bg-navy-800/50 border-navy-700'
        : 'bg-white border-light-border'}
    `}>
      {/* Month Header */}
      <div className={`
        flex border-b
        ${isDark ? 'bg-navy-900/50 border-navy-700' : 'bg-gray-50 border-light-border'}
      `}>
        {/* Row Label Column */}
        <div className={`
          w-28 flex-shrink-0 px-3 py-2 border-r
          ${isDark ? 'border-navy-700' : 'border-light-border'}
        `}>
          <span className={`text-xs font-medium ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Bootsklasse
          </span>
        </div>

        {/* Months */}
        <div className="flex-1 flex">
          {months.map((month, idx) => (
            <div
              key={`${month.year}-${month.month}`}
              className={`
                flex-1 px-2 py-2 text-center border-r last:border-r-0
                ${isDark ? 'border-navy-700' : 'border-light-border'}
              `}
              style={{ minWidth: `${(month.daysInMonth / totalDays) * 100}%` }}
            >
              <span className={`text-xs font-medium ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                {month.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Boat Class Rows */}
      {boatClasses.map((bc, rowIdx) => (
        <div
          key={bc.id}
          className={`
            flex border-b last:border-b-0
            ${isDark ? 'border-navy-700' : 'border-light-border'}
            ${rowIdx % 2 === 0
              ? isDark ? 'bg-navy-800/30' : 'bg-gray-50/50'
              : ''}
          `}
        >
          {/* Row Label */}
          <div className={`
            w-28 flex-shrink-0 px-3 py-3 border-r flex items-center gap-2
            ${isDark ? 'border-navy-700' : 'border-light-border'}
          `}>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: bc.color }}
            />
            <span className={`text-sm font-medium truncate ${isDark ? 'text-cream' : 'text-light-text'}`}>
              {bc.name}
            </span>
          </div>

          {/* Events Area */}
          <div className="flex-1 relative h-12">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex">
              {months.map((month, idx) => (
                <div
                  key={`grid-${month.year}-${month.month}`}
                  className={`
                    flex-1 border-r last:border-r-0
                    ${isDark ? 'border-navy-700/50' : 'border-light-border/50'}
                  `}
                  style={{ minWidth: `${(month.daysInMonth / totalDays) * 100}%` }}
                />
              ))}
            </div>

            {/* Events */}
            <div className="absolute inset-0 px-1 py-1.5">
              {eventsByClass[bc.id]?.map(event => {
                const style = getEventStyle(event);
                return (
                  <div
                    key={event.id}
                    className="absolute top-1 bottom-1 rounded-md cursor-pointer
                      transition-all hover:scale-y-110 hover:z-10
                      flex items-center px-1.5 overflow-hidden"
                    style={{
                      ...style,
                      backgroundColor: bc.color,
                      opacity: 0.9,
                    }}
                    onClick={() => onEventClick?.(event)}
                    title={`${event.name}\n${event.startDate} - ${event.endDate}`}
                  >
                    <span className="text-xs font-medium text-white truncate drop-shadow-sm">
                      {event.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className={`
        px-4 py-3 border-t flex flex-wrap gap-4
        ${isDark ? 'bg-navy-900/30 border-navy-700' : 'bg-gray-50 border-light-border'}
      `}>
        <span className={`text-xs ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
          Legende:
        </span>
        {boatClasses.map(bc => (
          <div key={bc.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: bc.color }}
            />
            <span className={`text-xs ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              {bc.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeasonTimeline;
