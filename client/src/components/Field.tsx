import { View, Text, TextInputProps, Switch } from 'react-native';
import { Input } from '../ui';
import { theme } from '../theme';

export const Field = ({ label, ...props }: { label: string } & TextInputProps) => (
  <View style={{ gap: 6 }}>
    <Text style={{ fontWeight: '600', color: theme.text }}>{label}</Text>
    <Input {...props} />
  </View>
);

export const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <Text style={{ fontWeight: '600', color: theme.text }}>{label}</Text>
    <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.primary, false: '#d1d5db' }} />
  </View>
);