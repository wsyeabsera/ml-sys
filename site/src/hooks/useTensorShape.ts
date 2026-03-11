import { useState, useMemo } from "react";
import {
  computeStrides,
  flatToMultiIndex,
  indexTo3DPosition,
  shapeSize,
} from "../lib/tensor-math";

export function useTensorShape(initialData: number[] = [1, 2, 3, 4, 5, 6]) {
  const [data] = useState(initialData);
  const [shape, setShape] = useState<number[]>([data.length]);

  const strides = useMemo(() => computeStrides(shape), [shape]);

  const elements = useMemo(() => {
    return data.map((value, flatIndex) => {
      const indices = flatToMultiIndex(flatIndex, shape);
      const position = indexTo3DPosition(indices, shape);
      return { value, flatIndex, indices, position };
    });
  }, [data, shape]);

  const canReshape = (newShape: number[]) =>
    shapeSize(newShape) === data.length;

  return { data, shape, setShape, strides, elements, canReshape };
}
