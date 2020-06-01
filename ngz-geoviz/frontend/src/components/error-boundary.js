import React from "react";
import styled from "styled-components";

const StyledError = styled.div`

    color: ${props => props.theme.textColor};
    font-weight: 500;
    margin-bottom: 5px;

`;


export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log("Critical error occurred", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <StyledError>Something unexpected happened. Please refresh the site.</StyledError>;
    }
    return this.props.children;
  }
}
