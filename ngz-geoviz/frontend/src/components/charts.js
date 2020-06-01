import React, {useEffect, useMemo, useRef, useState} from 'react';
import Chart from 'chart.js';
import {Bar, HorizontalBar, Bubble, Line} from 'react-chartjs-2';

export const StatsChart = React.memo(
  ({data, labels, label, color, type, height, timeAxis, labelCallback}) => {
    const options = useMemo(() => {
      const scales = timeAxis
        ? {
            xAxes: [
              {
                offset: true,
                type: 'time',
                time: {
                  unit: 'day',
                  displayFormats: {
                    day: 'D.M.'
                  }
                }
              }
            ]
          }
        : undefined;

      const isBubble = type === 'bubble';
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          mode: isBubble ? 'nearest' : 'index',
          axis: isBubble ? undefined : type.toLowerCase().includes('horizontal') ? 'y' : 'x',
          intersect: false
        },
        legend: {
          labels: {
            fontSize: 12 // TODO:
          }
        },
        scales
      };
      if (labelCallback) {
        options.tooltips.callbacks = {
          label: labelCallback
        };
      }
      return options;
    }, [type, timeAxis]);
    const chartData = useMemo(() => {
      return {
        labels,
        datasets: [
          {
            data,
            label,
            fill: false,
            backgroundColor: color
          }
        ]
      };
    }, [labels, data, label]);

    return (
      <div>
        {
          {
            bar: <Bar data={chartData} options={options} height={height} />,
            horizontalBar: <HorizontalBar data={chartData} options={options} height={height} />,
            bubble: <Bubble data={chartData} options={options} height={height} />,
            line: <Line data={chartData} options={options} height={height} />
          }[type]
        }
      </div>
    );
  }
);
