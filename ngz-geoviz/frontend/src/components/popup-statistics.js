import React, {useMemo} from 'react';
import {StatsChart} from './charts';
import {createIntl} from 'react-intl';

const PopupStat = React.memo(({statistics, data, fields, layer, intl}) => {
  const statData = useMemo(() => {
    if (layer.id === statistics.layerId) {
      const flds = fields.filter(field => field.id === statistics.fieldX);
      if (flds.length) {
        const i = flds[0].tableFieldIndex - 1;
        const row = statistics.data[data[i]];
        if (row) {
          return {
            y: row.y,
            x: row.x
          };
        }
      }
    }
    return null;
  }, [statistics, data, fields, layer]);

  const name = useMemo(() => {
    if (layer.id === statistics.layerId) {
      const nameFields = fields.filter(field => field.id === statistics.fieldY);
      if (nameFields.length) {
        return data[nameFields[0].tableFieldIndex -1];
      }
    }
    return null;
  })

  if (!statData) return null;

  return (
    <StatsChart
      data={statData.y}
      labels={statData.x}
      label={intl.formatMessage({id: statistics.id},{name})}
      color={statistics.colorHex}
      type={statistics.type}
      height={200}
      timeAxis={statistics.timeAxis}
    />
  );
});

export const PopupStatistics = React.memo(
  ({currentStatistics, data, fields, layer, locale}) => {
    const popupStatistics = useMemo(() => currentStatistics.filter(stats => stats.inPopup), [
      currentStatistics
    ]);

    const intl = useMemo(() => {
      const statisticsLabels = popupStatistics.reduce((acc, curr) => {
        acc[curr.id] = locale === 'fi' ? curr.labelFi : curr.labelEn;
        return acc;
      }, {});

      return createIntl({
        locale,
        messages: {...statisticsLabels}
      });
    }, [locale, popupStatistics]);

    return (
      <div>
        {popupStatistics.map(statistics => (
          <div key={statistics.id}>
            <PopupStat
              statistics={statistics}
              data={data}
              fields={fields}
              intl={intl}
              layer={layer}
            />
          </div>
        ))}
      </div>
    );
  }
);
