const style = `
:host {
    display: inline-block;
    padding: 6px 10px;
    border-radius: 200px;
}

:host(:state(primary)) {
    background-color: #363a5b;
    color: white;
}

:host > .wrapper {
    display: flex;
    align-items: center;
}

:host bnum-shadow-icon {
    display: flex;
    margin-%0: %1;
}
`;

export default style;
