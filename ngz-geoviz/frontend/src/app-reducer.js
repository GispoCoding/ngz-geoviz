import { combineReducers } from "redux";
import { createAction, handleActions } from "redux-actions";
import keplerGlReducer, { combinedUpdaters } from "kepler.gl/reducers";
import { processCsvData, processGeojson, processKeplerglJSON } from "kepler.gl/processors";
import { LOCALES } from "kepler.gl/constants";
import { FILTER_ARRAY_FIELD_NAMES, STYLES_MAP } from "./constants/default-settings";

import {
  HIDE_AND_SHOW_SIDE_PANEL,
  LOAD_MAPS_FILE,
  LOAD_REMOTE_RESOURCE_SUCCESS,
  SET_ACTIVE_SIDE_PANEL,
  SET_LOADING_STATUS,
  SET_MAP_ID,
  SET_MAPBOX_REF,
  SET_STATISTICS,
  SET_ZOOM_LIMITS
} from "./actions";
import moment from "moment";

// CONSTANTS
export const INIT = 'INIT';

// ACTIONS
export const appInit = createAction(INIT);

// INITIAL_STATE
const initialState = {
  appName: 'NGZ geoviz',
  mapboxRef: null,
  loaded: false,
  maps: [],
  mapId: null, // Used when map id is told in the url query param
  isMapLoading: false, // determine whether we are loading a sample map,
  error: null, // contains error when loading/retrieving data/configuration
  currentDetails: null,
  currentStatistics: [],
  minZoom: 0,
  maxZoom: 24
};

// REDUCER
const appReducer = handleActions(
  {
    [INIT]: (state, action) => ({
      ...state,
      loaded: true
    }),
    [SET_LOADING_STATUS]: (state, action) => ({
      ...state,
      isMapLoading: action.isMapLoading
    }),
    [LOAD_MAPS_FILE]: (state, action) => ({
      ...state,
      maps: action.maps
    }),
    [SET_ZOOM_LIMITS]: (state, action) => ({
      ...state,
      minZoom: action.minZoom,
      maxZoom: action.maxZoom
    }),
    [SET_STATISTICS]: (state, action) => ({
      ...state,
      currentStatistics: action.payload
    }),
    [SET_MAP_ID]: (state, action) => ({
      ...state,
      mapId: action.payload
    }),
    [SET_MAPBOX_REF]: (state, action) => ({
      ...state,
      mapboxRef: action.payload
    })
  },
  initialState
);

const ngzReducer = combineReducers({
  keplerGl: keplerGlReducer
    .initialState({
      uiState: {
        // hide side panel to disallower user customize the map
        readOnly: false,

        // use Finnish locale as default
        // locale: LOCALES.fi,

        // customize which map control button to show
        mapControls: {
          visibleLayers: {
            show: true
          },
          mapLegend: {
            show: true,
            active: false
          },
          toggle3d: {
            show: true
          },
          splitMap: {
            show: false
          },
          mapDraw: {
            show: false
          },
          mapLocale: {
            show: true
          }
        }
      }
    })
    // handle additional actions
    .plugin({
      [HIDE_AND_SHOW_SIDE_PANEL]: (state, action) => ({
        ...state,
        uiState: {
          ...state.uiState,
          readOnly: action.readOnly !== undefined ? action.readOnly : !state.uiState.readOnly
        }
      }),
      [SET_ACTIVE_SIDE_PANEL]: (state, action) => ({
        ...state,
        uiState: {
          ...state.uiState,
          activeSidePanel: action.panelId
        }
      })
    }),
  app: appReducer
});


// this can be moved into a action and call kepler.gl action
/**
 *
 * @param state
 * @param action {map: resultset, config, map}
 * @returns {{app: {isMapLoading: boolean}, keplerGl: {map: (state|*)}}}
 */
export const loadRemoteResourceSuccess = (state, action) => {
  let payload;
  // Using json including kepler config and data
  if (action.datasets === null) {
    console.log('Using kepler json');
    payload = processKeplerglJSON(action.data.config);
    payload.config.mapStyle.styleType =
      STYLES_MAP[payload.config.mapStyle.styleType] !== undefined
        ? STYLES_MAP[payload.config.mapStyle.styleType]
        : STYLES_MAP.default;
  } else {
    let processorMethod = processCsvData;
    const datasets = action.datasets.map(dataset => {
      let data;
      if (dataset.url.includes('json') || dataset.url.includes('geojson')) {
        processorMethod = processGeojson;
        data = JSON.parse(dataset.file);
      } else {
        console.log('Using csv');
        processorMethod = processCsvData;
        data = dataset.file;
      }
      return {
        info: {
          id: dataset.id,
          label: dataset.label
        },
        data: processorMethod(data)
      };
    });

    const config = action.data.config;
    config.config.mapStyle.styleType =
      STYLES_MAP[config.config.mapStyle.styleType] !== undefined
        ? STYLES_MAP[config.config.mapStyle.styleType]
        : STYLES_MAP.default;

    payload = {
      datasets,
      config
    };
  }

  const keplerGlInstance = combinedUpdaters.addDataToMapUpdater(
    state.keplerGl.map, // "map" is the id of your kepler.gl instance
    {
      payload
    }
  );

  return {
    ...state,
    app: {
      ...state.app,
      isMapLoading: false, // Turn off the spinner
      currentDetails: action.data.details
    },
    keplerGl: {
      ...state.keplerGl,
      map: keplerGlInstance
    }
  };
};

const composedUpdaters = {
  [LOAD_REMOTE_RESOURCE_SUCCESS]: loadRemoteResourceSuccess
};

const composedReducer = (state, action) => {
  if (composedUpdaters[action.type]) {
    return composedUpdaters[action.type](state, action);
  }
  return ngzReducer(state, action);
};

export default composedReducer;
