import React, {useCallback, useEffect, useMemo, useState} from 'react';
import styled from 'styled-components';
import booleanWithin from '@turf/boolean-within';
import turfCentroid from '@turf/centroid';
import {multiPolygon} from '@turf/helpers';
import {StatsChart} from './charts';
import {FormattedMessage} from 'react-intl';

const StyledStatistics = styled.div`
  height: ${props => props.height}px;
`;

function getFilteredData(dataset, internalBbox, statistics) {
  const geojsonFields = dataset.fields.filter(field => field.type === 'geojson');
  const geomField = geojsonFields.length ? geojsonFields[0].tableFieldIndex - 1 : 0;

  const filteredData = dataset.allData.filter(f =>
    booleanWithin(turfCentroid(multiPolygon(f[geomField].geometry.coordinates)), internalBbox)
  );

  console.log("FILTTERED", filteredData, internalBbox)

  const rExists = statistics.fieldR;
  const reducedData = dataset.fields.reduce(
    (acc, curr) => {
      if (curr.id === statistics.fieldX) {
        acc.x = filteredData.map(datapoint => datapoint[curr.tableFieldIndex - 1]);
      }
      if (curr.id === statistics.fieldY) {
        acc.y = filteredData.map(datapoint => datapoint[curr.tableFieldIndex - 1]);
      }
      if (curr.id === statistics.fieldLabel) {
        acc.labels = filteredData.map(datapoint => datapoint[curr.tableFieldIndex - 1]);
      }
      if (rExists && curr.id === statistics.fieldR) {
        acc.r = filteredData.map(datapoint => datapoint[curr.tableFieldIndex - 1]);
      }

      return acc;
    },
    {x: [], y: []}
  );

  if (rExists) {
    const points = [];
    const labels = [];
    const minR = Math.min(...reducedData.r);
    const maxR = Math.max(...reducedData.r);
    const denominator = maxR - minR;
    const scaledR = x =>
      Math.round((1 + 2 * ((x - minR) / denominator) + Number.EPSILON) * 100) / 100;
    let i;
    for (i = 0; i < reducedData.r.length; i++) {
      points.push({r: scaledR(reducedData.r[i]), x: reducedData.x[i], y: reducedData.y[i]});
      labels.push(reducedData.labels[i]);
    }
    return {y: points, x: labels, callbackTooltip: true};
  } else {
    return reducedData;
  }
}


const StatisticsContainer = ({intl, statistics, bbox, dataset}) => {
  const [internalBbox, setBbox] = useState(bbox);
  const [useCallbackTooltip, setUseCallbackTooltip] = useState(false);
  const [data, setData] = useState({y: statistics.data ? [...statistics.data] : []});

  useEffect(() => {
    if (bbox) {
      if (JSON.stringify(bbox) !== JSON.stringify(internalBbox)) {
        setBbox(bbox);
      }
    }
  }, [bbox]);

  useEffect(() => {
    let newData;
    let callbackTooltip = false;
    if (statistics.useData && dataset && internalBbox) {
      newData = getFilteredData(dataset, internalBbox, statistics);
      callbackTooltip = Boolean(newData.callbackTooltip);
    } else if (statistics.data && !statistics.timeAxis) {
      newData = {x: statistics.data.map(data => data.x), y: statistics.data.map(data => data.y)};
    } else {
      newData = {y: statistics.data || []};
    }
    setData(newData);
    setUseCallbackTooltip(callbackTooltip);
  }, [statistics, dataset, internalBbox]);

  const isHorizontal = useMemo(() => statistics.type.toLowerCase().includes('horizontal'), [
    statistics
  ]);

  const renderChart = useMemo(
    () => !statistics.useData || (data.y.length < 2000 && data.y.length > 0),
    [statistics, data]
  );

  const height = useMemo(() => (renderChart ? (isHorizontal ? 300 : 200) : 10), [
    isHorizontal,
    renderChart
  ]);

  const labelCallback = useCallback(
    (t, d) => {
      const origTooltip = d.datasets[t.datasetIndex].data[t.index];
      return `${d.labels[t.index]} (${origTooltip.x},${origTooltip.y})`;
    },
    [data]
  );

  return (
    <StyledStatistics height={height}>
      {renderChart ? (
        <StatsChart
          type={statistics.type}
          timeAxis={statistics.timeAxis}
          labels={data.x}
          data={data.y}
          label={intl.formatMessage({id: statistics.id})}
          color={statistics.colorHex}
          height={height}
          labelCallback={useCallbackTooltip && labelCallback}
        />
      ) : (
        <div className={'zoom-text'}>
          <FormattedMessage id={'infoDialog.zoom'} />
          <br />
          <br />
        </div>
      )}
    </StyledStatistics>
  );
};

export default StatisticsContainer;
