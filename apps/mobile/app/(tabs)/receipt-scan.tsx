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

type Step = 'select' | 'scanning' | 'preview';

export default function ReceiptScanScreen() {
  const [step, setStep] = useState<Step>('select');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [storeName, setStoreName] = useState<string>();
  const [purchaseDate, setPurchaseDate] = useState<string>();

  const parseMutation = useParseReceipt();
  const bulkCreateMutation = useBulkCreateFoodItems();

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

      if (!ocrText.trim()) {
        Alert.alert('인식 실패', '영수증에서 텍스트를 인식하지 못했습니다. 다시 시도해주세요.');
        setStep('select');
        return;
      }

      const parseResult = await parseMutation.mutateAsync(ocrText);

      if (parseResult.items.length === 0) {
        Alert.alert('파싱 실패', '영수증에서 품목을 추출하지 못했습니다. 다시 시도해주세요.');
        setStep('select');
        return;
      }

      setItems(parseResult.items);
      setStoreName(parseResult.storeName);
      setPurchaseDate(parseResult.purchaseDate);
      setStep('preview');
    } catch (error) {
      Alert.alert('오류', '영수증 처리 중 오류가 발생했습니다.');
      setStep('select');
    }
  }, [parseMutation]);

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
        [{ text: '확인', onPress: () => router.replace('/(tabs)/') }],
      );
    } catch {
      Alert.alert('오류', '식재료 추가 중 오류가 발생했습니다.');
    }
  };

  if (step === 'select') {
    return <SelectScreen onPick={pickImage} />;
  }

  if (step === 'scanning') {
    return <ScanningScreen />;
  }

  return (
    <PreviewScreen
      items={items}
      storeName={storeName}
      purchaseDate={purchaseDate}
      onUpdateItem={updateItem}
      onRemoveItem={removeItem}
      onSubmit={handleBulkAdd}
      onRetry={() => setStep('select')}
      isLoading={bulkCreateMutation.isPending}
    />
  );
}

function SelectScreen({ onPick }: { onPick: (source: 'camera' | 'gallery') => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.selectContent}>
        <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
        <Text style={styles.selectTitle}>영수증 스캔</Text>
        <Text style={styles.selectDesc}>
          영수증을 촬영하거나 사진을 선택하면{'\n'}
          품목이 자동으로 인식됩니다
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.selectButton, styles.cameraButton]}
            onPress={() => onPick('camera')}
          >
            <Ionicons name="camera-outline" size={24} color="#ffffff" />
            <Text style={styles.cameraButtonText}>카메라 촬영</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectButton, styles.galleryButton]}
            onPress={() => onPick('gallery')}
          >
            <Ionicons name="images-outline" size={24} color="#22c55e" />
            <Text style={styles.galleryButtonText}>갤러리에서 선택</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ScanningScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.scanningContent}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.scanningTitle}>영수증 분석 중...</Text>
        <Text style={styles.scanningDesc}>
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
  return (
    <View style={styles.container}>
      <ScrollView style={styles.previewScroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 매장 / 날짜 정보 */}
        {(storeName || purchaseDate) && (
          <View style={styles.receiptInfo}>
            {storeName && (
              <View style={styles.infoRow}>
                <Ionicons name="storefront-outline" size={16} color="#6b7280" />
                <Text style={styles.infoText}>{storeName}</Text>
              </View>
            )}
            {purchaseDate && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.infoText}>{purchaseDate}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.previewSectionTitle}>
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
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={20} color="#6b7280" />
          <Text style={styles.retryButtonText}>다시 스캔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
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

  const emoji = getFoodEmoji(item.name, item.category);
  const confidenceColor =
    item.confidence === 'high'
      ? '#22c55e'
      : item.confidence === 'medium'
        ? '#f59e0b'
        : '#ef4444';

  const handleSaveEdit = () => {
    onUpdate(index, {
      name: editName,
      quantity: parseInt(editQuantity) || 1,
    });
    setEditing(false);
  };

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemEmoji}>{emoji}</Text>
        <View style={styles.itemInfo}>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="품목명"
              />
              <TextInput
                style={[styles.editInput, { width: 50, textAlign: 'center' }]}
                value={editQuantity}
                onChangeText={setEditQuantity}
                keyboardType="numeric"
              />
            </View>
          ) : (
            <>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
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
              <Ionicons name="checkmark" size={20} color="#22c55e" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={styles.actionBtn}
            >
              <Ionicons name="create-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onRemove(index)}
            style={styles.actionBtn}
          >
            <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemDates}>
        <Text style={styles.dateLabel}>
          구매: {item.purchasedAt}
        </Text>
        <Text style={styles.dateLabel}>
          유통기한: {item.expiresAt}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    color: '#111827',
    marginTop: 16,
  },
  selectDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#22c55e',
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  galleryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
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
    color: '#111827',
    marginTop: 16,
  },
  scanningDesc: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#ffffff',
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
    color: '#374151',
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  // Item Card
  itemCard: {
    backgroundColor: '#ffffff',
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
    color: '#111827',
  },
  itemMeta: {
    fontSize: 12,
    color: '#6b7280',
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
    borderColor: '#d1d5db',
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
    borderTopColor: '#f3f4f6',
  },
  dateLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#22c55e',
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
