import React, {createRef, PureComponent} from 'react';
import {
  CoordinateInfoFactory,
  Icons,
  LayerHoverInfoFactory,
  MapPopoverFactory,
  withState
} from 'kepler.gl/components';

import styled from 'styled-components';
import PropTypes from 'prop-types';
import {PopupStatistics} from '../components/popup-statistics';
import {ErrorBoundary} from '../components/error-boundary';

const MAX_WIDTH = 500;
const MAX_HEIGHT = 600;

const StyledMapPopover = styled.div`
  ${props => props.theme.scrollBar};
  font-size: 11px;
  font-weight: 500;
  background-color: ${props => props.theme.panelBackground};
  color: ${props => props.theme.textColor};
  z-index: 1001;
  position: absolute;
  overflow-x: auto;

  .gutter {
    height: 6px;
  }

  table {
    margin: 2px 12px 12px 12px;
    width: auto;

    tbody {
      border-top: transparent;
      border-bottom: transparent;
    }

    td {
      border-color: transparent;
      padding: 4px;
      color: ${props => props.theme.textColor};
    }

    td.row__value {
      text-align: right;
      font-weight: 500;
      color: ${props => props.theme.textColorHl};
    }
  }
`;

const StyledPin = styled.div`
  position: absolute;
  left: 50%;
  transform: rotate(30deg);
  top: 10px;
  color: ${props => props.theme.primaryBtnBgd};

  :hover {
    cursor: pointer;
    color: ${props => props.theme.linkBtnColor};
  }
`;

function CustomMapPopoverFactory(LayerHoverInfo, CoordinateInfo) {
  class MapPopover extends PureComponent {
    static propTypes = {
      layerHoverProp: PropTypes.object,
      coordinate: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
      freezed: PropTypes.bool,
      x: PropTypes.number,
      y: PropTypes.number,
      mapW: PropTypes.number.isRequired,
      mapH: PropTypes.number.isRequired,
      onClose: PropTypes.func.isRequired
    };

    constructor(props) {
      super(props);
      this.state = {
        width: 380,
        height: 160
      };
    }

    componentDidMount() {
      this._setContainerSize();
    }

    componentDidUpdate() {
      this._setContainerSize();
    }

    popover = createRef();

    _setContainerSize() {
      const node = this.popover.current;
      if (!node) {
        return;
      }

      const width = Math.min(Math.round(node.scrollWidth), MAX_WIDTH);
      const height = Math.min(Math.round(node.scrollHeight), MAX_HEIGHT);

      if (width !== this.state.width || height !== this.state.height) {
        this.setState({width, height});
      }
    }

    _getPosition(x, y) {
      const topOffset = 20;
      const leftOffset = 20;
      const {mapW, mapH} = this.props;
      const {width, height} = this.state;
      const pos = {};
      if (x + leftOffset + width > mapW) {
        pos.right = mapW - x + leftOffset;
      } else {
        pos.left = x + leftOffset;
      }

      if (y + topOffset + height > mapH) {
        pos.bottom = 10;
      } else {
        pos.top = y + topOffset;
      }

      return pos;
    }

    render() {
      const {x, y, freezed, coordinate, layerHoverProp, currentStatistics, locale} = this.props;

      const style = Number.isFinite(x) && Number.isFinite(y) ? this._getPosition(x, y) : {};

      return (
        <ErrorBoundary>
          <StyledMapPopover
            ref={this.popover}
            className="map-popover"
            style={{
              ...style,
              maxWidth: MAX_WIDTH
            }}
          >
            {freezed ? (
              <div className="map-popover__top">
                <div className="gutter" />
                <StyledPin className="popover-pin" onClick={this.props.onClose}>
                  <Icons.Pin height="16px" />
                </StyledPin>
              </div>
            ) : null}
            {Array.isArray(coordinate) && <CoordinateInfo coordinate={coordinate} />}
            {layerHoverProp && <LayerHoverInfo {...layerHoverProp} />}
            {layerHoverProp && layerHoverProp.fieldsToShow.length && (
              <PopupStatistics
                currentStatistics={currentStatistics}
                data={layerHoverProp.data}
                fields={layerHoverProp.fields}
                layer={layerHoverProp.layer}
                locale={locale}
              />
            )}
          </StyledMapPopover>
        </ErrorBoundary>
      );
    }
  }

  return withState([], state => ({
    ...state.app.app,
    ...state.app.keplerGl.map,
    ...state.app.keplerGl.map.uiState
  }))(MapPopover);
}

CustomMapPopoverFactory.deps = [LayerHoverInfoFactory, CoordinateInfoFactory];

export function replaceMapPopover() {
  return [MapPopoverFactory, CustomMapPopoverFactory];
}
