import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { IconName, Input } from '../ui';

type Props = {
  icon: IconName;
  placeholder: string;
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
};

export default function PasswordField({ icon, placeholder, value, visible, onChangeText, onToggleVisibility }: Props) {
  return (
    <View style={{ position: 'relative' }}>
      <Input icon={icon} placeholder={placeholder} value={value} onChangeText={onChangeText}
        secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} box={{ paddingRight: 48 }} />
      <TouchableOpacity onPress={onToggleVisibility} hitSlop={8}
        accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        style={{ position: 'absolute', top: 0, right: 12, bottom: 0, width: 32, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.muted} />
      </TouchableOpacity>
    </View>
  );
}
