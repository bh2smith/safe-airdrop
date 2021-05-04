import React from "react";
import styled from 'styled-components';

import MuiAlert from '@material-ui/lab/Alert';

export const Container = styled.div`
margin-left: 8px;
display: flex;
flex-direction: column;
flex: 1;
justify-content: left;
width: 100%;
`;

export const Header = styled.div`
    flex: 1;
    width: 100%;
`;

export const Form = styled.div`
    flex: 1;
    flex-direction: column;
    display: flex;
    justify-content: space-around;
    gap: 8px;
`

export function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
  }
