/**
 * LECA Enterprise Mobile - UI Components
 * Premium Design System
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
  Animated, Dimensions, Modal, ScrollView, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import theme, { getStatusConfig, getAnlagentypConfig } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════════════════════

export const Card = ({ children, style, onPress, disabled, variant = 'default' }) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.cardElevated,
    variant === 'outlined' && styles.cardOutlined,
    disabled && styles.cardDisabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7} disabled={disabled}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// ═══════════════════════════════════════════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════════════════════════════════════════

export const KpiCard = ({ title, value, icon, color = theme.primary, subtitle, trend, onPress }) => {
  const displayColor = color || theme.primary;
  
  return (
    <TouchableOpacity 
      style={[styles.kpiCard, { flex: 1 }]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.kpiIconContainer, { backgroundColor: `${displayColor}20` }]}>
        <Ionicons name={icon} size={24} color={displayColor} />
      </View>
      <Text style={styles.kpiValue}>{value ?? '-'}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
      {trend !== undefined && (
        <View style={styles.kpiTrend}>
          <Ionicons 
            name={trend >= 0 ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={trend >= 0 ? theme.success : theme.error} 
          />
          <Text style={[styles.kpiTrendText, { color: trend >= 0 ? theme.success : theme.error }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════════════════

export const Badge = ({ text, color = theme.primary, size = 'md', style, icon }) => {
  const sizeStyles = {
    sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
    lg: { paddingHorizontal: 14, paddingVertical: 6, fontSize: 14 },
  };

  return (
    <View style={[
      styles.badge,
      { backgroundColor: `${color}20`, borderColor: color },
      { paddingHorizontal: sizeStyles[size].paddingHorizontal, paddingVertical: sizeStyles[size].paddingVertical },
      style
    ]}>
      {icon && <Ionicons name={icon} size={sizeStyles[size].fontSize} color={color} style={{ marginRight: 4 }} />}
      <Text style={[styles.badgeText, { color, fontSize: sizeStyles[size].fontSize }]}>{text}</Text>
    </View>
  );
};

export const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return <Badge text={config.label} color={config.color} icon={config.icon} />;
};

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON
// ═══════════════════════════════════════════════════════════════════════════

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  iconRight,
  loading, 
  disabled,
  style,
  textStyle,
}) => {
  const variants = {
    primary: { bg: theme.primary, text: '#FAFAFA' },
    secondary: { bg: theme.secondary, text: '#FAFAFA' },
    outline: { bg: 'transparent', text: theme.primary, border: theme.primary },
    ghost: { bg: 'transparent', text: theme.primary },
    danger: { bg: theme.error, text: '#FAFAFA' },
  };

  const sizes = {
    sm: { height: 36, paddingHorizontal: 12, fontSize: 13 },
    md: { height: 44, paddingHorizontal: 16, fontSize: 15 },
    lg: { height: 52, paddingHorizontal: 20, fontSize: 17 },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: v.bg, 
          height: s.height, 
          paddingHorizontal: s.paddingHorizontal,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && !iconRight && <Ionicons name={icon} size={s.fontSize + 2} color={v.text} style={{ marginRight: 8 }} />}
          <Text style={[styles.buttonText, { color: v.text, fontSize: s.fontSize }, textStyle]}>{title}</Text>
          {icon && iconRight && <Ionicons name={icon} size={s.fontSize + 2} color={v.text} style={{ marginLeft: 8 }} />}
        </>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════════════

export const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
  helper,
  icon,
  rightIcon,
  onRightIconPress,
  multiline,
  numberOfLines,
  style,
  editable = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        error && styles.inputWrapperError,
        !editable && styles.inputWrapperDisabled,
      ]}>
        {icon && <Ionicons name={icon} size={20} color={theme.textMuted} style={styles.inputIcon} />}
        <TextInput
          style={[
            styles.input,
            multiline && { height: numberOfLines ? numberOfLines * 24 : 100, textAlignVertical: 'top' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputRightIcon}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.inputRightIcon} disabled={!onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.inputError}>{error}</Text>}
      {helper && !error && <Text style={styles.inputHelper}>{helper}</Text>}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SELECT / PICKER
// ═══════════════════════════════════════════════════════════════════════════

export const Select = ({ label, value, options, onValueChange, placeholder, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.inputWrapper, error && styles.inputWrapperError]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.input, !selectedOption && { color: theme.textMuted }]}>
          {selectedOption?.label || placeholder || 'Auswählen...'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.textMuted} style={styles.inputRightIcon} />
      </TouchableOpacity>
      {error && <Text style={styles.inputError}>{error}</Text>}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectModal}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>{label || 'Auswählen'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectModalContent}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.selectOption, value === option.value && styles.selectOptionActive]}
                  onPress={() => {
                    onValueChange(option.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.selectOptionText, value === option.value && styles.selectOptionTextActive]}>
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LOADING
// ═══════════════════════════════════════════════════════════════════════════

export const Loading = ({ fullScreen, text, size = 'large' }) => {
  if (fullScreen) {
    return (
      <View style={styles.loadingFullScreen}>
        <ActivityIndicator size={size} color={theme.primary} />
        {text && <Text style={styles.loadingText}>{text}</Text>}
      </View>
    );
  }
  return (
    <View style={styles.loadingInline}>
      <ActivityIndicator size={size} color={theme.primary} />
      {text && <Text style={styles.loadingTextSmall}>{text}</Text>}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════

export const EmptyState = ({ icon, title, description, action, actionLabel }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon || 'folder-open-outline'} size={64} color={theme.textMuted} />
    <Text style={styles.emptyStateTitle}>{title}</Text>
    {description && <Text style={styles.emptyStateDescription}>{description}</Text>}
    {action && actionLabel && (
      <Button title={actionLabel} onPress={action} style={{ marginTop: 16 }} />
    )}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════

export const SectionHeader = ({ title, actionText, onAction, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
    {actionText && onAction && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionHeaderAction}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════════════════

export const Avatar = ({ name, size = 40, image, style }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';
  
  const bgColors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const colorIndex = name ? name.charCodeAt(0) % bgColors.length : 0;

  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColors[colorIndex] },
      style
    ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: theme.surfaceElevated, opacity },
        style
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LIST ITEM
// ═══════════════════════════════════════════════════════════════════════════

export const ListItem = ({ 
  title, 
  subtitle, 
  left, 
  right, 
  onPress, 
  chevron = true,
  borderBottom = true,
  style,
}) => (
  <TouchableOpacity
    style={[styles.listItem, borderBottom && styles.listItemBorder, style]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    {left && <View style={styles.listItemLeft}>{left}</View>}
    <View style={styles.listItemContent}>
      <Text style={styles.listItemTitle} numberOfLines={1}>{title}</Text>
      {subtitle && <Text style={styles.listItemSubtitle} numberOfLines={1}>{subtitle}</Text>}
    </View>
    {right && <View style={styles.listItemRight}>{right}</View>}
    {chevron && onPress && <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />}
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════════════════════════════════════

export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ═══════════════════════════════════════════════════════════════════════════
// ICON BUTTON
// ═══════════════════════════════════════════════════════════════════════════

export const IconButton = ({ icon, size = 44, iconSize = 24, color = theme.text, onPress, style, badge }) => (
  <TouchableOpacity
    style={[styles.iconButton, { width: size, height: size }, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={iconSize} color={color} />
    {badge !== undefined && badge > 0 && (
      <View style={styles.iconButtonBadge}>
        <Text style={styles.iconButtonBadgeText}>{badge > 9 ? '9+' : badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════════════════
// CHIP
// ═══════════════════════════════════════════════════════════════════════════

export const Chip = ({ label, selected, onPress, icon }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon && <Ionicons name={icon} size={14} color={selected ? theme.primary : theme.textSecondary} style={{ marginRight: 4 }} />}
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════

export const ProgressBar = ({ progress = 0, height = 8, color = theme.primary, style }) => (
  <View style={[styles.progressBar, { height }, style]}>
    <View style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%`, backgroundColor: color }]} />
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

export const StepIndicator = ({ steps, currentStep }) => (
  <View style={styles.stepIndicator}>
    {steps.map((step, index) => (
      <View key={index} style={styles.stepItem}>
        <View style={[
          styles.stepCircle,
          index < currentStep && styles.stepCircleCompleted,
          index === currentStep && styles.stepCircleActive,
        ]}>
          {index < currentStep ? (
            <Ionicons name="checkmark" size={14} color="#FFF" />
          ) : (
            <Text style={[
              styles.stepNumber,
              (index === currentStep || index < currentStep) && styles.stepNumberActive
            ]}>{index + 1}</Text>
          )}
        </View>
        {index < steps.length - 1 && (
          <View style={[styles.stepLine, index < currentStep && styles.stepLineCompleted]} />
        )}
      </View>
    ))}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// TOAST / SNACKBAR (simple version)
// ═══════════════════════════════════════════════════════════════════════════

export const Toast = ({ message, type = 'info', visible, onDismiss }) => {
  const colors = {
    info: theme.info,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
  };

  if (!visible) return null;

  return (
    <View style={[styles.toast, { backgroundColor: colors[type] }]}>
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <Ionicons name="close" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardElevated: {
    ...theme.shadows.md,
    borderWidth: 0,
  },
  cardOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  cardDisabled: {
    opacity: 0.5,
  },

  // KPI Card
  kpiCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  kpiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  kpiTitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  kpiSubtitle: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  kpiTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '600',
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: theme.primary,
  },
  inputWrapperError: {
    borderColor: theme.error,
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: theme.text,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputRightIcon: {
    padding: 4,
  },
  inputError: {
    fontSize: 12,
    color: theme.error,
    marginTop: 4,
  },
  inputHelper: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },

  // Select Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  selectModal: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  selectModalContent: {
    padding: 8,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  selectOptionActive: {
    backgroundColor: `${theme.primary}15`,
  },
  selectOptionText: {
    fontSize: 16,
    color: theme.text,
  },
  selectOptionTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },

  // Loading
  loadingFullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  loadingTextSmall: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  sectionHeaderAction: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },

  // Avatar
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '600',
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  listItemLeft: {
    marginRight: 14,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  listItemRight: {
    marginRight: 8,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
  },

  // Icon Button
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  iconButtonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: `${theme.primary}15`,
    borderColor: theme.primary,
  },
  chipText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  chipTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },

  // Progress Bar
  progressBar: {
    backgroundColor: theme.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}15`,
  },
  stepCircleCompleted: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
  },
  stepNumberActive: {
    color: theme.primary,
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: theme.border,
    marginHorizontal: 4,
  },
  stepLineCompleted: {
    backgroundColor: theme.primary,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default {
  Card, KpiCard, Badge, StatusBadge, Button, Input, Select, Loading, EmptyState,
  SectionHeader, Avatar, Skeleton, ListItem, Divider, IconButton, Chip,
  ProgressBar, StepIndicator, Toast,
};
