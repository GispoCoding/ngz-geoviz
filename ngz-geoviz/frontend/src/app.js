import React, {Component} from 'react';
import styled, {ThemeProvider} from 'styled-components';
import {connect} from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import {theme} from 'kepler.gl/styles';
import {addDataToMap, toggleModal, setLocale} from 'kepler.gl/actions';
import {LOCALES} from 'kepler.gl/constants';
import {AUTH_TOKENS, DEBUG, MAPS_MODAL_OPTIONS, MAP_STYLES} from './constants/default-settings';
import { hideAndShowSidePanel, loadMapConfigurations, setMapboxRef, setMapId } from "./actions";
import {replaceMapControl} from './factories/map-control';
import {replaceSaveExportDropdown} from './factories/save-export';
import {replaceMapPopover} from './factories/map-popover';
import store from './store';

const KeplerGl = DEBUG
  ? require('kepler.gl/components').injectComponents([replaceMapControl(), replaceMapPopover()])
  : require('kepler.gl/components').injectComponents([
      replaceMapControl(),
      replaceMapPopover(),
      replaceSaveExportDropdown()
    ]);

const keplerGlGetState = state => state.app.keplerGl;

const GlobalStyle = styled.div`
  font-family: ff-clan-web-pro, 'Helvetica Neue', Helvetica, sans-serif;
  font-weight: 400;
  font-size: 0.875em;
  line-height: 1.71429;

  *,
  *:before,
  *:after {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  ul {
    margin: 0;
    padding: 0;
  }

  li {
    margin: 0;
  }

  a {
    text-decoration: none;
    color: ${props => props.theme.labelColor};
  }
`;

class App extends Component {
  state = {
    loaded: false,
    debug: DEBUG
  };

  componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    const locale = params.has('locale') ? params.get('locale') : '';
    if (Object.keys(LOCALES).includes(locale)) {
      this.props.dispatch(setLocale(LOCALES[locale]));
    }
    const mapId = params.has('map') ? params.get('map') : null;
    this.props.dispatch(setMapId(mapId));

    if (!this.state.debug) {
      this._showMapsModal();
    } else {
      this._loadInitialData();
    }
  }

  _loadOrigSampleData() {
    // this.props.dispatch(
    //   addDataToMap({
    //     datasets: sampleData,
    //     config: sampleConfig
    //   })
    // );
  }

  _showMapsModal() {
    const options = {...MAPS_MODAL_OPTIONS};
    options.modalProps.onCancel = () => {
      const appState = store.getState().app.app;
      this.props.dispatch(toggleModal(null));
      if (appState.mapId === null) {
        this.props.dispatch(loadMapConfigurations("trains"));
      }
    }
    this.props.dispatch(toggleModal(options));
  }

  _loadInitialData() {
    this._loadOrigSampleData();
  }

  _toggleSidePanelVisibility = () => {
    this.props.dispatch(hideAndShowSidePanel());
  };

  _getMapboxRef = (mapbox, index) => {
    if (!mapbox) {
      this.props.dispatch(setMapboxRef(null));
      // The ref has been unset.
      // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
      // console.log(`Map ${index} has closed`);
    } else {
      const appState = store.getState().app.app;
      if (!appState.mapboxRef) {
        this.props.dispatch(setMapboxRef(mapbox));
      }
      // We expect an InteractiveMap created by KeplerGl's MapContainer.
      // https://uber.github.io/react-map-gl/#/Documentation/api-reference/interactive-map
      //
      // const map = mapbox.getMap();
      // map.on('zoomend', e => {
      //   // console.log(`Map ${index} zoom level: ${e.target.style.z}`);
      // });
    }
  };

  _onViewStateChange = viewState => {
    const appState = store.getState().app.app;
    if (viewState.minZoom !== appState.minZoom || viewState.maxZoom !== appState.maxZoom) {
      viewState.minZoom = appState.minZoom;
      viewState.maxZoom = appState.maxZoom;
    }
  };

  render() {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle
          // this is to apply the same modal style as kepler.gl core
          // because styled-components doesn't always return a node
          // https://github.com/styled-components/styled-components/issues/617
          ref={node => {
            node ? (this.root = node) : null;
          }}
        >
          <div
            style={{
              transition: 'margin 1s, height 1s',
              position: 'absolute',
              width: '100%',
              height: '100%',
              minHeight: `calc(100% - 30px)`,
              marginTop: 0
            }}
          >
            <AutoSizer>
              {({height, width}) => (
                <KeplerGl
                  mapboxApiAccessToken={AUTH_TOKENS.MAPBOX_TOKEN}
                  id="map"
                  getState={keplerGlGetState}
                  width={width}
                  height={height}
                  getMapboxRef={this._getMapboxRef}
                  onViewStateChange={this._onViewStateChange}
                  mapStylesReplaceDefault={!this.state.debug}
                  mapStyles={MAP_STYLES}
                />
              )}
            </AutoSizer>
          </div>
        </GlobalStyle>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
