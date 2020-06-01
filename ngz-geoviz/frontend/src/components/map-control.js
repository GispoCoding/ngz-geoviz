import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { IconRoundSmall, Icons, MapControlButton, MapControlFactory } from "kepler.gl/components";
import ReactMarkdown from "react-markdown";
import { createIntl, FormattedMessage, RawIntlProvider } from "react-intl";
import { Tooltip } from "kepler.gl";
import bboxPolygon from "@turf/bbox-polygon";
import { MAPS_MODAL_OPTIONS } from "../constants/default-settings";
import { messages } from "../constants/locale";
import StatisticsContainer from "./statistics-container";
import { ErrorBoundary } from "./error-boundary";

const MapControl = MapControlFactory();

const StyledMapControlOverlay = styled.div`
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 1;
`;

const StyledFloatingPanel = styled.div`
  margin-right: 12px;
  margin-top: 20px;
`;

const StyledProjectPanel = styled.div`
  ${props => props.theme.sidePanelScrollBar};
  background: ${props => props.theme.panelBackground};
  padding: 16px 20px;
  width: ${props => (props.hasStatistics ? '320px' : '280px')};
  box-shadow: ${props => props.theme.panelBoxShadow};

  .project-title {
    color: ${props => props.theme.titleTextColor};
    font-size: 13px;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
  }

  .project-content {
    ${props => props.theme.sidePanelScrollBar};
    max-height: 300px;
    overflow-y: auto;
  }

  .zoom-text {
    color: ${props => props.theme.textColor};
    font-weight: 500;
    margin-bottom: 5px;
  }

  .project-description {
    color: ${props => props.theme.textColor};
    font-size: 11px;
    margin-top: 12px;

    a {
      font-weight: 500;
      color: ${props => props.theme.titleTextColor};
    }
  }

  .project-links {
    margin-top: 20px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
`;
const StyledPanelAction = styled.div`
  border-radius: 2px;
  margin-left: 4px;
  padding: 5px;
  font-weight: 500;

  a {
    align-items: center;
    justify-content: flex-start;
    display: flex;
    height: 16px;
    padding-right: 10px;
    color: ${props => (props.active ? props.theme.textColorHl : props.theme.subtextColor)};

    svg {
      margin-right: 8px;
    }
  }

  :hover {
    cursor: pointer;
    a {
      color: ${props => props.theme.textColorHl};
    }
  }
`;

const StyledMapControlAction = styled.div`
  padding: 0 0;
  display: flex;
  justify-content: flex-end;
`;

const ActionPanel = ({className, children}) => (
  <StyledMapControlAction className={className}>{children}</StyledMapControlAction>
);

export const LinkButton = props => (
  <StyledPanelAction className="project-link__action">
    <a target="_blank" rel="noopener noreferrer" href={props.href}>
      <props.iconComponent height={props.height || '16px'} />
      <p>{props.label}</p>
    </a>
  </StyledPanelAction>
);

const CloseButton = ({onClick}) => (
  <IconRoundSmall>
    <Icons.Close height="16px" onClick={onClick} />
  </IconRoundSmall>
);

const LinkRenderer = props => {
  return (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
};

const InfoPanel = React.memo(({locale, currentDetails, currentStatistics, datasets, mapboxRef}) => {
  const [isActive, setActive] = useState(true);
  const dialogStatistics = useMemo(() => currentStatistics.filter(stat => !stat.inPopup), [
    currentStatistics
  ]);

  const intl = useMemo(() => {
    const statisticsLabels = dialogStatistics.reduce((acc, curr) => {
      acc[curr.id] = locale === 'fi' ? curr.labelFi : curr.labelEn;
      return acc;
    }, {});

    return createIntl({
      locale,
      messages: {...currentDetails[locale], ...statisticsLabels, ...messages[locale]}
    });
  }, [locale, currentDetails, dialogStatistics]);

  const mapboxMap = useMemo(() => mapboxRef && mapboxRef.getMap(), [mapboxRef]);

  const bbox = useMemo(() => {
    if (!mapboxMap) return null;
    const bounds = mapboxMap.getBounds();
    const round = num => Math.round((num + Number.EPSILON) * 100) / 100;

    // extent in minX, minY, maxX, maxY order
    return bboxPolygon([
      round(bounds._sw.lng),
      round(bounds._sw.lat),
      round(bounds._ne.lng),
      round(bounds._ne.lat)
    ]);
  }, [mapboxMap && mapboxMap.getBounds()]);

  return (
    <StyledFloatingPanel>
      {isActive ? (
        <StyledProjectPanel hasStatistics={dialogStatistics && dialogStatistics.length}>
          <RawIntlProvider value={intl}>
            <div className="project-title">
              <div>
                <FormattedMessage id={'label'} />
              </div>
              <CloseButton onClick={() => setActive(false)} />
            </div>
            <div className="project-content">
              <ErrorBoundary>
                <div className="project-statistics">
                  {dialogStatistics.map(statistics => (
                    <StatisticsContainer
                      key={statistics.id}
                      statistics={statistics}
                      intl={intl}
                      dataset={datasets && datasets[statistics.layerId]}
                      bbox={bbox}
                    />
                  ))}
                </div>
              </ErrorBoundary>

              <div className="project-description">
                <ReactMarkdown
                  source={intl.formatMessage({id: 'detail'})}
                  renderers={{link: LinkRenderer}}
                />
              </div>
            </div>
            <div className="project-links">
              <LinkButton
                label="Data"
                href={intl.formatMessage({id: 'dataurl'})}
                iconComponent={Icons.Files}
                height="15px"
              />
              {/* <LinkButton
              label="Config"
              href={getURL(props.currentDetails.configUrl)}
              iconComponent={Icons.CodeAlt}
              height="17px"
            /> */}
            </div>
          </RawIntlProvider>
        </StyledProjectPanel>
      ) : (
        <MapControlButton
          onClick={e => {
            e.preventDefault();
            setActive(true);
          }}
        >
          <Icons.Docs height="18px" />
        </MapControlButton>
      )}
    </StyledFloatingPanel>
  );
});

const ToggleMapsModalButton = React.memo(({openModal}) => (
  <StyledFloatingPanel>
    <MapControlButton
      onClick={e => {
        e.preventDefault();
        openModal(MAPS_MODAL_OPTIONS);
      }}
    >
      <Icons.Layers height="30px" />
      <Tooltip id={'toggle-maps-modal'} place="left" effect="solid">
        <span>Näytä karttavalinta</span>
      </Tooltip>
    </MapControlButton>
  </StyledFloatingPanel>
));

const CustomMapControl = props => (
  <StyledMapControlOverlay>
    <ActionPanel key={1}>
      <ToggleMapsModalButton {...props} />
    </ActionPanel>
    {props.currentDetails ? <InfoPanel {...props} /> : null}

    <MapControl {...props} />
  </StyledMapControlOverlay>
);

export default CustomMapControl;
