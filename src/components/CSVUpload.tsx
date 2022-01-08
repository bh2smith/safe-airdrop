import { Button, Text, theme as GnosisTheme } from "@gnosis.pm/safe-react-components";
import { createStyles } from "@material-ui/core";
import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";

export type CSVUploadProps = {
  onChange: (string) => void;
};

export const CSVUpload = (props: CSVUploadProps): JSX.Element => {
  const { onChange } = props;
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        console.log("Received Filename", file.name);
        const reader = new FileReader();
        reader.onload = function (evt) {
          if (!evt.target) {
            return;
          }
          onChange(evt.target.result as string);
        };
        reader.readAsText(file);
      });
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    maxFiles: 1,
    onDrop,
    accept: "text/csv",
  });

  const style = useMemo(
    () => ({
      ...styles.baseStyle,
      ...(isDragActive ? styles.activeStyle : {}),
      ...(isDragAccept ? styles.acceptStyle : {}),
      ...(isDragReject ? styles.rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept],
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
          <Button size="md" variant="contained" color="primary" component="span">
            Upload CSV
          </Button>
          <Text center size="lg">
            or drop file here
          </Text>
        </div>
      </div>
    </div>
  );
};

const styles = createStyles({
  baseStyle: {
    lex: 1,
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    padding: "20px",
    borderWidth: 2,
    borderRadius: 2,
    width: "660px",
    borderColor: "rgba(0, 0, 0, 0.23)",
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
    color: "#bdbdbd",
    outline: "none",
    transition: "border .24s ease-in-out",
  },
  activeStyle: {
    borderColor: "#2196f3",
  },
  acceptStyle: {
    borderColor: GnosisTheme.colors.primary,
  },
  rejectStyle: {
    borderColor: GnosisTheme.colors.error,
  },
});
