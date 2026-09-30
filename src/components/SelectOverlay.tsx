import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';

type Layer = { id: string; content: ReactNode; close: () => void };
const OverlayContext = createContext<{
  show: (layer: Layer) => void;
  hide: (id: string) => void;
} | null>(null);

// One in-app layer above the form: opening a picker does not create an Android Dialog.
export function SelectOverlayProvider({ children }: PropsWithChildren) {
  const [layer, setLayer] = useState<Layer | null>(null);
  const close = useRef<(() => void) | undefined>(undefined);
  close.current = layer?.close;
  const show = useCallback((next: Layer) => setLayer(next), []);
  const hide = useCallback((id: string) => {
    setLayer((current) => (current?.id === id ? null : current));
  }, []);
  const actions = useMemo(() => ({ show, hide }), [show, hide]);
  const activeId = layer?.id;
  useEffect(() => {
    if (!activeId) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      close.current?.();
      return true;
    });
    if (Platform.OS !== 'web') return () => back.remove();
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[data-testid="select-overlay"]');
    dialog?.setAttribute('role', 'dialog');
    dialog?.setAttribute('aria-modal', 'true');
    if (dialog) {
      dialog.tabIndex = -1;
      dialog.focus({ preventScroll: true });
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close.current?.();
      } else if (event.key === 'Tab' && dialog) {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'input:not([disabled]), button:not([disabled]), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === dialog)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keyboard, true);
    return () => {
      back.remove();
      document.removeEventListener('keydown', keyboard, true);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [activeId]);
  return (
    <OverlayContext.Provider value={actions}>
      <View style={styles.root}>
        <View
          style={styles.root}
          pointerEvents={layer ? 'none' : 'auto'}
          accessibilityElementsHidden={!!layer}
          importantForAccessibility={layer ? 'no-hide-descendants' : 'auto'}
          aria-hidden={!!layer}
        >
          {children}
        </View>
        {layer && (
          <View
            style={styles.layer}
            testID="select-overlay"
            accessibilityViewIsModal
            importantForAccessibility="yes"
          >
            {layer.content}
          </View>
        )}
      </View>
    </OverlayContext.Provider>
  );
}

export function SelectOverlay({ children, onClose }: PropsWithChildren<{ onClose: () => void }>) {
  const context = useContext(OverlayContext);
  if (!context) throw new Error('SelectOverlay precisa de SelectOverlayProvider.');
  const { show, hide } = context;
  const id = useId();
  useLayoutEffect(() => {
    show({ id, content: children, close: onClose });
  }, [show, id, children, onClose]);
  useLayoutEffect(() => () => hide(id), [hide, id]);
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
    outlineWidth: 0,
  },
});
