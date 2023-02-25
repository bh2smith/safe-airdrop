import CloseIcon from "@mui/icons-material/Close";
import ErrorIcon from "@mui/icons-material/Error";
import { Alert, Box, IconButton, LinearProgress, Snackbar } from "@mui/material";
import { useEffect, useState } from "react";
import { selectMessages } from "src/stores/slices/messageSlice";
import { useAppSelector } from "src/stores/store";

const HIDE_TIME = 7_000;

export const MessageSnackbar = () => {
  const messages = useAppSelector(selectMessages);

  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timer | undefined = undefined;
    if (messages.messages.length > 0) {
      setOpen(true);
      setTimeLeft(HIDE_TIME);
      timer = setInterval(() => {
        setTimeLeft((previousTime) => {
          if (previousTime === 100) {
            return 0;
          }
          return previousTime - 100;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [messages.messages]);

  const onClose = () => {
    setOpen(false);
  };

  const onOpen = () => {
    setTimeLeft(HIDE_TIME - 100);
    setOpen(true);
  };

  return (
    <>
      {messages.messages.length > 0 ? (
        <div>
          <IconButton size="small" aria-label="close" color="error" disabled={open} onClick={onOpen}>
            <ErrorIcon fontSize="medium" />
          </IconButton>
        </div>
      ) : null}
      <Snackbar
        open={open}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        autoHideDuration={HIDE_TIME}
        onClose={onClose}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          <LinearProgress
            variant="determinate"
            value={100 * (timeLeft / HIDE_TIME)}
            sx={{
              borderRadius: "6px",
            }}
          />
          {messages.messages.map((message, idx) => (
            <Alert key={idx} severity={message.severity}>
              {message.message}
            </Alert>
          ))}
        </Box>
      </Snackbar>
    </>
  );
};
