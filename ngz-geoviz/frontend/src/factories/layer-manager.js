// Copyright (c) 2020 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {Component} from 'react';
import classnames from 'classnames';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {sortableContainer, sortableElement} from 'react-sortable-hoc';
import {createSelector} from 'reselect';
import {
  LayerManagerFactory,
  SidePanelDivider,
  SidePanelSection,
  PanelLabel,
  ItemSelector
} from 'kepler.gl/components';
// import {arrayMove} from 'kepler.gl/utils/data-utils';
// import {LAYER_BLENDINGS} from 'kepler.gl/constants/default-settings';

// TODO: Maybe implement defaultProps to Layer Manager?

const LAYER_BLENDINGS = {
  additive: {
    label: 'layerBlending.additive',
    blendFunc: ['SRC_ALPHA', 'DST_ALPHA'],
    blendEquation: 'FUNC_ADD'
  },
  normal: {
    // reference to
    // https://limnu.com/webgl-blending-youre-probably-wrong/
    label: 'layerBlending.normal',
    blendFunc: ['SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA', 'ONE', 'ONE_MINUS_SRC_ALPHA'],
    blendEquation: ['FUNC_ADD', 'FUNC_ADD']
  },
  subtractive: {
    label: 'layerBlending.subtractive',
    blendFunc: ['ONE', 'ONE_MINUS_DST_COLOR', 'SRC_ALPHA', 'DST_ALPHA'],
    blendEquation: ['FUNC_SUBTRACT', 'FUNC_ADD']
  }
};

const arrayMoveMutate = (array, from, to) => {
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
};

export const arrayMove = (array, from, to) => {
  array = array.slice();
  arrayMoveMutate(array, from, to);
  return array;
};


const SortableStyledItem = styled.div`
  z-index: ${props => props.theme.dropdownWrapperZ + 1};

  &.sorting {
    pointer-events: none;
  }

  &.sorting-layers .layer-panel__header {
    background-color: ${props => props.theme.panelBackgroundHover};
    font-family: ${props => props.theme.fontFamily};
    font-weight: ${props => props.theme.fontWeight};
    font-size: ${props => props.theme.fontSize};
    line-height: ${props => props.theme.lineHeight};
    *,
    *:before,
    *:after {
      box-sizing: border-box;
    }
    .layer__drag-handle {
      opacity: 1;
      color: ${props => props.theme.textColorHl};
    }
  }
`;

const LayerBlendingSelector = ({layerBlending, updateLayerBlending}) => (
  <SidePanelSection>
    <PanelLabel>Layer Blending</PanelLabel>
    <ItemSelector
      selectedItems={layerBlending}
      options={Object.keys(LAYER_BLENDINGS)}
      multiSelect={false}
      searchable={false}
      onChange={updateLayerBlending}
    />
  </SidePanelSection>
);

function CustomLayerManagerFactory(AddDataButton, LayerPanel, SourceDataCatalog) {
  // By wrapping layer panel using a sortable element we don't have to implement the drag and drop logic into the panel itself;
  // Developers can provide any layer panel implementation and it will still be sortable
  const SortableItem = sortableElement(({children, isSorting}) => {
    return (
      <SortableStyledItem className={classnames('sortable-layer-items', {sorting: isSorting})}>
        {children}
      </SortableStyledItem>
    );
  });

  const SortableContainer = sortableContainer(({children}) => {
    return <div>{children}</div>;
  });

  return class LayerManager extends Component {
    static propTypes = {
      datasets: PropTypes.object.isRequired,
      layerBlending: PropTypes.string.isRequired,
      layerClasses: PropTypes.object.isRequired,
      layers: PropTypes.arrayOf(PropTypes.any).isRequired,
      // functions
      addLayer: PropTypes.func.isRequired,
      layerColorUIChange: PropTypes.func.isRequired,
      layerConfigChange: PropTypes.func.isRequired,
      layerTextLabelChange: PropTypes.func.isRequired,
      layerVisualChannelConfigChange: PropTypes.func.isRequired,
      layerTypeChange: PropTypes.func.isRequired,
      layerVisConfigChange: PropTypes.func.isRequired,
      openModal: PropTypes.func.isRequired,
      removeLayer: PropTypes.func.isRequired,
      removeDataset: PropTypes.func.isRequired,
      showDatasetTable: PropTypes.func.isRequired,
      updateLayerBlending: PropTypes.func.isRequired,
      updateLayerOrder: PropTypes.func.isRequired
    };
    state = {
      isSorting: false
    };

    layerClassSelector = props => props.layerClasses;
    layerTypeOptionsSelector = createSelector(this.layerClassSelector, layerClasses =>
      Object.keys(layerClasses).map(key => {
        const layer = new layerClasses[key]();
        return {
          id: key,
          label: layer.name,
          icon: layer.layerIcon
        };
      })
    );

    _addEmptyNewLayer = () => {
      this.props.addLayer();
    };

    _handleSort = ({oldIndex, newIndex}) => {
      this.props.updateLayerOrder(arrayMove(this.props.layerOrder, oldIndex, newIndex));
      this.setState({isSorting: false});
    };

    _onSortStart = () => {
      this.setState({isSorting: true});
    };

    _updateBeforeSortStart = ({index}) => {
      // if layer config is active, close it
      const {layerOrder, layers, layerConfigChange} = this.props;
      const layerIdx = layerOrder[index];
      if (layers[layerIdx].config.isConfigActive) {
        layerConfigChange(layers[layerIdx], {isConfigActive: false});
      }
    };

    render() {
      const {layers, datasets, layerOrder, openModal} = this.props;
      // const defaultDataset = Object.keys(datasets)[0];
      const layerTypeOptions = this.layerTypeOptionsSelector(this.props);

      const layerActions = {
        layerColorUIChange: this.props.layerColorUIChange,
        layerConfigChange: this.props.layerConfigChange,
        layerVisualChannelConfigChange: this.props.layerVisualChannelConfigChange,
        layerTypeChange: this.props.layerTypeChange,
        layerVisConfigChange: this.props.layerVisConfigChange,
        layerTextLabelChange: this.props.layerTextLabelChange,
        removeLayer: () => null
      };

      const panelProps = {
        datasets,
        openModal,
        layerTypeOptions
      };

      return (
        <div className="layer-manager">
          <SourceDataCatalog
            datasets={datasets}
            showDatasetTable={this.props.showDatasetTable}
            removeDataset={() => null}
            showDeleteDataset={false}
          />
          {/* <AddDataButton onClick={this.props.showAddDataModal} isInactive={!defaultDataset} /> */}
          <SidePanelDivider />
          <SidePanelSection>
            <SortableContainer
              onSortEnd={this._handleSort}
              onSortStart={this._onSortStart}
              updateBeforeSortStart={this._updateBeforeSortStart}
              lockAxis="y"
              helperClass="sorting-layers"
              useDragHandle
            >
              {layerOrder.map((layerIdx, index) => (
                <SortableItem
                  key={`layer-${layerIdx}`}
                  index={index}
                  isSorting={this.state.isSorting}
                >
                  <LayerPanel
                    {...panelProps}
                    {...layerActions}
                    sortData={layerIdx}
                    key={layers[layerIdx].id}
                    idx={layerIdx}
                    layer={layers[layerIdx]}
                  />
                </SortableItem>
              ))}
            </SortableContainer>
          </SidePanelSection>
          <SidePanelSection>
            {/* {defaultDataset ? (
              <Button onClick={this._addEmptyNewLayer} width="105px">
                <Add height="12px" />
                Add Layer
              </Button>
            ) : null} */}
          </SidePanelSection>
          <LayerBlendingSelector
            layerBlending={this.props.layerBlending}
            updateLayerBlending={this.props.updateLayerBlending}
          />
        </div>
      );
    }
  };
}

CustomLayerManagerFactory.deps = LayerManagerFactory.deps;

export function replaceLayerManager() {
  return [LayerManagerFactory, CustomLayerManagerFactory];
}
