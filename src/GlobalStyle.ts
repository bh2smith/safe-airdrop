import avertaBoldFont from "@gnosis.pm/safe-react-components/dist/fonts/averta-bold.woff2";
import avertaFont from "@gnosis.pm/safe-react-components/dist/fonts/averta-normal.woff2";
import { createGlobalStyle } from "styled-components";

import errorIcon from "./static/error-icon.svg";

const GlobalStyle = createGlobalStyle`
    html {
        height: 100%
    }

    body {
       height: 100%;
       margin: 0px;
       padding: 0px;
    }

    #root {
        height: 100%;
        padding-right: 2rem;
    }

    .MuiFormControl-root,
    .MuiInputBase-root {
        width: 100% !important;
    }

    @font-face {
        font-family: 'Averta';
        src: local('Averta'), local('Averta Bold'),
        url(${avertaFont}) format('woff2'),
        url(${avertaBoldFont}) format('woff');
    }

    .error-marker {
        position: absolute;
        background-color: lightpink;
        display: block;
      }
    
    .error-marker:hover::after {
        content: 'DescriptionTest';
    }
    .ace_error {
        background-image: url(${errorIcon}) !important;
        background-size: 15px;
    }
    .ace_tooltip {
        font-family: 'Averta' !important;
    }

    .cardWithCustomShadow {
        box-shadow: 1px 2px 10px 0.18 #000000;
        margin-top: 16px;
    }

    .MuiPaper-elevation3 {
        box-shadow: 0px 3px 3px -2px #F7F5F5,0px 3px 4px 0px #F7F5F5,0px 1px 8px 0px #F7F5F5 !important;
    }

    .navLabel {
        flex: 1;
    }

    .tableContainer {
        display: flex;
        flex-direction: horizontal;
        gap: 16px;
        width: 100%;
    }

    .leftAlignedMenu {
        padding-top: 4px;
        justify-content: flex-start;
        padding-bottom: 4px;
    }

    .openedGenerateMenu {
        padding-left: 12px;
    }

    .generateMenu {
        width: 160px;
        border-color: rgb(247, 245, 245);
        border-radius: 8px;
    }

    .generateMenu button {
        padding: 4px;
    }

    .generateMenu button:hover {
        background-color: rgb(247, 245, 245);
        border-radius: 8px; 
    }

    .MuiFab-root.statusDotButtonEmpty {
        background-color: #4caf50;
    }

    .MuiFab-root.statusDotButtonEmpty:hover {
        background-color: #2e7d32;
        cursor: pointer;
    }

    .MuiFab-root.statusDotButtonErrors {
        background-color: #ef5350;
    }

    .MuiFab-root.statusDotButtonErrors:hover {
        background-color: #d32f2f;
        cursor: pointer;
    }

`;

export default GlobalStyle;
