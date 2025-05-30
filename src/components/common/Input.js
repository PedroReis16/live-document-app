import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Input field com validação visual
const Input = ({
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  multiline,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  leftIcon,
  rightIcon,
  onRightIconPress,
  onLeftIconPress,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style
        ]}
      >
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftIconPress}
            disabled={!onLeftIconPress}
            style={styles.iconContainer}
          >
            <Feather name={leftIcon} size={20} color={error ? "#f44336" : "#666"} />
          </TouchableOpacity>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#999"
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.iconContainer}
          >
            <Feather name={rightIcon} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      {error && typeof error === 'string' && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: '#2196f3',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#f44336',
  },
  iconContainer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  }
});

export default Input;
