import { selectCsvContent } from "src/stores/slices/csvEditorSlice";
import { useAppSelector } from "src/stores/store";

export const useCsvContent = () => useAppSelector(selectCsvContent);
