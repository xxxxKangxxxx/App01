import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { recognizeTextFromImage } from '../../services/ocr';
import { useParseReceipt, useBulkCreateFoodItems } from '../../hooks/useReceiptScan';
import { getFoodEmoji } from '../../constants/foodEmoji';
import type { ReceiptItem, CreateFoodItemDto, Category } from '@freshbox/types';
import { CATEGORY_LABELS } from '@freshbox/types';
import { useThemeStore } from '../../store/theme.store';

type Step = 'select' | 'scanning' | 'manual' | 'preview';

export default function ReceiptScanScreen() {
  const [step, setStep] = useState<Step>('select');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [storeName, setStoreName] = useState<string>();
  const [purchaseDate, setPurchaseDate] = useState<string>();
  const [manualText, setManualText] = useState('');

  const parseMutation = useParseReceipt();
  const bulkCreateMutation = useBulkCreateFoodItems();

  const resetScanState = useCallback(() => {
    setStep('select');
    setItems([]);
    setStoreName(undefined);
    setPurchaseDate(undefined);
    setManualText('');
  }, []);

  const parseReceiptText = useCallback(async (ocrText: string) => {
    if (!ocrText.trim()) {
      Alert.alert('텍스트 필요', '파싱할 영수증 텍스트를 입력해주세요.');
      setStep('manual');
      return;
    }

    setStep('scanning');

    try {
      const parseResult = await parseMutation.mutateAsync(ocrText);

      if (parseResult.items.length === 0) {
        Alert.alert('파싱 실패', '영수증에서 품목을 추출하지 못했습니다. 텍스트를 확인해주세요.');
        setManualText(ocrText);
        setStep('manual');
        return;
      }

      setItems(parseResult.items);
      setStoreName(parseResult.storeName);
      setPurchaseDate(parseResult.purchaseDate);
      setStep('preview');
    } catch {
      Alert.alert('오류', '영수증 텍스트 파싱 중 오류가 발생했습니다.');
      setManualText(ocrText);
      setStep('manual');
    }
  }, [parseMutation]);

  const pickImage = useCallback(async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '카메라 사용 권한이 필요합니다.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
      });
    }

    if (result.canceled || !result.assets?.[0]) return;

    setStep('scanning');

    try {
      const imageUri = result.assets[0].uri;
      const ocrText = await recognizeTextFromImage(imageUri);
      await parseReceiptText(ocrText);
    } catch {
      Alert.alert('OCR 연결 실패', '영수증 텍스트를 직접 입력해 품목을 추출할 수 있습니다.');
      setManualText('');
      setStep('manual');
    }
  }, [parseReceiptText]);

  const updateItem = (index: number, updates: Partial<ReceiptItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkAdd = async () => {
    const foodItems: CreateFoodItemDto[] = items.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      purchasedAt: item.purchasedAt,
      expiresAt: item.expiresAt,
    }));

    try {
      const result = await bulkCreateMutation.mutateAsync(foodItems);
      Alert.alert(
        '추가 완료',
        `${result.count}개의 식재료가 추가되었습니다.`,
        [{
          text: '확인',
          onPress: () => {
            resetScanState();
            router.replace('/');
          },
        }],
      );
    } catch {
      Alert.alert('오류', '식재료 추가 중 오류가 발생했습니다.');
    }
  };

  if (step === 'select') {
    return <SelectScreen onPick={pickImage} onManual={() => setStep('manual')} />;
  }

  if (step === 'scanning') {
    return <ScanningScreen />;
  }

  if (step === 'manual') {
    return (
      <ManualTextScreen
        value={manualText}
        onChangeText={setManualText}
        onSubmit={() => parseReceiptText(manualText)}
        onBack={() => setStep('select')}
        isLoading={parseMutation.isPending}
      />
    );
  }

  return (
    <PreviewScreen
      items={items}
      storeName={storeName}
      purchaseDate={purchaseDate}
      onUpdateItem={updateItem}
      onRemoveItem={removeItem}
      onSubmit={handleBulkAdd}
      onRetry={resetScanState}
      isLoading={bulkCreateMutation.isPending}
    />
  );
}

function SelectScreen({
  onPick,
  onManual,
}: {
  onPick: (source: 'camera' | 'gallery') => void;
  onManual: () => void;
}) {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.selectContent}>
        <Ionicons name="receipt-outline" size={64} color={colors.border} />
        <Text style={[styles.selectTitle, { color: colors.text }]}>영수증 스캔</Text>
        <Text style={[styles.selectDesc, { color: colors.textSecondary }]}>
          영수증을 촬영하거나 사진을 선택하면{'\n'}
          품목이 자동으로 인식됩니다
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.success }]}
            onPress={() => onPick('camera')}
          >
            <Ionicons name="camera-outline" size={24} color="#ffffff" />
            <Text style={styles.cameraButtonText}>카메라 촬영</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectButton, styles.galleryButton, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => onPick('gallery')}
          >
            <Ionicons name="images-outline" size={24} color={colors.success} />
            <Text style={[styles.galleryButtonText, { color: colors.success }]}>갤러리에서 선택</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}
            onPress={onManual}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.galleryButtonText, { color: colors.textSecondary }]}>텍스트 직접 입력</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ManualTextScreen({
  value,
  onChangeText,
  onSubmit,
  onBack,
  isLoading,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.manualContent} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>영수증 텍스트</Text>
        </View>

        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12 }}>
          영수증에서 복사한 텍스트를 붙여 넣으면 품목을 추출합니다.
        </Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={'예:\n상품명 수량 단가 금액\n서울우유1L 1 2,800 2,800\n당근 1 1,500 1,500'}
          placeholderTextColor={colors.textTertiary}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.manualInput,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </ScrollView>

      <View style={[styles.bottomActions, { backgroundColor: colors.bgCard, borderTopColor: colors.divider }]}>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.bg }]} onPress={onBack}>
          <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.retryButtonText, { color: colors.textSecondary }]}>다시 선택</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.success }, (isLoading || !value.trim()) && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>품목 추출</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScanningScreen() {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.scanningContent}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={[styles.scanningTitle, { color: colors.text }]}>영수증 분석 중...</Text>
        <Text style={[styles.scanningDesc, { color: colors.textSecondary }]}>
          OCR로 텍스트를 추출하고{'\n'}
          품목을 파싱하고 있습니다
        </Text>
      </View>
    </View>
  );
}

function PreviewScreen({
  items,
  storeName,
  purchaseDate,
  onUpdateItem,
  onRemoveItem,
  onSubmit,
  onRetry,
  isLoading,
}: {
  items: ReceiptItem[];
  storeName?: string;
  purchaseDate?: string;
  onUpdateItem: (index: number, updates: Partial<ReceiptItem>) => void;
  onRemoveItem: (index: number) => void;
  onSubmit: () => void;
  onRetry: () => void;
  isLoading: boolean;
}) {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.previewScroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 매장 / 날짜 정보 */}
        {(storeName || purchaseDate) && (
          <View style={[styles.receiptInfo, { backgroundColor: colors.bgCard }]}>
            {storeName && (
              <View style={styles.infoRow}>
                <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{storeName}</Text>
              </View>
            )}
            {purchaseDate && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{purchaseDate}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.previewSectionTitle, { color: colors.text }]}>
          인식된 품목 ({items.length}개)
        </Text>

        {items.map((item, index) => (
          <ReceiptItemCard
            key={index}
            item={item}
            index={index}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        ))}
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View style={[styles.bottomActions, { backgroundColor: colors.bgCard, borderTopColor: colors.divider }]}>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.bg }]} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.retryButtonText, { color: colors.textSecondary }]}>다시 스캔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.success }, isLoading && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isLoading || items.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {items.length}개 일괄 추가
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReceiptItemCard({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: ReceiptItem;
  index: number;
  onUpdate: (index: number, updates: Partial<ReceiptItem>) => void;
  onRemove: (index: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQuantity, setEditQuantity] = useState(String(item.quantity));

  const { colors } = useThemeStore();
  const emoji = getFoodEmoji(item.name, item.category);
  const confidenceColor =
    item.confidence === 'high'
      ? colors.success
      : item.confidence === 'medium'
        ? colors.warning
        : colors.danger;

  const handleSaveEdit = () => {
    onUpdate(index, {
      name: editName,
      quantity: parseInt(editQuantity) || 1,
    });
    setEditing(false);
  };

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.bgCard }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemEmoji}>{emoji}</Text>
        <View style={styles.itemInfo}>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.editInput, { borderColor: colors.border, color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="품목명"
              />
              <TextInput
                style={[styles.editInput, { width: 50, textAlign: 'center', borderColor: colors.border, color: colors.text }]}
                value={editQuantity}
                onChangeText={setEditQuantity}
                keyboardType="numeric"
              />
            </View>
          ) : (
            <>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                {item.quantity}
                {item.unit} | {CATEGORY_LABELS[item.category]} |{' '}
                유통기한 {item.defaultShelfLifeDays}일
              </Text>
            </>
          )}
        </View>

        <View style={styles.itemActions}>
          <View
            style={[styles.confidenceDot, { backgroundColor: confidenceColor }]}
          />
          {editing ? (
            <TouchableOpacity onPress={handleSaveEdit} style={styles.actionBtn}>
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={styles.actionBtn}
            >
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onRemove(index)}
            style={styles.actionBtn}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.itemDates, { borderTopColor: colors.divider }]}>
        <Text style={[styles.dateLabel, { color: colors.textTertiary }]}>
          구매: {item.purchasedAt}
        </Text>
        <Text style={[styles.dateLabel, { color: colors.textTertiary }]}>
          유통기한: {item.expiresAt}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Select Screen
  selectContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  selectTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  selectDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  manualContent: {
    padding: 16,
    paddingBottom: 120,
  },
  manualInput: {
    minHeight: 280,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  galleryButton: {
    borderWidth: 1,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Scanning Screen
  scanningContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  scanningDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  // Preview Screen
  previewScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  receiptInfo: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  // Item Card
  itemCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  actionBtn: {
    padding: 4,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
  },
  itemDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  dateLabel: {
    fontSize: 12,
  },
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
