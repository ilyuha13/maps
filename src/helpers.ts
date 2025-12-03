import type { AddressData, DaDataSuggestion } from "./types";

// Функция проверки пересечения двух отрезков
function segmentsIntersect(
  p1: number[],
  p2: number[],
  p3: number[],
  p4: number[]
) {
  const ccw = (A: number[], B: number[], C: number[]) => {
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
  };

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

// Функция проверки, находится ли курсор близко к первой точке (замыкание)
function isClosingPolygon(
  currentPoint: number[],
  firstPoint: number[],
  threshold = 10
): boolean {
  const dx = currentPoint[0] - firstPoint[0];
  const dy = currentPoint[1] - firstPoint[1];
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < threshold;
}

// Функция проверки пересечения текущего сегмента с предыдущими
export const intersectingTest = (coordinates: number[][]) => {
  if (!coordinates || coordinates.length < 3) {
    return false; // Нужно минимум 3 точки
  }

  const points = coordinates.slice(0, -1); // Убираем замыкающую точку

  if (points.length < 2) {
    return false; // Нужно минимум 2 точки для сегмента
  }

  // ТЕКУЩИЙ РИСУЕМЫЙ СЕГМЕНТ
  const currentSegmentEnd = points[points.length - 1]; // курсор
  const currentSegmentStart = points[points.length - 2]; // последняя точка

  // Проверяем со ВСЕМИ предыдущими сегментами (кроме соседнего)

  let hasIntersection = false;

  for (let i = 0; i < points.length - 3; i++) {
    const segStart = points[i];
    const segEnd = points[i + 1];

    // 2. Пропускаем проверку с первым сегментом при замыкании
    // Замыкание происходит, когда курсор близко к первой точке
    if (i === 0 && isClosingPolygon(currentSegmentEnd, points[0])) {
      continue;
    }

    const intersect = segmentsIntersect(
      currentSegmentStart,
      currentSegmentEnd,
      segStart,
      segEnd
    );

    if (intersect) {
      hasIntersection = true;
      break;
    }
  }
  return hasIntersection;
};

export const getFormatAddressData = (suggestion: DaDataSuggestion) => {
  const addressData: AddressData = {
    fullAddress: suggestion.value,
    // Структурированные данные
    region: suggestion.data.region_with_type,
    city:
      suggestion.data.city_with_type || suggestion.data.settlement_with_type,
    street: suggestion.data.street_with_type,
    house: suggestion.data.house,
    flat: suggestion.data.flat,
    postalCode: suggestion.data.postal_code,
    // Координаты
    coordinates: {
      latitude: suggestion.data.geo_lat,
      longitude: suggestion.data.geo_lon,
    },
    // Дополнительная информация
    fiasId: suggestion.data.fias_id,
    kladrId: suggestion.data.kladr_id,
    qc: suggestion.data.qc, // Код качества (0 - точный адрес)
    // Полные данные
    rawData: suggestion.data,
  };

  return addressData;
};
