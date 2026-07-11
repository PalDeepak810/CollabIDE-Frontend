import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ content, onEdit, filePath, readOnly, onCursorChange, remoteCursors }) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const cursorWidgetsRef = useRef(new Map());
    const cursorHandlerRef = useRef(null);
    const isRemoteUpdateRef = useRef(false);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        if (cursorHandlerRef.current) cursorHandlerRef.current.dispose();
        cursorHandlerRef.current = editor.onDidChangeCursorPosition((e) => {
            if (!onCursorChange || !filePath) return;
            onCursorChange({ filePath, line: e.position.lineNumber, column: e.position.column });
        });
    };

    const handleEditorChange = (value, event) => {
        if (event.isFlush || isRemoteUpdateRef.current) return;

        event.changes.forEach(change => {
            const { rangeOffset, rangeLength, text } = change;
            if (rangeLength > 0 && text.length > 0) {
                // Replace: send as single DELETE+INSERT to keep positions consistent
                onEdit({ type: 'DELETE', position: rangeOffset, length: rangeLength, filePath });
                onEdit({ type: 'INSERT', position: rangeOffset, text, filePath });
            } else if (rangeLength > 0) {
                onEdit({ type: 'DELETE', position: rangeOffset, length: rangeLength, filePath });
            } else if (text.length > 0) {
                onEdit({ type: 'INSERT', position: rangeOffset, text, filePath });
            }
        });
    };

    // Apply remote content without resetting cursor
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || !content) return;

        const model = editor.getModel();
        if (!model) return;

        if (model.getValue() === content) return; // no-op if already in sync

        const position = editor.getPosition();
        isRemoteUpdateRef.current = true;
        model.setValue(content);
        isRemoteUpdateRef.current = false;
        if (position) editor.setPosition(position); // restore cursor
    }, [content]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || !remoteCursors) return;

        const widgetMap = cursorWidgetsRef.current;
        const nextKeys = new Set();

        Object.values(remoteCursors)
            .filter(c => c && c.line && c.column)
            .forEach(c => {
                const key = `${c.userId || c.name || 'user'}:${c.line}:${c.column}`;
                nextKeys.add(key);

                let widget = widgetMap.get(key);
                if (!widget) {
                    const domNode = document.createElement('div');
                    domNode.className = 'remote-cursor-widget';
                    const label = document.createElement('div');
                    label.className = 'remote-cursor-label';
                    label.textContent = c.name || c.userId || 'User';
                    domNode.appendChild(label);

                    widget = {
                        getId: () => `remote-cursor-${key}`,
                        getDomNode: () => domNode,
                        getPosition: () => ({
                            position: { lineNumber: c.line, column: c.column },
                            preference: [0]
                        })
                    };
                    widgetMap.set(key, widget);
                    editor.addContentWidget(widget);
                } else {
                    editor.layoutContentWidget(widget);
                }
            });

        for (const [key, widget] of widgetMap.entries()) {
            if (!nextKeys.has(key)) {
                editor.removeContentWidget(widget);
                widgetMap.delete(key);
            }
        }
    }, [remoteCursors]);

    // Determine language based on file extension
    const getLanguage = (path) => {
        if (!path) return 'javascript';
        const ext = path.split('.').pop().toLowerCase();
        switch (ext) {
            case 'js': case 'jsx': return 'javascript';
            case 'ts': case 'tsx': return 'typescript';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'java': return 'java';
            case 'py': return 'python';
            default: return 'plaintext';
        }
    };

    return (
        <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
            <Editor
                height="100%"
                language={getLanguage(filePath)}
                theme="vs-dark"
                defaultValue={content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    readOnly: readOnly,
                    automaticLayout: true,
                    padding: { top: 10 }
                }}
            />
        </div>
    );
};

export default CodeEditor;
