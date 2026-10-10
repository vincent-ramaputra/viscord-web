import { MouseEvent, ReactNode } from "react";
import styled from "styled-components";


const ModalBackground = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 69;
    background-color: rgba(0, 0, 0, 0.7);
    justify-content: center;
    align-items: center;
    display: flex;
`


export default function Modal({children, onClose}: {children: ReactNode, onClose: () => void}) {
    
    function hideModal(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }
    
    return (
        <ModalBackground onClick={hideModal}>
            {children}
        </ModalBackground>
    )
}