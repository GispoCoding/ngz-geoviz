import React, {Component} from 'react';
import styled from 'styled-components';
import {FormattedMessage, IntlProvider} from 'react-intl';
import {format} from 'd3-format';
import {withState, Button, Icons} from 'kepler.gl/components';
import {setLocale} from 'kepler.gl/actions';
import {loadMap, loadMapConfigurations} from '../../actions';
import {LoadingDialog, ModalTitle} from 'kepler.gl';
import {messages} from '../../constants/locale';
import {useMediaQuery} from 'react-responsive';
import {LOCALES} from 'kepler.gl/constants';

const StyledSampleGallery = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const StyledMap = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.textColorLT};
  line-height: 22px;
  width: ${props => (!props.isMobile ? '30%' : '40%')};
  max-width: 480px;
  margin-bottom: 50px;

  .sample-map__image {
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
    opacity: 0.9;
    transition: opacity 0.4s ease;
    position: relative;
    line-height: 0;

    img {
      max-width: 100%;
    }
    :hover {
      cursor: pointer;
      opacity: 1;
    }
  }

  .sample-map__size {
    font-size: 12px;
    font-weight: 400;
    line-height: 24px;
  }

  ${props =>
    !props.isMobile
      ? ':hover {\n .sample-map__image__caption {\n opacity: 0.8;\n transition: opacity 0.4s ease;\n }\n  }'
      : '.sample-map__image__caption {\n opacity: 0.8;\n transition: opacity 0.4s ease;\n}\n'};
`;

const StyledImageCaption = styled.div`
  color: ${props => props.theme.labelColorLT};
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  margin-top: 10px;
  opacity: 0;
`;

const MapControlButton = styled(Button).attrs({
  className: 'map-control-button'
})`
  box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.16);
  height: 32px;
  width: 32px;
  padding: 0;
  border-radius: 0;
  background-color: ${props => (props.dark ? '#29323C' : '#dae1ea')};
  color: ${props =>
    props.active ? props.theme.floatingBtnActColor : props.theme.floatingBtnColor};

  :hover,
  :focus,
  :active,
  &.active {
    background-color: ${props => props.theme.floatingBtnBgdHover};
    color: ${props => props.theme.floatingBtnActColor};
  }
  svg {
    margin-right: 0;
  }
`;

const Map = ({map, onClick, locale}) => {
  const isTabletOrMobile = useMediaQuery({query: '(max-width: 1224px)'});
  const isPortrait = useMediaQuery({query: '(orientation: portrait)'});
  return (
    <StyledMap className="sample-map-gallery__item" isMobile={isTabletOrMobile && isPortrait}>
      <IntlProvider locale={locale} messages={map.details[locale]}>
        <div className="sample-map">
          <div className="sample-map__image" onClick={onClick}>
            {map.imageUrl && <img src={map.imageUrl} />}
          </div>
          <div className="sample-map__title">
            <FormattedMessage id={'label'} />
          </div>
          <StyledImageCaption className="sample-map__image__caption">
            <FormattedMessage id={'desc'} />
          </StyledImageCaption>
        </div>
      </IntlProvider>
    </StyledMap>
  );
};

const MapsModalFactory = () => {
  class MapsModal extends Component {
    componentDidMount() {
      if (!this.props.maps.length) {
        this.props.loadMapConfigurations(this.props.mapId);
      }
    }

    render() {
      const {maps, onLoadMap, onSetLocale, isMapLoading, locale} = this.props;
      const locales = Object.keys(LOCALES);
      return (
        <div className="maps-modal">
          <IntlProvider locale={locale} messages={messages[locale]}>
            <ModalTitle className="modal--title">
              <FormattedMessage id={'mapsModal.title'} />
            </ModalTitle>
          </IntlProvider>
          {isMapLoading ? (
            <LoadingDialog size={64} />
          ) : (
            <div className="trip-info-modal__description">
              <IntlProvider locale={locale} messages={messages[locale]}>
                <MapControlButton
                  onClick={e => {
                    e.preventDefault();
                    onSetLocale(locales.find(l => l !== locale));
                  }}
                  active={false}
                  data-tip
                  data-for="locale"
                >
                  {locale.toUpperCase()}
                </MapControlButton>
                <br />

                <p>
                  <FormattedMessage id={'mapsModal.subtitle1'} />
                  <MapControlButton onClick={null} dark={true}>
                    <Icons.Layers height="30px" />
                  </MapControlButton>
                  <FormattedMessage id={'mapsModal.subtitle2'} />
                </p>

                <br />

                <StyledSampleGallery className="sample-map-gallery">
                  {maps &&
                    maps.map(m => (
                      <Map map={m} key={m.id} onClick={() => onLoadMap(m)} locale={locale} />
                    ))}
                </StyledSampleGallery>
              </IntlProvider>
            </div>
          )}
        </div>
      );
    }
  }
  return withState([], state => ({...state.app.app, ...state.app.keplerGl.map.uiState}), {
    onLoadMap: loadMap,
    onSetLocale: setLocale,
    loadMapConfigurations
  })(MapsModal);
};

export default MapsModalFactory;
