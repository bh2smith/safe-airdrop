import React from "react";
import AceEditor, { IMarker, IAnnotation } from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-text";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import styled from "styled-components";

import { updateCsvContent } from "../stores/slices/csvEditorSlice";

const EditorWrapper = styled.div``;

export type CSVEditorProps = {};

export const CSVEditor = (props: CSVEditorProps): JSX.Element => {
  const { codeWarnings } = useSelector((state: RootState) => state.messages);
  const dispatch = useDispatch();
  const csvText = useSelector((state: RootState) => state.csvEditor.csvContent);

  return (
    <EditorWrapper>
      <AceEditor
        onChange={(newCode) => dispatch(updateCsvContent({ csvContent: newCode }))}
        value={csvText}
        theme="tomorrow"
        width={"100%"}
        mode={"text"}
        minLines={6}
        maxLines={20}
        setOptions={{
          firstLineNumber: 0,
        }}
        showPrintMargin={false}
        style={{
          borderWidth: 1,
          borderColor: "rgba(0, 0, 0, 0.23)",
          borderRadius: "4px",
          borderStyle: "solid",
          boxShadow: "#F7F5F5 1px 2px 4px 0px",
        }}
        markers={codeWarnings.map(
          (warning): IMarker => ({
            startRow: warning.lineNo,
            endRow: warning.lineNo,
            className: "error-marker",
            type: "fullLine",
            startCol: 0,
            endCol: 30,
          }),
        )}
        annotations={codeWarnings.map(
          (warning): IAnnotation => ({
            row: warning.lineNo,
            type: "error",
            column: 0,
            text: warning.message,
          }),
        )}
      />
    </EditorWrapper>
  );
};
