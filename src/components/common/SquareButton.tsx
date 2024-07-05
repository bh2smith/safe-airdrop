import { Tooltip, Button } from "@mui/material";
import { ReactNode } from "react";

export const SquareButton = ({ icon, onClick, title }: { icon: ReactNode; onClick: () => void; title: string }) => {
  return (
    <Tooltip title={title} arrow>
      <Button
        color="secondary"
        sx={{
          width: "48px",
          height: "48px",
          borderRadius: "4px",
        }}
        onClick={onClick}
      >
        {icon}
      </Button>
    </Tooltip>
  );
};
