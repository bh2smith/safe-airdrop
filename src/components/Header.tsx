import React from "react";
import styled from 'styled-components';

import MuiAlert from '@material-ui/lab/Alert';
import { Title } from '@gnosis.pm/safe-react-components';
import { Snackbar } from '@material-ui/core';

export function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
  }
const HeaderContainer = styled.div`
    flex: 1;
    width: 100%;
`;

export interface HeaderProps {
    lastError: { message: string };
    onCloseError :() => void;
}

export const Header = (props: HeaderProps) => {

    return (
        <HeaderContainer>
            <Title size="md">CSV Airdrop</Title>
            {props.lastError && 
            <Snackbar anchorOrigin={{vertical: 'top', horizontal: 'center'}} open={true} autoHideDuration={6000}>
                <Alert severity="error" onClose={props.onCloseError} >
                {JSON.stringify(props.lastError?.message)}
                </Alert>
            </Snackbar>
            }
        </HeaderContainer>
    );
}