import MapsModalFactory from '../components/modals/maps-modal';
import { onCloseMapsModal } from "../actions";

export const API_URL = SERVER_URL; // eslint-disable-line

export const MAP_CONFIG_URL = `${API_URL}api/maps`;

export const CHECK_AUTH_URL = `${API_URL}api/is_authenticated`;

export const DEBUG = false;

export const AUTH_TOKENS = {
  MAPBOX_TOKEN: process.env.MapboxAccessToken, // eslint-disable-line
  DROPBOX_CLIENT_ID: process.env.DropboxClientId, // eslint-disable-line
  EXPORT_MAPBOX_TOKEN: process.env.MapboxExportToken, // eslint-disable-line
  CARTO_CLIENT_ID: process.env.CartoClientId // eslint-disable-line
};

export const MAP_STYLES = [
  {
    id: 'ngz_gispo_dark',
    label: 'NGZ Dark',
    url: 'mapbox://styles/tjukanovt/ck8r6rx910x9o1imzf0g8klli',
    icon: `https://api.mapbox.com/styles/v1/tjukanovt/ck8r6rx910x9o1imzf0g8klli/static/-122.3391,37.7922,9,0,0/400x300?access_token=${AUTH_TOKENS.MAPBOX_TOKEN}&logo=false&attribution=false`
  },
  {
    id: 'ngz_gispo_gold',
    label: 'NGZ Gold',
    url: 'mapbox://styles/tjukanovt/ck8r6t1lj0x611iql4mze37vl',
    icon: `https://api.mapbox.com/styles/v1/tjukanovt/ck8r6t1lj0x611iql4mze37vl/static/-122.3391,37.7922,9,0,0/400x300?access_token=${AUTH_TOKENS.MAPBOX_TOKEN}&logo=false&attribution=false`
  },
  {
    id: 'ngz_gispo_light',
    label: 'NGZ Light',
    url: 'mapbox://styles/tjukanovt/ck8r6i1yq0wr11intcalc18ze',
    icon: `https://api.mapbox.com/styles/v1/tjukanovt/ck8r6i1yq0wr11intcalc18ze/static/-122.3391,37.7922,9,0,0/400x300?access_token=${AUTH_TOKENS.MAPBOX_TOKEN}&logo=false&attribution=false`
  },
  {
    id: 'ngz_gispo_navy',
    label: 'NGZ Navy',
    url: 'mapbox://styles/tjukanovt/ck8r660zm0wfc1inth8bf4zta',
    icon: `https://api.mapbox.com/styles/v1/tjukanovt/ck8r660zm0wfc1inth8bf4zta/static/-122.3391,37.7922,9,0,0/400x300?access_token=${AUTH_TOKENS.MAPBOX_TOKEN}&logo=false&attribution=false`
  }
];

export const STYLES_MAP = {
  default: 'ngz_gispo_dark',
  light: 'ngz_gispo_light',
  ngz_gispo_light: 'ngz_gispo_light',
  ngz_light: 'ngz_gispo_light',
  dark: 'ngz_gispo_dark',
  ngz_dark: 'ngz_gispo_dark',
  ngz_gispo_dark: 'ngz_gispo_dark',
  ngz_gispo_gold: 'ngz_gispo_gold',
  ngz_gispo_navy: 'ngz_gispo_navy',
  navy: 'navy'
};

export const MAPS_MODAL_OPTIONS = {
  id: 'iconInfo',
  template: MapsModalFactory(),
  modalProps: {
    title: '',
  }
};
