import styled from "styled-components";
import { FaTrashCan } from "react-icons/fa6";
import GenericFileIcon from "../generic-file-icon/generic-file-icon";

const List = styled.ul`
    display: flex;
    gap: 24px;
    padding: 20px 26px 10px 10px;
    overflow-x: auto;
`

const Card = styled.li`
    position: relative;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    width: 216px;
    height: 216px;
    padding: 8px;
    background-color: var(--background-secondary);
    border-radius: 4px;
    border: 1px solid var(--border-faint);
`

const IconWrapper = styled.div`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`

const FileName = styled.p`
    margin-top: 8px;
    font-size: var(--text-base);
    color: var(--text-default);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

// Sits on the card's top-right corner and pokes out past its right edge, like Discord's.
const ActionBar = styled.div`
    position: absolute;
    top: 0;
    right: -16px;
    display: flex;
    background-color: var(--background-primary);
    box-shadow: 0 0 0 1px rgba(4, 4, 5, 0.15);
    border-radius: 4px;
`

const ActionButton = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: ${props => props.$danger ? 'var(--status-danger)' : 'var(--interactive-normal)'};
    border-radius: 4px;

    &:hover {
        background-color: var(--background-modifier-hover);
        color: ${props => props.$danger ? 'var(--status-danger-hover)' : 'var(--interactive-hover)'};
    }
`

export default function AttachmentUploadList({ files, onRemove }: { files: File[], onRemove: (index: number) => void }) {
    if (files.length === 0) return null;

    return (
        <List>
            {files.map((file, i) => (
                <Card key={`${file.name}-${file.lastModified}-${i}`}>
                    <ActionBar>
                        <ActionButton type="button" $danger aria-label={`Remove ${file.name}`} onClick={() => onRemove(i)}>
                            <FaTrashCan size={16} />
                        </ActionButton>
                    </ActionBar>
                    <IconWrapper>
                        <GenericFileIcon />
                    </IconWrapper>
                    <FileName title={file.name}>{file.name}</FileName>
                </Card>
            ))}
        </List>
    );
}
