import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/theme.store';

interface Props {
  onAdd: (name: string) => void;
}

export default function AddItemInline({ onAdd }: Props) {
  const { colors } = useThemeStore();
  const [name, setName] = useState('');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.bgCard,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderStyle: 'dashed',
      }}
    >
      <Ionicons name="add-circle-outline" size={22} color={colors.textTertiary} />
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="직접 추가..."
        placeholderTextColor={colors.textTertiary}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
        style={{
          flex: 1,
          fontSize: 14,
          color: colors.text,
          paddingVertical: 6,
        }}
      />
      {name.trim().length > 0 && (
        <TouchableOpacity
          onPress={handleAdd}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textInverse }}>추가</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
