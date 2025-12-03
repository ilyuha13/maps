import { useEffect, useLayoutEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw.js";
import { Circle, Fill, Stroke, Style } from "ol/style.js";
import css from "./MapComponents.module.css";
import PointerInteraction from "ol/interaction/Pointer.js";
import { Feature } from "ol";
import { Point, Polygon, type Geometry } from "ol/geom";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import { intersectingTest } from "../../helpers";
import { fromLonLat } from "ol/proj";
import type { Coordinates } from "../../types";
import type { Coordinate } from "ol/coordinate";
import { BASE_COORDINATES } from "../../constants";

export const MapComponent = ({
  coordinate,
  handleCheck,
}: {
  coordinate?: Coordinates;
  handleCheck: boolean;
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const isPolygonHoveredRef = useRef(false);
  const polygonFeatureRef = useRef<Feature<Geometry>>(null);
  const isIntersectingRef = useRef(false);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const coordinateesRef = useRef<Coordinate | null>(null);
  const polygonDrawRef = useRef<Draw | null>(null);

  const createMarker = (coordinate: number[]) => {
    const marker = new Feature({
      geometry: new Point(coordinate),
    });
    marker.setStyle(
      new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: "blue" }),
          stroke: new Stroke({ color: "white", width: 3 }),
        }),
      })
    );
    return marker;
  };

  const normalStyle = new Style({
    fill: new Fill({
      color: "rgba(0, 255, 0, 0.3)",
    }),
    stroke: new Stroke({
      color: "green",
      width: 1,
    }),
  });

  const deletingStyle = new Style({
    fill: new Fill({
      color: "rgba(255, 0, 0, 0.1)",
    }),
    stroke: new Stroke({
      color: "red",
      width: 1,
    }),
  });

  useLayoutEffect(() => {
    if (!mapRef.current) return;
    const tileLayer = new TileLayer({
      source: new OSM(),
    });
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;
    const markerLayer = new VectorLayer({
      source: markerSource,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer, markerLayer],
      view: new View({
        center: BASE_COORDINATES,
        zoom: 10,
      }),
    });

    const polygonDraw = new Draw({
      source: vectorSource,
      type: "Polygon",
      minPoints: 3,
      maxPoints: 20,
      condition: () => !isIntersectingRef.current,
    });
    polygonDrawRef.current = polygonDraw;

    map.addInteraction(polygonDraw);

    polygonDraw.on("drawstart", (event) => {
      polygonFeatureRef.current = event.feature;
      map.addInteraction(checkInteraction);
    });

    polygonDraw.on("drawend", () => {
      polygonDraw.setActive(false);
      map.removeInteraction(checkInteraction);
    });

    const deletePolygonFromClick = new PointerInteraction({
      handleMoveEvent: (event) => {
        const feature = vectorSourceRef.current?.getFeaturesAtCoordinate(
          event.coordinate
        )[0];

        const isPolygonHovered = !!feature;
        if (isPolygonHovered !== isPolygonHoveredRef.current) {
          isPolygonHoveredRef.current = isPolygonHovered;
          polygonFeatureRef.current?.setStyle(
            isPolygonHovered ? deletingStyle : normalStyle
          );
        }

        return false;
      },
    });

    map.on("dblclick", (event) => {
      if (!polygonFeatureRef.current || !isPolygonHoveredRef.current) return;

      event.stopPropagation();
      vectorSourceRef.current?.removeFeature(polygonFeatureRef.current);
      polygonDrawRef.current?.setActive(true);
    });
    map.addInteraction(deletePolygonFromClick);

    const checkInteraction = new PointerInteraction({
      handleMoveEvent: () => {
        const geometry = polygonFeatureRef.current?.getGeometry();

        let coordinates: number[][] = [];

        if (geometry instanceof SimpleGeometry) {
          coordinates = geometry.getCoordinates()?.[0];
        }

        isIntersectingRef.current = intersectingTest(coordinates);
        if (isIntersectingRef.current) {
          polygonFeatureRef.current?.setStyle(deletingStyle);
        } else {
          polygonFeatureRef.current?.setStyle(normalStyle);
        }
        return false;
      },
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
      map.dispose();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!coordinate) return;
    if (!coordinate.latitude || !coordinate.longitude) return;
    if (!mapInstance.current) return;
    if (!markerSourceRef.current) return;

    markerSourceRef.current.clear();

    const olCoords = fromLonLat([
      parseFloat(coordinate.longitude),
      parseFloat(coordinate.latitude),
    ]);

    coordinateesRef.current = olCoords;

    const marker = createMarker(olCoords);
    markerSourceRef.current.addFeature(marker);

    const view = mapInstance.current.getView();
    view.setCenter(olCoords);
  }, [coordinate]);

  useEffect(() => {
    if (!polygonFeatureRef.current) return;
    if (!coordinateesRef.current) return;

    const isInsidePolygon = (
      coordinate: number[],
      polygon: Polygon
    ): boolean => {
      return polygon.intersectsCoordinate(coordinate);
    };

    const polygonGeometry = polygonFeatureRef.current.getGeometry() as Polygon;

    if (isInsidePolygon(coordinateesRef.current, polygonGeometry)) {
      console.log("Точка внутри полигона");
    }
  }, [handleCheck]);

  return <div ref={mapRef} className={css.map} />;
};
