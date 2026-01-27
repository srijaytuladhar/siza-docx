export type BlockType = 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet-list' | 'numbered-list' | 'code' | 'quote';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
}

export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: number;
    updatedAt: number;
}

export interface DocumentModel {
    id: string;
    title: string;
    blocks: Block[];
    parentId: string | null;
    createdAt: number;
    updatedAt: number;
}
