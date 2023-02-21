import { Link, Typography, useTheme } from "@mui/material";
import { createStyles } from "@mui/styles";
import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch } from "react-redux";

import { updateCsvContent } from "../stores/slices/csvEditorSlice";

export type CSVUploadProps = {};

export const CSVUpload = (props: CSVUploadProps): JSX.Element => {
  const theme = useTheme();
  const styles = createStyles({
    baseStyle: {
      alignItems: "center",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      cursor: "pointer",
      padding: "24px 40px",
      background: theme.palette.secondary.background,
      color: theme.palette.primary.light,
      transition: "border 0.5s, background 0.5s",
      border: `1px dashed ${theme.palette.secondary.dark}`,
    },
    activeStyle: {
      border: `1px dashed ${theme.palette.primary.main}`,
    },
    acceptStyle: {
      borderColor: `1px dashed ${theme.palette.primary.main}`,
    },
    rejectStyle: {
      borderColor: `1px dashed ${theme.palette.error.dark}`,
    },
  });
  const dispatch = useDispatch();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (evt) {
          if (!evt.target) {
            return;
          }
          dispatch(
            updateCsvContent({
              csvContent: evt.target.result as string,
            }),
          );
        };
        reader.readAsText(file);
      });
    },
    [dispatch],
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    maxFiles: 1,
    onDrop,
    accept: {
      text: [".csv"],
    },
  });

  const style = useMemo(
    () => ({
      ...styles.baseStyle,
      ...(isDragActive ? styles.activeStyle : {}),
      ...(isDragAccept ? styles.acceptStyle : {}),
      ...(isDragReject ? styles.rejectStyle : {}),
    }),
    [styles, isDragActive, isDragAccept, isDragReject],
  );

  return (
    <div>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <div
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Typography>
            Drag and drop a CSV file or{" "}
            <Link href="#" color="secondary">
              choose a file
            </Link>{" "}
          </Typography>
        </div>
      </div>
    </div>
  );
};
