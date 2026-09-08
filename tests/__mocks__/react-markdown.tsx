import React from 'react';

interface MockProps {
    children?: React.ReactNode;
    components?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

const ReactMarkdown = ({ children, components }: MockProps) => {
    if (typeof children === 'string' && components?.a) {
        const parts: React.ReactNode[] = [];
        let remaining = children;
        let key = 0;

        while (remaining) {
            const match = remaining.match(/\[(.*?)\]\((.*?)\)/);
            if (!match || match.index === undefined) {
                parts.push(remaining);
                break;
            }

            if (match.index > 0) {
                parts.push(remaining.substring(0, match.index));
            }

            const text = match[1];
            const href = match[2];
            const CustomA = components.a;
            parts.push(<CustomA key={key++} href={href}>{text}</CustomA>);

            remaining = remaining.substring(match.index + match[0].length);
        }

        return <>{parts}</>;
    }

    return <>{children}</>;
};

export default ReactMarkdown;
