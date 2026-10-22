import {
Fit,
RiveView,
useRiveFile,
useViewModelInstance,
type RiveFile,
type ViewModelInstance,
} from '@rive-app/react-native';
import { useCallback,useEffect,useRef,useState } from 'react';
import { Pressable,StyleSheet,Text,View,type ViewStyle } from 'react-native';
import { Gesture,GestureDetector } from 'react-native-gesture-handler';
import Animated,{ useAnimatedStyle,useSharedValue,withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useFrameMeter } from '../lib/useFrameMeter';

// Test A from docs/ideas/tech-stack.md: Dombi's real .riv with transparent effect
// overlays, `viseme` and `amp` set every frame during a drag, a trigger fired back
// from the file, and a tap listener inside the artboard.

// Metro bundles native assets through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DOMBI_FILE = require('../../assets/rive/dombi.riv');
const FX_MACHINE = 'State Machine 1';
const GOLD = 0xffffc800;

type LayerProps = {
  file: RiveFile;
  artboard: string;
  machine: string;
  style: ViewStyle;
  onInstance: (artboard: string, instance: ViewModelInstance) => void;
  onError: (message: string) => void;
};

/** One Rive view bound to the default view model instance of its artboard. */
function RiveLayer({ file, artboard, machine, style, onInstance, onError }: LayerProps) {
  const { instance, error } = useViewModelInstance(file, { artboardName: artboard, async: true });

  useEffect(() => {
    if (instance) onInstance(artboard, instance);
  }, [instance, artboard, onInstance]);

  useEffect(() => {
    if (error) onError(`${artboard}: ${error.message}`);
  }, [error, artboard, onError]);

  if (!instance) return null;
  return (
    <RiveView
      file={file}
      artboardName={artboard}
      stateMachineName={machine}
      dataBind={instance}
      fit={Fit.Contain}
      autoPlay
      style={style}
      onError={(e) => onError(`${artboard}: ${e.message}`)}
    />
  );
}

export default function TestA() {
  const { riveFile, error: fileError } = useRiveFile(DOMBI_FILE);
  const frames = useFrameMeter();

  const instances = useRef<Record<string, ViewModelInstance>>({});
  const [ready, setReady] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [gestureDone, setGestureDone] = useState(0);
  const [tapped, setTapped] = useState(0);
  const [driving, setDriving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [setsPerSecond, setSetsPerSecond] = useState(0);

  const note = useCallback((line: string) => {
    console.log(`[TestA] ${line}`);
    setLog((lines) => [...lines.slice(-5), line]);
  }, []);

  // What the file contains, so a missing artboard or property is visible on screen.
  useEffect(() => {
    if (!riveFile) return;
    console.log(`[TestA] file loaded, ${riveFile.artboardCount} artboards`);
    riveFile.getViewModelNamesAsync().then((names) => console.log('[TestA] view models:', names.join(', ')));
    console.log('[TestA] artboards:', riveFile.artboardNames.join(', '));
  }, [riveFile]);

  const onInstance = useCallback(
    (artboard: string, instance: ViewModelInstance) => {
      instances.current[artboard] = instance;
      setReady((list) => (list.includes(artboard) ? list : [...list, artboard]));
      instance
        .getPropertiesAsync()
        .then((props) => console.log(`[TestA] ${artboard} props:`, props.map((p) => `${p.name}:${p.type}`).join(' ')));
    },
    [],
  );

  // Triggers fired by the file: `gestureDone` at the end of a gesture, `tapped` from
  // the listener on Dombi's body.
  const dombiReady = ready.includes('Dombi');
  useEffect(() => {
    const dombi = instances.current.Dombi;
    if (!dombiReady || !dombi) return;
    const done = dombi.triggerProperty('gestureDone');
    const tap = dombi.triggerProperty('tapped');
    if (!done) note('no gestureDone trigger in the file');
    if (!tap) note('no tapped trigger in the file');
    const offDone = done?.addListener(() => setGestureDone((n) => n + 1));
    const offTap = tap?.addListener(() => setTapped((n) => n + 1));
    return () => {
      offDone?.();
      offTap?.();
    };
  }, [dombiReady, note]);

  // The 60-per-second writes: mouth shape and voice level, every frame.
  const active = driving || dragging;
  useEffect(() => {
    const dombi = instances.current.Dombi;
    if (!active || !dombiReady || !dombi) return;
    const viseme = dombi.numberProperty('viseme');
    const amp = dombi.numberProperty('amp');
    const talking = dombi.booleanProperty('talking');
    if (!viseme || !amp || !talking) {
      note('viseme / amp / talking missing in the file');
      return;
    }
    talking.set(true);
    let raf = 0;
    let sets = 0;
    let windowStart = performance.now();
    const tick = (now: number) => {
      viseme.set(1 + (Math.floor(now / 90) % 10));
      amp.set(50 + 50 * Math.sin(now / 110));
      sets += 2;
      if (now - windowStart >= 1000) {
        setSetsPerSecond(Math.round((sets * 1000) / (now - windowStart)));
        sets = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      talking.set(false);
      viseme.set(0);
      amp.set(0);
      setSetsPerSecond(0);
    };
  }, [active, dombiReady, note]);

  const fire = (artboard: string, trigger: string) => {
    const property = instances.current[artboard]?.triggerProperty(trigger);
    if (!property) return note(`${artboard}.${trigger} not found`);
    property.trigger();
  };

  const pop = () => {
    instances.current['FX Pop']?.colorProperty('color')?.set(GOLD);
    fire('FX Pop', 'fire');
  };

  // Dragging Dombi around the screen.
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const drag = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      scheduleOnRN(setDragging, true);
    })
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onFinalize(() => {
      x.value = withSpring(0);
      y.value = withSpring(0);
      scheduleOnRN(setDragging, false);
    });
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));

  if (!riveFile) {
    return (
      <View style={styles.center}>
        <Text style={styles.readout}>{fileError ? `Error: ${fileError.message}` : 'Loading dombi.riv…'}</Text>
      </View>
    );
  }

  const layer = { file: riveFile, onInstance, onError: note };

  return (
    <View style={styles.screen}>
      {/* Stripes behind everything: an overlay that is not transparent would hide them. */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.stripe, { backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.stripe, { backgroundColor: '#7C5CFF' }]} />
        <View style={[styles.stripe, { backgroundColor: '#FF6B5E' }]} />
        <View style={[styles.stripe, { backgroundColor: '#121214' }]} />
      </View>

      <View style={styles.stage}>
        <GestureDetector gesture={drag}>
          <Animated.View style={[styles.dombiBox, dragStyle]}>
            <RiveLayer {...layer} artboard="Dombi" machine="Dombi" style={styles.fill} />
            <View style={styles.popBox} pointerEvents="none">
              <RiveLayer {...layer} artboard="FX Pop" machine={FX_MACHINE} style={styles.fill} />
            </View>
          </Animated.View>
        </GestureDetector>
        <View style={styles.embersBox} pointerEvents="none">
          <RiveLayer {...layer} artboard="FX Embers" machine={FX_MACHINE} style={styles.fill} />
        </View>
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <RiveLayer {...layer} artboard="FX Confetti" machine={FX_MACHINE} style={styles.fill} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.readout} testID="readout">
          JS {frames.fps} fps · worst {frames.worstMs} ms · sets/s {setsPerSecond}
          {'\n'}gestureDone {gestureDone} · tapped {tapped} · views {ready.length}/4
        </Text>
        <View style={styles.row}>
          <Button label="Correct" onPress={() => fire('Dombi', 'correct')} />
          <Button label="Wrong" onPress={() => fire('Dombi', 'wrong')} />
          <Button label="Celebrate" onPress={() => fire('Dombi', 'celebrate')} />
        </View>
        <View style={styles.row}>
          <Button label="Pop" onPress={pop} />
          <Button label="Confetti" onPress={() => fire('FX Confetti', 'large')} />
          <Button label="Embers" onPress={() => fire('FX Embers', 'fire')} />
          <Button label={driving ? 'Stop' : 'Talk 60/s'} onPress={() => setDriving((on) => !on)} />
        </View>
        <Text style={styles.log}>{[`file loaded, ${riveFile.artboardCount} artboards`, ...log].join('\n')}</Text>
      </View>
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.button} testID={`btn-${label}`}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stripe: { flex: 1 },
  fill: { flex: 1 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dombiBox: { width: 260, height: 230 },
  popBox: { position: 'absolute', left: 30, top: 0, width: 200, height: 200 },
  embersBox: { position: 'absolute', top: 40, right: 10, width: 140, height: 182 },
  panel: { backgroundColor: 'rgba(255,255,255,0.92)', padding: 12, paddingBottom: 28, gap: 8 },
  readout: { fontSize: 14, fontVariant: ['tabular-nums'], color: '#2B2B3C' },
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, backgroundColor: '#2B2B3C', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  log: { fontSize: 11, color: '#6E6E82', minHeight: 44 },
});
