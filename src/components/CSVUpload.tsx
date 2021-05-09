import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Button, Link, Text } from "@gnosis.pm/safe-react-components";
import { createStyles } from "@material-ui/core";

export type CSVUploadProps = {
  onChange: (string) => void;
};

export const CSVUpload = (props: CSVUploadProps) => {
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
    [onChange]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
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
    [isDragActive, isDragReject, isDragAccept]
  );

  return (
    <div>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <input
          accept="text/csv"
          id="csvUploadButton"
          type="file"
          name="file"
          onChange={onChange}
          style={{ display: "none" }}
        />
        <label htmlFor="csvUploadButton">
          <div
            style={{
              display: "inline-flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Button
              size="md"
              variant="contained"
              color="primary"
              component="span"
            >
              Upload CSV
            </Button>
            <Text center size="lg">
              or drop file here
            </Text>
          </div>
        </label>
      </div>
      <div>
        <Link href="./sample.csv" download>
          Sample Transfer File
        </Link>
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
    borderColor: "#eeeeee",
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
    borderColor: "#008C73",
  },
  rejectStyle: {
    borderColor: "#ff1744",
  },
});
