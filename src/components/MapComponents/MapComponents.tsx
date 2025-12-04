import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw.js";
import { Circle, Fill, Stroke, Style } from "ol/style.js";
import PointerInteraction from "ol/interaction/Pointer.js";
import { Feature } from "ol";
import { Point, Polygon, type Geometry } from "ol/geom";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import { intersectingTest } from "../../helpers";
import { fromLonLat } from "ol/proj";
import type { Coordinates } from "../../types";
import type { Coordinate } from "ol/coordinate";
import css from "./MapComponents.module.css";

const BASE_COORDINATES = [5332194.336084221, 7685742.579137978];

const POLYGON_STYLES = {
  normal: new Style({
    fill: new Fill({ color: "rgba(0, 255, 0, 0.3)" }),
    stroke: new Stroke({ color: "green", width: 1 }),
  }),
  error: new Style({
    fill: new Fill({ color: "rgba(255, 0, 0, 0.1)" }),
    stroke: new Stroke({ color: "red", width: 1 }),
  }),
};

export const MapComponent = ({
  coordinate,
  trigerCheck,
  onCheckResult,
}: {
  coordinate?: Coordinates;
  trigerCheck: boolean;
  onCheckResult: (result: boolean | null) => void;
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const polygonFeatureRef = useRef<Feature<Geometry> | null>(null);
  const polygonDrawRef = useRef<Draw | null>(null);
  const coordinatesRef = useRef<Coordinate | null>(null);
  const isPolygonHoveredRef = useRef(false);
  const isIntersectingRef = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!mapRef.current) return;

    const tileLayer = new TileLayer({ source: new OSM() });

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;
    const vectorLayer = new VectorLayer({ source: vectorSource });

    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;
    const markerLayer = new VectorLayer({ source: markerSource });

    const map = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer, markerLayer],
      view: new View({
        center: BASE_COORDINATES,
        zoom: 10,
      }),
    });

    mapInstance.current = map;

    const polygonDraw = new Draw({
      source: vectorSource,
      type: "Polygon",
      minPoints: 3,
      maxPoints: 20,
      condition: () => !isIntersectingRef.current,
    });
    polygonDrawRef.current = polygonDraw;

    const intersectionCheckInteraction = new PointerInteraction({
      handleMoveEvent: () => {
        const geometry = polygonFeatureRef.current?.getGeometry();
        if (!geometry || !(geometry instanceof SimpleGeometry)) {
          return false;
        }

        const coordinates = geometry.getCoordinates()?.[0] || [];
        isIntersectingRef.current = intersectingTest(coordinates);

        polygonFeatureRef.current?.setStyle(
          isIntersectingRef.current
            ? POLYGON_STYLES.error
            : POLYGON_STYLES.normal
        );

        return false;
      },
    });

    polygonDraw.on("drawstart", (event) => {
      polygonFeatureRef.current = event.feature;
      map.addInteraction(intersectionCheckInteraction);
    });

    polygonDraw.on("drawend", () => {
      polygonDraw.setActive(false);
      map.removeInteraction(intersectionCheckInteraction);
    });

    map.addInteraction(polygonDraw);

    const hoverInteraction = new PointerInteraction({
      handleMoveEvent: (event) => {
        const feature = vectorSourceRef.current?.getFeaturesAtCoordinate(
          event.coordinate
        )[0];

        const isHovered = !!feature;
        if (isHovered !== isPolygonHoveredRef.current) {
          isPolygonHoveredRef.current = isHovered;
          polygonFeatureRef.current?.setStyle(
            isHovered ? POLYGON_STYLES.error : POLYGON_STYLES.normal
          );
        }

        return false;
      },
    });

    map.on("dblclick", (event) => {
      if (!polygonFeatureRef.current || !isPolygonHoveredRef.current) return;

      event.stopPropagation();
      vectorSourceRef.current?.removeFeature(polygonFeatureRef.current);
      polygonFeatureRef.current = null;
      polygonDrawRef.current?.setActive(true);
    });

    map.addInteraction(hoverInteraction);

    return () => {
      map.setTarget(undefined);
      map.dispose();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!coordinate?.latitude || !coordinate?.longitude) return;
    if (!mapInstance.current || !markerSourceRef.current) return;

    markerSourceRef.current.clear();

    const olCoords = fromLonLat([
      parseFloat(coordinate.longitude),
      parseFloat(coordinate.latitude),
    ]);

    coordinatesRef.current = olCoords;

    const marker = new Feature({ geometry: new Point(olCoords) });
    marker.setStyle(
      new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: "blue" }),
          stroke: new Stroke({ color: "white", width: 3 }),
        }),
      })
    );

    markerSourceRef.current.addFeature(marker);

    mapInstance.current.getView().setCenter(olCoords);
  }, [coordinate]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!polygonFeatureRef.current || !coordinatesRef.current) {
      onCheckResult(null);
      return;
    }

    const polygonGeometry = polygonFeatureRef.current.getGeometry() as Polygon;
    const isInside = polygonGeometry.intersectsCoordinate(
      coordinatesRef.current
    );

    onCheckResult(isInside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigerCheck]);

  return <div ref={mapRef} className={css.map} />;
};
