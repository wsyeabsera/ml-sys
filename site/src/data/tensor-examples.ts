export interface TensorExample {
  label: string;
  data: number[];
  shape: number[];
  description: string;
}

export const shapeExamples: { shape: number[]; label: string }[] = [
  { shape: [6], label: "1D — flat array" },
  { shape: [2, 3], label: "2D — 2 rows, 3 cols" },
  { shape: [3, 2], label: "2D — 3 rows, 2 cols" },
  { shape: [2, 3, 1], label: "3D — 2×3×1" },
  { shape: [1, 6], label: "2D — 1 row, 6 cols" },
  { shape: [6, 1], label: "2D — 6 rows, 1 col" },
];

export const defaultData = [1, 2, 3, 4, 5, 6];

export const tensorExamples: TensorExample[] = [
  {
    label: "Vector",
    data: [1, 2, 3, 4],
    shape: [4],
    description: "A 1D tensor — just a list of numbers.",
  },
  {
    label: "Matrix",
    data: [1, 2, 3, 4, 5, 6],
    shape: [2, 3],
    description: "A 2D tensor — rows and columns. shape=[2,3] means 2 rows of 3.",
  },
  {
    label: "3D Tensor",
    data: [1, 2, 3, 4, 5, 6, 7, 8],
    shape: [2, 2, 2],
    description: "A 3D tensor — like a stack of matrices.",
  },
];
