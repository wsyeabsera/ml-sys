/** Compute row-major strides from shape — mirrors rs-tensor/src/tensor.rs:28-34 */
export function computeStrides(shape: number[]): number[] {
  const strides = new Array(shape.length);
  let stride = 1;
  for (let i = shape.length - 1; i >= 0; i--) {
    strides[i] = stride;
    stride *= shape[i];
  }
  return strides;
}

/** Convert flat index to multi-dimensional indices */
export function flatToMultiIndex(flat: number, shape: number[]): number[] {
  const strides = computeStrides(shape);
  const indices = new Array(shape.length);
  let remaining = flat;
  for (let i = 0; i < shape.length; i++) {
    indices[i] = Math.floor(remaining / strides[i]);
    remaining %= strides[i];
  }
  return indices;
}

/** Convert multi-dimensional indices to flat index — mirrors the indexing formula */
export function multiIndexToFlat(
  indices: number[],
  strides: number[]
): number {
  let flat = 0;
  for (let i = 0; i < indices.length; i++) {
    flat += indices[i] * strides[i];
  }
  return flat;
}

/** Total number of elements from shape */
export function shapeSize(shape: number[]): number {
  return shape.reduce((a, b) => a * b, 1);
}

/** Validate that a reshape is legal (same total elements) */
export function validateReshape(
  currentSize: number,
  newShape: number[]
): boolean {
  return shapeSize(newShape) === currentSize;
}

/** Get 3D position for a tensor element given its multi-dim indices */
export function indexTo3DPosition(
  indices: number[],
  shape: number[],
  spacing = 1.2
): [number, number, number] {
  // Pad to 3D
  const idx = [...indices];
  while (idx.length < 3) idx.unshift(0);
  const s = [...shape];
  while (s.length < 3) s.unshift(1);

  // Center the grid
  const x = (idx[2] - (s[2] - 1) / 2) * spacing;
  const y = -((idx[1] - (s[1] - 1) / 2) * spacing); // flip y
  const z = (idx[0] - (s[0] - 1) / 2) * spacing;

  return [x, y, z];
}
