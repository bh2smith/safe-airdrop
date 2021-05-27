import React, { useContext } from "react";
import AceEditor, { IMarker, IAnnotation } from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-text";
import styled from "styled-components";

import { MessageContext } from "../../src/contexts/MessageContextProvider";

const EditorWrapper = styled.div``;

export type CSVEditorProps = {
  onChange: (csvContent: string) => void;
  csvText: string;
};

export const CSVEditor = (props: CSVEditorProps): JSX.Element => {
  const { codeWarnings } = useContext(MessageContext);
  return (
    <EditorWrapper>
      <AceEditor
        onChange={(newCode) => props.onChange(newCode)}
        value={props.csvText}
        theme="tomorrow"
        width={"700px"}
        mode={"text"}
        minLines={6}
        maxLines={32}
        setOptions={{
          firstLineNumber: 0,
        }}
        showPrintMargin={false}
        style={{
          borderWidth: 1,
          borderColor: "rgba(0, 0, 0, 0.23)",
          borderRadius: "4px",
          borderStyle: "solid",
          boxShadow: "rgba(40, 54, 61, 0.12) 1px 2px 4px 0px",
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
