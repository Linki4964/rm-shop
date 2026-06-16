// src/utils/validators.ts

/**
 * 验证邮箱格式（与后端 EmailStr 一致）
 */
export const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '请输入有效的邮箱地址';
    }
    return null;
  };
  
  /**
   * 验证用户名（3-50 个字符）
   */
  export const validateUsername = (username: string): string | null => {
    if (username.length < 3) return '用户名至少 3 个字符';
    if (username.length > 50) return '用户名最多 50 个字符';
    return null;
  };
  
  /**
   * 验证密码（长度≥6，且同时包含字母和数字）
   * @param password 密码
   * @param required 是否必填（编辑时密码可选）
   */
  export const validatePassword = (password: string, required = false): string | null => {
    if (!required && password === '') return null; // 编辑时留空表示不修改
    if (password.length < 6) return '密码长度至少为 6 位';
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return '密码必须同时包含字母和数字';
    }
    return null;
  };