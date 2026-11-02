import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadow, theme } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export const safeIcon = (n?: string): IconName =>
  (n && (Ionicons.glyphMap as Record<string, number>)[n]
    ? n
    : 'checkmark-circle') as IconName;
/* ---------- formatting ---------- */
export const money = (n: number) => `$${Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(2)}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const day = (iso: string) => iso.slice(0, 10);
export const shortDate = (iso: string) => { const [, m, d] = day(iso).split('-'); return `${+d} ${MONTHS[+m - 1]}`; };
export const prettyDate = (iso: string) => `${shortDate(iso)} ${day(iso).slice(0, 4)}`;
export const errMsg = (e: any) => e?.response?.data?.message ?? e?.message ?? 'Network error';

export const availabilityText = (n: number | null) =>
  n === null ? 'Select dates to see availability'
  : n === 0 ? 'Sold out for these dates'
  : n <= 5 ? `Only ${n} room${n > 1 ? 's' : ''} left`
  : `${n} rooms available`;
export const availabilityColor = (n: number | null) =>
  n === null ? theme.muted : n === 0 ? theme.danger : n <= 5 ? theme.warning : theme.success;

export const policyText = (p: { allowRefund: boolean; refundPercent: number }) =>
  p.allowRefund
    ? `Cancel any time: ${p.refundPercent}% of the unused nights is refunded.`
    : 'Non-refundable: cancelling will not refund any money.';

/* ---------- building blocks ---------- */
type BtnProps = {
  title: string; onPress?: () => void; disabled?: boolean; loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; color?: string; // `color` mimics react-native's Button
  icon?: IconName; small?: boolean; style?: ViewStyle;
};
export const Button = ({ title, onPress, disabled, loading, variant, color, icon, small, style }: BtnProps) => {
  const v = variant ?? (color ? (/crimson|red|#c62828|#dc2626/i.test(color) ? 'danger' : 'secondary') : 'primary');
  const [bg, fg] = {
    primary: [theme.primary, '#fff'], secondary: [theme.primarySoft, theme.primaryDark],
    danger: ['#fee2e2', theme.danger], ghost: ['transparent', theme.primary],
  }[v];
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
      style={[{ backgroundColor: bg, borderRadius: 12, paddingVertical: small ? 8 : 14, paddingHorizontal: small ? 14 : 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.45 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
    </TouchableOpacity>
  );
};

export const Input = ({ icon, box, style, ...props }: TextInputProps & { icon?: IconName; box?: ViewStyle }) => (
  <View style={[{ flexDirection: 'row', alignItems: props.multiline ? 'flex-start' : 'center', backgroundColor: '#fff',
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, gap: 8 }, box]}>
    {icon && <Ionicons name={icon} size={18} color={theme.muted} style={props.multiline ? { marginTop: 14 } : undefined} />}
    <TextInput placeholderTextColor="#9ca3af" {...props}
      style={[{ flex: 1, paddingVertical: 12, fontSize: 15, color: theme.text },
        props.multiline && { minHeight: 90, textAlignVertical: 'top' }, style]} />
  </View>
);

export const Card = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <View style={[{ backgroundColor: theme.card, borderRadius: theme.radius, ...shadow }, style]}>{children}</View>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{children}</Text>
);

export const InfoRow = ({ icon, children }: { icon: IconName; children: ReactNode }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
    <Ionicons name={icon} size={18} color={theme.muted} style={{ marginTop: 1 }} />
    <Text style={{ flex: 1, color: theme.text, lineHeight: 20 }}>{children}</Text>
  </View>
);

export const Spec = ({ icon, text }: { icon: IconName; text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <Ionicons name={icon} size={15} color={theme.muted} />
    <Text style={{ color: theme.muted }}>{text}</Text>
  </View>
);

export const Rating = ({ avg, count }: { avg: number; count: number }) =>
  count ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name="star" size={14} color={theme.star} />
      <Text style={{ fontWeight: '700', color: theme.text }}>{avg.toFixed(1)}</Text>
      <Text style={{ color: theme.muted }}>({count} review{count > 1 ? 's' : ''})</Text>
    </View>
  ) : <Text style={{ color: theme.muted }}>New · no reviews yet</Text>;

export const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((i) => <Ionicons key={i} name={i <= n ? 'star' : 'star-outline'} size={size} color={theme.star} />)}
  </View>
);

export const Chip = ({ label, active, onPress, icon }:
  { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) => {
  const interactive = !!onPress;
  return (
    <TouchableOpacity onPress={onPress} disabled={!interactive} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
        marginRight: 6, marginBottom: 6, borderWidth: interactive ? 1 : 0, borderColor: active ? theme.primary : theme.border,
        backgroundColor: active ? theme.primary : interactive ? '#fff' : '#eef2f6' }}>
      {icon && <Ionicons name={icon} size={13} color={active ? '#fff' : theme.muted} />}
      <Text style={{ color: active ? '#fff' : theme.text, fontSize: 12.5, fontWeight: active ? '700' : '500' }}>{label}</Text>
    </TouchableOpacity>
  );
};

export const AmenityTag = ({ a }: { a: { name: string; icon?: string } }) => <Chip label={a.name} icon={safeIcon(a.icon)} />;

const STATUS: Record<string, [string, string, string]> = {
  // Booking statuses
  pending: ['Awaiting payment', '#b45309', '#fef3c7'],
  confirmed: ['Confirmed', '#15803d', '#dcfce7'],
  completed: ['Completed', '#374151', '#f3f4f6'],
  cancelled: ['Cancelled', '#b91c1c', '#fee2e2'],
  refunded: ['Refunded', '#6d28d9', '#ede9fe'],

  // Room statuses
  available: ['Available', '#15803d', '#dcfce7'],
  occupied: ['Occupied', '#b91c1c', '#fee2e2'],
  maintenance: ['Maintenance', '#374151', '#e5e7eb'],
};
export const StatusBadge = ({ status }: { status: string }) => {
  const [label, fg, bg] = STATUS[status] ?? [status, '#374151', '#f3f4f6'];
  return (
    <Text style={{ alignSelf: 'flex-start', color: fg, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3,
      borderRadius: 10, fontSize: 12, fontWeight: '700', overflow: 'hidden' }}>{label}</Text>
  );
};

export const DateBox = ({ label, date }: { label: string; date: string }) => (
  <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 12, padding: 12 }}>
    <Text style={{ color: theme.muted, fontSize: 12 }}>{label}</Text>
    <Text style={{ fontWeight: '700', fontSize: 15, color: theme.text }}>{prettyDate(date)}</Text>
  </View>
);

export const PriceLine = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={{ color: bold ? theme.text : theme.muted, fontWeight: bold ? '800' : '400', fontSize: bold ? 17 : 14 }}>{label}</Text>
    <Text style={{ color: theme.text, fontWeight: bold ? '800' : '600', fontSize: bold ? 17 : 14 }}>{value}</Text>
  </View>
);

export const Segment = ({ options, value, onChange }:
  { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <View style={{ flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 3 }}>
    {options.map((o) => (
      <TouchableOpacity key={o.value} onPress={() => onChange(o.value)}
        style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: value === o.value ? '#fff' : 'transparent' }}>
        <Text style={{ fontWeight: '700', color: value === o.value ? theme.text : theme.muted }}>{o.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const EmptyState = ({ icon, title, subtitle, action }:
  { icon: IconName; title: string; subtitle?: string; action?: ReactNode }) => (
  <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
    <Ionicons name={icon} size={44} color="#cbd5e1" />
    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, textAlign: 'center' }}>{title}</Text>
    {subtitle ? <Text style={{ color: theme.muted, textAlign: 'center' }}>{subtitle}</Text> : null}
    {action}
  </View>
);

export const Loader = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <ActivityIndicator size="large" color={theme.primary} />
  </View>
);