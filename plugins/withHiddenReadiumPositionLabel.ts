import { ConfigPlugin, createRunOncePlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

// Keeps react-native-readium's view ids (its view binding needs them) but sizes the position label to nothing.
const FRAGMENT_READER_LAYOUT = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/reader_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <FrameLayout
        android:id="@+id/fragment_reader_container"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <TextView
        android:id="@+id/position_label"
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:textSize="0sp"
        android:visibility="gone" />

</FrameLayout>
`;

const withHiddenReadiumPositionLabel: ConfigPlugin = (config) =>
    withDangerousMod(config, [
        'android',
        (configProps: any) => {
            const layoutDir = path.join(configProps.modRequest.platformProjectRoot, 'app/src/main/res/layout');
            fs.mkdirSync(layoutDir, { recursive: true });
            fs.writeFileSync(path.join(layoutDir, 'fragment_reader.xml'), FRAGMENT_READER_LAYOUT);
            return configProps;
        },
    ]);

export default createRunOncePlugin(
    withHiddenReadiumPositionLabel,
    'with-hidden-readium-position-label',
    '1.0.0',
);
