import {json as requestJson, text as requestText} from 'd3-request';
import {createAction} from 'redux-actions';
import { CHECK_AUTH_URL, MAP_CONFIG_URL, MAPS_MODAL_OPTIONS } from "./constants/default-settings";
import { toggleModal } from "kepler.gl/actions";

// CONSTANTS
export const SET_LOADING_STATUS = 'SET_LOADING_STATUS';
export const LOAD_REMOTE_RESOURCE_SUCCESS = 'LOAD_REMOTE_RESOURCE_SUCCESS';
export const HIDE_AND_SHOW_SIDE_PANEL = 'HIDE_AND_SHOW_SIDE_PANEL';
export const LOAD_MAPS_FILE = 'LOAD_MAPS_FILE';
export const SET_ACTIVE_SIDE_PANEL = 'SET_ACTIVE_SIDE_PANEL';
export const SET_ZOOM_LIMITS = 'SET_ZOOM_LIMITS';
export const SET_STATISTICS = 'SET_STATISTICS';
export const SET_MAP_ID = 'SET_MAP_ID';
export const SET_MAPBOX_REF = 'SET_MAPBOX_REF';

function setLoadingMapStatus(isMapLoading) {
  return {
    type: SET_LOADING_STATUS,
    isMapLoading
  };
}

function loadRemoteResourceSuccess(data, datasets = null) {
  return {
    type: LOAD_REMOTE_RESOURCE_SUCCESS,
    datasets,
    data
  };
}

export function loadMapsFile(maps) {
  return {
    type: LOAD_MAPS_FILE,
    maps
  };
}

export function setReadOnlyState(readOnly) {
  return {
    type: HIDE_AND_SHOW_SIDE_PANEL,
    readOnly
  };
}

export function setActiveSidePanel(panelId) {
  return {
    type: SET_ACTIVE_SIDE_PANEL,
    panelId
  };
}

export function setZoomLimits(minZoom, maxZoom) {
  return {
    type: SET_ZOOM_LIMITS,
    minZoom,
    maxZoom
  };
}

export const setStatistics = createAction(SET_STATISTICS);
export const setMapId = createAction(SET_MAP_ID);
export const setMapboxRef = createAction(SET_MAPBOX_REF);

export const hideAndShowSidePanel = createAction(HIDE_AND_SHOW_SIDE_PANEL);

export function loadMapConfigurations(mapId = null) {
  return dispatch => {
    dispatch(setLoadingMapStatus(true));
    requestJson(MAP_CONFIG_URL, (error, maps) => {
      if (error) {
        // TODO: error handling?
        console.log('ERROR in loadMapConfigurations: ', error);
      } else {
        requestJson(CHECK_AUTH_URL, (error, response) => {
          if (error) {
            // TODO: error handling?
            console.log('ERROR in loadMapConfigurations: ', error);
          } else {
            const isAuthenticated = response.is_authenticated;
            dispatch(setLoadingMapStatus(false));
            dispatch(loadMapsFile(maps.filter(map => isAuthenticated || map.enabled)));

            // Load specifig map
            const map = mapId && maps.find(s => s.id === mapId);
            if (map) {
              dispatch(loadMap(map));
            }
          }
        });
      }
    });
  };
}

export function loadMap(map) {
  return dispatch => {
    dispatch(setLoadingMapStatus(true));
    dispatch(setMapId(map.id));
    dispatch(setZoomLimits(map.minZoom, map.maxZoom));
    dispatch(setActiveSidePanel(null));
    dispatch(setReadOnlyState(map.readOnly));
    dispatch(loadRemoteStatistics(map));

    requestJson(map.configUrl, (error, config) => {
      if (error) {
        // TODO: error handling?
        console.log('ERROR in loadMap: ', error);
      } else {
        const data = {
          config,
          details: map.details,
          datasets: map.datasets
        };
        dispatch(loadRemoteData(data));
      }
    });
  };
}

function loadRemoteStatistics(map) {
  return dispatch => {
    const statistics = map.statistics || [];
    if (statistics.length > 0) {
      Promise.all(
        statistics.map(stat => {
          return new Promise((resolve, reject) => {
            if (!stat.url) {
              stat.data = [];
              resolve(stat);
            } else {
              requestJson(stat.url, (error, file) => {
                if (error) {
                  // eslint-disable-next-line no-console
                  console.log('ERROR in loadRemoteStatistics: ', error);
                  reject(error);
                } else {
                  stat.data = file;
                  resolve(stat);
                }
              });
            }
          });
        })
      ).then(statisticsAll => {
        dispatch(setStatistics(statisticsAll));
      });
    } else {
      dispatch(setStatistics([]));
    }
  };
}

export function loadRemoteData(data) {
  return dispatch => {
    if (data.datasets.length > 0) {
      Promise.all(
        data.datasets.map(dataset => {
          return new Promise((resolve, reject) => {
            requestText(dataset.url, (error, file) => {
              if (error) {
                // eslint-disable-next-line no-console
                console.log('ERROR in loadRemoteData: ', error);
                reject(error);
              } else {
                dataset['file'] = file;
                resolve(dataset);
              }
            });
          });
        })
      ).then(datasets => {
        dispatch(setLoadingMapStatus(false));
        dispatch(loadRemoteResourceSuccess(data, datasets));
      });
    } else {
      dispatch(setLoadingMapStatus(false));
      dispatch(loadRemoteResourceSuccess(data));
    }
  };
}

export function loadRemoteData2(url, config, info, details) {
  return dispatch => {
    dispatch(setLoadingMapStatus(true));
    new Promise((resolve, reject) => {
      requestText(url, (error, file) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.log('ERROR: ', error);
          reject(error);
        } else {
          resolve(file);
        }
      });
    }).then(data => dispatch(loadRemoteResourceSuccess(data, config, info, details)));
  };
}
