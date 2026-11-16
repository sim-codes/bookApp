import { Colors } from '@/constants';
import { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

interface TxtPageProps {
    text: string;
    style: StyleProp<TextStyle>;
    onDefine: (word: string) => void;
}

export const TxtPage = memo(function TxtPage({ text, style, onDefine }: TxtPageProps) {
    const [pressedIndex, setPressedIndex] = useState<number | null>(null);
    const tokens = useMemo(() => text.split(/(\s+)/), [text]);

    return (
        <Text style={style}>
            {tokens.map((token, index) =>
                index % 2 === 1 || !token ? (
                    token
                ) : (
                    <Text
                        key={index}
                        style={pressedIndex === index ? styles.pressed : undefined}
                        onLongPress={() => {
                            setPressedIndex(index);
                            onDefine(token);
                        }}
                        onPressOut={() => setPressedIndex(null)}
                    >
                        {token}
                    </Text>
                ),
            )}
        </Text>
    );
});

const styles = StyleSheet.create({
    pressed: {
        backgroundColor: Colors.primary + '33',
    },
});
